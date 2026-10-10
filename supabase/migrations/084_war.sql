-- 084: ⚔️ War, the card game, for 2-4 players (people and robots), with the chaos layer. Safe to run again.
--
-- A shuffled 52-card deck (codes like 'AS', 'TD', '7H': rank 2-9 T J Q K A, A high; suit S H D C) is
-- dealt out evenly into face-down piles; what doesn't divide (52 mod 3 = 1) waits in the middle as the
-- pot, and the first battle's winner takes it. The piles never leave the server: war_piles has RLS and
-- no policy at all (like card_piles); everyone sees only the counts.
-- A battle: everyone still in flips their top card (war_flip). Once all have, the server resolves it:
-- the highest card takes every card on the table into the bottom of its pile (shuffled). A tie for the
-- top is a WAR: the tied players each put 3 cards face down and 1 face up (fewer if they're short: they
-- keep one to turn up; a player with no card left to turn up loses the war), again if they tie again,
-- and the last one standing takes the lot. Out of cards = out. Last one holding cards wins.
-- The cap: after 150 battles it's sudden death: most cards wins (a tie goes to whoever won that battle,
-- else at random). Robots flip the moment a battle starts (server-side, _war_settle), so a battle only
-- waits on people; when only robots are left, the server plays it out at once.
-- Live (live_here 'war'; robots always count as here): 4 s after the first person flips, any page can
-- call war_timeout() and the slow ones flip.
-- Chaos: every battle steps the curve (_chaos_curve('war'), wild, not calm); a twist sets up the next
-- battle: 🔄 reverse (lowest wins), 🃏 joker (someone's card counts as an Ace), 💥 double war (it opens
-- with a war), or 🌀 shuffle (every pile shuffled now). Mirror / golden / Fibonacci drops and the chaos
-- rating like card_play. Results, the scoreboard, the trophy counts, the chaos clock (2 h: your card
-- flips itself; 8 h: and two of your cards slide into the pot; 24 h on a Chaos round: forfeit, the most
-- cards wins), Route to Chaos (any group of 4 or fewer), who's live, hidden games and deletes know War.

-- ---------------------------------------------------------------- tables
create table if not exists public.war_games (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles (id),
  players uuid[] not null check (cardinality(players) between 2 and 4),
  bot_level smallint check (bot_level between 0 and 2),
  gauntlet_id uuid references public.gauntlets (id) on delete set null,
  status text not null default 'playing' check (status in ('playing', 'over')),
  battle int not null default 1,               -- the battle being played (1-based)
  counts int[] not null default '{}',          -- cards in each pile, by seat
  flips text[] not null default '{}',          -- this battle's face-up cards by seat: '' = not yet, '-' = out
  pot int not null default 0,                  -- face-down cards waiting in the middle
  won int[] not null default '{}',             -- battles won, by seat
  wars int[] not null default '{}',            -- wars won, by seat
  twist text check (twist in ('reverse', 'joker', 'double')),   -- chaos on this battle
  twist_seat smallint,                         -- the joker's seat
  last_battle jsonb,                           -- how the last battle went, for the pages to play back
  flip_at timestamptz,                         -- the first person's flip this battle (the live timer)
  cap int not null default 150,                -- sudden death after this many battles
  winner uuid references public.profiles (id),
  turn_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.war_piles (
  game_id uuid not null references public.war_games (id) on delete cascade,
  seat smallint not null,                      -- 0.. = that seat's pile (top card first), -1 = the pot
  cards text[] not null default '{}',
  primary key (game_id, seat)
);
alter table public.war_games enable row level security;
alter table public.war_piles enable row level security;
drop policy if exists "see war games you're in" on public.war_games;
create policy "see war games you're in" on public.war_games for select to authenticated using (auth.uid() = any (players));
-- war_piles: no policy at all, so nobody reads a pile but the server.
revoke all on public.war_piles from anon, authenticated;
revoke insert, update, delete, truncate on public.war_games from anon, authenticated;
do $$ begin
  alter publication supabase_realtime add table public.war_games;
exception when duplicate_object then null; end $$;

create or replace function public._war_turn_moved() returns trigger
language plpgsql as $$
begin
  if new.battle is distinct from old.battle then new.turn_at := now(); end if;
  return new;
end $$;
drop trigger if exists turn_moved on public.war_games;
create trigger turn_moved before update on public.war_games for each row execute function public._war_turn_moved();

-- ---------------------------------------------------------------- cards
create or replace function public._war_deck() returns text[]
language sql volatile as $$
  select array_agg(r || s order by random())
  from unnest(array['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']) r, unnest(array['S', 'H', 'D', 'C']) s
$$;
-- 2 .. 14 (Ace high)
create or replace function public._war_rank(c text) returns int
language sql immutable as $$ select position(left(c, 1) in '23456789TJQKA') + 1 $$;

-- Deals the deck out and lets any robots flip.
create or replace function public._war_setup(p_game uuid) returns void
language plpgsql security definer set search_path = public as $$
declare g war_games; deck text[]; n int; per int; i int;
begin
  select * into g from war_games where id = p_game for update;
  n := cardinality(g.players); per := 52 / n; deck := _war_deck();
  delete from war_piles where game_id = p_game;
  for i in 0 .. n - 1 loop
    insert into war_piles (game_id, seat, cards) values (p_game, i, deck[i * per + 1 : (i + 1) * per]);
  end loop;
  insert into war_piles (game_id, seat, cards) values (p_game, -1, deck[n * per + 1 :]);
  update war_games set counts = array_fill(per, array[n]), flips = array_fill(''::text, array[n]), pot = 52 - n * per,
    won = array_fill(0, array[n]), wars = array_fill(0, array[n]), battle = 1, twist = null, twist_seat = null,
    last_battle = null, flip_at = null, updated_at = now()
  where id = p_game;
  perform _war_settle(p_game);
end $$;

create or replace function public.war_create(opponents text[], p_bot_level int default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); others uuid[]; gid uuid;
begin
  if me is null then raise exception 'Sign in first'; end if;
  others := array(select p.id from (select distinct on (u) u, k from unnest(opponents) with ordinality o(u, k) order by u, k) o
                  join profiles p on p.username = o.u where p.id <> me order by o.k);
  if cardinality(others) < 1 or cardinality(others) > 3 then raise exception 'Pick 1 to 3 other players'; end if;
  insert into war_games (created_by, players, bot_level)
    values (me, array[me] || others,
            case when exists (select 1 from bots where profile_id = any (others)) then least(2, greatest(0, coalesce(p_bot_level, 1))) end)
    returning id into gid;
  perform _war_setup(gid);
  return gid;
end $$;

create or replace function public.war_delete(p_game uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from war_games where id = p_game and created_by = auth.uid();
  if not found then raise exception 'Only the player who started this game can delete it'; end if;
end $$;

-- ---------------------------------------------------------------- a battle
-- `who` turns up their top card for this battle. Returns the card.
create or replace function public._war_flip(p_game uuid, who uuid) returns text
language plpgsql security definer set search_path = public as $$
declare g war_games; s int; pc text[]; c text;
begin
  select * into g from war_games where id = p_game for update;
  if not found or not (who = any (g.players)) then raise exception 'Game not found'; end if;
  if g.status <> 'playing' then raise exception 'This game is over'; end if;
  s := array_position(g.players, who);
  if g.flips[s] = '-' then raise exception 'You''re out of cards'; end if;
  if g.flips[s] <> '' then raise exception 'Already flipped: waiting for the others'; end if;
  select cards into pc from war_piles where game_id = p_game and seat = s - 1 for update;
  if coalesce(cardinality(pc), 0) = 0 then raise exception 'You''re out of cards'; end if;
  c := pc[1];
  update war_piles set cards = pc[2:] where game_id = p_game and seat = s - 1;
  update war_games set flips[s] = c, counts[s] = cardinality(pc) - 1,
    flip_at = coalesce(flip_at, case when _is_bot(who) then null else now() end), updated_at = now()
  where id = p_game;
  return c;
end $$;

-- Robots flip; once every card is up, the battle resolves (and the next one starts). Repeats while
-- only robots are left to flip, so a robots-only ending plays out at once (the cap bounds it).
create or replace function public._war_settle(p_game uuid) returns void
language plpgsql security definer set search_path = public as $$
declare g war_games; i int; guard int := 0;
begin
  loop
    guard := guard + 1; exit when guard > 400;
    select * into g from war_games where id = p_game;
    exit when not found or g.status <> 'playing';
    for i in 1 .. cardinality(g.players) loop
      if g.flips[i] = '' and _is_bot(g.players[i]) then perform _war_flip(p_game, g.players[i]); end if;
    end loop;
    select * into g from war_games where id = p_game;
    exit when '' = any (g.flips);
    perform _war_resolve(p_game);
  end loop;
end $$;

-- Every card is up: who takes the table? Plays any wars out, pays the winner, starts the next battle,
-- and steps the chaos curve.
create or replace function public._war_resolve(p_game uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  g war_games; n int; v_pot text[]; v_up text[]; v_cont int[]; v_tied int[]; v_next int[]; v_best int; v_win int;
  v_first boolean := true; v_wl jsonb := '[]'; v_war jsonb; v_down jsonb; v_ups jsonb; v_short jsonb; s int; k int; d int;
  pc text[]; v_counts int[]; v_alive int[]; v_out jsonb; v_over boolean := false; v_champ int; v_capped boolean := false;
  v_mover uuid; v_others uuid[]; v_guard int := 0;
begin
  select * into g from war_games where id = p_game for update;
  if g.status <> 'playing' or '' = any (g.flips) then return; end if;
  n := cardinality(g.players);
  select coalesce(cards, '{}') into v_pot from war_piles where game_id = p_game and seat = -1 for update;
  v_pot := coalesce(v_pot, '{}');
  update war_piles set cards = '{}' where game_id = p_game and seat = -1;
  v_cont := array(select i - 1 from generate_subscripts(g.flips, 1) i where g.flips[i] <> '-' order by i);
  v_up := g.flips;
  v_pot := v_pot || array(select g.flips[i + 1] from unnest(v_cont) i);
  loop
    v_guard := v_guard + 1;
    -- what each card counts as: a joker is an Ace on the battle's first flip; reverse turns the order round
    select (case when g.twist = 'reverse' then min(x) else max(x) end) into v_best from (
      select case when v_first and g.twist = 'joker' and i = g.twist_seat then 14 else _war_rank(v_up[i + 1]) end x from unnest(v_cont) i) t;
    v_tied := array(select i from unnest(v_cont) i
                    where (case when v_first and g.twist = 'joker' and i = g.twist_seat then 14 else _war_rank(v_up[i + 1]) end) = v_best);
    if v_first and g.twist = 'double' and cardinality(v_cont) > 1 then v_tied := v_cont; end if;   -- 💥 it opens with a war
    v_first := false;
    if cardinality(v_tied) = 1 then v_win := v_tied[1]; exit; end if;
    if v_guard > 30 then v_win := v_tied[1 + floor(random() * cardinality(v_tied))::int]; exit; end if;
    -- ⚔️ WAR: three down, one up, each
    v_next := '{}'; v_down := '{}'; v_ups := '{}'; v_short := '[]';
    foreach s in array v_tied loop
      select cards into pc from war_piles where game_id = p_game and seat = s for update;
      k := coalesce(cardinality(pc), 0);
      if k = 0 then v_short := v_short || to_jsonb(s); continue; end if;
      d := least(3, k - 1);
      v_pot := v_pot || pc[1 : d + 1];
      v_up[s + 1] := pc[d + 1];
      update war_piles set cards = pc[d + 2 :] where game_id = p_game and seat = s;
      v_down := v_down || jsonb_build_object(s::text, d);
      v_ups := v_ups || jsonb_build_object(s::text, pc[d + 1]);
      v_next := v_next || s;
    end loop;
    v_wl := v_wl || jsonb_build_array(jsonb_build_object('who', to_jsonb(v_tied), 'down', v_down, 'up', v_ups, 'short', v_short));
    if cardinality(v_next) = 0 then v_win := v_tied[1 + floor(random() * cardinality(v_tied))::int]; exit; end if;
    if cardinality(v_next) = 1 then v_win := v_next[1]; exit; end if;
    v_cont := v_next;
  end loop;
  -- The winner takes the table into the bottom of their pile, shuffled.
  update war_piles set cards = cards || array(select x from unnest(v_pot) x order by random()) where game_id = p_game and seat = v_win;
  v_counts := array(select coalesce((select cardinality(w.cards) from war_piles w where w.game_id = p_game and w.seat = i), 0) from generate_series(0, n - 1) i);
  v_alive := array(select i from generate_series(0, n - 1) i where v_counts[i + 1] > 0);
  v_out := to_jsonb(array(select i from generate_series(0, n - 1) i where v_counts[i + 1] = 0 and g.flips[i + 1] <> '-'));
  g.won[v_win + 1] := g.won[v_win + 1] + 1;
  if jsonb_array_length(v_wl) > 0 then g.wars[v_win + 1] := g.wars[v_win + 1] + 1; end if;
  if cardinality(v_alive) <= 1 then
    v_over := true; v_champ := coalesce(v_alive[1], v_win);
  elsif g.battle >= g.cap then   -- sudden death: most cards wins
    v_over := true; v_capped := true;
    select i into v_champ from generate_series(0, n - 1) i order by v_counts[i + 1] desc, (i = v_win) desc, random() limit 1;
  end if;
  update war_games set
    counts = v_counts, won = g.won, wars = g.wars, pot = 0,
    last_battle = jsonb_build_object('n', g.battle, 'flips', to_jsonb(g.flips), 'twist', g.twist, 'twist_seat', g.twist_seat,
      'wars', v_wl, 'win', v_win, 'taken', cardinality(v_pot), 'counts', to_jsonb(v_counts), 'out', v_out, 'capped', v_capped),
    status = case when v_over then 'over' else 'playing' end,
    winner = case when v_over then players[v_champ + 1] end,
    battle = case when v_over then battle else battle + 1 end,
    flips = array(select case when v_counts[i] > 0 then '' else '-' end from generate_series(1, n) i),
    twist = null, twist_seat = null, flip_at = null, updated_at = now()
  where id = p_game;
  -- 🌀 chaos: one beat of the curve per battle, the battle's winner as the mover
  v_mover := g.players[v_win + 1]; v_others := array_remove(g.players, v_mover);
  perform set_config('chaos.mover', v_mover::text, true);
  if v_over then
    perform _chaos_drop(g.players[v_champ + 1], 'war', p_game, 'Winning the war');
    return;
  end if;
  if _chaos_curve('war', p_game) then perform _war_twist(p_game); end if;
  -- A War runs to 100+ battles (a card game is 30-50 moves), so its drops come at half the usual odds.
  if _chaos_mirror(p_game) and random() < 0.5 then perform _chaos_drop(v_mover, 'war', p_game, ' the mirror: x landed on 1 minus the battle before'); end if;   -- ✨
  if _chaos_golden(p_game) and random() < 0.5 then perform _chaos_drop(v_mover, 'war', p_game, ' the golden cut: x landed on 1/φ'); end if;   -- 🌻
  if _chaos_fib(p_game) and random() < 0.175 * _chaos_edge(_chaos_mood(p_game), 'fib_luck') then perform _chaos_drop(v_mover, 'war', p_game, ' a Fibonacci battle: luck runs higher'); end if;
  if jsonb_array_length(v_wl) > 0 and random() < 0.08 then perform _chaos_drop(v_mover, 'war', p_game, 'Winning a war'); end if;
  perform _chaos_mark_move(v_mover, 'war', p_game);   -- 🌀 the chaos rating
end $$;

-- A chaos twist on the next battle (or the piles, now).
create or replace function public._war_twist(p_game uuid) returns void
language plpgsql security definer set search_path = public as $$
declare g war_games; r float8 := random(); s int; p uuid; msg text; icon text; v_alive int[];
begin
  select * into g from war_games where id = p_game for update;
  if not found or g.status <> 'playing' then return; end if;
  v_alive := array(select i - 1 from generate_subscripts(g.flips, 1) i where g.flips[i] <> '-');
  if r < 0.28 then
    update war_games set twist = 'reverse', twist_seat = null, updated_at = now() where id = p_game;
    icon := '🔄'; msg := 'Chaos twist: REVERSE! Next battle the LOWEST card wins.';
  elsif r < 0.53 then
    s := v_alive[1 + floor(random() * cardinality(v_alive))::int];
    update war_games set twist = 'joker', twist_seat = s, updated_at = now() where id = p_game;
    icon := '🃏'; msg := format('Chaos twist: JOKER! %s''s next card counts as an Ace.', _uname(g.players[s + 1]));
  elsif r < 0.76 then
    update war_games set twist = 'double', twist_seat = null, updated_at = now() where id = p_game;
    icon := '💥'; msg := 'Chaos twist: DOUBLE WAR! The next battle starts with a war.';
  else
    -- 🌀 every pile shuffled (cards already turned up stay where they are)
    update war_piles w set cards = array(select x from unnest(w.cards) x order by random()) where w.game_id = p_game and w.seat >= 0;
    update war_games set last_battle = coalesce(last_battle, '{}') || jsonb_build_object('shuffle', true), updated_at = now() where id = p_game;
    icon := '🌀'; msg := 'Chaos twist: SHUFFLE! Every pile just got shuffled.';
  end if;
  foreach p in array g.players loop perform _chaos_event(p, null, 'twist', 'war', p_game, icon, msg); end loop;
end $$;

create or replace function public.war_flip(p_game uuid) returns text
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  c := _war_flip(p_game, auth.uid());
  perform _war_settle(p_game);
  return c;
end $$;

-- ---------------------------------------------------------------- live (everyone on the page)
create or replace function public._war_live(g war_games) returns boolean
language sql stable security definer set search_path = public as $$
  select g.status = 'playing'
     and not exists (
       select 1 from unnest(g.players) p
       where not exists (select 1 from bots where profile_id = p)
         and not exists (select 1 from live_here h where h.kind = 'war' and h.game_id = g.id and h.player = p and h.seen_at > now() - interval '8 seconds'));
$$;

-- The flip timer ran out (4 s on the page after the first person flipped): everyone still to flip
-- flips. Any player's page can call it; only a call after 3.5 s does anything.
create or replace function public.war_timeout(p_game uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare g war_games; i int;
begin
  select * into g from war_games where id = p_game for update;
  if not found or not (auth.uid() = any (g.players)) then raise exception 'Game not found'; end if;
  if not _war_live(g) or g.flip_at is null or now() - g.flip_at < interval '3.5 seconds' then return false; end if;
  for i in 1 .. cardinality(g.players) loop
    if g.flips[i] = '' then perform _war_flip(p_game, g.players[i]); end if;
  end loop;
  perform _war_settle(p_game);
  return true;
end $$;

-- ---------------------------------------------------------------- the chaos clock's hits
-- 2 h: your card flips itself. 8 h: it flips, and two of your cards slide into the pot.
create or replace function public._war_clock_hit(p_game uuid, p_who uuid, p_level int) returns text
language plpgsql security definer set search_path = public as $$
declare g war_games; s int; pc text[]; k int;
begin
  select * into g from war_games where id = p_game for update;
  if not found or g.status <> 'playing' then return 'nothing happened'; end if;
  s := array_position(g.players, p_who);
  if p_level >= 2 then
    select cards into pc from war_piles where game_id = p_game and seat = s - 1 for update;
    k := least(2, greatest(0, coalesce(cardinality(pc), 0) - 1 - case when g.flips[s] = '' then 1 else 0 end));
    if k > 0 then
      update war_piles set cards = cards || pc[1 : k] where game_id = p_game and seat = -1;
      update war_piles set cards = pc[k + 1 :] where game_id = p_game and seat = s - 1;
      update war_games set counts[s] = counts[s] - k, pot = pot + k, updated_at = now() where id = p_game;
    end if;
  end if;
  if g.flips[s] = '' then perform _war_flip(p_game, p_who); end if;
  perform _war_settle(p_game);
  return case when p_level >= 2 then 'your card flipped itself and two more slid into the pot' else 'your card flipped itself' end;
end $$;

-- 24 h on a Route to Chaos round: the slow player forfeits; the most cards (of the rest) wins.
create or replace function public._war_forfeit(p_game uuid, p_who uuid) returns void
language plpgsql security definer set search_path = public as $$
declare g war_games;
begin
  select * into g from war_games where id = p_game for update;
  if not found or g.status <> 'playing' then return; end if;
  update war_games set status = 'over', updated_at = now(),
    winner = (select q from unnest(g.players) with ordinality u(q, k) where q <> p_who order by g.counts[k] desc, random() limit 1)
  where id = p_game;
end $$;

-- ---------------------------------------------------------------- results
alter table public.results drop constraint if exists results_kind_check;
alter table public.results add constraint results_kind_check check (kind in ('battleship', 'golf', 'duel', 'cards', 'war', 'gauntlet'));
create or replace function public._log_war_result(p_game uuid) returns void
language plpgsql security definer set search_path = public as $$
declare g war_games; st jsonb := '{}'; p uuid; i int;
begin
  if exists (select 1 from results where kind = 'war' and game_id = p_game) then return; end if;
  select * into g from war_games where id = p_game and status = 'over'; if not found then return; end if;
  foreach p in array g.players loop
    i := array_position(g.players, p);
    st := st || jsonb_build_object(p::text, jsonb_build_object('left', g.counts[i], 'battles', g.won[i], 'wars', g.wars[i]));
  end loop;
  insert into results (kind, game_id, players, winners, gauntlet_id, stats)
    values ('war', p_game, g.players, case when g.winner is null then '{}' else array[g.winner] end, g.gauntlet_id, st)
    on conflict (kind, game_id) do nothing;
end $$;
create or replace function public._war_result_on_finish() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'over' and old.status is distinct from 'over' then perform _log_war_result(new.id); end if;
  return new;
end $$;
drop trigger if exists log_result on public.war_games;
create trigger log_result after update on public.war_games for each row execute function public._war_result_on_finish();

-- ---------------------------------------------------------------- the rest of the site
alter table public.live_here drop constraint if exists live_here_kind_check;
alter table public.live_here add constraint live_here_kind_check check (kind in ('battleship', 'golf', 'cards', 'war'));
alter table public.online drop constraint if exists online_page_check;
alter table public.online add constraint online_page_check check (page in ('lobby', 'battleship', 'golf', 'duel', 'cards', 'war'));

-- live_here (latest body: 045's, with the since column) knows War.
create or replace function public.live_here(p_kind text, p_game uuid, p_on boolean default true) returns boolean
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); b games; gg golf_games; cg card_games; wg war_games;
begin
  if p_kind = 'battleship' then
    select * into b from games where id = p_game;
    if not found or not (me = any (b.players)) then raise exception 'Game not found'; end if;
  elsif p_kind = 'golf' then
    select * into gg from golf_games where id = p_game;
    if not found or not (me = any (gg.players)) then raise exception 'Game not found'; end if;
  elsif p_kind = 'cards' then
    select * into cg from card_games where id = p_game;
    if not found or not (me = any (cg.players)) then raise exception 'Game not found'; end if;
  elsif p_kind = 'war' then
    select * into wg from war_games where id = p_game;
    if not found or not (me = any (wg.players)) then raise exception 'Game not found'; end if;
  else
    raise exception 'Unknown game';
  end if;
  if p_on then
    insert into live_here (kind, game_id, player, seen_at) values (p_kind, p_game, me, now())
      on conflict (kind, game_id, player) do update set since = case when live_here.seen_at < now() - interval '8 seconds' then now() else live_here.since end, seen_at = now();
  else
    delete from live_here where kind = p_kind and game_id = p_game and player = me;
  end if;
  return case p_kind when 'battleship' then _bs_live(b) when 'golf' then _golf_live(gg) when 'war' then _war_live(wg) else _card_live(cg) end;
end $$;
create or replace function public._live_here_gone() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from live_here where game_id = old.id
    and kind = (case tg_table_name when 'games' then 'battleship' when 'golf_games' then 'golf' when 'war_games' then 'war' else 'cards' end);
  return old;
end $$;
drop trigger if exists live_here_gone on public.war_games;
create trigger live_here_gone after delete on public.war_games for each row execute function public._live_here_gone();
drop trigger if exists game_deleted on public.war_games;
create trigger game_deleted after delete on public.war_games for each row execute function public._game_deleted();

-- Deleting finished games from your list (020).
create or replace function public._finished_games(p_player uuid, p_gauntlet uuid default null) returns setof uuid
language sql stable security definer set search_path = public as $$
  select id from games where status = 'over' and p_player = any (players) and (p_gauntlet is null or gauntlet_id = p_gauntlet)
  union all select id from golf_games where status = 'over' and p_player = any (players) and (p_gauntlet is null or gauntlet_id = p_gauntlet)
  union all select id from duel_games where status = 'over' and p_player = any (players) and (p_gauntlet is null or gauntlet_id = p_gauntlet)
  union all select id from card_games where status = 'over' and p_player = any (players) and (p_gauntlet is null or gauntlet_id = p_gauntlet)
  union all select id from war_games where status = 'over' and p_player = any (players) and (p_gauntlet is null or gauntlet_id = p_gauntlet)
$$;

-- Route to Chaos: War is a round for any group of 4 or fewer.
create or replace function public._kind_label(k text) returns text
language sql immutable as $$ select case k when 'battleship' then '⚓ Battleship' when 'golf' then '⛳ Putt Post' when 'cards' then '🃏 Chaos Cards' when 'war' then '⚔️ War' else '💥 Hilltop Duel' end $$;
drop trigger if exists gauntlet_war on public.war_games;
create trigger gauntlet_war after update on public.war_games for each row execute function public._gauntlet_round_over('war');
create or replace function public.gauntlet_delete(p_gauntlet uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from gauntlets where id = p_gauntlet and created_by = auth.uid()) then
    raise exception 'Only the player who started this Chaos can call it off';
  end if;
  delete from games where gauntlet_id = p_gauntlet and status <> 'over';
  delete from golf_games where gauntlet_id = p_gauntlet and status <> 'over';
  delete from duel_games where gauntlet_id = p_gauntlet and status <> 'over';
  delete from card_games where gauntlet_id = p_gauntlet and status <> 'over';
  delete from war_games where gauntlet_id = p_gauntlet and status <> 'over';
  delete from chaos_events where game_id = p_gauntlet;
  delete from gauntlets where id = p_gauntlet;
end $$;

-- ---------------------------------------------------------------- patches in place (each guarded, so a re-run is a no-op)
do $$
declare d text;
begin
  -- the chaos curve finds a War game's players and Chaos round
  d := pg_get_functiondef('public._chaos_curve(text,uuid)'::regprocedure);
  if position('from war_games' in d) = 0 then
    if position('      when ''cards'' then select players, gauntlet_id into ps, gid from card_games where id = p_game;' in d) = 0 then
      raise exception '084: _chaos_curve is not the shape this patch expects';
    end if;
    d := replace(d, '      when ''cards'' then select players, gauntlet_id into ps, gid from card_games where id = p_game;',
      '      when ''cards'' then select players, gauntlet_id into ps, gid from card_games where id = p_game;
      when ''war'' then select players, gauntlet_id into ps, gid from war_games where id = p_game;   -- ⚔️ (084)');
    execute d;
  end if;

  -- a twist on a War table
  d := pg_get_functiondef('public._chaos_twist(text,uuid)'::regprocedure);
  if position('_war_twist' in d) = 0 then
    if position('    perform _chaos_twist_golf(p_game);' in d) = 0 then raise exception '084: _chaos_twist is not the shape this patch expects'; end if;
    d := replace(d, '    perform _chaos_twist_golf(p_game);', '    perform _chaos_twist_golf(p_game);

  elsif p_kind = ''war'' then
    perform _war_twist(p_game);   -- ⚔️ (084)');
    execute d;
  end if;

  -- Route to Chaos deals War
  d := pg_get_functiondef('public._gauntlet_next(uuid)'::regprocedure);
  if position('_war_setup' in d) = 0 then
    if position('case when n <= 4 then array[''cards''] else' in d) = 0 or position('  else
    child := _duel_new(' in d) = 0 then
      raise exception '084: _gauntlet_next is not the shape this patch expects';
    end if;
    d := replace(d, 'case when n <= 4 then array[''cards''] else', 'case when n <= 4 then array[''cards'', ''war''] else');
    d := replace(d, '  else
    child := _duel_new(', '  elsif k = ''war'' then   -- ⚔️ (084)
    insert into war_games (created_by, players, bot_level, gauntlet_id) values (gt.created_by, rot, case when has_bot then 1 end, p_gauntlet)
      returning id into child;
    perform _war_setup(child);
  else
    child := _duel_new(');
    execute d;
  end if;

  -- the chaos clock: whose flip is overdue
  d := pg_get_functiondef('public._clock_turn(text,uuid)'::regprocedure);
  if position('war_games' in d) = 0 then
    if position('declare g games; gg golf_games; dg duel_games; cg card_games;' in d) = 0 or position('  else
    select * into dg from duel_games' in d) = 0 then
      raise exception '084: _clock_turn is not the shape this patch expects';
    end if;
    d := replace(d, 'declare g games; gg golf_games; dg duel_games; cg card_games;', 'declare g games; gg golf_games; dg duel_games; cg card_games; wg war_games; wk int;');
    d := replace(d, '  else
    select * into dg from duel_games', '  elsif p_kind = ''war'' then   -- ⚔️ (084): the first person still to flip this battle
    select * into wg from war_games where id = p_game and status = ''playing'';
    if found then
      select i into wk from generate_subscripts(wg.flips, 1) i where wg.flips[i] = '''' and not _is_bot(wg.players[i]) order by i limit 1;
      if wk is not null then who := wg.players[wk]; turn_key := wg.battle * 10 + wk; turn_at := wg.turn_at; gauntlet := wg.gauntlet_id; n := cardinality(wg.players); end if;
    end if;
  else
    select * into dg from duel_games');
    execute d;
  end if;

  d := pg_get_functiondef('public._clock_hit(text,uuid,uuid,integer,text)'::regprocedure);
  if position('_war_clock_hit' in d) = 0 then
    if position('    update card_games set updated_at = now() where id = p_game;
  else' in d) = 0 then raise exception '084: _clock_hit is not the shape this patch expects'; end if;
    d := replace(d, '    update card_games set updated_at = now() where id = p_game;
  else', '    update card_games set updated_at = now() where id = p_game;
  elsif p_kind = ''war'' then
    effect := _war_clock_hit(p_game, p_who, p_level);   -- ⚔️ (084)
  else');
    execute d;
  end if;

  d := pg_get_functiondef('public.chaos_clock()'::regprocedure);
  if position('war_games' in d) = 0 then
    if position('    union all select ''cards'', id, players from card_games where status = ''playing'' and me = any (players)' in d) = 0
       or position('        elsif x.k = ''cards'' then' in d) = 0 then
      raise exception '084: chaos_clock is not the shape this patch expects';
    end if;
    d := replace(d, '    union all select ''cards'', id, players from card_games where status = ''playing'' and me = any (players)',
      '    union all select ''cards'', id, players from card_games where status = ''playing'' and me = any (players)
    union all select ''war'', id, players from war_games where status = ''playing'' and me = any (players)');
    d := replace(d, '        elsif x.k = ''cards'' then', '        elsif x.k = ''war'' then
          perform _war_forfeit(x.id, c.who);   -- ⚔️ (084)
        elsif x.k = ''cards'' then');
    execute d;
  end if;

  -- the scoreboard's per-game chips and the trophy case's counts
  d := pg_get_functiondef('public.family_stats()'::regprocedure);
  if position('''cards'', ''war''' in d) = 0 then
    if position('from unnest(array[''battleship'', ''golf'', ''duel'', ''cards'']) k) by_kind' in d) = 0 then raise exception '084: family_stats is not the shape this patch expects'; end if;
    d := replace(d, 'from unnest(array[''battleship'', ''golf'', ''duel'', ''cards'']) k) by_kind', 'from unnest(array[''battleship'', ''golf'', ''duel'', ''cards'', ''war'']) k) by_kind');
    execute d;
  end if;
  d := pg_get_functiondef('public.player_trophies(uuid)'::regprocedure);
  if position('war_won' in d) = 0 then
    if position('''duel_won'', (select count(*) from duo where kind = ''duel'' and p_player = any (winners)),' in d) = 0 then raise exception '084: player_trophies is not the shape this patch expects'; end if;
    d := replace(d, '''duel_won'', (select count(*) from duo where kind = ''duel'' and p_player = any (winners)),',
      '''duel_won'', (select count(*) from duo where kind = ''duel'' and p_player = any (winners)),
      ''cards_won'', (select count(*) from duo where kind = ''cards'' and p_player = any (winners)),
      ''war_won'', (select count(*) from duo where kind = ''war'' and p_player = any (winners)),');
    execute d;
  end if;

  -- who's live: "at War"
  d := pg_get_functiondef('public.here_now(text,uuid,boolean)'::regprocedure);
  if position('''cards'', ''war''' in d) = 0 then
    if position('p_page not in (''lobby'', ''battleship'', ''golf'', ''duel'', ''cards'')' in d) = 0 then raise exception '084: here_now is not the shape this patch expects'; end if;
    d := replace(d, 'p_page not in (''lobby'', ''battleship'', ''golf'', ''duel'', ''cards'')', 'p_page not in (''lobby'', ''battleship'', ''golf'', ''duel'', ''cards'', ''war'')');
    execute d;
  end if;
end $$;

-- ---------------------------------------------------------------- permissions
revoke execute on function public._war_deck(), public._war_setup(uuid), public._war_flip(uuid, uuid), public._war_settle(uuid),
  public._war_resolve(uuid), public._war_twist(uuid), public._war_live(war_games), public._war_clock_hit(uuid, uuid, int),
  public._war_forfeit(uuid, uuid), public._log_war_result(uuid), public._war_result_on_finish(), public._war_turn_moved()
  from public, anon, authenticated;
revoke execute on function public.war_create(text[], int), public.war_delete(uuid), public.war_flip(uuid), public.war_timeout(uuid) from public, anon;
grant execute on function public.war_create(text[], int), public.war_delete(uuid), public.war_flip(uuid), public.war_timeout(uuid) to authenticated;
