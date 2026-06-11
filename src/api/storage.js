import { supabase } from '../lib/supabase';
import { sanitizeRow } from '../lib/sanitize';

const generateId = () => crypto.randomUUID();

// HARD EGRESS CEILING: list() never returns more than this many rows unless a
// caller *explicitly* asks for more (a number) or for everything (limit: 'all').
// This is the structural safety net — even a future query that forgets to pass a
// limit can't pull thousands of rows and blow the egress cap. 500 comfortably
// covers every screen; only Backup needs 'all'. See EGRESS.md.
// 1000 rows of the heaviest table (~1KB/row) is ~1MB worst case per fetch —
// safe — while still blocking the "accidentally pull 10k rows" failure mode.
const DEFAULT_LIST_LIMIT = 1000;

const sortItems = (items, sortField) => {
  if (!sortField) return items;
  const desc = sortField.startsWith('-');
  const field = desc ? sortField.slice(1) : sortField;
  return [...items].sort((a, b) => {
    const av = a[field] ?? '';
    const bv = b[field] ?? '';
    if (typeof av === 'number' && typeof bv === 'number') {
      return desc ? bv - av : av - bv;
    }
    return desc
      ? String(bv).localeCompare(String(av), 'he')
      : String(av).localeCompare(String(bv), 'he');
  });
};

const tableMapping = {
  'Player': 'players',
  'Round': 'rounds',
  'Payment': 'payments',
  'PlayerRating': 'player_ratings',
  'RoundBet': 'round_bets',
  'Signup': 'signups',
};

export function createStorage(entityName) {
  const tableName = tableMapping[entityName] || entityName.toLowerCase();
  const key = `sintetiko_${entityName}`;

  const getAll = () => JSON.parse(localStorage.getItem(key) || '[]');
  const setAll = (items) => localStorage.setItem(key, JSON.stringify(items));

  return {
    // EGRESS: `limit` caps rows. If omitted, DEFAULT_LIST_LIMIT (500) is applied
    // automatically — so a forgotten limit can't pull a whole growing table.
    // Pass an explicit number for more, or limit: 'all' to opt out (Backup only).
    // `columns` fetches a narrow projection instead of '*' to shrink payloads.
    async list(sortField, limit, columns) {
      const effectiveLimit = limit === 'all' ? null : (limit || DEFAULT_LIST_LIMIT);
      if (supabase) {
        let query = supabase.from(tableName).select(columns || '*');
        if (sortField) {
          const desc = sortField.startsWith('-');
          const field = desc ? sortField.slice(1) : sortField;
          query = query.order(field, { ascending: !desc });
        }
        if (effectiveLimit) {
          query = query.limit(effectiveLimit);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data;
      }

      // Fallback
      const items = sortItems(getAll(), sortField);
      return effectiveLimit ? items.slice(0, effectiveLimit) : items;
    },

    async create(data) {
      data = sanitizeRow(data);
      if (supabase) {
        const item = {
          ...data,
          id: data.id || generateId(),
          created_date: data.created_date || new Date().toISOString(),
          updated_date: data.updated_date || new Date().toISOString(),
        };
        const { data: created, error } = await supabase
          .from(tableName)
          .insert([item])
          .select()
          .single();
        if (error) throw error;
        return created;
      }

      // Fallback
      const items = getAll();
      const item = {
        ...data,
        id: generateId(),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      };
      items.push(item);
      setAll(items);
      return item;
    },

    async update(id, data) {
      data = sanitizeRow(data);
      if (supabase) {
        const updateData = {
          ...data,
          updated_date: new Date().toISOString(),
        };
        const { data: updated, error } = await supabase
          .from(tableName)
          .update(updateData)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return updated;
      }

      // Fallback
      const items = getAll();
      const index = items.findIndex((i) => i.id === id);
      if (index === -1) throw new Error(`${entityName} not found: ${id}`);
      items[index] = { ...items[index], ...data, updated_date: new Date().toISOString() };
      setAll(items);
      return items[index];
    },

    async upsert(data, conflictColumns) {
      data = sanitizeRow(data);
      if (supabase) {
        const item = { ...data, updated_at: new Date().toISOString() };
        const { data: upserted, error } = await supabase
          .from(tableName)
          .upsert(item, { onConflict: conflictColumns })
          .select()
          .single();
        if (error) throw error;
        return upserted;
      }
      // Fallback
      const cols = conflictColumns.split(',').map(c => c.trim());
      const items = getAll();
      const idx = items.findIndex(i => cols.every(c => i[c] === data[c]));
      if (idx >= 0) {
        items[idx] = { ...items[idx], ...data, updated_at: new Date().toISOString() };
        setAll(items);
        return items[idx];
      }
      return this.create(data);
    },

    async filter(filters) {
      if (supabase) {
        let query = supabase.from(tableName).select('*');
        Object.entries(filters).forEach(([k, v]) => { query = query.eq(k, v); });
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      }
      return getAll().filter(item => Object.entries(filters).every(([k, v]) => item[k] === v));
    },

    async delete(id) {
      if (supabase) {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', id);
        if (error) throw error;
        return;
      }

      // Fallback
      setAll(getAll().filter((i) => i.id !== id));
    },
  };
}

