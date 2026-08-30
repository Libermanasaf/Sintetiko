-- Scorekeepers: trusted players who may update LIVE SCORES on a round
-- (team wins + player goals) without being admins. They cannot create,
-- delete, close, publish or re-team a round.
--
-- A table rather than a hardcoded email list, so the admin can change who has
-- this without a redeploy.
create table if not exists public.scorekeepers (
  email      text primary key,
  note       text,
  created_at timestamptz not null default now()
);

alter table public.scorekeepers enable row level security;

drop policy if exists scorekeepers_admin_all on public.scorekeepers;
create policy scorekeepers_admin_all on public.scorekeepers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.is_scorekeeper()
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select exists (
    select 1 from public.scorekeepers s
    where s.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$function$;

-- Postgres has no column-level RLS, so a trigger narrows what a scorekeeper may
-- change. Comparing the whole row minus the score columns means a column added
-- later stays locked down by default instead of silently becoming writable.
--
-- Privileged server-side callers (service_role / direct SQL) carry no JWT, so
-- is_admin() is false for them — they must be trusted explicitly or the /api
-- routes and maintenance SQL would be unable to write rounds at all.
create or replace function public.enforce_scorekeeper_scope()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if current_user in ('postgres', 'supabase_admin', 'service_role')
     or auth.role() = 'service_role'
     or public.is_admin() then
    return new;
  end if;

  if public.is_scorekeeper() then
    if coalesce(old.is_closed, false) then
      raise exception 'round is closed';
    end if;
    if (to_jsonb(new) - 'teamWins' - 'player_goals' - 'updated_date')
       is distinct from
       (to_jsonb(old) - 'teamWins' - 'player_goals' - 'updated_date') then
      raise exception 'scorekeepers may only update scores';
    end if;
    return new;
  end if;

  raise exception 'not authorised to update rounds';
end;
$function$;

drop trigger if exists trg_scorekeeper_scope on public.rounds;
create trigger trg_scorekeeper_scope
  before update on public.rounds
  for each row execute function public.enforce_scorekeeper_scope();

drop policy if exists rounds_scorekeeper_update on public.rounds;
create policy rounds_scorekeeper_update on public.rounds
  for update to authenticated
  using (public.is_scorekeeper() and not coalesce(is_closed, false))
  with check (public.is_scorekeeper() and not coalesce(is_closed, false));

insert into public.scorekeepers (email, note) values
  ('dgal160401@gmail.com',   'גל דניאל'),
  ('liranlevy5839@gmail.com','לירן לוי')
on conflict (email) do nothing;
