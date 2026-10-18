-- 095: each kid's diary and the world it grows (r4box.com/diary.html).
-- Built nightly by the kid-diary Edge Function from what the kid asked Claude
-- (tutor, trips, family chat) and the games they finished. Same shape as the
-- Clearing diary: topics (ideas) with immutable events (spark, deepen, branch,
-- pivot, merge, park, revive, ship), plus one entry a day.
-- A topic's source decides what it grows into: tutor = a tree, chat = a flower,
-- trip = a constellation, game = animals. Nothing derived is stored.
-- Privacy: a kid reads only their own diary. A parent sees the world's shape and
-- topic names (r4_kid_world), never summaries or entries: the tutor's chats stay
-- private, as the tutor promises.

create table if not exists public.kid_topics (
  id uuid primary key default gen_random_uuid(),
  kid uuid not null references auth.users(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9][a-z0-9-]{0,60}$'),
  title text not null check (length(title) between 1 and 80),
  source text not null check (source in ('tutor', 'trip', 'chat', 'game')),
  summary text check (length(summary) <= 1000),
  stage text not null default 'spark' check (stage in ('spark', 'explored', 'prototyped', 'shipped', 'parked')),
  parent uuid references public.kid_topics(id) on delete set null,
  created date not null default current_date,
  unique (kid, slug)
);

create table if not exists public.kid_events (
  id bigint generated always as identity primary key,
  kid uuid not null references auth.users(id) on delete cascade,
  topic uuid not null references public.kid_topics(id) on delete cascade,
  day date not null,
  kind text not null check (kind in ('spark', 'deepen', 'branch', 'pivot', 'merge', 'park', 'revive', 'ship')),
  summary text check (length(summary) <= 500),
  effort smallint not null default 1 check (effort between 1 and 5),
  meta jsonb,                                   -- games: { played, won }
  created_at timestamptz not null default now()
);
create index if not exists kid_events_kid_day on public.kid_events (kid, day);

create table if not exists public.kid_entries (
  kid uuid not null references auth.users(id) on delete cascade,
  day date not null,
  body text not null check (length(body) <= 4000),
  created_at timestamptz not null default now(),
  primary key (kid, day)
);

-- One row per build: what it covered, so the next build starts where it ended.
create table if not exists public.kid_diary_runs (
  id bigint generated always as identity primary key,
  kid uuid not null references auth.users(id) on delete cascade,
  covered_to timestamptz not null,
  items int not null default 0,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists kid_diary_runs_kid on public.kid_diary_runs (kid, covered_to desc);

alter table public.kid_topics enable row level security;
alter table public.kid_events enable row level security;
alter table public.kid_entries enable row level security;
alter table public.kid_diary_runs enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kid_topics' and policyname = 'kid reads own topics') then
    create policy "kid reads own topics" on public.kid_topics for select to authenticated using (kid = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kid_events' and policyname = 'kid reads own events') then
    create policy "kid reads own events" on public.kid_events for select to authenticated using (kid = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kid_entries' and policyname = 'kid reads own entries') then
    create policy "kid reads own entries" on public.kid_entries for select to authenticated using (kid = (select auth.uid()));
  end if;
end $$;
revoke all on public.kid_topics, public.kid_events, public.kid_entries, public.kid_diary_runs from anon;
grant select on public.kid_topics, public.kid_events, public.kid_entries to authenticated;

-- A kid's world without the words: topic names and how they grew, for a parent
-- (or the kid). No summaries, no entries.
create or replace function public.r4_kid_world(p_kid uuid) returns jsonb
  language plpgsql stable security definer set search_path = '' as $$
begin
  if not (public.r4_is_parent() or p_kid = auth.uid()) then raise exception 'not allowed'; end if;
  return jsonb_build_object(
    'topics', (select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'slug', t.slug, 'title', t.title, 'source', t.source,
                 'stage', t.stage, 'parent', t.parent, 'created', t.created) order by t.created, t.slug), '[]'::jsonb)
               from public.kid_topics t where t.kid = p_kid),
    'events', (select coalesce(jsonb_agg(jsonb_build_object('id', e.id, 'topic', e.topic, 'day', e.day, 'kind', e.kind,
                 'effort', e.effort, 'meta', e.meta) order by e.day, e.id), '[]'::jsonb)
               from public.kid_events e where e.kid = p_kid));
end $$;
revoke execute on function public.r4_kid_world(uuid) from public, anon;
grant execute on function public.r4_kid_world(uuid) to authenticated;

-- The nightly build. pg_cron calls the kid-diary function through pg_net with a
-- secret that lives only in Vault (made here, never typed or copied); the
-- function checks it with r4_diary_secret_ok, which only the service role may call.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

do $$ begin
  if not exists (select 1 from vault.secrets where name = 'kid_diary_cron') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'kid_diary_cron', 'pg_cron -> kid-diary');
  end if;
end $$;

create or replace function public.r4_diary_secret_ok(p text) returns boolean
  language sql stable security definer set search_path = '' as
  $$ select exists (select 1 from vault.decrypted_secrets where name = 'kid_diary_cron' and decrypted_secret = p) $$;
revoke execute on function public.r4_diary_secret_ok(text) from public, anon, authenticated;
grant execute on function public.r4_diary_secret_ok(text) to service_role;

-- Every night at 05:00 UTC (10 pm in California in summer, 9 pm in winter).
select cron.schedule('kid-diary-nightly', '0 5 * * *', $cron$
  select net.http_post(
    url := 'https://okywhdfmdpdvrfhbkyeo.supabase.co/functions/v1/kid-diary',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9reXdoZGZtZHBkdnJmaGJreWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0Nzc1OTQsImV4cCI6MjEwNjA1MzU5NH0.cJHfp_0pnAz9HpeX7e5UoGJ_K5rU6eSe1sajcktf8fs',
      'X-R4-Cron', (select decrypted_secret from vault.decrypted_secrets where name = 'kid_diary_cron')),
    body := '{"action":"nightly"}'::jsonb,
    timeout_milliseconds := 5000)
$cron$);
