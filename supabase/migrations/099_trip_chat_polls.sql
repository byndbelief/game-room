-- 099: a chat for the whole trip, and polls.
-- trip_comments.item may now be empty: those are the trip's own chat (the trip
-- page's Chat tab); with an item they stay that item's discussion.
-- trip_polls: a question with 2 to 6 options, in a trip's chat or an item's
-- discussion. Everyone in the family votes once and may change their vote; the
-- poll's author or a parent can close it.

alter table public.trip_comments alter column item drop not null;
do $$ begin
  -- The trip's own chat (no item). Kept beside the item policy, which needs an item.
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trip_comments' and policyname = 'family chats on the trip') then
    create policy "family chats on the trip" on public.trip_comments for insert to authenticated
      with check ((select public.r4_is_family()) and author = (select auth.uid()) and item is null
                  and exists (select 1 from public.trips t where t.id = trip));
  end if;
end $$;

create table if not exists public.trip_polls (
  id bigint generated always as identity primary key,
  trip uuid not null references public.trips(id) on delete cascade,
  item uuid references public.trip_items(id) on delete cascade,   -- empty: the trip's chat
  author uuid not null references auth.users(id) on delete cascade default auth.uid(),
  question text not null check (length(question) between 1 and 200),
  options text[] not null check (cardinality(options) between 2 and 6 and length(array_to_string(options, '')) <= 480 and array_position(options, '') is null),
  closed boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists trip_polls_trip on public.trip_polls (trip);

create table if not exists public.trip_poll_votes (
  poll bigint not null references public.trip_polls(id) on delete cascade,
  voter uuid not null references auth.users(id) on delete cascade default auth.uid(),
  choice smallint not null check (choice >= 0),
  created_at timestamptz not null default now(),
  primary key (poll, voter)
);

alter table public.trip_polls enable row level security;
alter table public.trip_poll_votes enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trip_polls' and policyname = 'family reads polls') then
    create policy "family reads polls" on public.trip_polls for select to authenticated using ((select public.r4_is_family()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trip_polls' and policyname = 'family starts polls') then
    create policy "family starts polls" on public.trip_polls for insert to authenticated
      with check ((select public.r4_is_family()) and author = (select auth.uid()) and not closed
                  and (item is null or exists (select 1 from public.trip_items i where i.id = item and i.trip = trip_polls.trip)));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trip_polls' and policyname = 'author or parent closes polls') then
    create policy "author or parent closes polls" on public.trip_polls for update to authenticated
      using (author = (select auth.uid()) or (select public.r4_is_parent()))
      with check (author = (select auth.uid()) or (select public.r4_is_parent()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trip_polls' and policyname = 'author or parent removes polls') then
    create policy "author or parent removes polls" on public.trip_polls for delete to authenticated
      using (author = (select auth.uid()) or (select public.r4_is_parent()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trip_poll_votes' and policyname = 'family reads votes') then
    create policy "family reads votes" on public.trip_poll_votes for select to authenticated using ((select public.r4_is_family()));
  end if;
  -- A vote is one of the poll's options, on a poll still open.
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trip_poll_votes' and policyname = 'own vote on an open poll') then
    create policy "own vote on an open poll" on public.trip_poll_votes for insert to authenticated
      with check ((select public.r4_is_family()) and voter = (select auth.uid())
                  and exists (select 1 from public.trip_polls p where p.id = poll and not p.closed and choice < cardinality(p.options)));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trip_poll_votes' and policyname = 'change own vote on an open poll') then
    create policy "change own vote on an open poll" on public.trip_poll_votes for update to authenticated
      using (voter = (select auth.uid()))
      with check (voter = (select auth.uid()) and exists (select 1 from public.trip_polls p where p.id = poll and not p.closed and choice < cardinality(p.options)));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trip_poll_votes' and policyname = 'take back own vote') then
    create policy "take back own vote" on public.trip_poll_votes for delete to authenticated
      using (voter = (select auth.uid()) and exists (select 1 from public.trip_polls p where p.id = poll and not p.closed));
  end if;
end $$;
revoke all on public.trip_polls, public.trip_poll_votes from anon;
grant select, insert, update, delete on public.trip_polls, public.trip_poll_votes to authenticated;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'trip_polls') then
    alter publication supabase_realtime add table public.trip_polls;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'trip_poll_votes') then
    alter publication supabase_realtime add table public.trip_poll_votes;
  end if;
end $$;
