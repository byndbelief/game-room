-- 101: structured details on a flight option, for the trip page's flight
-- comparison (filters on price, stops and flight time; a timeline per leg).
-- Filled by the trip helper from what it finds; prices are typical fares, not
-- quotes. Shape (checked by the helper, read loosely by the page):
--   { kind: 'roundtrip' | 'oneway', price_pp, price_total, airlines: [..],
--     legs: [{ dir: 'out' | 'back', date, depart: 'HH:MM', arrive: 'HH:MM',
--              arrive_plus: days, from, to, minutes, stops, via: [..], flights: [..] }] }
alter table public.trip_items add column if not exists flight jsonb
  check (flight is null or (jsonb_typeof(flight) = 'object' and length(flight::text) <= 4000));
