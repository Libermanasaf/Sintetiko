const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const SUPABASE_URL = 'https://xwrlgthrylaxoujtdull.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_xZ2pGCq6rTBulm6GT8xb1Q_SV6Y_r1H';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// שחקנים לפי קבוצות מהתמונה
const TEAMS_FROM_IMAGE = [
  // קבוצה 0: הצהובים
  ['יניב אזולאי', 'בר ממן', 'ניק ירושנקו', 'טל דלאל', 'חמיד אברהם', 'אביחי שם טוב'],
  // קבוצה 1: הכחולים
  ['זיו איסרס', 'חן נצר', 'אוהד סנדיק', 'רחמים רוזמן', 'ניב מזרחי', 'מתן בינאדי'],
  // קבוצה 2: הכתומים
  ['דניאל יוסיפוב', 'עידן טל', 'מתן עקרון', 'אייל קלאס', 'תומר ויצמן', 'לירן לוי'],
];

// שמות חלופיים (מיפוי שם בתמונה -> שם אפשרי בבסיס הנתונים)
const NAME_ALIASES = {
  'רחמים רוזמן': ['רחמים רומן', 'רחמים רוזמן'],
  'מתן בינאדי': ['מתן גינאדי', 'מתן בינאדי'],
  'אביחי שם טוב': ['אביתר שם טוב', 'אביחי שם טוב'],
};

const ROUND_DATE = '2026-05-20T17:00:00.000Z';

function normalizeName(name) {
  return name.trim().replace(/\s+/g, ' ');
}

function findPlayer(players, nameFromImage) {
  const normalized = normalizeName(nameFromImage);

  // חיפוש מדויק
  let found = players.find(p => normalizeName(p.name) === normalized);
  if (found) return found;

  // חיפוש לפי aliases
  const aliases = NAME_ALIASES[normalized];
  if (aliases) {
    for (const alias of aliases) {
      found = players.find(p => normalizeName(p.name) === normalizeName(alias));
      if (found) return found;
    }
  }

  // חיפוש חלקי (שם פרטי + חלק משם משפחה)
  const parts = normalized.split(' ');
  if (parts.length >= 2) {
    found = players.find(p => {
      const pParts = normalizeName(p.name).split(' ');
      return pParts[0] === parts[0] && pParts[1]?.startsWith(parts[1]?.slice(0, 3));
    });
    if (found) return found;
  }

  return null;
}

async function run() {
  console.log('שולף שחקנים מ-Supabase...');
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('*');

  if (playersError) {
    console.error('שגיאה בשליפת שחקנים:', playersError.message);
    process.exit(1);
  }

  console.log(`נמצאו ${players.length} שחקנים בסה"כ\n`);

  const now = new Date().toISOString();

  // מיפוי שמות לIDים
  const teamIds = [];
  let allFound = true;

  for (let i = 0; i < TEAMS_FROM_IMAGE.length; i++) {
    const teamNames = TEAMS_FROM_IMAGE[i];
    const teamName = ['הצהובים', 'הכחולים', 'הכתומים'][i];
    const ids = [];

    console.log(`--- ${teamName} ---`);
    for (const name of teamNames) {
      const player = findPlayer(players, name);
      if (player) {
        console.log(`  ✓ ${name} → ${player.name} (${player.id})`);
        ids.push(player.id);
      } else {
        console.log(`  ✗ לא נמצא: ${name}`);
        allFound = false;
      }
    }
    console.log();
    teamIds.push(ids);
  }

  // הוסף שחקנים חדשים שלא נמצאו
  if (!allFound) {
    const missingNames = [];
    for (let i = 0; i < TEAMS_FROM_IMAGE.length; i++) {
      for (const name of TEAMS_FROM_IMAGE[i]) {
        if (!findPlayer(players, name)) missingNames.push({ name, teamIndex: i });
      }
    }

    console.log(`מוסיף ${missingNames.length} שחקנים חדשים...`);
    for (const { name } of missingNames) {
      const newPlayer = {
        id: crypto.randomUUID(),
        name,
        rating: 2.5,
        image: null,
        wins: 0,
        appearances: 0,
        created_date: now,
        updated_date: now,
      };
      const { data: created, error: createErr } = await supabase
        .from('players')
        .insert([newPlayer])
        .select()
        .single();
      if (createErr) {
        console.error(`שגיאה בהוספת שחקן ${name}:`, createErr.message);
        process.exit(1);
      }
      players.push(created);
      console.log(`  ✓ שחקן חדש נוסף: ${name} (${created.id})`);
    }
    console.log();

    // בנה מחדש את הקבוצות עם השחקנים החדשים
    for (let i = 0; i < TEAMS_FROM_IMAGE.length; i++) {
      teamIds[i] = TEAMS_FROM_IMAGE[i].map(name => findPlayer(players, name)?.id).filter(Boolean);
    }
  }

  // בדיקה שהמחזור עוד לא קיים בתאריך זה
  const roundDate = new Date(ROUND_DATE);
  const { data: existingRounds } = await supabase.from('rounds').select('id, date');
  const alreadyExists = existingRounds?.some(r => {
    const d = new Date(r.date);
    return d.getFullYear() === roundDate.getFullYear() &&
      d.getMonth() === roundDate.getMonth() &&
      d.getDate() === roundDate.getDate();
  });

  if (alreadyExists) {
    console.log('⚠️  מחזור בתאריך 20.5.2026 כבר קיים! מדלג על יצירה.');
    process.exit(0);
  }

  // יצירת המחזור
  const roundId = crypto.randomUUID();

  const roundData = {
    id: roundId,
    date: ROUND_DATE,
    teams: teamIds,
    teamWins: {},
    winningTeam: null,
    goalkeepers: {},
    openingTeams: [],
    victoryPhoto: null,
    created_date: now,
    updated_date: now,
  };

  console.log('מכניס מחזור ל-Supabase...');
  const { error: roundError } = await supabase.from('rounds').insert([roundData]);
  if (roundError) {
    console.error('שגיאה בהכנסת המחזור:', roundError.message);
    process.exit(1);
  }
  console.log(`✓ מחזור נוצר (ID: ${roundId})\n`);

  // יצירת רשומת תשלומים (כל השחקנים לא שילמו בהתחלה)
  const allPlayerIds = teamIds.flat();
  const paymentsObj = {};
  allPlayerIds.forEach(id => { paymentsObj[id] = false; });

  const paymentData = {
    id: crypto.randomUUID(),
    roundId,
    roundDate: ROUND_DATE,
    payments: paymentsObj,
    pricePerPlayer: 40,
    created_date: now,
    updated_date: now,
  };

  console.log('יוצר רשומת תשלומים ב-Supabase...');
  const { error: paymentError } = await supabase.from('payments').insert([paymentData]);
  if (paymentError) {
    console.error('שגיאה ביצירת רשומת תשלומים:', paymentError.message);
    process.exit(1);
  }
  console.log(`✓ רשומת תשלומים נוצרה (${allPlayerIds.length} שחקנים, מחיר: ₪40)\n`);

  console.log('✅ המחזור מ-20.5.2026 הוכנס בהצלחה!');
  console.log('   - 3 קבוצות, 18 שחקנים');
  console.log('   - יומן משחקים: מחזור נוסף');
  console.log('   - יומן תשלומים: פתוח לכל השחקנים');
}

run();
