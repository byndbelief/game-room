-- 088: trips the family plans together on r4box.com/trip.html. Everyone in the
-- family (r4_role parent or kid) reads and adds; bookings (money, confirmation
-- numbers) are added and changed by a parent. Items are one table by kind:
-- plan (a day's activity), idea (voted on), booking, pack (a packing line; who =
-- whose list, null = shared).

create or replace function public.r4_is_family() returns boolean
  language sql stable set search_path = '' as
  $$ select coalesce((auth.jwt() -> 'app_metadata' ->> 'r4_role') in ('parent', 'kid'), false) $$;

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  place text,
  starts date,
  ends date,
  currency text not null default 'USD',
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.trip_items (
  id uuid primary key default gen_random_uuid(),
  trip uuid not null references public.trips(id) on delete cascade,
  kind text not null check (kind in ('plan', 'idea', 'booking', 'pack')),
  day date,
  at text,
  title text not null check (length(title) between 1 and 200),
  notes text,
  link text,
  cost numeric(10,2),
  conf text,
  who uuid references auth.users(id) on delete set null,
  done boolean not null default false,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index trip_items_trip on public.trip_items (trip, kind, day);

create table public.trip_votes (
  item uuid not null references public.trip_items(id) on delete cascade,
  voter uuid not null references auth.users(id) on delete cascade default auth.uid(),
  value smallint not null check (value in (-1, 1)),
  primary key (item, voter)
);

alter table public.trips enable row level security;
alter table public.trip_items enable row level security;
alter table public.trip_votes enable row level security;

create policy "family reads trips" on public.trips for select to authenticated using ((select public.r4_is_family()));
create policy "parent adds trips" on public.trips for insert to authenticated with check ((select public.r4_is_parent()));
create policy "parent changes trips" on public.trips for update to authenticated using ((select public.r4_is_parent())) with check ((select public.r4_is_parent()));
create policy "parent removes trips" on public.trips for delete to authenticated using ((select public.r4_is_parent()));

create policy "family reads items" on public.trip_items for select to authenticated using ((select public.r4_is_family()));
create policy "family adds items" on public.trip_items for insert to authenticated
  with check ((select public.r4_is_family()) and created_by = (select auth.uid()) and (kind <> 'booking' or (select public.r4_is_parent())));
create policy "family changes items" on public.trip_items for update to authenticated
  using ((select public.r4_is_family()) and (kind <> 'booking' or (select public.r4_is_parent())))
  with check ((select public.r4_is_family()) and (kind <> 'booking' or (select public.r4_is_parent())));
create policy "creator or parent removes items" on public.trip_items for delete to authenticated
  using ((select public.r4_is_family()) and (created_by = (select auth.uid()) or (select public.r4_is_parent())));

create policy "family reads votes" on public.trip_votes for select to authenticated using ((select public.r4_is_family()));
create policy "own vote" on public.trip_votes for insert to authenticated with check ((select public.r4_is_family()) and voter = (select auth.uid()));
create policy "change own vote" on public.trip_votes for update to authenticated using (voter = (select auth.uid())) with check (voter = (select auth.uid()));
create policy "remove own vote" on public.trip_votes for delete to authenticated using (voter = (select auth.uid()));

grant select, insert, update, delete on public.trips, public.trip_items, public.trip_votes to authenticated;
revoke all on public.trips, public.trip_items, public.trip_votes from anon;

-- Who is in the family (for packing lists and names), to the family only.
create or replace function public.r4_family() returns table (id uuid, username text, role text)
  language sql stable security definer set search_path = '' as $$
  select u.id, p.username, u.raw_app_meta_data ->> 'r4_role'
  from auth.users u join public.profiles p on p.id = u.id
  where public.r4_is_family() and u.raw_app_meta_data ->> 'r4_role' in ('parent', 'kid')
  order by 3 desc, 2
$$;
revoke execute on function public.r4_family() from public, anon;
grant execute on function public.r4_family() to authenticated;

alter publication supabase_realtime add table public.trips, public.trip_items, public.trip_votes;
