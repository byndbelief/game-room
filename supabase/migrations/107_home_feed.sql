-- 107: what the r4box.com home needs from the game room and the trips, in one call.
--   turns:    games waiting on you (Battleship, Putt Post, Hilltop Duel, Chaos Cards),
--             the same rule as the game room's lobby: status 'playing' and the turn is yours
--   together: per game, how many finished games each family member played with
--             another family member (bots don't count): the roots between trees
--   trips:    every trip and who's going (104; unset is everyone), for the stars
-- The game tables only show you games you're in; this returns no moves or boards.
create or replace function public.r4_home() returns jsonb
  language plpgsql stable security definer set search_path = '' as $$
declare v_me uuid := auth.uid();
begin
  if not public.r4_is_family() then raise exception 'not allowed'; end if;
  return jsonb_build_object(
    'turns', (select coalesce(jsonb_agg(x order by x->>'at' desc), '[]'::jsonb) from (
        select jsonb_build_object('kind', 'battleship', 'id', g.id, 'players', g.players, 'at', g.updated_at) x
          from public.games g where g.status = 'playing' and g.players[g.turn + 1] = v_me and not (v_me = any (coalesce(g.eliminated, '{}')))
        union all
        select jsonb_build_object('kind', 'golf', 'id', g.id, 'players', g.players, 'at', g.updated_at)
          from public.golf_games g where g.status = 'playing' and cardinality(g.players) > 0 and g.players[(g.t % cardinality(g.players)) + 1] = v_me
        union all
        select jsonb_build_object('kind', 'duel', 'id', g.id, 'players', g.players, 'at', g.updated_at)
          from public.duel_games g where g.status = 'playing' and g.players[g.turn + 1] = v_me
        union all
        select jsonb_build_object('kind', 'cards', 'id', g.id, 'players', g.players, 'at', g.updated_at)
          from public.card_games g where g.status = 'playing' and g.players[g.turn + 1] = v_me) t),
    'together', (select coalesce(jsonb_agg(jsonb_build_object('kind', k.kind, 'who', k.who)), '[]'::jsonb) from (
        select r.kind, jsonb_agg(jsonb_build_object('id', r.p, 'played', r.n)) who from (
          select res.kind, p, count(*) n
            from public.results res, unnest(res.players) p
           where res.kind in ('battleship', 'golf', 'duel', 'cards', 'war')
             and p in (select u.id from auth.users u where u.raw_app_meta_data->>'r4_role' in ('parent', 'kid'))
             and (select count(*) from unnest(res.players) q join auth.users u on u.id = q where u.raw_app_meta_data->>'r4_role' in ('parent', 'kid')) >= 2
           group by res.kind, p) r
        group by r.kind having count(*) >= 2) k),
    'trips', (select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'place', t.place, 'starts', t.starts, 'ends', t.ends,
               'members', coalesce(t.going->'members', 'null'::jsonb)) order by t.starts nulls last), '[]'::jsonb) from public.trips t));
end $$;
revoke execute on function public.r4_home() from public, anon;
grant execute on function public.r4_home() to authenticated;
