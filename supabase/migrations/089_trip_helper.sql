-- 089: Claude helps plan trips (the trip-helper Edge Function). Anyone in the
-- family asks from the trip page's box; Claude researches and files what it
-- finds as plan / idea / booking / pack items (marked by_claude). Each ask is
-- kept so the family sees what was asked and what Claude did. Kids' asks count
-- toward their tutor daily cap and hours.

alter table public.trip_items add column if not exists by_claude boolean not null default false;

create table public.trip_asks (
  id uuid primary key default gen_random_uuid(),
  trip uuid not null references public.trips(id) on delete cascade,
  asker uuid not null references auth.users(id) on delete cascade,
  text text not null,
  reply text,
  added int not null default 0,
  created_at timestamptz not null default now()
);
create index trip_asks_trip on public.trip_asks (trip, created_at desc);
create index trip_asks_asker_day on public.trip_asks (asker, created_at);

alter table public.trip_asks enable row level security;
create policy "family reads asks" on public.trip_asks for select to authenticated using ((select public.r4_is_family()));
grant select on public.trip_asks to authenticated;
revoke all on public.trip_asks from anon;
alter publication supabase_realtime add table public.trip_asks;
