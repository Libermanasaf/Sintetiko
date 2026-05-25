import { createStorage } from './storage';
import { supabase } from '../lib/supabase';

export const Player = createStorage('Player');
export const Round = createStorage('Round');
export const Payment = createStorage('Payment');
export const PlayerRating = createStorage('PlayerRating');
export const RoundBet = createStorage('RoundBet');

/* ─── Signup entity with graceful Supabase → localStorage fallback ─── */
const SIGNUPS_KEY = 'sintetiko_signups_local';
const localGet = () => { try { return JSON.parse(localStorage.getItem(SIGNUPS_KEY) || '[]'); } catch { return []; } };
const localSet = (items) => { try { localStorage.setItem(SIGNUPS_KEY, JSON.stringify(items)); } catch {} };

export const Signup = {
  async list(sortField) {
    if (supabase) {
      try {
        let query = supabase.from('signups').select('*');
        if (sortField) {
          const desc = sortField.startsWith('-');
          const field = desc ? sortField.slice(1) : sortField;
          query = query.order(field, { ascending: !desc });
        }
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      } catch (e) {
        console.warn('[Signup.list] Supabase failed, falling back to localStorage:', e.message);
      }
    }
    const items = localGet();
    if (sortField) {
      const desc = sortField.startsWith('-');
      const field = desc ? sortField.slice(1) : sortField;
      items.sort((a, b) => {
        const av = a[field] || '';
        const bv = b[field] || '';
        return desc ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
      });
    }
    return items;
  },

  async create(data) {
    const item = {
      ...data,
      id: data.id || crypto.randomUUID(),
      created_date: data.created_date || new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };
    if (supabase) {
      try {
        const { data: created, error } = await supabase.from('signups').insert([item]).select().single();
        if (error) throw error;
        return created;
      } catch (e) {
        console.warn('[Signup.create] Supabase failed, saving to localStorage:', e.message);
      }
    }
    const items = localGet();
    items.push(item);
    localSet(items);
    return item;
  },

  async update(id, data) {
    const updateData = { ...data, updated_date: new Date().toISOString() };
    if (supabase) {
      try {
        const { data: updated, error } = await supabase.from('signups').update(updateData).eq('id', id).select().single();
        if (error) throw error;
        return updated;
      } catch (e) {
        console.warn('[Signup.update] Supabase failed, updating localStorage:', e.message);
      }
    }
    const items = localGet();
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) throw new Error(`Signup not found: ${id}`);
    items[idx] = { ...items[idx], ...updateData };
    localSet(items);
    return items[idx];
  },

  async delete(id) {
    if (supabase) {
      try {
        const { error } = await supabase.from('signups').delete().eq('id', id);
        if (error) throw error;
        return;
      } catch (e) {
        console.warn('[Signup.delete] Supabase failed, deleting from localStorage:', e.message);
      }
    }
    localSet(localGet().filter(i => i.id !== id));
  },
};

export async function uploadFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve({ file_url: e.target.result });
    reader.readAsDataURL(file);
  });
}
