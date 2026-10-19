-- 110: Projects + workbench on r4box.com/projects.html (design system: projects kit).
--
-- projects: something someone makes, started from a kit (catch game, timer app, about-me
-- page, comic strip, drum pad) or from code. Every change is a version, kept in the row
-- (versions: [{ v, at, note, params, files?, by }], cur = the one showing), so undo, redo and
-- going back are just a different cur. A draft is seen only by its maker and the people they
-- let help (collab); published, the family can play and remix it. A parent sees published
-- projects like everyone else: what a kid is still making stays theirs until they share it.
-- What a project runs is always shown in a sandboxed frame on the page (no access to r4box).
--
-- The owner changes their row directly. Helpers save through project_save (versions, cur and
-- name only); anyone in the family may ask to help on a published one (project_ask_help).
--
-- project_builds: each time Claude changed (build) or answered about (ask) a project, written
-- by the project-build Edge Function, which keeps the kids' daily cap (8 builds a day).

create table if not exists public.projects (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{2,60}$'),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kit text not null check (kit in ('catch', 'timer', 'page', 'comic', 'drums', 'code')),
  name text not null check (length(name) between 1 and 80),
  published boolean not null default false,
  remix_of jsonb,
  collab uuid[] not null default '{}',
  requests uuid[] not null default '{}',
  versions jsonb not null check (jsonb_typeof(versions) = 'array' and jsonb_array_length(versions) between 1 and 200),
  cur int not null default 0 check (cur >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cur < jsonb_array_length(versions)),
  check (pg_column_size(versions) < 600000)
);
create index if not exists projects_owner on public.projects (owner, updated_at desc);
alter table public.projects enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'projects' and policyname = 'maker, helpers or published') then
    create policy "maker, helpers or published" on public.projects for select to authenticated
      using ((select public.r4_is_family()) and (owner = (select auth.uid()) or (select auth.uid()) = any(collab) or published));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'projects' and policyname = 'own projects start') then
    create policy "own projects start" on public.projects for insert to authenticated
      with check ((select public.r4_is_family()) and owner = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'projects' and policyname = 'own projects change') then
    create policy "own projects change" on public.projects for update to authenticated
      using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'projects' and policyname = 'own projects go') then
    create policy "own projects go" on public.projects for delete to authenticated using (owner = (select auth.uid()));
  end if;
end $$;
revoke all on public.projects from anon;
grant select, insert, update, delete on public.projects to authenticated;

-- A helper's save: the versions and which one shows. Never who owns it, who helps, or whether it's published.
create or replace function public.project_save(p_id text, p_versions jsonb, p_cur int, p_name text) returns void
  language plpgsql security definer set search_path = '' as $$
begin
  update public.projects set versions = p_versions, cur = p_cur, name = left(coalesce(nullif(trim(p_name), ''), name), 80), updated_at = now()
   where id = p_id and (owner = auth.uid() or auth.uid() = any(collab)) and public.r4_is_family();
  if not found then raise exception 'not yours to change'; end if;
end $$;
revoke all on function public.project_save(text, jsonb, int, text) from public, anon;
grant execute on function public.project_save(text, jsonb, int, text) to authenticated;

create or replace function public.project_ask_help(p_id text) returns void
  language plpgsql security definer set search_path = '' as $$
begin
  update public.projects set requests = array_append(array_remove(requests, auth.uid()), auth.uid())
   where id = p_id and published and owner <> auth.uid() and not (auth.uid() = any(collab)) and public.r4_is_family();
end $$;
revoke all on function public.project_ask_help(text) from public, anon;
grant execute on function public.project_ask_help(text) to authenticated;

create table if not exists public.project_builds (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project text references public.projects(id) on delete set null,
  kind text not null check (kind in ('build', 'ask')),
  at timestamptz not null default now()
);
create index if not exists project_builds_user on public.project_builds (user_id, at desc);
alter table public.project_builds enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_builds' and policyname = 'own builds') then
    create policy "own builds" on public.project_builds for select to authenticated using (user_id = (select auth.uid()));
  end if;
end $$;
revoke all on public.project_builds from anon;
grant select on public.project_builds to authenticated;
