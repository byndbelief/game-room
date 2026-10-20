-- 116: a trip has a type, and the planner adapts to it (r4box.com/trip.html): a trip away
-- (flights, stay, getting around), a road trip (the route and its stops), a local event (a
-- concert, a game: tickets and getting there), a movie night, a game night, or something else.
-- Two new parts for items: route (a road trip's driving legs and stops) and pick (the movie to
-- watch, the games to play).
alter table public.trips add column if not exists type text not null default 'away';
alter table public.trips drop constraint if exists trips_type_check;
alter table public.trips add constraint trips_type_check check (type in ('away', 'road', 'local', 'movie', 'games', 'other'));

alter table public.trip_items drop constraint if exists trip_items_topic_check;
alter table public.trip_items add constraint trip_items_topic_check
  check (topic is null or topic in ('dates', 'flights', 'stay', 'tickets', 'transport', 'food', 'activities', 'other', 'route', 'pick'));
