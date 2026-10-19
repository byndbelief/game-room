-- 112: a project's brief, Claude's short reference note on it (what it is, what's done, ideas and
-- decisions, what's next). project-build reads it with every ✦ Vibes question and rewrites it when
-- something changes, so Claude picks up where it left off on any visit. Shown at the top of Vibes;
-- whoever can see the project can read it (110's policies).
alter table public.projects add column if not exists brief text not null default '';
