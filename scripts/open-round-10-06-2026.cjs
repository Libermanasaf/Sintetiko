/**
 * One-off, three actions (mirrors the app's create flow + a backfill):
 *   1. Create new player "דור אזורד" (rating 3, id = randomUUID) — he's in the
 *      10.6 yellow roster but doesn't exist yet.
 *   2. Open a regular round for 10/06/2026 from the three rosters (6 per team).
 *      Opening match: הצהובים(0) vs הכתומים(2) -> openingTeams:[0,2]. +1 appearance
 *      for all 18 players. is_published:false (admin finishes in-app).
 *   3. Backfill openingTeams on the existing 18.6 round so MatchDay recognizes it
 *      as active (it requires openingTeams.length >= 2). Opening was הכתומים vs
 *      הכחולים; in that round teams order is [צהובים0, כחולים1, כתומים2] ->
 *      openingTeams:[2,1].
 *
 * Team order MUST match the app color mapping: 0=הצהובים 1=הכחולים 2=הכתומים.
 *
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/open-round-10-06-2026.cjs            (dry run)
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/open-round-10-06-2026.cjs --apply
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const APPLY = process.argv.includes('--apply');
const ROUND_18_ID = 'fd255f9f-5e48-4320-98b2-0e982a0d67f2';

let SUPABASE_URL = '';
for (const line of fs.readFileSync(path.join(__dirname, '../.env'), 'utf8').split('\n')) {
  const t = line.trim();
  if (t.startsWith('VITE_SUPABASE_URL=')) SUPABASE_URL = t.split('=').slice(1).join('=').trim();
}
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) { console.error('Missing URL or SERVICE_ROLE_KEY'); process.exit(1); }
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const NEW_PLAYER = 'דור אזורד';
// Rosters in app color order. (NEW_PLAYER is resolved/created at runtime.)
const ROSTERS = {
  'הצהובים (0)': ['דוד דסלין', 'אביחי שרה קאן', NEW_PLAYER, 'אריאל רביבו', 'גל בן חמו', 'יניב אזולאי'],
  'הכחולים (1)': ['גלעד עוזיאל', 'מידד חליבה', 'ינון בן שאול', 'מתן גינאדי', 'בר ממן', 'מאור קאקולי'],
  'הכתומים (2)': ['גל דניאל', 'תמיר אברהם', 'לירן לוי', 'מאור חימי', 'עידו לדרמן', 'גורדן מאיימבו'],
};
const OPENING_TEAMS_10_6 = [0, 2]; // צהובים vs כתומים
const OPENING_TEAMS_18_6 = [2, 1]; // כתומים vs כחולים

async function main() {
  const { data: players, error } = await supabase.from('players').select('id,name,appearances');
  if (error) throw error;
  const byName = new Map();
  for (const p of players) { if (!byName.has(p.name)) byName.set(p.name, []); byName.get(p.name).push(p); }

  // --- 1. ensure new player exists ---
  let newPlayer = (byName.get(NEW_PLAYER) || [])[0];
  if (newPlayer) {
    console.log('player "' + NEW_PLAYER + '" already exists -> ' + newPlayer.id);
  } else {
    const payload = { id: crypto.randomUUID(), name: NEW_PLAYER, rating: 3 };
    console.log('WILL CREATE player: ' + JSON.stringify(payload));
    if (APPLY) {
      const { data: created, error: e } = await supabase.from('players').insert(payload).select().single();
      if (e) throw e;
      newPlayer = created;
      console.log('  ✓ created ' + created.id);
    } else {
      newPlayer = { ...payload, appearances: 0 }; // for dry-run resolution
    }
  }
  byName.set(NEW_PLAYER, [newPlayer]);

  const resolve = (name) => {
    const arr = byName.get(name);
    if (!arr) throw new Error('NOT FOUND: ' + name);
    if (arr.length > 1) throw new Error('DUPLICATE: ' + name);
    return arr[0];
  };

  // --- 2. build + create 10.6 round ---
  const teams = [];
  const flat = [];
  for (const [label, names] of Object.entries(ROSTERS)) {
    const ids = names.map((n) => { const p = resolve(n); flat.push(p); return p.id; });
    teams.push(ids);
    console.log(label + ': ' + names.length + ' resolved');
  }
  const roundPayload = {
    id: crypto.randomUUID(),
    date: '2026-06-10T18:00:00.000+00:00',
    teams,
    goalkeepers: {},
    openingTeams: OPENING_TEAMS_10_6,
    is_published: false,
  };
  console.log('\n=== 10.6 ROUND ===');
  console.log(JSON.stringify({ ...roundPayload, teams: teams.map((t) => t.length + ' ids') }, null, 2));
  console.log('appearances +1 for ' + flat.length + ' players');

  console.log('\n=== 18.6 BACKFILL ===');
  console.log('set openingTeams = ' + JSON.stringify(OPENING_TEAMS_18_6) + ' on round ' + ROUND_18_ID);

  if (!APPLY) { console.log('\n=== DRY RUN — no writes. Pass --apply. ==='); return; }

  // create round
  const { data: created, error: cErr } = await supabase.from('rounds').insert(roundPayload).select().single();
  if (cErr) throw cErr;
  console.log('\n✓ 10.6 round created, id=' + created.id);

  // appearances +1
  let ok = 0, fail = 0;
  for (const p of flat) {
    const { error: e } = await supabase.from('players').update({ appearances: (p.appearances || 0) + 1 }).eq('id', p.id);
    if (e) { fail++; console.warn('  appearance fail ' + p.name + ': ' + e.message); } else ok++;
  }
  console.log('✓ appearances: ' + ok + ' ok, ' + fail + ' failed');

  // backfill 18.6
  const { error: bErr } = await supabase.from('rounds').update({ openingTeams: OPENING_TEAMS_18_6 }).eq('id', ROUND_18_ID);
  if (bErr) throw bErr;
  console.log('✓ 18.6 openingTeams backfilled');
  console.log('\nDone. Both rounds should now show win-buttons in MatchDay (admin).');
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
