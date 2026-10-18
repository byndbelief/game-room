-- 108: the kids' world pages (r4box.com/diary.html, design system: family world).
--
-- kid_seeds: what a kid plants on their ground: something they want to grow next
-- (to learn, a wonder, somewhere to go). Only they see and change their seeds.
--
-- kid_shares: what someone chose to share with the family: one journal entry
-- (kind 'entry', ref = its day) or one topic's story (kind 'story', ref = the topic
-- id). The family reads shares (the title and a short excerpt, kept with the share);
-- a shared story also opens its moments to the family through r4_world. Unsharing
-- deletes the row, and the words are private again.
--
-- r4_world(kid): one world for its page. Topic names for the kid, a parent, or a
-- shared story; event summaries and journal entries only for the kid or what they
-- shared. A kid may open only their own world; a parent, any kid's.

create table if not exists public.kid_seeds (
  id uuid primary key default gen_random_uuid(),
  kid uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (length(title) between 1 and 60),
  kind text not null check (kind in ('tutor', 'chat', 'trip')),
  x real not null, y real not null,
  day date not null default current_date,
  created_at timestamptz not null default now()
);
create table if not exists public.kid_shares (
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('entry', 'story')),
  ref text not null check (length(ref) <= 60),
  title text check (length(title) <= 120),
  day date,
  text text check (length(text) <= 400),
  created_at timestamptz not null default now(),
  primary key (owner, kind, ref)
);
alter table public.kid_seeds enable row level security;
alter table public.kid_shares enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kid_seeds' and policyname = 'own seeds') then
    create policy "own seeds" on public.kid_seeds for all to authenticated
      using (kid = (select auth.uid())) with check (kid = (select auth.uid()) and (select public.r4_is_family()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kid_shares' and policyname = 'family reads shares') then
    create policy "family reads shares" on public.kid_shares for select to authenticated using ((select public.r4_is_family()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kid_shares' and policyname = 'own shares') then
    create policy "own shares" on public.kid_shares for all to authenticated
      using (owner = (select auth.uid())) with check (owner = (select auth.uid()) and (select public.r4_is_family()));
  end if;
end $$;
revoke all on public.kid_seeds, public.kid_shares from anon;
grant select, insert, update, delete on public.kid_seeds, public.kid_shares to authenticated;

create or replace function public.r4_world(p_kid uuid) returns jsonb
  language plpgsql stable security definer set search_path = '' as $$
declare v_self boolean := p_kid = auth.uid(); v_parent boolean := public.r4_is_parent();
begin
  if not (v_self or v_parent) then raise exception 'not allowed'; end if;
  return jsonb_build_object(
    'topics', (select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'slug', t.slug, 'source', t.source, 'stage', t.stage, 'parent', t.parent, 'created', t.created,
                 'title', t.title, 'summary', case when v_self or s.ref is not null then t.summary end) order by t.created, t.slug), '[]'::jsonb)
               from public.kid_topics t left join public.kid_shares s on s.owner = t.kid and s.kind = 'story' and s.ref = t.id::text
               where t.kid = p_kid),
    'events', (select coalesce(jsonb_agg(jsonb_build_object('id', e.id, 'topic', e.topic, 'day', e.day, 'kind', e.kind, 'effort', e.effort, 'meta', e.meta,
                 'summary', case when v_self or s.ref is not null then e.summary end) order by e.day, e.id), '[]'::jsonb)
               from public.kid_events e left join public.kid_shares s on s.owner = e.kid and s.kind = 'story' and s.ref = e.topic::text
               where e.kid = p_kid),
    'entries', (select coalesce(jsonb_agg(jsonb_build_object('day', en.day, 'body', en.body) order by en.day desc), '[]'::jsonb)
                from public.kid_entries en
                where en.kid = p_kid and (v_self or exists (select 1 from public.kid_shares s where s.owner = en.kid and s.kind = 'entry' and s.ref = en.day::text))));
end $$;
revoke execute on function public.r4_world(uuid) from public, anon;
grant execute on function public.r4_world(uuid) to authenticated;
