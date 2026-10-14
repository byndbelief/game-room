-- 086 · Putt Post gets the Putt organ's upgrades.
--  🔧 Fixes: tap a hazard on the hole you're playing to clear it, two a hole. The list lives here so every page builds
--     the same hole for you (the page applies them with withFixes() in golf-engine.js). Fig may also shoo a gopher
--     pair for you once a hole (kind 'gophers', fig = true), which doesn't count against your two.
--  🕳️ Inside the cup: hole out at par or better and you may dive into the cup for a 20 s bonus game; win it and
--     golf_cup_bonus drops one Putt Post item into your backpack, once a hole.
-- Re-runnable: no drops.
create table if not exists public.golf_fixes (
  game_id uuid not null references public.golf_games(id) on delete cascade,
  player uuid not null references public.profiles(id),
  hole smallint not null,
  kind text not null check (kind in ('bumpers', 'blocks', 'water', 'mud', 'sand', 'gophers')),
  idx smallint not null check (idx between 0 and 63),
  fig boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (game_id, player, hole, kind, idx)
);
alter table public.golf_fixes enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'golf_fixes' and policyname = 'see fixes in your golf games') then
    create policy "see fixes in your golf games" on public.golf_fixes for select to authenticated using (_in_golf(game_id));
  end if;
end $$;
grant select on public.golf_fixes to authenticated;

create table if not exists public.golf_cup_bonus (
  game_id uuid not null references public.golf_games(id) on delete cascade,
  player uuid not null references public.profiles(id),
  hole smallint not null,
  item text not null,
  created_at timestamptz not null default now(),
  primary key (game_id, player, hole)
);
alter table public.golf_cup_bonus enable row level security;

create or replace function public.golf_fix(p_game uuid, p_kind text, p_idx int, p_fig boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  g golf_games; me uuid := auth.uid(); n int; cur_hole int; used int;
begin
  select * into g from golf_games where id = p_game;
  if not found or not (me = any (g.players)) then raise exception 'Game not found'; end if;
  if g.status <> 'playing' then raise exception 'This round is over'; end if;
  if exists (select 1 from bots where profile_id = me) then raise exception 'Robots play it as it lies'; end if;
  n := cardinality(g.players);
  cur_hole := g.start + g.t / n;
  if exists (select 1 from golf_turns where game_id = p_game and player = me and hole = cur_hole and t / n = g.t / n) then
    raise exception 'You''ve finished this hole';
  end if;
  if p_idx is null or p_idx not between 0 and 63 then raise exception 'Nothing to fix there'; end if;
  if coalesce(p_fig, false) then
    if p_kind <> 'gophers' then raise exception 'Fig only shoos gophers'; end if;
    if exists (select 1 from golf_fixes where game_id = p_game and player = me and hole = cur_hole and fig) then raise exception 'Fig already helped on this hole'; end if;
  else
    if p_kind not in ('bumpers', 'blocks', 'water', 'mud', 'sand') then raise exception 'That can''t be fixed'; end if;
    select count(*) into used from golf_fixes where game_id = p_game and player = me and hole = cur_hole and not fig;
    if used >= 2 then raise exception 'No fixes left on this hole'; end if;
  end if;
  insert into golf_fixes (game_id, player, hole, kind, idx, fig) values (p_game, me, cur_hole, p_kind, p_idx, coalesce(p_fig, false))
    on conflict do nothing;
  select count(*) into used from golf_fixes where game_id = p_game and player = me and hole = cur_hole and not fig;
  return jsonb_build_object('hole', cur_hole, 'left', greatest(0, 2 - used));
end $$;
grant execute on function public.golf_fix(uuid, text, int, boolean) to authenticated;

create or replace function public.golf_cup_bonus(p_game uuid, p_hole int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  g golf_games; me uuid := auth.uid(); tu golf_turns; it text;
  items text[] := array['golden_tee', 'magnet', 'chip', 'atk_ice', 'atk_wind', 'atk_cup', 'atk_bumpers', 'atk_butter'];
begin
  select * into g from golf_games where id = p_game;
  if not found or not (me = any (g.players)) then raise exception 'Game not found'; end if;
  select * into tu from golf_turns where game_id = p_game and player = me and hole = p_hole and not skipped order by t desc limit 1;
  if not found then raise exception 'Finish the hole first'; end if;
  if tu.actual > _golf_par(p_hole, g.course) then raise exception 'The cup only opens at par or better'; end if;
  if tu.created_at < now() - interval '15 minutes' then raise exception 'That cup has closed'; end if;
  if exists (select 1 from golf_cup_bonus where game_id = p_game and player = me and hole = p_hole) then raise exception 'You already raided that cup'; end if;
  it := items[1 + floor(random() * cardinality(items))::int];
  insert into golf_cup_bonus (game_id, player, hole, item) values (p_game, me, p_hole, it);
  insert into loot (player, item, from_kind, detail) values (me, it, 'golf', jsonb_build_object('cup', p_hole, 'game', p_game));
  return jsonb_build_object('item', it);
end $$;
grant execute on function public.golf_cup_bonus(uuid, int) to authenticated;
