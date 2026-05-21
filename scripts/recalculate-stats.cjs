const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xwrlgthrylaxoujtdull.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_xZ2pGCq6rTBulm6GT8xb1Q_SV6Y_r1H';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// מחשב מחדש הופעות וגביעים לכל שחקן מתוך טבלת המחזורים:
//   הופעות = מספר המחזורים בהם השחקן מופיע באחת הקבוצות
//   גביעים = מספר המחזורים בהם הקבוצה של השחקן זכתה (winningTeam)
async function run() {
  const { data: rounds, error: roundsErr } = await supabase.from('rounds').select('*');
  if (roundsErr) { console.error('שגיאה בשליפת מחזורים:', roundsErr.message); process.exit(1); }

  const { data: players, error: playersErr } = await supabase.from('players').select('*');
  if (playersErr) { console.error('שגיאה בשליפת שחקנים:', playersErr.message); process.exit(1); }

  console.log(`מחשב מחדש מתוך ${rounds.length} מחזורים עבור ${players.length} שחקנים...\n`);

  const trueApp = {};
  const trueWin = {};
  rounds.forEach(round => {
    (round.teams || []).forEach((team, teamIndex) => {
      team.forEach(pid => {
        trueApp[pid] = (trueApp[pid] || 0) + 1;
        if (round.winningTeam === teamIndex) {
          trueWin[pid] = (trueWin[pid] || 0) + 1;
        }
      });
    });
  });

  const now = new Date().toISOString();
  let changed = 0;

  for (const player of players) {
    const newApp = trueApp[player.id] || 0;
    const newWin = trueWin[player.id] || 0;
    const oldApp = player.appearances || 0;
    const oldWin = player.wins || 0;

    if (newApp === oldApp && newWin === oldWin) continue;

    const { error: updateErr } = await supabase
      .from('players')
      .update({ appearances: newApp, wins: newWin, updated_date: now })
      .eq('id', player.id);

    if (updateErr) {
      console.error(`שגיאה בעדכון ${player.name}:`, updateErr.message);
      continue;
    }

    const appTag = newApp !== oldApp ? `הופעות ${oldApp}→${newApp}` : '';
    const winTag = newWin !== oldWin ? `גביעים ${oldWin}→${newWin}` : '';
    console.log(`  ✓ ${player.name}: ${[appTag, winTag].filter(Boolean).join(', ')}`);
    changed++;
  }

  console.log(`\n✅ הסתיים. עודכנו ${changed} שחקנים, ${players.length - changed} ללא שינוי.`);
}

run();
