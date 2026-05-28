-- 1. Add missing columns to rounds table
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS "mvpVotes" JSONB DEFAULT '{}'::jsonb;

-- 2. Create round_bets table
CREATE TABLE IF NOT EXISTS round_bets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  round_id TEXT NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  player_name TEXT,
  voted_team_index INTEGER NOT NULL,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(round_id, player_id)
);

-- Disable Row Level Security (RLS) for round_bets
ALTER TABLE round_bets DISABLE ROW LEVEL SECURITY;

-- 3. Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  endpoint TEXT PRIMARY KEY,
  subscription JSONB NOT NULL,
  user_email TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Disable Row Level Security (RLS) for push_subscriptions
ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;

-- 4. Ensure signups and lists_state exist
CREATE TABLE IF NOT EXISTS signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT,
  player_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  day TEXT NOT NULL,
  note TEXT,
  status TEXT DEFAULT 'waiting',
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE signups ALTER COLUMN player_id TYPE TEXT;
ALTER TABLE signups DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS lists_state (
  id TEXT PRIMARY KEY,
  data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE lists_state DISABLE ROW LEVEL SECURITY;
INSERT INTO lists_state (id, data) VALUES ('main', '{}'::jsonb) ON CONFLICT (id) DO NOTHING;
