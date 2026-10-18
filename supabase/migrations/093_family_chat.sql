-- 093: the family chat on r4box.com/chat.html. One room for the family (r4_role
-- parent or kid). Messages are written only by the family-chat Edge Function
-- (which also pushes alerts and answers @claude); the family reads them live and
-- may delete their own (a parent, any). Photos live in the private storage
-- bucket family-chat, under the sender's id; only the family can read them.
-- chat_reads keeps when each person last read the chat (unread counts) and was
-- last looking at it (no push to someone who is reading already).

create table if not exists public.chat_messages (
  id bigint generated always as identity primary key,
  author uuid references auth.users(id) on delete set null,   -- null with is_claude: Claude
  is_claude boolean not null default false,
  body text check (length(body) <= 4000),
  image text check (length(image) <= 200),
  asks_claude boolean not null default false,
  created_at timestamptz not null default now(),
  check (body is not null or image is not null)
);
create index if not exists chat_messages_time on public.chat_messages (created_at desc);
create index if not exists chat_messages_asks on public.chat_messages (author, created_at) where asks_claude;

create table if not exists public.chat_reads (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  read_at timestamptz not null default now(),
  seen_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;
alter table public.chat_reads enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_messages' and policyname = 'family reads chat') then
    create policy "family reads chat" on public.chat_messages for select to authenticated using ((select public.r4_is_family()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_messages' and policyname = 'author or parent deletes') then
    create policy "author or parent deletes" on public.chat_messages for delete to authenticated
      using ((select public.r4_is_family()) and (author = (select auth.uid()) or (select public.r4_is_parent())));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_reads' and policyname = 'family reads reads') then
    create policy "family reads reads" on public.chat_reads for select to authenticated using ((select public.r4_is_family()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_reads' and policyname = 'own read marker') then
    create policy "own read marker" on public.chat_reads for all to authenticated
      using (user_id = (select auth.uid())) with check ((select public.r4_is_family()) and user_id = (select auth.uid()));
  end if;
end $$;

revoke all on public.chat_messages, public.chat_reads from anon;
grant select, delete on public.chat_messages to authenticated;
grant select, insert, update on public.chat_reads to authenticated;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_messages') then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end $$;

-- Photos: private, images only, 5 MB (the page shrinks them first).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('family-chat', 'family-chat', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'family reads chat photos') then
    create policy "family reads chat photos" on storage.objects for select to authenticated
      using (bucket_id = 'family-chat' and (select public.r4_is_family()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'family adds own chat photos') then
    create policy "family adds own chat photos" on storage.objects for insert to authenticated
      with check (bucket_id = 'family-chat' and (select public.r4_is_family()) and (storage.foldername(name))[1] = (select auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'family removes own chat photos') then
    create policy "family removes own chat photos" on storage.objects for delete to authenticated
      using (bucket_id = 'family-chat' and (storage.foldername(name))[1] = (select auth.uid())::text);
  end if;
end $$;
