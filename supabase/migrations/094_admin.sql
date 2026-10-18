-- 094: the admin page (r4box.com/admin.html), for a parent only.
-- r4_admin_family: each person's role, last sign-in, passkeys, alert devices and
--   signed-in sessions (from auth, which the page cannot read itself).
-- r4_admin_usage: each kid's Claude asks today and over 7 days (tutor, trips,
--   chat; the parent cannot read the tutor's messages, only these counts) and
--   their limits.
-- r4_admin_remove_device: forget someone's alert device.
-- box_health: what r4box last reported about itself (r4os posts it every few
--   minutes through the admin-tools Edge Function).
-- A parent may also remove anyone's family-chat photo.

create or replace function public.r4_admin_family() returns jsonb
  language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.r4_is_parent() then raise exception 'parents only'; end if;
  return (select coalesce(jsonb_agg(x order by x ->> 'role' desc, x ->> 'username'), '[]'::jsonb) from (
    select jsonb_build_object(
      'id', u.id, 'username', p.username, 'role', u.raw_app_meta_data ->> 'r4_role', 'email', u.email,
      'last_sign_in', u.last_sign_in_at,
      'passkeys', (select coalesce(jsonb_agg(jsonb_build_object('name', w.friendly_name, 'created', w.created_at, 'used', w.last_used_at) order by w.created_at), '[]'::jsonb)
                   from auth.webauthn_credentials w where w.user_id = u.id),
      'devices', (select coalesce(jsonb_agg(jsonb_build_object('endpoint', s.endpoint, 'created', s.created_at) order by s.created_at desc), '[]'::jsonb)
                  from public.push_subscriptions s where s.user_id = u.id),
      'sessions', (select coalesce(jsonb_agg(jsonb_build_object('agent', left(se.user_agent, 300), 'seen', coalesce(se.refreshed_at, se.updated_at, se.created_at))
                                             order by coalesce(se.refreshed_at, se.updated_at, se.created_at) desc), '[]'::jsonb)
                   from auth.sessions se where se.user_id = u.id and (se.not_after is null or se.not_after > now()))
    ) as x
    from auth.users u join public.profiles p on p.id = u.id
    where u.raw_app_meta_data ->> 'r4_role' in ('parent', 'kid')) t);
end $$;

create or replace function public.r4_admin_usage() returns jsonb
  language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.r4_is_parent() then raise exception 'parents only'; end if;
  return (select coalesce(jsonb_agg(row_to_json(k)::jsonb order by k.username), '[]'::jsonb) from (
    select u.id as kid, p.username,
      coalesce(s.daily_cap, 40) as daily_cap, coalesce(s.start_hour, 7) as start_hour, coalesce(s.end_hour, 21) as end_hour,
      coalesce(s.tz, 'America/New_York') as tz,
      (select count(*) from public.tutor_messages m where m.kid = u.id and m.role = 'user' and m.created_at >= d.today) as tutor_today,
      (select count(*) from public.trip_asks a where a.asker = u.id and a.created_at >= d.today) as trip_today,
      (select count(*) from public.chat_messages c where c.author = u.id and c.asks_claude and c.created_at >= d.today) as chat_today,
      (select count(*) from public.tutor_messages m where m.kid = u.id and m.role = 'user' and m.created_at >= d.week) as tutor_week,
      (select count(*) from public.trip_asks a where a.asker = u.id and a.created_at >= d.week) as trip_week,
      (select count(*) from public.chat_messages c where c.author = u.id and c.asks_claude and c.created_at >= d.week) as chat_week
    from auth.users u
    join public.profiles p on p.id = u.id
    left join public.tutor_settings s on s.kid = u.id
    -- today and the last 7 days begin at midnight in the kid's own timezone, as the limit does
    cross join lateral (select (date_trunc('day', now() at time zone coalesce(s.tz, 'America/New_York')) at time zone coalesce(s.tz, 'America/New_York')) as today) d0
    cross join lateral (select d0.today, d0.today - interval '6 days' as week) d
    where u.raw_app_meta_data ->> 'r4_role' = 'kid') k);
end $$;

create or replace function public.r4_admin_remove_device(p_endpoint text) returns void
  language plpgsql security definer set search_path = '' as $$
begin
  if not public.r4_is_parent() then raise exception 'parents only'; end if;
  delete from public.push_subscriptions where endpoint = p_endpoint;
end $$;

revoke execute on function public.r4_admin_family(), public.r4_admin_usage(), public.r4_admin_remove_device(text) from public, anon;
grant execute on function public.r4_admin_family(), public.r4_admin_usage(), public.r4_admin_remove_device(text) to authenticated;

create table if not exists public.box_health (
  name text primary key check (length(name) <= 40),
  ok boolean not null,
  detail text check (length(detail) <= 300),
  checked_at timestamptz not null default now()
);
alter table public.box_health enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'box_health' and policyname = 'parent reads box health') then
    create policy "parent reads box health" on public.box_health for select to authenticated using ((select public.r4_is_parent()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'parent removes chat photos') then
    create policy "parent removes chat photos" on storage.objects for delete to authenticated
      using (bucket_id = 'family-chat' and (select public.r4_is_parent()));
  end if;
end $$;
revoke all on public.box_health from anon;
grant select on public.box_health to authenticated;
