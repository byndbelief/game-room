// Pickups: "On my way" in the family chat (124). A parent picking up a kid shares how many
// minutes away they are and how far along the road (126), never a map. The parent's chat page sends its position here
// while the pickup is on; this asks Google for the drive time to the pickup place, keeps only
// the minutes (eta_at) and how far along the route (done_m), and forgets the position. The kid sees a card counting down, with
// alerts when the parent sets off, is about 5 minutes away, is running late, and is here.
// The card also shows the drive as a road (126): Google's route with its turns, and the traffic lights,
// train crossings and landmarks on it from OpenStreetMap, with how far along it the car is (done_m).
// The route's line stays in pickup_lines, which only this reads.
//
// POST { start: { kid, place? | address?, name?, from: { lat, lng } }, ask? }  a parent sets off (ask: the kid's ask it answers)
// POST { ask: { to, place, when? } }                                        a kid asks a parent for a pickup
// POST { update: id, from: { lat, lng } }                                   the driver's page, every ~30 s
// POST { note: id, text }                                                   the kid: Ready, 5 more min, where they'll be
// POST { here: id } / { stop: id }                                          the driver arrived / it's over (driver, kid or a parent)
// POST { place: { name, emoji?, address? | at: { lat, lng } } }             a parent saves a pickup spot
// -> { pickup } (the row) or { place } or { error }
// A pickup ends by itself an hour after it started. Positions are never written anywhere.
// Practice (125): start.test or ask.test from a parent (ask.kid: whose ask to play) makes a pickup only
// that parent sees: no card in the chat, and the kid's alerts go to the parent, marked 🧪. The parent
// may answer for the kid on it (note) to see both sides.
// Secrets: GOOGLE_MAPS_KEY (Routes API and Geocoding API), the VAPID_* for alerts. SUPABASE_* are automatic.

import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import webpush from 'npm:web-push@3.6.7';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const KEY = Deno.env.get('GOOGLE_MAPS_KEY');
const CHAT_URL = 'https://r4box.com/chat.html';
const HERE_M = 150;            // this close to the place is "here"
const MAX_MS = 60 * 60_000;    // a pickup ends by itself after an hour
const MIN_GAP_MS = 15_000;     // updates closer together than this reuse the last answer

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void };

type Pos = { lat: number; lng: number };
const pos = (x: unknown): Pos | null => {
  const p = x as { lat?: unknown; lng?: unknown } | null;
  return p && typeof p.lat === 'number' && typeof p.lng === 'number' && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180 ? { lat: p.lat, lng: p.lng } : null;
};
// Straight-line metres (for "here").
function metres(a: Pos, b: Pos) {
  const R = 6371e3, r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
// Minutes of driving from a to b in today's traffic (Google Routes).
async function driveMin(a: Pos, b: Pos): Promise<number> {
  return (await routes(a, b, 'routes.duration')).min;
}
type Pt = [number, number, number];   // lat, lng, metres from the start
type Mark = { d: number; k: 'turn' | 'light' | 'spot' | 'rail'; e: string; n?: string };
type Route = { min: number; m: number; line: Pt[]; marks: Mark[] };
// The drive itself (126): minutes, the line, and the turns from Google's steps.
async function routes(a: Pos, b: Pos, mask = 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.steps.distanceMeters,routes.legs.steps.navigationInstruction'): Promise<Route> {
  const r = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': KEY!, 'X-Goog-FieldMask': mask },
    body: JSON.stringify({ origin: { location: { latLng: { latitude: a.lat, longitude: a.lng } } }, destination: { location: { latLng: { latitude: b.lat, longitude: b.lng } } },
      travelMode: 'DRIVE', routingPreference: 'TRAFFIC_AWARE' }),
  });
  if (!r.ok) throw new Error(`routes ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const ro = (await r.json()).routes?.[0];
  const s = parseInt(String(ro?.duration ?? ''), 10);
  if (!Number.isFinite(s)) throw new Error('no route');
  const min = Math.max(1, Math.round(s / 60));
  const enc = ro.polyline?.encodedPolyline;
  if (!enc) return { min, m: 0, line: [], marks: [] };
  const line: Pt[] = [];
  for (const [lat, lng] of decode(enc)) {
    const last = line[line.length - 1];
    line.push([+lat.toFixed(5), +lng.toFixed(5), last ? Math.round(last[2] + metres({ lat: last[0], lng: last[1] }, { lat, lng })) : 0]);
  }
  const m = line[line.length - 1][2] || 1;
  // A turn happens where its step starts; Google's step lengths are scaled to the line's.
  const steps = (ro.legs ?? []).flatMap((l: { steps?: unknown[] }) => l.steps ?? []) as { distanceMeters?: number; navigationInstruction?: { maneuver?: string; instructions?: string } }[];
  const scale = m / (steps.reduce((t, x) => t + (x.distanceMeters ?? 0), 0) || m);
  const marks: Mark[] = [];
  let acc = 0;
  steps.forEach((x, i) => {
    const mv = x.navigationInstruction?.maneuver ?? '', text = (x.navigationInstruction?.instructions ?? '').split('\n')[0];
    const e = /UTURN/.test(mv) ? '↶' : /ROUNDABOUT/.test(mv) ? '⟳' : /LEFT/.test(mv) ? '↰' : /RIGHT/.test(mv) ? '↱' : /RAMP|MERGE/.test(mv) ? '⤴' : '';
    if (i > 0 && e && acc > 30 && acc < m - 30) {
      const road = text.match(/(?:onto|on|toward|to) (.+?)(?:\/|$)/)?.[1]?.trim();
      const way = /UTURN/.test(mv) ? 'U-turn' : /ROUNDABOUT/.test(mv) ? 'roundabout' : /LEFT/.test(mv) ? 'left' : /RIGHT/.test(mv) ? 'right' : /MERGE/.test(mv) ? 'merge' : 'ramp';
      marks.push({ d: Math.round(acc), k: 'turn', e, n: (road ? `${way} onto ${road}` : text || way).slice(0, 60) });
    }
    acc += (x.distanceMeters ?? 0) * scale;
  });
  return { min, m, line, marks };
}
// Google's encoded polyline.
function decode(s: string): [number, number][] {
  const out: [number, number][] = [];
  let i = 0, lat = 0, lng = 0;
  const next = () => { let r = 0, sh = 0, b; do { b = s.charCodeAt(i++) - 63; r |= (b & 31) << sh; sh += 5; } while (b >= 32); return r & 1 ? ~(r >> 1) : r >> 1; };
  while (i < s.length) { lat += next(); lng += next(); out.push([lat / 1e5, lng / 1e5]); }
  return out;
}
// How far along the line a point is, and how far off it (metres).
function along(line: Pt[], p: Pos): { d: number; off: number } {
  const kx = 111320 * Math.cos(p.lat * Math.PI / 180), ky = 110540;
  let best = { d: 0, off: Infinity };
  for (let i = 1; i < line.length; i++) {
    const [aLat, aLng, aD] = line[i - 1], [bLat, bLng, bD] = line[i];
    const ax = (aLng - p.lng) * kx, ay = (aLat - p.lat) * ky, bx = (bLng - p.lng) * kx, by = (bLat - p.lat) * ky;
    const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
    const t = L ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / L)) : 0;
    const off = Math.hypot(ax + t * dx, ay + t * dy);
    if (off < best.off) best = { d: aD + t * (bD - aD), off };
  }
  return { d: Math.round(best.d), off: best.off };
}
// Fewer points for the OpenStreetMap question (Douglas-Peucker, loosened until it's short).
function simplify(line: Pt[], max = 300): Pt[] {
  for (let tol = 8; ; tol *= 1.6) {
    const keep = new Uint8Array(line.length); keep[0] = keep[line.length - 1] = 1;
    const stack: [number, number][] = [[0, line.length - 1]];
    while (stack.length) {
      const [a, b] = stack.pop()!;
      let worst = 0, at = -1;
      for (let i = a + 1; i < b; i++) {
        const off = along([line[a], line[b]], { lat: line[i][0], lng: line[i][1] }).off;
        if (off > worst) { worst = off; at = i; }
      }
      if (worst > tol) { keep[at] = 1; stack.push([a, at], [at, b]); }
    }
    const out = line.filter((_, i) => keep[i]);
    if (out.length <= max) return out;
  }
}
const SPOT: Record<string, [string, number]> = {
  'amenity=school': ['🏫', 3], 'amenity=college': ['🎓', 3], 'amenity=university': ['🎓', 3], 'amenity=hospital': ['🏥', 3], 'amenity=place_of_worship': ['⛪', 2],
  'amenity=library': ['📚', 2], 'amenity=fire_station': ['🚒', 2], 'amenity=police': ['🚓', 2], 'amenity=fuel': ['⛽', 1.5], 'amenity=fast_food': ['🍔', 1.5],
  'amenity=cafe': ['☕', 1], 'amenity=restaurant': ['🍽️', 1], 'amenity=ice_cream': ['🍦', 1.5], 'amenity=cinema': ['🎬', 2], 'amenity=bank': ['🏦', 0.5],
  'amenity=pharmacy': ['💊', 1], 'amenity=post_office': ['🏤', 1], 'shop=supermarket': ['🛒', 2.5], 'shop=mall': ['🛍️', 3], 'shop=department_store': ['🛍️', 2.5],
  'shop=*': ['🛍️', 0.5], 'leisure=park': ['🌳', 2.5], 'leisure=stadium': ['🏟️', 3], 'leisure=sports_centre': ['🏀', 1.5], 'leisure=playground': ['🛝', 1.5],
  'leisure=golf_course': ['⛳', 2], 'tourism=museum': ['🏛️', 3], 'tourism=attraction': ['⭐', 2.5], 'tourism=hotel': ['🏨', 1], 'historic=*': ['🏛️', 2],
};
// The lights, train crossings and landmarks on the way, from OpenStreetMap. Lights within 25 m of the
// line (one per crossing), landmarks with a name within 90 m, the best-known few, spread out.
async function sights(line: Pt[], m: number): Promise<Mark[]> {
  const pts = simplify(line).map(([a, b]) => `${a},${b}`).join(',');
  // Everything near the line once, then sorted by kind (much quicker than asking per kind).
  const kinds = ['amenity', 'shop', 'leisure', 'tourism', 'historic'];
  const q = `[out:json][timeout:25];node(around:90,${pts})->.n;way(around:90,${pts})["name"]->.w;(node.n["highway"="traffic_signals"];node.n["railway"="level_crossing"];` +
    kinds.map((k) => `node.n["name"]["${k}"];way.w["${k}"];`).join('') + ');out center tags;';
  let els: { lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string>; type: string }[] = [];
  for (const host of ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']) {
    try {
      const r = await fetch(host, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'r4box-pickup/1.0' }, body: 'data=' + encodeURIComponent(q), signal: AbortSignal.timeout(30000) });
      if (r.ok) { els = (await r.json()).elements ?? []; break; }
      console.error('overpass', host, r.status);
    } catch (e) { console.error('overpass', host, e); }
  }
  const lights: number[] = [], rails: number[] = [], spots: (Mark & { s: number })[] = [];
  for (const el of els) {
    const lat = el.lat ?? el.center?.lat, lng = el.lon ?? el.center?.lon, t = el.tags ?? {};
    if (lat == null || lng == null) continue;
    const { d, off } = along(line, { lat, lng });
    if (t.highway === 'traffic_signals') { if (off <= 30) lights.push(d); continue; }
    if (t.railway === 'level_crossing') { if (off <= 25) rails.push(d); continue; }
    if (off > 100 || d < 120 || d > m - 120) continue;
    const key = kinds.map((k) => t[k] ? (SPOT[`${k}=${t[k]}`] ? `${k}=${t[k]}` : SPOT[`${k}=*`] ? `${k}=*` : '') : '').find(Boolean);
    if (!key) continue;
    const [e, w] = SPOT[key];
    const s = w + (t.wikidata ? 3 : 0) + (t.brand || t['brand:wikidata'] ? 1.5 : 0) + (el.type !== 'node' ? 1 : 0) - off / 100;
    spots.push({ d, k: 'spot', e, n: t.name.slice(0, 50), s });
  }
  // Signals at one crossing are several nodes: one light per 60 m.
  const one = (ds: number[], gap: number) => ds.sort((a, b) => a - b).filter((d, i, a) => !i || d - a[i - 1] > gap);
  const gap = Math.max(250, m * 0.12), picked: Mark[] = [];
  for (const sp of spots.sort((a, b) => b.s - a.s)) {
    if (picked.length >= 6) break;
    if (picked.some((x) => Math.abs(x.d - sp.d) < gap || x.n === sp.n)) continue;
    picked.push({ d: sp.d, k: 'spot', e: sp.e, n: sp.n });
  }
  return [...one(lights, 60).map((d): Mark => ({ d, k: 'light', e: '🚦' })), ...one(rails, 60).map((d): Mark => ({ d, k: 'rail', e: '🚂', n: 'train tracks' })), ...picked];
}
// The route for the card: the turns now, the lights and landmarks once OpenStreetMap answers.
// A new route on the way (they left the old one) carries on from where they are: what's behind stays.
async function setRoute(id: string, ro: Route, from: Pos, prev?: { done: number; route: { from?: unknown; marks?: Mark[] } }) {
  if (!ro.line.length) return;
  const v = Date.now(), off = prev?.done ?? 0;
  if (off) { ro.line = ro.line.map(([a, b, d]) => [a, b, d + off]); ro.m += off; ro.marks = ro.marks.map((x) => ({ ...x, d: x.d + off })); }
  const behind = (prev?.route?.marks ?? []).filter((x) => x.d <= off);
  ro.marks = [...behind, ...ro.marks];
  let start = prev?.route?.from ?? null;
  if (!prev) {
    const { data: pl } = await admin.from('family_places').select('name, emoji, lat, lng');
    const near = (pl ?? []).map((x) => ({ x, m: metres(from, x) })).filter((x) => x.m < 250).sort((a, b) => a.m - b.m)[0]?.x;
    start = near ? { e: near.emoji || '📍', n: near.name } : null;
  }
  const base = { v, m: ro.m, from: start };
  await admin.from('pickup_lines').upsert({ pickup: id, pts: ro.line, at: new Date().toISOString() });
  await admin.from('pickups').update({ route: { ...base, marks: ro.marks, ready: false } }).eq('id', id);
  EdgeRuntime.waitUntil((async () => {
    let more: Mark[] = [];
    try { more = (await sights(ro.line.filter((x) => x[2] >= off), ro.m)).filter((x) => x.d > off); } catch (e) { console.error('sights', e); }
    const { data: now } = await admin.from('pickups').select('route').eq('id', id).maybeSingle();
    if (now?.route?.v !== v) return;   // re-routed since
    // A turn at a light keeps the turn; the light shows too.
    const marks = [...ro.marks, ...more].sort((a, b) => a.d - b.d);
    await admin.from('pickups').update({ route: { ...base, marks, ready: true } }).eq('id', id);
  })());
}
async function geocode(address: string): Promise<(Pos & { address: string }) | null> {
  const r = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${KEY}`);
  const j = await r.json();
  const g = j.results?.[0];
  return g ? { lat: g.geometry.location.lat, lng: g.geometry.location.lng, address: String(g.formatted_address).slice(0, 200) } : null;
}

async function push(to: string[], title: string, body: string, tag: string) {
  try {
    webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT') ?? 'mailto:alerts@example.com', Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!);
    const { data: subs } = await admin.from('push_subscriptions').select('*').in('user_id', to).contains('topics', ['chat']);
    const payload = JSON.stringify({ title, body: body.slice(0, 140), url: CHAT_URL, tag, kind: 'pickup' });
    await Promise.all((subs ?? []).map((s) => webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
      .catch((e: { statusCode?: number }) => { if (e.statusCode === 404 || e.statusCode === 410) return admin.from('push_subscriptions').delete().eq('endpoint', s.endpoint); })));
  } catch (e) { console.error('push', e); }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer /, '');
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return json({ error: 'Sign in first.' }, 401);
  const role = user.app_metadata?.r4_role;
  if (role !== 'kid' && role !== 'parent') return json({ error: 'Not for this account.' }, 403);
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: 'Bad request.' }, 400); }

  const [{ data: users }, { data: prof }] = await Promise.all([admin.auth.admin.listUsers({ perPage: 100 }), admin.from('profiles').select('id, username')]);
  const fam = (users?.users ?? []).filter((u) => ['parent', 'kid'].includes(u.app_metadata?.r4_role))
    .map((u) => ({ id: u.id, role: u.app_metadata!.r4_role as string, username: (prof ?? []).find((p) => p.id === u.id)?.username ?? '?' }));
  const name = (id: string) => fam.find((f) => f.id === id)?.username ?? 'someone';
  // Everything over an hour old ends now (a page closed mid-drive leaves nothing running).
  await admin.from('pickups').update({ status: 'ended', ended_at: new Date().toISOString() }).neq('status', 'ended').lt('started_at', new Date(Date.now() - MAX_MS).toISOString());
  // The kid's alerts; on a practice pickup, the parent's phone gets them instead.
  const tellKid = (p: { test?: boolean; kid: string; driver: string; id: string }, title: string, text: string) =>
    EdgeRuntime.waitUntil(p.test ? push([p.driver], `🧪 ${title}`, `${text} (${name(p.kid)} would get this)`, 'pickup-' + p.id) : push([p.kid], title, text, 'pickup-' + p.id));
  const card = async (author: string, text: string, id: string) => {
    const { data: m } = await admin.from('chat_messages').insert({ author, body: text, ref: { type: 'pickup', id } }).select('id').single();
    if (m) await admin.from('pickups').update({ msg: m.id }).eq('id', id);
  };

  // ---- a parent saves a pickup spot ----
  if (body.place && typeof body.place === 'object') {
    if (role !== 'parent') return json({ error: 'A parent adds pickup places.' }, 403);
    const p = body.place as { name?: string; emoji?: string; address?: string; at?: unknown };
    const nm = String(p.name ?? '').trim().slice(0, 40);
    if (!nm) return json({ error: 'Give the place a name.' }, 400);
    let at = pos(p.at), address: string | null = null;
    if (!at && p.address) {
      if (!KEY) return json({ error: 'Pickups need the Google key first.' }, 503);
      const g = await geocode(String(p.address).slice(0, 200));
      if (!g) return json({ error: "Couldn't find that address." }, 404);
      at = g; address = g.address;
    }
    if (!at) return json({ error: 'Type an address, or use where you are now.' }, 400);
    const { data, error } = await admin.from('family_places').insert({ name: nm, emoji: p.emoji ? String(p.emoji).slice(0, 8) : null, address, lat: at.lat, lng: at.lng, created_by: user.id }).select('*').single();
    if (error) return json({ error: 'Could not save the place.' }, 500);
    return json({ place: data });
  }

  // ---- a kid asks for a pickup ----
  if (body.ask && typeof body.ask === 'object') {
    const a = body.ask as { to?: string; place?: string; when?: string; test?: boolean; kid?: string };
    // Practice: a parent plays one of the kids asking them.
    const test = a.test === true && role === 'parent';
    const asker = test ? fam.find((f) => f.id === a.kid && f.role === 'kid') : fam.find((f) => f.id === user.id);
    if (!asker) return json({ error: 'Pick whose ask to try.' }, 400);
    const to = test ? fam.find((f) => f.id === user.id) : fam.find((f) => f.id === a.to && f.role === 'parent');
    if (!to) return json({ error: 'Ask a parent.' }, 400);
    const { data: pl } = await admin.from('family_places').select('*').eq('id', a.place ?? '').maybeSingle();
    if (!pl) return json({ error: 'Pick a place.' }, 400);
    if (test) await admin.from('pickups').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('driver', user.id).eq('test', true).neq('status', 'ended');
    else {
      const { data: open } = await admin.from('pickups').select('id').eq('kid', user.id).eq('test', false).neq('status', 'ended').limit(1);
      if (open?.length) return json({ error: 'There is already a pickup going for you.' }, 409);
    }
    const when = String(a.when ?? 'now').trim().slice(0, 40) || 'now';
    const { data: p, error } = await admin.from('pickups').insert({ driver: to.id, kid: asker.id, place: pl.id, place_name: pl.name, dest_lat: pl.lat, dest_lng: pl.lng, status: 'asked', ask_when: when, test }).select('*').single();
    if (error) { console.error(error); return json({ error: 'Could not ask just now.' }, 500); }
    if (!test) await card(user.id, `🙋 Can you pick me up? ${pl.name}, ${when}`, p.id);
    EdgeRuntime.waitUntil(push([to.id], `${test ? '🧪 ' : ''}🙋 ${asker.username} asks for a pickup`, `${pl.name}, ${when}`, 'pickup-' + p.id));
    return json({ pickup: p });
  }

  // ---- a parent sets off ----
  if (body.start && typeof body.start === 'object') {
    if (role !== 'parent') return json({ error: 'A parent starts a pickup.' }, 403);
    if (!KEY) return json({ error: 'Pickups need the Google key first.' }, 503);
    const s = body.start as { kid?: string; place?: string; address?: string; name?: string; from?: unknown; test?: boolean };
    const from = pos(s.from);
    if (!from) return json({ error: 'Your phone needs to say where you are to work out the minutes.' }, 400);
    let asked = null;
    if (typeof body.ask === 'string') {
      ({ data: asked } = await admin.from('pickups').select('*').eq('id', body.ask).eq('status', 'asked').maybeSingle());
      if (!asked || (asked.test && asked.driver !== user.id)) return json({ error: 'That ask is already taken care of.' }, 409);
    }
    const test = asked ? !!asked.test : s.test === true;
    const kid = fam.find((f) => f.id === (asked?.kid ?? s.kid) && f.role === 'kid');
    if (!kid) return json({ error: 'Pick who you are picking up.' }, 400);
    let dest: Pos, placeName: string, placeId: string | null = null;
    if (asked) { dest = { lat: asked.dest_lat, lng: asked.dest_lng }; placeName = asked.place_name; placeId = asked.place; }
    else if (s.place) {
      const { data: pl } = await admin.from('family_places').select('*').eq('id', s.place).maybeSingle();
      if (!pl) return json({ error: 'That place is gone.' }, 404);
      dest = { lat: pl.lat, lng: pl.lng }; placeName = pl.name; placeId = pl.id;
    } else if (s.address) {
      const g = await geocode(String(s.address).slice(0, 200));
      if (!g) return json({ error: "Couldn't find that address." }, 404);
      dest = g; placeName = String(s.name ?? '').trim().slice(0, 80) || g.address.split(',')[0];
    } else return json({ error: 'Pick where you are going.' }, 400);
    // One at a time per kid: a new one replaces what was going (a practice one, only your other practice).
    const old = admin.from('pickups').update({ status: 'ended', ended_at: new Date().toISOString() }).neq('status', 'ended').neq('id', asked?.id ?? '00000000-0000-0000-0000-000000000000');
    await (test ? old.eq('driver', user.id).eq('test', true) : old.eq('kid', kid.id).eq('test', false));
    let ro: Route;
    try { ro = await routes(from, dest); } catch (e) { console.error(e); return json({ error: "Couldn't work out the drive just now. Try again." }, 502); }
    const min = ro.min;
    const here = metres(from, dest) < HERE_M;
    const row = { driver: user.id, kid: kid.id, place: placeId, place_name: placeName, dest_lat: dest.lat, dest_lng: dest.lng, status: here ? 'here' : 'on_way',
      eta_at: new Date(Date.now() + min * 60_000).toISOString(), eta_first: min, started_at: new Date().toISOString(), updated_at: new Date().toISOString(), test };
    const { data: p, error } = asked ? await admin.from('pickups').update(row).eq('id', asked.id).select('*').single() : await admin.from('pickups').insert(row).select('*').single();
    if (error) { console.error(error); return json({ error: 'Could not start the pickup.' }, 500); }
    if (!asked && !test) await card(user.id, `🚗 On my way to pick up ${kid.username} · ${placeName}`, p.id);
    tellKid(p, `🚗 ${name(user.id)} is on the way`, `About ${min} min to ${placeName}`);
    if (!here) { try { await setRoute(p.id, ro, from); } catch (e) { console.error('route', e); } }
    const { data: q } = await admin.from('pickups').select('*').eq('id', p.id).single();
    return json({ pickup: q ?? p });
  }

  // ---- the rest act on one pickup ----
  const id = String(body.update ?? body.note ?? body.here ?? body.stop ?? '');
  const { data: p } = await admin.from('pickups').select('*').eq('id', id).maybeSingle();
  if (!p) return json({ error: 'That pickup is over.' }, 404);
  const now = new Date().toISOString();

  if (body.update != null) {
    if (p.driver !== user.id) return json({ error: 'Not your pickup.' }, 403);
    if (p.status !== 'on_way') return json({ pickup: p });
    const from = pos(body.from);
    if (!from) return json({ error: 'No position.' }, 400);
    if (Date.now() - Date.parse(p.updated_at) < MIN_GAP_MS) return json({ pickup: p });
    const dest = { lat: p.dest_lat, lng: p.dest_lng };
    if (metres(from, dest) < HERE_M) {
      const { data: q } = await admin.from('pickups').update({ status: 'here', eta_at: now, updated_at: now }).eq('id', p.id).select('*').single();
      tellKid(p, `🚗 ${name(p.driver)} is here`, `At ${p.place_name}`);
      return json({ pickup: q });
    }
    // How far along the route they are; off it by 200 m or more, a new route from here (once a minute at most).
    const { data: ln } = await admin.from('pickup_lines').select('pts, at').eq('pickup', p.id).maybeSingle();
    const on = ln?.pts?.length ? along(ln.pts as Pt[], from) : null;
    let min: number, done = on ? on.d : p.done_m;
    try {
      if (on && on.off > 200 && Date.now() - Date.parse(ln!.at) > 60_000 && p.route) {
        const ro = await routes(from, dest);
        min = ro.min; done = p.done_m ?? 0;
        await setRoute(p.id, ro, from, { done, route: p.route });
      } else min = await driveMin(from, dest);
    } catch (e) { console.error(e); return json({ pickup: p }); }
    const eta = Date.now() + min * 60_000;
    // Later than first said, from where they set off: traffic.
    const late = Math.max(0, Math.round((eta - (Date.parse(p.started_at) + (p.eta_first ?? min) * 60_000)) / 60_000));
    const told = { ...(p.told ?? {}) } as { five?: boolean; late?: number };
    const alerts: [string, string][] = [];
    if (min <= 5 && !told.five) { told.five = true; alerts.push([`🚗 ${name(p.driver)} is about ${min} min away`, `Get ready at ${p.place_name}`]); }
    else if (late >= 5 && late >= (told.late ?? 0) + 5) { told.late = late; alerts.push([`🚦 ${name(p.driver)} is running late`, `Traffic: now about ${min} min to ${p.place_name}`]); }
    const { data: q } = await admin.from('pickups').update({ eta_at: new Date(eta).toISOString(), late_min: late, told, updated_at: now, done_m: done }).eq('id', p.id).select('*').single();
    for (const [t, b] of alerts) tellKid(p, t, b);
    return json({ pickup: q });
  }

  if (body.note != null) {
    if (p.kid !== user.id && !(p.test && p.driver === user.id)) return json({ error: 'Only the one being picked up answers here.' }, 403);
    if (p.status === 'ended') return json({ error: 'That pickup is over.' }, 409);
    const t = String(body.text ?? '').trim().slice(0, 60);
    if (!t) return json({ error: 'Say something first.' }, 400);
    const { data: q } = await admin.from('pickups').update({ kid_note: t, updated_at: p.status === 'on_way' ? p.updated_at : now }).eq('id', p.id).select('*').single();
    EdgeRuntime.waitUntil(push([p.driver], `${p.test ? '🧪 ' : ''}${name(p.kid)}: ${t}`, `Pickup at ${p.place_name}`, 'pickup-note-' + p.id));
    return json({ pickup: q });
  }

  if (body.here != null) {
    if (p.driver !== user.id || p.status !== 'on_way') return json({ pickup: p });
    const { data: q } = await admin.from('pickups').update({ status: 'here', eta_at: now, updated_at: now }).eq('id', p.id).select('*').single();
    tellKid(p, `🚗 ${name(p.driver)} is here`, `At ${p.place_name}`);
    return json({ pickup: q });
  }

  if (body.stop != null) {
    if (![p.driver, p.kid].includes(user.id) && role !== 'parent') return json({ error: 'Not your pickup.' }, 403);
    const { data: q } = await admin.from('pickups').update({ status: 'ended', ended_at: now, updated_at: now }).eq('id', p.id).select('*').single();
    return json({ pickup: q });
  }
  return json({ error: 'Bad request.' }, 400);
});
