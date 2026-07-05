/**
 * One-off: open a regular round for 18/06/2026 from the three rosters the user
 * supplied (screenshot). Mirrors StepOpeningTeam's create flow:
 *   - Round.create({ date, teams, goalkeepers, openingTeams, is_published:false })
 *   - bump appearances +1 for every player in the round
 * Does NOT set winningTeam/teamWins/victoryPhoto — the admin finishes the round
 * in-app, which distributes trophies. The round auto-appears in Payments (keyed
 * by roundId) once it exists.
 *
 * Team order MUST match the app's color mapping: index 0=הצהובים, 1=הכחולים,
 * 2=הכתומים (see src/components/round/StepOpeningTeam.jsx TEAM_NAMES).
 *
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/open-round-18-06-2026.cjs          (dry run)
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/open-round-18-06-2026.cjs --apply
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const APPLY = process.argv.includes('--apply');

// URL from .env (public), service-role from process env (secret).
let SUPABASE_URL = '';
const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
for (const line of envContent.split('\n')) {
  const t = line.trim();
  if (t.startsWith('VITE_SUPABASE_URL=')) SUPABASE_URL = t.split('=').slice(1).join('=').trim();
}
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL (.env) or SUPABASE_SERVICE_ROLE_KEY (env)');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// Rosters as confirmed against the DB (names normalized to actual DB spelling).
const ROSTERS = {
  'הצהובים (0)': ['עידן טל', 'בן חגאי', 'מאור קאקולי', 'רפאל טולמסוב', 'לירן לוי', 'מרדכי חן', 'דוד דסלין', 'אור נחמיאס'],
  'הכחולים (1)': ['אסף ליברמן', 'רחמים מאירוב', 'חן נצר', 'אוראל מטוטי', 'רון מנדלסון', 'בר ממן', 'ניב מזרחי', 'גל דניאל'],
  'הכתומים (2)': ['ארז דיין', 'גלעד עוזיאל', 'תמיר אברהם', 'סתיו אבן', 'מתן עקרון', 'מתן גינאדי', 'גורדן מאיימבו', 'אנדו דירס'],
};

async function main() {
  const { data: players, error } = await supabase.from('players').select('id,name,appearances');
  if (error) throw error;
  const byName = new Map();
  for (const p of players) {
    if (!byName.has(p.name)) byName.set(p.name, []);
    byName.get(p.name).push(p);
  }
  const resolve = (name) => {
    const arr = byName.get(name);
    if (!arr) throw new Error('NOT FOUND in DB: ' + name);
    if (arr.length > 1) throw new Error('DUPLICATE name in DB: ' + name + ' (' + arr.length + ')');
    return arr[0];
  };

  const teams = [];
  const flatPlayers = [];
  for (const [label, names] of Object.entries(ROSTERS)) {
    const ids = names.map((n) => {
      const p = resolve(n);
      flatPlayers.push(p);
      return p.id;
    });
    teams.push(ids);
    console.log(label + ': ' + names.length + ' players resolved');
  }

  const roundPayload = {
    id: require('crypto').randomUUID(),  // app generates id client-side (entities.js)
    date: '2026-06-18T18:00:00.000+00:00',
    teams,
    goalkeepers: {},      // left empty per user
    openingTeams: [],     // not specified
    is_published: false,  // open round; admin will finish in-app
  };

  console.log('\n=== ROUND PAYLOAD ===');
  console.log(JSON.stringify({ ...roundPayload, teams: teams.map((t) => t.length + ' ids') }, null, 2));
  console.log('appearances +1 for ' + flatPlayers.length + ' players');

  if (!APPLY) {
    console.log('\n=== DRY RUN — no writes. Pass --apply to create. ===');
    return;
  }

  // 1) create round
  const { data: created, error: cErr } = await supabase.from('rounds').insert(roundPayload).select().single();
  if (cErr) throw cErr;
  console.log('\n✓ round created, id=' + created.id);

  // 2) bump appearances +1 (mirrors StepOpeningTeam)
  let ok = 0, fail = 0;
  for (const p of flatPlayers) {
    const { error: uErr } = await supabase.from('players').update({ appearances: (p.appearances || 0) + 1 }).eq('id', p.id);
    if (uErr) { fail++; console.warn('  appearance fail ' + p.name + ': ' + uErr.message); }
    else ok++;
  }
  console.log('✓ appearances bumped: ' + ok + ' ok, ' + fail + ' failed');
  console.log('\nDone. Round id ' + created.id + ' — finish it in-app to distribute trophies.');
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
