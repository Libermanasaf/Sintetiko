-- הוספת עמודת user_id לקשר בין משתמשי Auth לשחקנים קיימים
ALTER TABLE players ADD COLUMN IF NOT EXISTS user_id TEXT;
