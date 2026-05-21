-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/xwrlgthrylaxoujtdull/sql

create table if not exists push_subscriptions (
  id bigserial primary key,
  endpoint text unique not null,
  subscription jsonb not null,
  user_email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table push_subscriptions enable row level security;

create policy "allow_all_push_subscriptions" on push_subscriptions
  for all using (true) with check (true);
