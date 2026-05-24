-- Add per-round per-player goal tracking
ALTER TABLE rounds
  ADD COLUMN IF NOT EXISTS player_goals JSONB DEFAULT '{}'::jsonb;
