-- 126: the pickup card shows the drive as a road, start to finish: the turns, the traffic lights
-- and a few landmarks on the way, and how far along the car is. The pickup function works these
-- out from Google's route and OpenStreetMap when the parent sets off (and again if they leave the
-- route). The kid sees the road and the car's place along it; the parent agreed to that by asking
-- for it. The route's own line (which starts where the parent set off) is kept apart in
-- pickup_lines, which only the function reads, and goes with the pickup.
--
-- route:  { v, m (metres start to finish), from: { e, n } (a family place the drive started at),
--           marks: [{ d (metres from the start), k: turn | light | spot | rail, e, n }], ready }
-- done_m: metres along the route at the last update.
alter table public.pickups add column if not exists route jsonb, add column if not exists done_m int;

create table if not exists public.pickup_lines (
  pickup uuid primary key references public.pickups (id) on delete cascade,
  pts jsonb not null,                     -- [[lat, lng, metres from the start], ...]
  at timestamptz not null default now()
);
alter table public.pickup_lines enable row level security;
revoke all on public.pickup_lines from anon, authenticated;
