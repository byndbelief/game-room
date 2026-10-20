-- Admin turns kids' apps on and off: the apps listed here are hidden from that kid's home and
-- their pages send them home. Kids read their own row; only a parent changes it (087's policies).
alter table public.tutor_settings add column if not exists apps_off text[] not null default '{}';
alter table public.tutor_settings drop constraint if exists tutor_settings_apps_off;
alter table public.tutor_settings add constraint tutor_settings_apps_off
  check (apps_off <@ array['diary','tutor','games','chat','projects','trip']::text[]);
