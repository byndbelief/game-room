-- 122: a trip ends. It's over once its end date has passed (worked out on the page, in the
-- family's own time zone) or when its starter or a parent ends it early (ended_at; clearing it
-- reopens the trip). An ended trip stays readable under Past trips; deleting one stays
-- parent-only (092). r4_home (107) now carries ended_at so home skips trips that are over.
alter table public.trips add column if not exists ended_at timestamptz;

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
    'trips', (select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'place', t.place, 'starts', t.starts, 'ends', t.ends, 'ended_at', t.ended_at,
               'members', coalesce(t.going->'members', 'null'::jsonb)) order by t.starts nulls last), '[]'::jsonb) from public.trips t));
end $$;
revoke execute on function public.r4_home() from public, anon;
grant execute on function public.r4_home() to authenticated;
