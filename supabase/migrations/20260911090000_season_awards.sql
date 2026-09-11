-- Season awards: players vote once per category for the club's end-of-season
-- ceremony. Modelled on cast_mvp_vote — one vote, final, no self-voting,
-- enforced server-side — but scoped to a season rather than a round.
--
-- Every player who can log in may vote, including those below the candidacy
-- floor: voting is open to the club, being nominated is earned.
create table if not exists public.season_awards (
  id            text primary key,
  title         text not null,
  opens_at      timestamptz,
  closes_at     timestamptz,
  is_open       boolean not null default false,
  results_shown boolean not null default false,
  min_rounds    int not null default 10,
  created_at    timestamptz not null default now()
);

create table if not exists public.season_award_votes (
  award_id     text not null references public.season_awards(id) on delete cascade,
  category     text not null,
  voter_id     text not null,
  candidate_id text not null references public.players(id) on delete cascade,
  created_at   timestamptz not null default now(),
  -- The PK is what makes a vote final: a second insert conflicts and is dropped.
  primary key (award_id, category, voter_id)
);

alter table public.season_awards      enable row level security;
alter table public.season_award_votes enable row level security;

drop policy if exists season_awards_read on public.season_awards;
create policy season_awards_read on public.season_awards
  for select to authenticated using (true);

drop policy if exists season_awards_admin on public.season_awards;
create policy season_awards_admin on public.season_awards
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Raw votes are never client-readable. Tallies come from an RPC that refuses
-- until the admin reveals, so an early voter cannot see the running score (and
-- sway later voters), and nobody can see who voted for whom.
drop policy if exists season_award_votes_admin on public.season_award_votes;
create policy season_award_votes_admin on public.season_award_votes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.season_awards (id, title, opens_at, min_rounds)
values ('2026', 'נבחרי העונה 2026', '2026-01-01', 10)
on conflict (id) do nothing;
