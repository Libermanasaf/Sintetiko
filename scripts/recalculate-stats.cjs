const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xwrlgthrylaxoujtdull.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_xZ2pGCq6rTBulm6GT8xb1Q_SV6Y_r1H';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// מחשב את הקבוצה המנצחת מתוך teamWins:
//   הקבוצה עם מספר הניצחונות הגבוה ביותר זוכה.
//   אם יש שוויון בצמרת (או שאין תוצאות) — אין מנצחת (null).
function computeWinningTeam(teamWins) {
  const tw = teamWins || {};
  const values = Object.values(tw);
  if (values.length === 0) return null;
  const max = Math.max(...values);
  if (max === 0) return null;
  const topTeams = Object.keys(tw).filter(k => (tw[k] || 0) === max);
  return topTeams.length === 1 ? parseInt(topTeams[0], 10) : null;
}

// מחשב מחדש הופעות וגביעים לכל שחקן מתוך טבלת המחזורים:
//   הופעות = מספר המחזורים בהם השחקן מופיע באחת הקבוצות
//   גביעים = מספר המחזורים בהם הקבוצה של השחקן זכתה
async function run() {
  const { data: rounds, error: roundsErr } = await supabase.from('rounds').select('*');
  if (roundsErr) { console.error('שגיאה בשליפת מחזורים:', roundsErr.message); process.exit(1); }

  const { data: players, error: playersErr } = await supabase.from('players').select('*');
  if (playersErr) { console.error('שגיאה בשליפת שחקנים:', playersErr.message); process.exit(1); }

  const now = new Date().toISOString();

  // שלב 1: תיקון winningTeam בכל מחזור לפי teamWins
  console.log('שלב 1 — מתקן קבוצה מנצחת לפי תוצאות המחזור...');
  let roundsFixed = 0;
  for (const round of rounds) {
    const correct = computeWinningTeam(round.teamWins);
    const stored = round.winningTeam ?? null;
    if (stored === correct) continue;
    const { error } = await supabase
      .from('rounds')
      .update({ winningTeam: correct, updated_date: now })
      .eq('id', round.id);
    if (error) { console.error('  שגיאה בעדכון מחזור:', error.message); continue; }
    console.log(`  ✓ ${new Date(round.date).toISOString().slice(0, 10)}: קבוצה מנצחת ${stored} → ${correct}`);
    roundsFixed++;
  }
  console.log(`  ${roundsFixed} מחזורים תוקנו.\n`);

  // שלב 2: חישוב הופעות וגביעים מתוך המחזורים המתוקנים
  console.log('שלב 2 — מחשב מחדש הופעות וגביעים לשחקנים...');
  const trueApp = {};
  const trueWin = {};
  rounds.forEach(round => {
    const winningTeam = computeWinningTeam(round.teamWins);
    (round.teams || []).forEach((team, teamIndex) => {
      team.forEach(pid => {
        trueApp[pid] = (trueApp[pid] || 0) + 1;
        if (winningTeam === teamIndex) {
          trueWin[pid] = (trueWin[pid] || 0) + 1;
        }
      });
    });
  });

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
      console.error(`  שגיאה בעדכון ${player.name}:`, updateErr.message);
      continue;
    }

    const appTag = newApp !== oldApp ? `הופעות ${oldApp}→${newApp}` : '';
    const winTag = newWin !== oldWin ? `גביעים ${oldWin}→${newWin}` : '';
    console.log(`  ✓ ${player.name}: ${[appTag, winTag].filter(Boolean).join(', ')}`);
    changed++;
  }

  console.log(`\n✅ הסתיים. ${roundsFixed} מחזורים תוקנו, ${changed} שחקנים עודכנו.`);
}

run();
