const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// קריאה ידנית של קובץ ה- .env
let supabaseUrl = '';
let supabaseAnonKey = '';

try {
  const envPath = path.join(__dirname, '../.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = trimmed.split('VITE_SUPABASE_URL=')[1].trim();
    }
    if (trimmed.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      supabaseAnonKey = trimmed.split('VITE_SUPABASE_ANON_KEY=')[1].trim();
    }
  }
} catch (e) {
  console.error('שגיאה בקריאת קובץ .env:', e.message);
}

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('YOUR_SUPABASE') || supabaseAnonKey.includes('YOUR_SUPABASE')) {
  console.error('שגיאה: משתני הסביבה ב- .env אינם מוגדרים או שטרם הוחלפו מהמפתחות הזמניים (placeholders).');
  console.log('אנא פתח את הקובץ .env בתיקיית הפרויקט והזן את כתובת ה-URL והמפתח ה-Anon שלך מתוך Supabase.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('מחלץ נתונים מקובץ הגיבוי...');
  
  const backupPath = path.join(__dirname, '../synthetiko-backup-2026-05-19_01-21.json');
  if (!fs.existsSync(backupPath)) {
    console.error(`קובץ הגיבוי לא נמצא בנתיב: ${backupPath}`);
    process.exit(1);
  }
  
  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  const { players, rounds, payments } = backup.data;

  console.log(`שחקנים לייבוא: ${players ? players.length : 0}`);
  console.log(`סבבים לייבוא: ${rounds ? rounds.length : 0}`);
  console.log(`תשלומים לייבוא: ${payments ? payments.length : 0}`);

  // 1. ייבוא שחקנים
  if (players && players.length > 0) {
    console.log('מייבא שחקנים ל-Supabase...');
    const { error } = await supabase.from('players').upsert(players);
    if (error) {
      console.error('שגיאה בייבוא שחקנים:', error.message);
      process.exit(1);
    }
    console.log('שחקנים יובאו בהצלחה.');
  }

  // 2. ייבוא סבבים
  if (rounds && rounds.length > 0) {
    console.log('מייבא סבבים ל-Supabase...');
    const { error } = await supabase.from('rounds').upsert(rounds);
    if (error) {
      console.error('שגיאה בייבוא סבבים:', error.message);
      process.exit(1);
    }
    console.log('סבבים יובאו בהצלחה.');
  }

  // 3. ייבוא תשלומים
  if (payments && payments.length > 0) {
    console.log('מייבא תשלומים ל-Supabase...');
    const { error } = await supabase.from('payments').upsert(payments);
    if (error) {
      console.error('שגיאה בייבוא תשלומים:', error.message);
      process.exit(1);
    }
    console.log('תשלומים יובאו בהצלחה.');
  }

  console.log('ייבוא הנתונים ל-Supabase הושלם בהצלחה! 🎉');
}

run();
