-- Admin-only per-player rating breakdown: who rated a given player, and what
-- they gave. admin_rating_averages() aggregates rater identity away (GROUP BY
-- rated_player_id), which is the right default for the roster list. This is the
-- drill-down for one player, so the admin screen can show the individual rows.
--
-- SECURITY DEFINER + an explicit is_admin() check, mirroring
-- admin_rating_averages: player_ratings has a permissive
-- "allow_all_player_ratings" RLS policy, so the gate here is what actually
-- keeps rater identity out of a regular player's reach. Never drop it, and
-- never expose this to the `anon`/`authenticated` roles without the check.
create or replace function public.admin_player_rating_breakdown(p_rated_player_id text)
returns table (
  rater_player_id text,
  rater_name      text,
  rater_image     text,
  rating          numeric,
  created_at      timestamptz,
  updated_at      timestamptz
)
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  return query
    select
      pr.rater_player_id,
      coalesce(rp.name, 'שחקן שנמחק'),
      rp.image,
      pr.rating,
      pr.created_at,
      pr.updated_at
    from public.player_ratings pr
    -- LEFT JOIN so a rating whose rater row was deleted still shows up; the
    -- FK is ON DELETE CASCADE today, but the count must not silently shrink
    -- if that ever changes.
    left join public.players rp on rp.id = pr.rater_player_id
    where pr.rated_player_id = p_rated_player_id
    order by pr.rating desc, coalesce(rp.name, '') asc;
end;
$function$;

revoke all on function public.admin_player_rating_breakdown(text) from public, anon;
grant execute on function public.admin_player_rating_breakdown(text) to authenticated;
