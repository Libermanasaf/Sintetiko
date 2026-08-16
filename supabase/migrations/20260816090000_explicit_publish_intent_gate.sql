-- A day's list must be visible to players ONLY after a deliberate "publish"
-- action by the admin. Previously visibility was decided purely by
-- publishedLists[day].publishedAt being < 24h old — and any client path that
-- re-snapshotted a day (e.g. confirming a stand-by signup) stamped that field
-- to now(), flipping an unpublished list live. Encoding intent in the client
-- was the mistake: publishing is a jsonb blob write, so every admin-side code
-- path could grant visibility by accident.
--
-- New rule: serve a day only when publishedLists[day].intent = 'publish' AND
-- publishedAt is within 24h. Re-snapshot paths (publishDayList with
-- refreshOnly) write rows and publishedAt but never set `intent`, so they can
-- refresh an already-published list and can never publish an unpublished one.
--
-- Fails closed: a day with no `intent` is treated as NOT published.
create or replace function public.get_lists_state()
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
DECLARE
  blob jsonb;
  fresh jsonb := '{}'::jsonb;
  day text;
  entry jsonb;
  pub_at timestamptz;
BEGIN
  SELECT data INTO blob FROM public.lists_state WHERE id = 'main';
  IF blob IS NULL THEN RETURN NULL; END IF;

  -- Admin: full live blob (editing/preview).
  IF public.is_admin() THEN
    RETURN blob;
  END IF;

  -- Player: a day must be explicitly published AND fresh (< 24h).
  FOR day IN SELECT jsonb_object_keys(COALESCE(blob->'publishedLists', '{}'::jsonb))
  LOOP
    entry := blob->'publishedLists'->day;

    -- Fail closed: no explicit publish intent recorded => not visible.
    CONTINUE WHEN COALESCE(entry->>'intent', '') <> 'publish';

    BEGIN
      pub_at := (entry->>'publishedAt')::timestamptz;
    EXCEPTION WHEN others THEN
      pub_at := NULL;
    END;

    IF pub_at IS NOT NULL AND pub_at > (now() - interval '24 hours') THEN
      fresh := fresh || jsonb_build_object(day, entry);
    END IF;
  END LOOP;

  RETURN jsonb_build_object('publishedLists', fresh);
END;
$function$;
