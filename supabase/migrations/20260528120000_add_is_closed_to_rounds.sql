-- Add explicit "closed" flag so admins can finalize a round without declaring a winner.
-- A closed round disappears from the home screen / active-round views and shows only in game history.
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT FALSE;
