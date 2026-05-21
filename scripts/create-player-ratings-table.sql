-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/xwrlgthrylaxoujtdull/sql

create table if not exists player_ratings (
  id bigserial primary key,
  rater_player_id integer not null references players(id) on delete cascade,
  rated_player_id integer not null references players(id) on delete cascade,
  rating numeric(3,1) not null check (rating >= 1.0 and rating <= 5.0),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(rater_player_id, rated_player_id)
);

alter table player_ratings enable row level security;

create policy "allow_all_player_ratings" on player_ratings
  for all using (true) with check (true);
