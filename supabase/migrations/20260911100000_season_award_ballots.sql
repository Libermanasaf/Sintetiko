-- ADMIN ONLY: who voted for whom. season_award_results aggregates voter
-- identity away, which is right for the ceremony; this is the drill-down.
--
-- SECURITY DEFINER with an explicit is_admin() check. season_award_votes is
-- not client-readable at all under RLS, so this check is the only door and it
-- must stay — players were told the vote is secret.
create or replace function public.season_award_ballots(p_award_id text)
returns table (
  category        text,
  voter_id        text,
  voter_name      text,
  voter_image     text,
  candidate_id    text,
  candidate_name  text,
  candidate_image text,
  created_at      timestamptz
)
language plpgsql stable security definer set search_path to ''
as $function$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  return query
    select
      v.category,
      v.voter_id,
      -- LEFT JOIN so a ballot still shows if a player row was removed; the
      -- count must never silently shrink.
      coalesce(vp.name, 'שחקן שנמחק'),
      vp.image,
      v.candidate_id,
      coalesce(cp.name, 'שחקן שנמחק'),
      cp.image,
      v.created_at
    from public.season_award_votes v
    left join public.players vp on vp.id = v.voter_id
    left join public.players cp on cp.id = v.candidate_id
    where v.award_id = p_award_id
    order by v.category, cp.name nulls last, vp.name;
end;
$function$;

revoke all on function public.season_award_ballots(text) from public, anon;
grant execute on function public.season_award_ballots(text) to authenticated;
