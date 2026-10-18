-- 104: who's going on a trip: { members: [family user ids], guests: ['Grandma', ...] }.
-- Empty means the whole family. The count drives the trip page's estimated total
-- (fares and tickets per traveller) and the trip helper's totals. A parent or the
-- trip's starter sets it (they may change the trip).
alter table public.trips add column if not exists going jsonb
  check (going is null or (jsonb_typeof(going) = 'object' and length(going::text) <= 2000));
