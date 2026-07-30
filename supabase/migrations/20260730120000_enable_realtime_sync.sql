-- Enable Supabase Realtime for cross-device sync (phone <-> desktop, both ways).
--
-- WHY: the `supabase_realtime` publication existed but contained ZERO tables, so
-- every postgres_changes subscription connected successfully and then received
-- nothing, forever. Client-side subscriptions are inert without this migration.
--
-- SCOPE: only the tables that change while two+ people are looking at the app:
--   lists_state — the rosters the admin edits (the reported bug)
--   rounds      — live match state (teams, goals, MVP votes)
--   signups     — players adding/removing themselves from a day
-- Deliberately NOT added: players, payments, player_ratings. They change rarely
-- and are already covered by explicit invalidateQueries after each mutation;
-- adding them would stream row changes to every client for no liveness gain.
--
-- EGRESS: realtime REPLACES polling here, it does not add to it. A changed row is
-- pushed once over one shared WebSocket instead of every client re-fetching the
-- whole table on a timer. See EGRESS.md.
--
-- RLS: postgres_changes is filtered per-subscriber through RLS, so the existing
-- policies on these tables continue to apply to streamed rows. No policy changes.

-- REPLICA IDENTITY FULL makes the OLD row available on UPDATE/DELETE events.
-- Needed because lists_state is a single wide jsonb row ('main'): without it the
-- payload carries only the primary key and clients can't tell what changed.
ALTER TABLE public.lists_state REPLICA IDENTITY FULL;
ALTER TABLE public.rounds      REPLICA IDENTITY FULL;
ALTER TABLE public.signups     REPLICA IDENTITY FULL;

-- Idempotent: re-running must not fail if a table is already published.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_publication p ON p.oid = pr.prpubid
    JOIN pg_class c       ON c.oid = pr.prrelid
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'lists_state'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.lists_state;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_publication p ON p.oid = pr.prpubid
    JOIN pg_class c       ON c.oid = pr.prrelid
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'rounds'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rounds;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_publication p ON p.oid = pr.prpubid
    JOIN pg_class c       ON c.oid = pr.prrelid
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'signups'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.signups;
  END IF;
END $$;
