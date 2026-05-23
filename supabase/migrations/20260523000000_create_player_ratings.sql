-- Fix: player_ratings was previously defined with integer FK columns
-- but players.id is TEXT. This creates the table with correct types.

DROP TABLE IF EXISTS player_ratings;

CREATE TABLE player_ratings (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  rater_player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  rated_player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  rating       NUMERIC(3,1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(rater_player_id, rated_player_id)
);

ALTER TABLE player_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_player_ratings" ON player_ratings
  FOR ALL USING (true) WITH CHECK (true);
