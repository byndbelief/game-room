-- 120: a project started from an idea is built whole by Claude on the spot (project-build with
-- start), and a kid's first few of those a day don't use a build: they're logged as 'start'.
alter table public.project_builds drop constraint if exists project_builds_kind_check;
alter table public.project_builds add constraint project_builds_kind_check check (kind in ('build', 'ask', 'start'));
