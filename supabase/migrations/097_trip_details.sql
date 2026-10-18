-- 097: richer trip items and a discussion on each.
-- preview: what the item's link says about itself (title, description, image,
--   site), fetched by the link-preview Edge Function when someone opens the item.
-- photos: pictures the family adds, in the private trip-photos bucket under the
--   adder's id; only the family can see them.
-- trip_comments: a live discussion on any item, for the whole family.

alter table public.trip_items add column if not exists preview jsonb;
alter table public.trip_items add column if not exists photos text[] not null default '{}';

create table if not exists public.trip_comments (
  id bigint generated always as identity primary key,
  trip uuid not null references public.trips(id) on delete cascade,
  item uuid not null references public.trip_items(id) on delete cascade,
  author uuid not null references auth.users(id) on delete cascade default auth.uid(),
  body text not null check (length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists trip_comments_item on public.trip_comments (item, id);
create index if not exists trip_comments_trip on public.trip_comments (trip);

alter table public.trip_comments enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trip_comments' and policyname = 'family reads comments') then
    create policy "family reads comments" on public.trip_comments for select to authenticated using ((select public.r4_is_family()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trip_comments' and policyname = 'family comments as themselves') then
    create policy "family comments as themselves" on public.trip_comments for insert to authenticated
      with check ((select public.r4_is_family()) and author = (select auth.uid())
                  and exists (select 1 from public.trip_items i where i.id = item and i.trip = trip_comments.trip));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trip_comments' and policyname = 'author or parent removes comments') then
    create policy "author or parent removes comments" on public.trip_comments for delete to authenticated
      using (author = (select auth.uid()) or (select public.r4_is_parent()));
  end if;
end $$;
revoke all on public.trip_comments from anon;
grant select, insert, delete on public.trip_comments to authenticated;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'trip_comments') then
    alter publication supabase_realtime add table public.trip_comments;
  end if;
end $$;

-- Photos: private, images only, 5 MB (the page shrinks them first).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trip-photos', 'trip-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'family reads trip photos') then
    create policy "family reads trip photos" on storage.objects for select to authenticated
      using (bucket_id = 'trip-photos' and (select public.r4_is_family()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'family adds own trip photos') then
    create policy "family adds own trip photos" on storage.objects for insert to authenticated
      with check (bucket_id = 'trip-photos' and (select public.r4_is_family()) and (storage.foldername(name))[1] = (select auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'own or parent removes trip photos') then
    create policy "own or parent removes trip photos" on storage.objects for delete to authenticated
      using (bucket_id = 'trip-photos' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.r4_is_parent())));
  end if;
end $$;
