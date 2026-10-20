// Google Maps photos for a trip place (a hotel, a restaurant, something to do), shown on its
// card on r4box.com/trip.html. The item is matched to a Google place once (Text Search, ids
// only) and only that place id is kept (trip_items.gplace, 115), as Google's terms allow; the
// photos, rating and Maps link are fetched fresh each time the card opens and never stored.
// The page shows each photo's author, as Google asks.
//
// POST { item } -> { name, address, rating, ratings, maps, photos: [{ src, by, byUrl }] }
//                | { none: true } (no match) | { off: true } (no key set yet)
// Secrets: GOOGLE_MAPS_KEY (a Google Maps Platform key with Places API (New) on). SUPABASE_* are automatic.

import { createClient } from 'npm:@supabase/supabase-js@2.117.2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const PLACES = 'https://places.googleapis.com/v1';
const TOPICS = ['stay', 'food', 'activities', 'tickets', 'transport', 'other'];
const PHOTOS = 4;
const RETRY_NONE_MS = 14 * 864e5;   // a place Google didn't find is asked about again after two weeks

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer /, '');
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return json({ error: 'Sign in first.' }, 401);
  if (!['parent', 'kid'].includes(user.app_metadata?.r4_role)) return json({ error: 'Not for this account.' }, 403);
  const key = Deno.env.get('GOOGLE_MAPS_KEY');
  if (!key) return json({ off: true });

  let body: { item?: string };
  try { body = await req.json(); } catch { return json({ error: 'Bad request.' }, 400); }
  if (typeof body.item !== 'string') return json({ error: 'Which item?' }, 400);
  const { data: it } = await admin.from('trip_items').select('id, kind, topic, title, gplace, trips(place)').eq('id', body.item).maybeSingle();
  if (!it) return json({ error: 'That is no longer in the trip.' }, 404);
  if (it.kind === 'pack' || (it.topic && !TOPICS.includes(it.topic))) return json({ none: true });

  // Match once: the item's name in the trip's place. Ids only, the cheapest kind of search.
  let id: string | null = it.gplace?.id ?? null;
  if (!id) {
    if (it.gplace?.none && Date.now() - Date.parse(it.gplace.at) < RETRY_NONE_MS) return json({ none: true });
    const place = (it as { trips?: { place?: string } }).trips?.place ?? '';
    const name = String(it.title).replace(/^[A-Za-z ]+:\s*/, '').replace(/\s*\((pick|choose)[^)]*\)\s*$/i, '');
    const r = await fetch(`${PLACES}/places:searchText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'places.id' },
      body: JSON.stringify({ textQuery: place ? `${name}, ${place}` : name, maxResultCount: 1 }),
    });
    if (!r.ok) { console.error('search', r.status, (await r.text()).slice(0, 300)); return json({ error: 'Google Maps didn’t answer. Try again later.' }, 502); }
    id = (await r.json()).places?.[0]?.id ?? null;
    await admin.from('trip_items').update({ gplace: id ? { id, at: new Date().toISOString() } : { none: true, at: new Date().toISOString() } }).eq('id', it.id);
    if (!id) return json({ none: true });
  }

  // Fresh each time: the place's photos, rating and link.
  const d = await fetch(`${PLACES}/places/${encodeURIComponent(id)}`, {
    headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'displayName,formattedAddress,rating,userRatingCount,googleMapsUri,photos' },
  });
  if (!d.ok) {
    console.error('details', d.status, (await d.text()).slice(0, 300));
    if (d.status === 404) await admin.from('trip_items').update({ gplace: null }).eq('id', it.id);   // the place id went stale: match again next time
    return json({ error: 'Google Maps didn’t answer. Try again later.' }, 502);
  }
  const p = await d.json();
  const photos = (await Promise.all((p.photos ?? []).slice(0, PHOTOS).map(async (ph: { name: string; authorAttributions?: { displayName?: string; uri?: string }[] }) => {
    const m = await fetch(`${PLACES}/${ph.name}/media?maxWidthPx=900&skipHttpRedirect=true`, { headers: { 'X-Goog-Api-Key': key } });
    if (!m.ok) return null;
    const src = (await m.json()).photoUri;
    if (typeof src !== 'string' || !/^https:\/\//.test(src)) return null;
    const a = ph.authorAttributions?.[0];
    return { src, by: a?.displayName ?? null, byUrl: a?.uri && /^https:\/\//.test(a.uri) ? a.uri : null };
  }))).filter(Boolean);
  return json({ name: p.displayName?.text ?? null, address: p.formattedAddress ?? null, rating: p.rating ?? null, ratings: p.userRatingCount ?? null,
    maps: typeof p.googleMapsUri === 'string' && /^https:\/\//.test(p.googleMapsUri) ? p.googleMapsUri : null, photos });
});
