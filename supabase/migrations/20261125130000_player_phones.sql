-- Players' WhatsApp numbers, admin-only. Kept out of `players` on purpose:
-- every logged-in player reads players, and phone numbers must not leak.
create table if not exists public.player_phones (
  player_id text primary key references public.players(id) on delete cascade,
  phone text not null,
  updated_at timestamptz not null default now()
);
alter table public.player_phones enable row level security;
create policy player_phones_admin_all on public.player_phones
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
