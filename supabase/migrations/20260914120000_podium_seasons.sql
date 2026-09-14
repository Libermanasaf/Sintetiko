-- Separating two things that shared one column.
--
-- players.wins was BOTH the podium ranking and each player's career trophy
-- count. Resetting the podium for a new season would therefore have wiped
-- everyone's lifetime trophies — so the season count gets its own column and
-- `wins` keeps its original meaning: trophies for life.
--
--   wins          -> career trophies, never reset (personal stats, Hall of Fame)
--   season_wins   -> current podium only, reset each season
--   podium_titles -> times this player finished #1 on a podium (מלך הפודיום)
alter table public.players add column if not exists season_wins   int not null default 0;
alter table public.players add column if not exists podium_titles int not null default 0;

comment on column public.players.wins is
  'Career trophies — cumulative for life. Never reset; drives personal stats.';
comment on column public.players.season_wins is
  'Trophies in the CURRENT podium season. Reset when a new podium starts.';
comment on column public.players.podium_titles is
  'Times this player finished first on a podium (מלך הפודיום).';

-- History of podiums, so a reset is recorded rather than silently discarded.
create table if not exists public.podium_seasons (
  id          text primary key,
  title       text not null,
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  winner_id   text references public.players(id) on delete set null,
  winner_wins int,
  is_current  boolean not null default true
);

alter table public.podium_seasons enable row level security;

drop policy if exists podium_seasons_read on public.podium_seasons;
create policy podium_seasons_read on public.podium_seasons
  for select to authenticated using (true);

drop policy if exists podium_seasons_admin on public.podium_seasons;
create policy podium_seasons_admin on public.podium_seasons
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
