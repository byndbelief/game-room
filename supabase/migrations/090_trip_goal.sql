-- 090: a trip can start from a goal ("watch the Dodgers play the Yankees in New
-- York") before it has a place or dates; the trip helper works those out.
alter table public.trips add column if not exists goal text check (length(goal) <= 1000);
alter table public.trips alter column name set default 'New trip';
