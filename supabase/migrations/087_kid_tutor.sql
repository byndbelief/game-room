-- 087: the kids' tutor. Claude, through the kid-tutor Edge Function, which alone
-- writes here (service role). Kids read their own chats; a parent reads only the
-- chats Claude flagged as worrying, and sets each kid's daily cap and hours.

create table public.tutor_chats (
  id uuid primary key default gen_random_uuid(),
  kid uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New chat',
  flagged boolean not null default false,
  flag_reason text,
  flagged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tutor_chats_kid on public.tutor_chats (kid, updated_at desc);

create table public.tutor_messages (
  id bigint generated always as identity primary key,
  chat uuid not null references public.tutor_chats(id) on delete cascade,
  kid uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  flagged boolean not null default false,
  created_at timestamptz not null default now()
);
create index tutor_messages_chat on public.tutor_messages (chat, id);
create index tutor_messages_kid_day on public.tutor_messages (kid, created_at) where role = 'user';

create table public.tutor_settings (
  kid uuid primary key references auth.users(id) on delete cascade,
  daily_cap int not null default 40 check (daily_cap between 0 and 500),
  start_hour int not null default 7 check (start_hour between 0 and 23),
  end_hour int not null default 21 check (end_hour between 1 and 24),
  tz text not null default 'America/New_York',
  updated_at timestamptz not null default now()
);

create or replace function public.r4_is_parent() returns boolean
  language sql stable set search_path = '' as
  $$ select coalesce((auth.jwt() -> 'app_metadata' ->> 'r4_role') = 'parent', false) $$;

alter table public.tutor_chats enable row level security;
alter table public.tutor_messages enable row level security;
alter table public.tutor_settings enable row level security;

create policy "kid reads own chats" on public.tutor_chats for select to authenticated
  using (kid = (select auth.uid()));
create policy "parent reads flagged chats" on public.tutor_chats for select to authenticated
  using (flagged and (select public.r4_is_parent()));

create policy "kid reads own messages" on public.tutor_messages for select to authenticated
  using (kid = (select auth.uid()));
create policy "parent reads flagged chats' messages" on public.tutor_messages for select to authenticated
  using ((select public.r4_is_parent()) and exists (select 1 from public.tutor_chats c where c.id = chat and c.flagged));

create policy "kid reads own settings" on public.tutor_settings for select to authenticated
  using (kid = (select auth.uid()));
create policy "parent reads settings" on public.tutor_settings for select to authenticated
  using ((select public.r4_is_parent()));
create policy "parent adds settings" on public.tutor_settings for insert to authenticated
  with check ((select public.r4_is_parent()));
create policy "parent changes settings" on public.tutor_settings for update to authenticated
  using ((select public.r4_is_parent())) with check ((select public.r4_is_parent()));

-- A parent marks a flagged chat as seen (clears the flag). Nothing else changes.
create or replace function public.tutor_clear_flag(p_chat uuid) returns void
  language plpgsql security definer set search_path = '' as $$
begin
  if not public.r4_is_parent() then raise exception 'parents only'; end if;
  update public.tutor_chats set flagged = false where id = p_chat;
end $$;
revoke execute on function public.tutor_clear_flag(uuid) from public, anon;
grant execute on function public.tutor_clear_flag(uuid) to authenticated;

grant select on public.tutor_chats, public.tutor_messages to authenticated;
grant select, insert, update on public.tutor_settings to authenticated;
revoke all on public.tutor_chats, public.tutor_messages, public.tutor_settings from anon;

insert into public.tutor_settings (kid)
  select id from auth.users where raw_app_meta_data ->> 'r4_role' = 'kid'
  on conflict do nothing;
