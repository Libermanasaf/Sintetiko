-- הוספת עמודות אימייל ואישור שחקנים
ALTER TABLE players ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;

-- עדכון שחקנים קיימים ל-Approved (כדי שלא ננעל את השחקנים הקיימים שיובאו מהגיבוי)
UPDATE players SET is_approved = TRUE;
