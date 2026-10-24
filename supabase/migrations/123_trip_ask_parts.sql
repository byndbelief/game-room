-- The trip's Claude works in the background, one part at a time (trip-helper): an ask is
-- kept as it goes (working, then done, failed or stopped), with the plan it is working
-- through, which part this was, what it asks itself next, and the items it filed; label is
-- what the chat shows for a built-in ask (✦ Build our itinerary sends a longer brief). The
-- trip page shows them as a chat with Claude.
alter table public.trip_asks
  add column status text not null default 'done' check (status in ('working', 'done', 'failed', 'stopped')),
  add column plan jsonb,
  add column part int,
  add column next text,
  add column label text,
  add column auto boolean not null default false,
  add column items uuid[] not null default '{}',
  add column updated_at timestamptz not null default now();
