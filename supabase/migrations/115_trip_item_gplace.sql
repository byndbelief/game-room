-- Google Maps photos for trip places (place-photos function): the Google place a trip item was
-- matched to. Only the place id is kept (Google's terms allow storing it; photos, ratings and the
-- rest are fetched fresh each time and never stored). { id, at } or { none: true, at }.
alter table public.trip_items add column if not exists gplace jsonb;
