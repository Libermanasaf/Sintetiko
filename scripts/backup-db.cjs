/**
 * Full Supabase backup: exports every table to one timestamped JSON file in
 * backups/. Runs locally with the service_role key (bypasses RLS) — Supabase
 * FREE has no backups, so this is the only "undo" if data is ever lost.
 *
 *   node scripts/backup-db.cjs
 *
 * Scheduled weekly via Windows Task Scheduler ("Sintetiko DB Backup").
 * Keeps the last KEEP backups, deletes older ones. The backups/ folder lives
 * inside OneDrive, so each file also gets an offsite copy automatically.
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// --- config from .env (works no matter what cwd the scheduler uses) ---------
let SUPABASE_URL = '', SERVICE_KEY = '';
for (const line of fs.readFileSync(path.join(__dirname, '../.env'), 'utf8').split('\n')) {
  const t = line.trim();
  if (t.startsWith('VITE_SUPABASE_URL=')) SUPABASE_URL = t.split('=').slice(1).join('=').trim();
  if (t.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) SERVICE_KEY = t.split('=').slice(1).join('=').trim();
}
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// Every table + its primary key (for stable pagination). Composite keys use
// their first column — good enough for ordering.
const TABLES = {
  rounds: 'id',
  players: 'id',
  player_ratings: 'id',
  payments: 'id',
  login_events: 'id',
  page_visits: 'user_id',
  list_views: 'day',
  lists_state: 'id',
  professionals: 'id',
  push_subscriptions: 'id',
  signups: 'id',
  round_bets: 'id',
  mvp_overrides: 'player_id',
  monthly_summary_log: 'month',
};

const KEEP = 10;         // how many backup files to retain
const PAGE = 1000;       // Supabase returns max 1000 rows per request

async function dumpTable(name, pk) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(name).select('*').order(pk, { ascending: true }).range(from, from + PAGE - 1);
    if (error) throw new Error(`${name}: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

async function main() {
  const stamp = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '');
  const outDir = path.join(__dirname, '../backups');
  fs.mkdirSync(outDir, { recursive: true });

  const backup = { created_at: new Date().toISOString(), tables: {} };
  for (const [name, pk] of Object.entries(TABLES)) {
    backup.tables[name] = await dumpTable(name, pk);
    console.log(`  ${name}: ${backup.tables[name].length} rows`);
  }

  const outFile = path.join(outDir, `sintetiko-backup-${stamp}.json`);
  fs.writeFileSync(outFile, JSON.stringify(backup));
  const sizeKb = Math.round(fs.statSync(outFile).size / 1024);
  console.log(`\nBackup written: ${outFile} (${sizeKb} KB)`);

  // Retention: keep the newest KEEP files, delete the rest.
  const files = fs.readdirSync(outDir)
    .filter((f) => f.startsWith('sintetiko-backup-') && f.endsWith('.json'))
    .sort()
    .reverse();
  for (const old of files.slice(KEEP)) {
    fs.unlinkSync(path.join(outDir, old));
    console.log(`Pruned old backup: ${old}`);
  }
}

main().catch((e) => { console.error('BACKUP FAILED:', e.message); process.exit(1); });
