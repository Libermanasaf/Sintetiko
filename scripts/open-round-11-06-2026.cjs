/**
 * One-off: open a regular round for 11/06/2026 from the three rosters (6 per team).
 * Opening match: הצהובים(0) vs הכתומים(2) -> openingTeams:[0,2]. +1 appearance for
 * all 18 players. is_published:false (admin finishes in-app).
 *
 * Team order MUST match app color mapping: 0=הצהובים 1=הכחולים 2=הכתומים.
 *
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/open-round-11-06-2026.cjs            (dry run)
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/open-round-11-06-2026.cjs --apply
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const APPLY = process.argv.includes('--apply');

let SUPABASE_URL = '';
for (const line of fs.readFileSync(path.join(__dirname, '../.env'), 'utf8').split('\n')) {
  const t = line.trim();
  if (t.startsWith('VITE_SUPABASE_URL=')) SUPABASE_URL = t.split('=').slice(1).join('=').trim();
}
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) { console.error('Missing URL or SERVICE_ROLE_KEY'); process.exit(1); }
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const ROSTERS = {
  'הצהובים (0)': ['דוד דסלין', 'אוראל מטוטי', 'אסף ליברמן', 'בן חגאי', 'דור ביטון', 'מרדכי חן'],
  'הכחולים (1)': ['גלעד עוזיאל', 'סתיו אבן', 'רפאל טולמסוב', 'שי נחמיאס', 'עידן טל', 'אור נחמיאס'],
  'הכתומים (2)': ['ארז דיין', 'חן נצר', 'מידד חליבה', 'מתן גינאדי', 'ראם כהן', 'בר ממן'],
};
const OPENING_TEAMS = [0, 2]; // צהובים vs כתומים

async function main() {
  const { data: players, error } = await supabase.from('players').select('id,name,appearances');
  if (error) throw error;
  const byName = new Map();
  for (const p of players) { if (!byName.has(p.name)) byName.set(p.name, []); byName.get(p.name).push(p); }
  const resolve = (name) => {
    const arr = byName.get(name);
    if (!arr) throw new Error('NOT FOUND: ' + name);
    if (arr.length > 1) throw new Error('DUPLICATE: ' + name);
    return arr[0];
  };

  const teams = [];
  const flat = [];
  for (const [label, names] of Object.entries(ROSTERS)) {
    const ids = names.map((n) => { const p = resolve(n); flat.push(p); return p.id; });
    teams.push(ids);
    console.log(label + ': ' + names.length + ' resolved');
  }
  const roundPayload = {
    id: crypto.randomUUID(),
    date: '2026-06-11T18:00:00.000+00:00',
    teams,
    goalkeepers: {},
    openingTeams: OPENING_TEAMS,
    is_published: false,
  };
  console.log('\n=== 11.6 ROUND ===');
  console.log(JSON.stringify({ ...roundPayload, teams: teams.map((t) => t.length + ' ids') }, null, 2));
  console.log('appearances +1 for ' + flat.length + ' players');

  if (!APPLY) { console.log('\n=== DRY RUN — no writes. Pass --apply. ==='); return; }

  const { data: created, error: cErr } = await supabase.from('rounds').insert(roundPayload).select().single();
  if (cErr) throw cErr;
  console.log('\n✓ round created, id=' + created.id);

  let ok = 0, fail = 0;
  for (const p of flat) {
    const { error: e } = await supabase.from('players').update({ appearances: (p.appearances || 0) + 1 }).eq('id', p.id);
    if (e) { fail++; console.warn('  appearance fail ' + p.name + ': ' + e.message); } else ok++;
  }
  console.log('✓ appearances: ' + ok + ' ok, ' + fail + ' failed');
  console.log('\nDone. Round id ' + created.id + ' — finish it in-app to distribute trophies.');
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
