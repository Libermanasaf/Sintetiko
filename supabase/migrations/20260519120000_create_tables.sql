-- יצירת טבלת שחקנים
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rating NUMERIC,
  image TEXT,
  wins INTEGER DEFAULT 0,
  appearances INTEGER DEFAULT 0,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- יצירת טבלת סבבים
CREATE TABLE IF NOT EXISTS rounds (
  id TEXT PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE,
  teams JSONB,
  goalkeepers JSONB,
  "openingTeams" JSONB,
  "winningTeam" INTEGER,
  "teamWins" JSONB,
  "victoryPhoto" TEXT,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- יצירת טבלת תשלומים
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  "roundId" TEXT REFERENCES rounds(id) ON DELETE CASCADE,
  "roundDate" TIMESTAMP WITH TIME ZONE,
  payments JSONB,
  "pricePerPlayer" NUMERIC,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- כיבוי RLS לצורך גישה חופשית מהאפליקציה (כמו שהיה ב-LocalStorage)
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE rounds DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
