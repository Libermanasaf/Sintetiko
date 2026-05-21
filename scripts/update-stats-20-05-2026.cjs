const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xwrlgthrylaxoujtdull.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_xZ2pGCq6rTBulm6GT8xb1Q_SV6Y_r1H';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ROUND_DATE = '2026-05-20';
const ROUND_ID = '49929bcf-181b-447d-879a-67d60c4fe3bc';

// קבוצה 0 = הצהובים (מנצחת)
const YELLOW_TEAM_IDS = [
  '6a04139e45177fba9f354fe3', // יניב אזולאי
  '6a0413a1b04434f16acfea37', // בר ממן
  '6a0413958f5f6fc58fafdcaa', // ניק ירושנקו
  '6a0413926d960ff84b56a91b', // טל דלאל
  '30cb3c1d-a26c-4262-9df0-2af79025f352', // חמיד אברהם
  '6a0413a6ab08e981de3c1758', // אביתר שם טוב
];

const BLUE_TEAM_IDS = [
  '6a04138eb95f701eab3f4e14', // זיו איסרס
  '6a04139fbb952083164c7ba6', // חן נצר
  '6a04139496a0739b4f98b17c', // אוהד סנדיק
  '6a041398e44d990ba9e50ea5', // רחמים רומן
  '6a04139a4e8301e0dfab9542', // ניב מזרחי
  '6a04139bd6c4e22464840460', // מתן גינאדי
];

const ORANGE_TEAM_IDS = [
  '6a041397a37c1085cb853b8c', // דניאל יוסיפוב
  '6a041399221d6f482e97318d', // עידן טל
  '6a04138b851c24bb35b9bfb9', // מתן עקרון
  '6a041392ed5bedf55689f6e9', // אייל קלאס
  '303aaf2b-0f33-44b2-a4d8-3d4b976c5dab', // תומר ויצמן
  '6a04139ddda029401693a54c', // לירן לוי
];

const ALL_PLAYER_IDS = [...YELLOW_TEAM_IDS, ...BLUE_TEAM_IDS, ...ORANGE_TEAM_IDS];

async function run() {
  // שלוף נתונים נוכחיים
  const { data: players, error } = await supabase
    .from('players')
    .select('id, name, appearances, wins')
    .in('id', ALL_PLAYER_IDS);

  if (error) { console.error('שגיאה:', error.message); process.exit(1); }

  console.log('מעדכן סטטיסטיקות שחקנים...\n');

  for (const player of players) {
    const isWinner = YELLOW_TEAM_IDS.includes(player.id);
    const newAppearances = (player.appearances || 0) + 1;
    const newWins = (player.wins || 0) + (isWinner ? 1 : 0);

    const { error: updateErr } = await supabase
      .from('players')
      .update({ appearances: newAppearances, wins: newWins, updated_date: new Date().toISOString() })
      .eq('id', player.id);

    if (updateErr) {
      console.error(`שגיאה בעדכון ${player.name}:`, updateErr.message);
    } else {
      const tag = isWinner ? '🏆' : '  ';
      console.log(`${tag} ${player.name}: הופעות ${player.appearances}→${newAppearances}${isWinner ? `, גביעים ${player.wins}→${newWins}` : ''}`);
    }
  }

  // עדכן winningTeam=0 במחזור
  console.log('\nמעדכן קבוצה מנצחת במחזור...');
  const { error: roundErr } = await supabase
    .from('rounds')
    .update({ winningTeam: 0, updated_date: new Date().toISOString() })
    .eq('id', ROUND_ID);

  if (roundErr) {
    console.error('שגיאה בעדכון המחזור:', roundErr.message);
  } else {
    console.log(`✓ קבוצה מנצחת עודכנה: הצהובים (index 0)`);
  }

  console.log('\n✅ עדכון הושלם!');
}

run();
