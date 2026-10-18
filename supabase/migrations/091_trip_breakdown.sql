-- 091: the trip helper breaks a trip down into what it needs. Each item can
-- carry a topic (dates, flights, stay, tickets, transport, food, activities,
-- other) so the trip page groups options by decision and shows what is still
-- open. A trip can say where the family travels from, so flights are priced
-- from the right airport.
alter table public.trip_items add column if not exists topic text
  check (topic is null or topic in ('dates', 'flights', 'stay', 'tickets', 'transport', 'food', 'activities', 'other'));
alter table public.trips add column if not exists origin text check (length(origin) <= 120);
