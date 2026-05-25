import { createStorage } from './storage';
import { supabase } from '../lib/supabase';

export const Player = createStorage('Player');
export const Round = createStorage('Round');
export const Payment = createStorage('Payment');
export const PlayerRating = createStorage('PlayerRating');
export const RoundBet = createStorage('RoundBet');

/* ─── Signup entity — Supabase only (no silent fallback so errors are visible) ─── */
export const Signup = {
  async list(sortField) {
    if (!supabase) throw new Error('Supabase לא מוגדר');
    let query = supabase.from('signups').select('*');
    if (sortField) {
      const desc = sortField.startsWith('-');
      const field = desc ? sortField.slice(1) : sortField;
      query = query.order(field, { ascending: !desc });
    }
    const { data, error } = await query;
    if (error) throw new Error(`קריאת רישומים נכשלה: ${error.message}`);
    return data || [];
  },

  async create(data) {
    if (!supabase) throw new Error('Supabase לא מוגדר');
    const item = {
      ...data,
      id: data.id || crypto.randomUUID(),
      created_date: data.created_date || new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };
    const { data: created, error } = await supabase.from('signups').insert([item]).select().single();
    if (error) throw new Error(`רישום ל-Supabase נכשל: ${error.message}`);
    return created;
  },

  async update(id, data) {
    if (!supabase) throw new Error('Supabase לא מוגדר');
    const updateData = { ...data, updated_date: new Date().toISOString() };
    const { data: updated, error } = await supabase.from('signups').update(updateData).eq('id', id).select().single();
    if (error) throw new Error(`עדכון רישום נכשל: ${error.message}`);
    return updated;
  },

  async delete(id) {
    if (!supabase) throw new Error('Supabase לא מוגדר');
    const { error } = await supabase.from('signups').delete().eq('id', id);
    if (error) throw new Error(`מחיקת רישום נכשלה: ${error.message}`);
  },
};

export async function uploadFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve({ file_url: e.target.result });
    reader.readAsDataURL(file);
  });
}
