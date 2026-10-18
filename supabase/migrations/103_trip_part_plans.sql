-- 103: builders for tickets, where to stay and getting around, like the flight
-- builder (102). A trip's plans hold, per part, the pieces it needs and the
-- option picked for each:
--   { stay:      [{ label: 'Mexico City · Dec 3–5', date, until, pick }],
--     tickets:   [{ label: 'Bruno Mars · Estadio GNP', date, pick }],
--     transport: [{ label: 'MEX airport → hotel', date, from, to, pick }] }
-- Each piece's options are ideas of that topic whose details say { seg: <index> }
-- plus what the family compares (hotels: nightly, nights, total, rating,
-- walk_min...; tickets: section, seller, official, price_each, count, total...;
-- getting around: mode, minutes, price_total...). Set by the trip helper; picks
-- are made on the trip page by a parent or the trip's starter.
alter table public.trips add column if not exists plans jsonb
  check (plans is null or (jsonb_typeof(plans) = 'object' and length(plans::text) <= 8000));
alter table public.trip_items add column if not exists details jsonb
  check (details is null or (jsonb_typeof(details) = 'object' and length(details::text) <= 3000));
