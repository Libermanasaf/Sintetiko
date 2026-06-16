/**
 * Re-compresses victory photos that already live in Storage but were uploaded
 * BEFORE client-side compression existed — they're still multi-megabyte.
 *
 * Why this matters: the victory photo is the single heaviest asset in the app
 * (one measured at 4.45 MB). With a public bucket + 1-year CDN cache each browser
 * downloads it once, but the FIRST 100 viewers after a match each pull it from
 * origin: 100 × 4.45 MB ≈ 425 MB per match. Across 12 matches/month that alone
 * would blow the 5 GB egress cap. New uploads are now capped at ~250 KB by
 * src/lib/imageCompress.js; this script retrofits the OLD ones.
 *
 * Strategy: for each round whose victoryPhoto is a Storage URL, download the
 * object, and if it's over the ceiling, re-encode with `sharp` to <= ~250 KB and
 * re-upload to the SAME path (upsert). The public URL is unchanged, so the rounds
 * table needs no update and no app code changes. CDN cache is busted by re-upload.
 *
 * Requires `sharp` (server-side image lib) and the SERVICE ROLE key (Storage
 * overwrite). The service_role key must NEVER be in the client bundle — this is a
 * one-off admin script run locally. Reads it from env, not from .env client vars.
 *
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/recompress-storage-photos.cjs
 *
 * Safe to re-run: photos already under the ceiling are skipped. Dry-run by
 * default — pass --apply to actually overwrite.
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const APPLY = process.argv.includes('--apply');
const TARGET_BYTES = 250 * 1024;
const MAX_WIDTH = 1600;
const BUCKET = 'media';

// --- config: URL from .env (public), service-role from process env (secret) ---
let supabaseUrl = '';
try {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
  for (const line of envContent.split('\n')) {
    const t = line.trim();
    if (t.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = t.split('VITE_SUPABASE_URL=')[1].trim();
  }
} catch (e) {
  console.error('שגיאה בקריאת .env:', e.message);
  process.exit(1);
}
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceKey) {
  console.error('חסר SUPABASE_SERVICE_ROLE_KEY ב-env. הרץ:');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=... node scripts/recompress-storage-photos.cjs --apply');
  process.exit(1);
}

let sharp;
try { sharp = require('sharp'); }
catch { console.error('חסר sharp. התקן: npm i -D sharp'); process.exit(1); }

const supabase = createClient(supabaseUrl, serviceKey);

// derive the storage object path from a public URL
// .../storage/v1/object/public/media/victory/abc.jpg  ->  victory/abc.jpg
function pathFromUrl(url) {
  const marker = `/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length).split('?')[0];
}

// step quality/width down until under ceiling (server-side mirror of the client)
async function compress(buf) {
  const meta = await sharp(buf).metadata();
  let width = Math.min(meta.width || MAX_WIDTH, MAX_WIDTH);
  let best = null;
  while (width >= 800) {
    for (const q of [80, 70, 60, 50, 42]) {
      const out = await sharp(buf).resize({ width }).jpeg({ quality: q }).toBuffer();
      if (!best || out.length < best.length) best = out;
      if (out.length <= TARGET_BYTES) return best;
    }
    width = Math.round(width * 0.8);
  }
  return best;
}

async function run() {
  console.log(APPLY ? '=== APPLY MODE (will overwrite) ===' : '=== DRY RUN (use --apply to write) ===');
  const { data: rounds, error } = await supabase
    .from('rounds')
    .select('id, victoryPhoto');
  if (error) { console.error('קריאת מחזורים נכשלה:', error.message); process.exit(1); }

  const targets = (rounds || []).filter(
    r => typeof r.victoryPhoto === 'string' && r.victoryPhoto.includes(`/object/public/${BUCKET}/`)
  );
  if (!targets.length) { console.log('אין תמונות Storage לבדיקה.'); return; }

  let saved = 0, touched = 0;
  for (const r of targets) {
    const objPath = pathFromUrl(r.victoryPhoto);
    if (!objPath) { console.warn(`דילוג ${r.id}: URL לא מזוהה`); continue; }

    const { data: blob, error: dlErr } = await supabase.storage.from(BUCKET).download(objPath);
    if (dlErr) { console.warn(`דילוג ${r.id}: הורדה נכשלה (${dlErr.message})`); continue; }
    const buf = Buffer.from(await blob.arrayBuffer());

    if (buf.length <= TARGET_BYTES) {
      console.log(`✓ ${r.id}: ${(buf.length / 1024).toFixed(0)}KB כבר תחת התקרה — דילוג`);
      continue;
    }

    const out = await compress(buf);
    if (!out || out.length >= buf.length) { console.warn(`דילוג ${r.id}: אין רווח דחיסה`); continue; }
    console.log(`${APPLY ? '↻' : '·'} ${r.id}: ${(buf.length / 1024 / 1024).toFixed(2)}MB → ${(out.length / 1024).toFixed(0)}KB`);
    saved += buf.length - out.length;
    touched++;

    if (APPLY) {
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(objPath, out, { cacheControl: '31536000', contentType: 'image/jpeg', upsert: true });
      if (upErr) console.error(`  העלאה נכשלה ${r.id}: ${upErr.message}`);
    }
  }
  console.log(`\n${touched} תמונות, חיסכון ${(saved / 1024 / 1024).toFixed(1)}MB ${APPLY ? '(הוחל)' : '(הרצה יבשה)'}.`);
}

run();
