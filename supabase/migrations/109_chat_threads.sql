-- 109: the family chat around the family world (design system: chat kit).
--
-- chat_messages.reply_to: a reply in a thread (its root message). Replies go when
-- the root goes, so "delete" takes the whole thread with it.
--
-- chat_reactions: one row per person, emoji and message (the six the chat offers).
-- The family reads them; everyone adds and removes only their own.
--
-- Shared diary words in the chat: when someone shares a journal entry or a story
-- from their world (kid_shares, 108), a card with what they shared (the same title
-- and excerpt the family can already read) is posted to the chat. Unsharing takes
-- the card away again, so the words go private everywhere at once.

alter table public.chat_messages add column if not exists reply_to bigint references public.chat_messages(id) on delete cascade;
create index if not exists chat_messages_thread on public.chat_messages (reply_to, id) where reply_to is not null;

create table if not exists public.chat_reactions (
  message bigint not null references public.chat_messages(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  emoji text not null check (emoji in ('❤️', '😂', '👍', '😮', '🔥', '🎉')),
  created_at timestamptz not null default now(),
  primary key (message, user_id, emoji)
);
alter table public.chat_reactions enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_reactions' and policyname = 'family reads reactions') then
    create policy "family reads reactions" on public.chat_reactions for select to authenticated using ((select public.r4_is_family()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_reactions' and policyname = 'own reactions') then
    create policy "own reactions" on public.chat_reactions for insert to authenticated
      with check (user_id = (select auth.uid()) and (select public.r4_is_family()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_reactions' and policyname = 'own reactions go') then
    create policy "own reactions go" on public.chat_reactions for delete to authenticated using (user_id = (select auth.uid()));
  end if;
end $$;
revoke all on public.chat_reactions from anon;
grant select, insert, delete on public.chat_reactions to authenticated;
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_reactions') then
    alter publication supabase_realtime add table public.chat_reactions;
  end if;
end $$;

create or replace function public.r4_share_to_chat() returns trigger
  language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.chat_messages (author, body, ref)
    values (new.owner,
      case when new.kind = 'story' then '🌳 Shared a story: ' else '🌳 Shared a journal entry: ' end || coalesce(new.title, 'untitled'),
      jsonb_build_object('type', 'story', 'who', new.owner, 'kind', new.kind, 'ref', new.ref, 'title', new.title, 'text', new.text, 'day', new.day));
    return new;
  end if;
  delete from public.chat_messages
   where author = old.owner and ref->>'type' = 'story' and ref->>'kind' = old.kind and ref->>'ref' = old.ref;
  return old;
end $$;
revoke all on function public.r4_share_to_chat() from public, anon, authenticated;
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'kid_shares_to_chat') then
    create trigger kid_shares_to_chat after insert or delete on public.kid_shares for each row execute function public.r4_share_to_chat();
  end if;
end $$;
