-- Pickups: "On my way" in the family chat. A parent heading out to pick up a kid shares how
-- many minutes away they are, never where they are: the parent's phone sends its position
-- to the pickup function, which asks Google for the drive time to the pickup place and keeps
-- only the minutes. A pickup is for one kid, one place, and ends on arrival, on Stop, or by
-- itself after an hour. A kid can ask for one first (status asked).
--
-- family_places: the family's pickup spots (School, Soccer field), set by a parent, with the
-- place's own coordinates (the destination, not anyone's whereabouts).

create table public.family_places (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  emoji text check (char_length(emoji) <= 8),
  address text check (char_length(address) <= 200),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.family_places enable row level security;
create policy "family reads places" on public.family_places for select to authenticated using ((select public.r4_is_family()));
create policy "parent removes places" on public.family_places for delete to authenticated using ((select public.r4_is_parent()));
grant select, delete on public.family_places to authenticated;
revoke all on public.family_places from anon;

create table public.pickups (
  id uuid primary key default gen_random_uuid(),
  driver uuid not null references auth.users (id) on delete cascade,   -- the parent; for an ask, the one asked
  kid uuid not null references auth.users (id) on delete cascade,
  place uuid references public.family_places (id) on delete set null,
  place_name text not null check (char_length(place_name) between 1 and 80),
  dest_lat double precision not null,
  dest_lng double precision not null,
  status text not null default 'on_way' check (status in ('asked', 'on_way', 'here', 'ended')),
  ask_when text check (char_length(ask_when) <= 40),                    -- an ask: "now", "at 3:30"
  eta_at timestamptz,                                                  -- when they'd arrive, at the last update
  eta_first int,                                                       -- minutes away when they set off (the ring)
  late_min int not null default 0,                                     -- minutes later than first said (traffic)
  told jsonb not null default '{}',                                    -- alerts already sent: five, late
  kid_note text check (char_length(kid_note) <= 60),
  msg bigint references public.chat_messages (id) on delete set null,  -- its card in the chat
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ended_at timestamptz
);
create index pickups_live on public.pickups (status) where status <> 'ended';
alter table public.pickups enable row level security;
create policy "family reads pickups" on public.pickups for select to authenticated using ((select public.r4_is_family()));
grant select on public.pickups to authenticated;
revoke all on public.pickups from anon;
alter publication supabase_realtime add table public.pickups;
