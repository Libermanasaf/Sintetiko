-- Fix: "seen ✓" marks stopped appearing on ALL day lists after 2026-07-17.
--
-- Evidence: public.list_views has views only up to 2026-07-16; zero rows since,
-- for every day, even though Sunday/Thursday were re-published afterwards. The
-- break coincides with the 2026-07-17 Shaming-poll migration, which revoked and
-- re-granted several functions — record_list_view / list_viewers lost their
-- EXECUTE grant to `authenticated` (anon/authenticated now get HTTP 401), so the
-- player app can no longer record a view and the admin can no longer read them.
--
-- record_list_view / list_viewers are SECURITY DEFINER, so the only thing needed
-- is to restore EXECUTE to authenticated. The table grants + permissive policies
-- are added defensively in case RLS also lost its INSERT/SELECT path.

GRANT EXECUTE ON FUNCTION public.record_list_view(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_viewers(text)     TO authenticated;

-- Defensive: the DEFINER functions run as owner, but keep direct table access
-- working too so nothing silently blocks the insert/read.
GRANT INSERT, SELECT ON TABLE public.list_views TO authenticated;

DROP POLICY IF EXISTS list_views_insert_authenticated ON public.list_views;
CREATE POLICY list_views_insert_authenticated ON public.list_views
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS list_views_select_authenticated ON public.list_views;
CREATE POLICY list_views_select_authenticated ON public.list_views
  FOR SELECT TO authenticated USING (true);
