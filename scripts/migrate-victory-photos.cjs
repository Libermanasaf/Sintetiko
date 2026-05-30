/**
 * Migrates base64 victoryPhoto values out of the `rounds` table into Supabase
 * Storage (bucket: media), then rewrites the column to the public URL.
 *
 * Why: a base64 data-URI sits inside the row, so every `select('*')` on rounds
 * re-downloads the full image. Two old rounds held 6.4MB of base64 between them,
 * which the app's auto-refetch was pulling repeatedly — the main egress driver.
 *
 * Safe to re-run: only touches rows whose victoryPhoto still starts with "data:".
 *
 * Usage: node scripts/migrate-victory-photos.cjs
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manual .env read (mirrors the other scripts in this folder)
let supabaseUrl = '';
let supabaseAnonKey = '';
try {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
  for (const line of envContent.split('\n')) {
    const t = line.trim();
    if (t.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = t.split('VITE_SUPABASE_URL=')[1].trim();
    if (t.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseAnonKey = t.split('VITE_SUPABASE_ANON_KEY=')[1].trim();
  }
} catch (e) {
  console.error('שגיאה בקריאת .env:', e.message);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// data:image/jpeg;base64,XXXX  ->  { contentType, ext, buffer }
function parseDataUri(uri) {
  const m = /^data:([^;]+);base64,(.*)$/s.exec(uri);
  if (!m) return null;
  const contentType = m[1];
  const ext = (contentType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  return { contentType, ext, buffer: Buffer.from(m[2], 'base64') };
}

async function run() {
  const { data: rounds, error } = await supabase
    .from('rounds')
    .select('id, victoryPhoto');
  if (error) { console.error('קריאת מחזורים נכשלה:', error.message); process.exit(1); }

  const targets = (rounds || []).filter(r => typeof r.victoryPhoto === 'string' && r.victoryPhoto.startsWith('data:'));
  if (targets.length === 0) {
    console.log('אין תמונות base64 להגירה — הכל כבר URLs. ✅');
    return;
  }
  console.log(`נמצאו ${targets.length} תמונות base64 להגירה.`);

  for (const r of targets) {
    const parsed = parseDataUri(r.victoryPhoto);
    if (!parsed) { console.warn(`דילוג על ${r.id} — data-URI לא תקין`); continue; }

    const storagePath = `victory/${r.id}.${parsed.ext}`;
    const { error: upErr } = await supabase.storage
      .from('media')
      .upload(storagePath, parsed.buffer, {
        cacheControl: '31536000',
        contentType: parsed.contentType,
        upsert: true,
      });
    if (upErr) { console.error(`העלאת ${r.id} נכשלה:`, upErr.message); continue; }

    const { data: pub } = supabase.storage.from('media').getPublicUrl(storagePath);
    const { error: updErr } = await supabase
      .from('rounds')
      .update({ victoryPhoto: pub.publicUrl })
      .eq('id', r.id);
    if (updErr) { console.error(`עדכון ${r.id} נכשל:`, updErr.message); continue; }

    console.log(`✅ ${r.id}: ${(parsed.buffer.length / 1024 / 1024).toFixed(2)}MB → ${pub.publicUrl}`);
  }
  console.log('סיום.');
}

run();
