-- 106: the new r4box.com home (the family world, today, apps with live status, recent).
--
-- box_status: one short line per box app (os, term, code, browser, ntfy, diary),
-- sent by r4os on r4box every minute through admin-tools (the box's secret). The
-- box apps are Dad's, so only a parent reads it.
--
-- Dad's world is his Clearing diary: r4os sends its ideas and events (no idea
-- bodies, no entries) whenever the diary changes, and admin-tools files them as
-- topics and events in kid_topics / kid_events under the parent's id, so every
-- world (his and the kids') is the same shape and the same tree draws it.
--
-- r4_family_world(): every family member's world for the home's family ground.
-- Topic names only for your own world, or for a parent; everyone else sees shapes
-- (sources, stages, when things grew). Never summaries or entries.

create table if not exists public.box_status (
  app text primary key check (app in ('os', 'term', 'code', 'browser', 'ntfy', 'diary')),
  line text not null check (length(line) <= 120),
  hot boolean not null default false,          -- needs Dad (an approval waiting)
  detail text check (length(detail) <= 200),   -- os: what the oldest waiting approval asks
  at timestamptz not null default now()
);
alter table public.box_status enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'box_status' and policyname = 'parent reads box status') then
    create policy "parent reads box status" on public.box_status for select to authenticated using ((select public.r4_is_parent()));
  end if;
end $$;
revoke all on public.box_status from anon;
grant select on public.box_status to authenticated;

create or replace function public.r4_family_world() returns jsonb
  language plpgsql stable security definer set search_path = '' as $$
declare v_me uuid := auth.uid(); v_parent boolean := public.r4_is_parent();
begin
  if not public.r4_is_family() then raise exception 'not allowed'; end if;
  return (select coalesce(jsonb_agg(jsonb_build_object(
      'id', u.id, 'username', coalesce(p.username, '?'), 'role', u.raw_app_meta_data->>'r4_role',
      'topics', (select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'slug', t.slug, 'source', t.source, 'stage', t.stage,
                   'parent', t.parent, 'created', t.created,
                   'title', case when v_parent or t.kid = v_me then t.title end) order by t.created, t.slug), '[]'::jsonb)
                 from public.kid_topics t where t.kid = u.id),
      'events', (select coalesce(jsonb_agg(jsonb_build_object('id', e.id, 'topic', e.topic, 'day', e.day, 'kind', e.kind,
                   'effort', e.effort, 'meta', e.meta) order by e.day, e.id), '[]'::jsonb)
                 from public.kid_events e where e.kid = u.id)
    ) order by case when u.raw_app_meta_data->>'r4_role' = 'parent' then 0 else 1 end, p.username), '[]'::jsonb)
    from auth.users u left join public.profiles p on p.id = u.id
    where u.raw_app_meta_data->>'r4_role' in ('parent', 'kid'));
end $$;
revoke execute on function public.r4_family_world() from public, anon;
grant execute on function public.r4_family_world() to authenticated;
