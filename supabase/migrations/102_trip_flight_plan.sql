-- 102: the flight builder. A trip's flight plan is the legs it flies, in order,
-- and the flight picked for each:
--   [{ from: 'LAX', to: 'MEX', date: 'YYYY-MM-DD', pick: <trip_items id> | null }]
-- Each leg's options are flight ideas (topic flights) whose flight details say
-- { kind: 'leg', leg: <index> } with one leg. Set by the trip helper; picks are
-- made on the trip page by a parent or the trip's starter (who may change the trip).
alter table public.trips add column if not exists flight_plan jsonb
  check (flight_plan is null or (jsonb_typeof(flight_plan) = 'array' and jsonb_array_length(flight_plan) <= 8));
