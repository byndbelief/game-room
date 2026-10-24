-- 121: after Claude changes a project, the page runs it in a hidden preview; if it throws errors as it
-- starts, Claude gets them back and fixes them (project-build with fix), up to twice, before anyone sees
-- it. Those rounds are logged as 'fix' and use no build or answer.
alter table public.project_builds drop constraint if exists project_builds_kind_check;
alter table public.project_builds add constraint project_builds_kind_check check (kind in ('build', 'ask', 'start', 'fix'));
