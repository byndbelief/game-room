// Pickups: "On my way" in the family chat (124). A parent picking up a kid shares how many
// minutes away they are, never where they are. The parent's chat page sends its position here
// while the pickup is on; this asks Google for the drive time to the pickup place, keeps only
// the minutes (eta_at), and forgets the position. The kid sees a card counting down, with
// alerts when the parent sets off, is about 5 minutes away, is running late, and is here.
//
// POST { start: { kid, place? | address?, name?, from: { lat, lng } }, ask? }  a parent sets off (ask: the kid's ask it answers)
// POST { ask: { to, place, when? } }                                        a kid asks a parent for a pickup
// POST { update: id, from: { lat, lng } }                                   the driver's page, every ~30 s
// POST { note: id, text }                                                   the kid: Ready, 5 more min, where they'll be
// POST { here: id } / { stop: id }                                          the driver arrived / it's over (driver, kid or a parent)
// POST { place: { name, emoji?, address? | at: { lat, lng } } }             a parent saves a pickup spot
// -> { pickup } (the row) or { place } or { error }
// A pickup ends by itself an hour after it started. Positions are never written anywhere.
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
  const r = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': KEY!, 'X-Goog-FieldMask': 'routes.duration' },
    body: JSON.stringify({ origin: { location: { latLng: { latitude: a.lat, longitude: a.lng } } }, destination: { location: { latLng: { latitude: b.lat, longitude: b.lng } } },
      travelMode: 'DRIVE', routingPreference: 'TRAFFIC_AWARE' }),
  });
  if (!r.ok) throw new Error(`routes ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const s = parseInt(String((await r.json()).routes?.[0]?.duration ?? ''), 10);
  if (!Number.isFinite(s)) throw new Error('no route');
  return Math.max(1, Math.round(s / 60));
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
    const a = body.ask as { to?: string; place?: string; when?: string };
    const to = fam.find((f) => f.id === a.to && f.role === 'parent');
    if (!to) return json({ error: 'Ask a parent.' }, 400);
    const { data: pl } = await admin.from('family_places').select('*').eq('id', a.place ?? '').maybeSingle();
    if (!pl) return json({ error: 'Pick a place.' }, 400);
    const { data: open } = await admin.from('pickups').select('id').eq('kid', user.id).neq('status', 'ended').limit(1);
    if (open?.length) return json({ error: 'There is already a pickup going for you.' }, 409);
    const when = String(a.when ?? 'now').trim().slice(0, 40) || 'now';
    const { data: p, error } = await admin.from('pickups').insert({ driver: to.id, kid: user.id, place: pl.id, place_name: pl.name, dest_lat: pl.lat, dest_lng: pl.lng, status: 'asked', ask_when: when }).select('*').single();
    if (error) { console.error(error); return json({ error: 'Could not ask just now.' }, 500); }
    await card(user.id, `🙋 Can you pick me up? ${pl.name}, ${when}`, p.id);
    EdgeRuntime.waitUntil(push([to.id], `🙋 ${name(user.id)} asks for a pickup`, `${pl.name}, ${when}`, 'pickup-' + p.id));
    return json({ pickup: p });
  }

  // ---- a parent sets off ----
  if (body.start && typeof body.start === 'object') {
    if (role !== 'parent') return json({ error: 'A parent starts a pickup.' }, 403);
    if (!KEY) return json({ error: 'Pickups need the Google key first.' }, 503);
    const s = body.start as { kid?: string; place?: string; address?: string; name?: string; from?: unknown };
    const from = pos(s.from);
    if (!from) return json({ error: 'Your phone needs to say where you are to work out the minutes.' }, 400);
    let asked = null;
    if (typeof body.ask === 'string') {
      ({ data: asked } = await admin.from('pickups').select('*').eq('id', body.ask).eq('status', 'asked').maybeSingle());
      if (!asked) return json({ error: 'That ask is already taken care of.' }, 409);
    }
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
    // One at a time per kid: a new one replaces what was going.
    await admin.from('pickups').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('kid', kid.id).neq('status', 'ended').neq('id', asked?.id ?? '00000000-0000-0000-0000-000000000000');
    let min: number;
    try { min = await driveMin(from, dest); } catch (e) { console.error(e); return json({ error: "Couldn't work out the drive just now. Try again." }, 502); }
    const here = metres(from, dest) < HERE_M;
    const row = { driver: user.id, kid: kid.id, place: placeId, place_name: placeName, dest_lat: dest.lat, dest_lng: dest.lng, status: here ? 'here' : 'on_way',
      eta_at: new Date(Date.now() + min * 60_000).toISOString(), eta_first: min, started_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    const { data: p, error } = asked ? await admin.from('pickups').update(row).eq('id', asked.id).select('*').single() : await admin.from('pickups').insert(row).select('*').single();
    if (error) { console.error(error); return json({ error: 'Could not start the pickup.' }, 500); }
    if (!asked) await card(user.id, `🚗 On my way to pick up ${kid.username} · ${placeName}`, p.id);
    EdgeRuntime.waitUntil(push([kid.id], `🚗 ${name(user.id)} is on the way`, `About ${min} min to ${placeName}`, 'pickup-' + p.id));
    return json({ pickup: p });
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
      EdgeRuntime.waitUntil(push([p.kid], `🚗 ${name(p.driver)} is here`, `At ${p.place_name}`, 'pickup-' + p.id));
      return json({ pickup: q });
    }
    let min: number;
    try { min = await driveMin(from, dest); } catch (e) { console.error(e); return json({ pickup: p }); }
    const eta = Date.now() + min * 60_000;
    // Later than first said, from where they set off: traffic.
    const late = Math.max(0, Math.round((eta - (Date.parse(p.started_at) + (p.eta_first ?? min) * 60_000)) / 60_000));
    const told = { ...(p.told ?? {}) } as { five?: boolean; late?: number };
    const alerts: [string, string][] = [];
    if (min <= 5 && !told.five) { told.five = true; alerts.push([`🚗 ${name(p.driver)} is about ${min} min away`, `Get ready at ${p.place_name}`]); }
    else if (late >= 5 && late >= (told.late ?? 0) + 5) { told.late = late; alerts.push([`🚦 ${name(p.driver)} is running late`, `Traffic: now about ${min} min to ${p.place_name}`]); }
    const { data: q } = await admin.from('pickups').update({ eta_at: new Date(eta).toISOString(), late_min: late, told, updated_at: now }).eq('id', p.id).select('*').single();
    for (const [t, b] of alerts) EdgeRuntime.waitUntil(push([p.kid], t, b, 'pickup-' + p.id));
    return json({ pickup: q });
  }

  if (body.note != null) {
    if (p.kid !== user.id) return json({ error: 'Only the one being picked up answers here.' }, 403);
    if (p.status === 'ended') return json({ error: 'That pickup is over.' }, 409);
    const t = String(body.text ?? '').trim().slice(0, 60);
    if (!t) return json({ error: 'Say something first.' }, 400);
    const { data: q } = await admin.from('pickups').update({ kid_note: t, updated_at: p.status === 'on_way' ? p.updated_at : now }).eq('id', p.id).select('*').single();
    EdgeRuntime.waitUntil(push([p.driver], `${name(p.kid)}: ${t}`, `Pickup at ${p.place_name}`, 'pickup-note-' + p.id));
    return json({ pickup: q });
  }

  if (body.here != null) {
    if (p.driver !== user.id || p.status !== 'on_way') return json({ pickup: p });
    const { data: q } = await admin.from('pickups').update({ status: 'here', eta_at: now, updated_at: now }).eq('id', p.id).select('*').single();
    EdgeRuntime.waitUntil(push([p.kid], `🚗 ${name(p.driver)} is here`, `At ${p.place_name}`, 'pickup-' + p.id));
    return json({ pickup: q });
  }

  if (body.stop != null) {
    if (![p.driver, p.kid].includes(user.id) && role !== 'parent') return json({ error: 'Not your pickup.' }, 403);
    const { data: q } = await admin.from('pickups').update({ status: 'ended', ended_at: now, updated_at: now }).eq('id', p.id).select('*').single();
    return json({ pickup: q });
  }
  return json({ error: 'Bad request.' }, 400);
});
