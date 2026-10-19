-- 111: a project can be put away: archived projects leave the lists, the family's shelf and the
-- maker's world, and come back with one tap. Only the maker changes it (their own row, 110).
alter table public.projects add column if not exists archived boolean not null default false;
