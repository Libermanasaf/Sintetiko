-- The calling player's own open payments (last 30 days), for the in-app
-- "you have an open payment" banner. Only rounds the admin has started a
-- payment record for count; payments stays admin-only under RLS.
create or replace function public.my_unpaid_payments()
returns table (round_date timestamptz, price numeric)
language sql
stable
security definer
set search_path = public
as $$
  select p."roundDate", coalesce(p."pricePerPlayer", 35)
  from players me
  join payments p on p."roundDate" >= now() - interval '30 days'
  join rounds r on r.id = p."roundId"
  where me.user_id = auth.uid()::text
    and exists (
      select 1 from jsonb_array_elements(r.teams) t, jsonb_array_elements_text(t) pid
      where pid = me.id
    )
    and coalesce((p.payments ->> me.id)::boolean, false) = false
  order by p."roundDate";
$$;
revoke all on function public.my_unpaid_payments() from public, anon;
grant execute on function public.my_unpaid_payments() to authenticated;
