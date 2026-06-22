import { createStorage } from './storage';
import { supabase } from '../lib/supabase';
import { sanitizeRow } from '../lib/sanitize';
import { compressImage } from '../lib/imageCompress';

export const Player = createStorage('Player');
export const Round = createStorage('Round');
export const Payment = createStorage('Payment');
export const PlayerRating = createStorage('PlayerRating');
export const RoundBet = createStorage('RoundBet');
export const Professional = createStorage('Professional');

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
    data = sanitizeRow(data);
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
    data = sanitizeRow(data);
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

// Uploads an image to Supabase Storage (bucket: media) and returns its public URL.
// Storing the URL — instead of a base64 data-URI in a table column — keeps row
// payloads tiny so list queries don't re-download megabytes of image data.
// Falls back to a base64 data-URI when Supabase isn't configured (local dev).
export async function uploadFile(file) {
  // Compress before anything else: phone photos are 3–12 MB; this cuts them to
  // ~250 KB, saving Storage (1 GB cap) and egress on every view. Fail-soft.
  const compressed = await compressImage(file);

  if (!supabase) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve({ file_url: e.target.result });
      reader.readAsDataURL(compressed);
    });
  }

  const ext = (compressed.name?.split('.').pop() || 'jpg').toLowerCase();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from('media')
    .upload(path, compressed, { cacheControl: '31536000', contentType: compressed.type || undefined });
  if (error) throw new Error(`העלאת התמונה נכשלה: ${error.message}`);

  const { data } = supabase.storage.from('media').getPublicUrl(path);
  return { file_url: data.publicUrl };
}
