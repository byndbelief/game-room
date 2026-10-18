// Link previews for trip items: when someone opens an item on r4box.com/trip.html,
// the page asks for its link's preview (title, description, image, site name)
// and it is saved on the item (trip_items.preview), so it is fetched only once.
// When the link gives no picture (or there is no link), places, food, things to
// do, venues and transport get the photo of their Wikipedia article instead.
// A fetch that got nothing is tried again after a day.
//
// POST { item } -> { preview }    a family member's sign-in
//
// The fetch is guarded, since it runs on Supabase's network: http(s) only, on
// the standard ports, never to a private, loopback or link-local address (each
// redirect and each resolved address is checked), 5 s and 600 KB at most, and
// only the page's <head> tags are read.

import { createClient } from 'npm:@supabase/supabase-js@2.117.2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

function privateV4(ip: string) {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some((n) => !(n >= 0 && n <= 255))) return true;
  return p[0] === 10 || p[0] === 127 || p[0] === 0 || (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31)
    || (p[0] === 192 && p[1] === 168) || (p[0] === 100 && p[1] >= 64 && p[1] <= 127) || p[0] >= 224;
}
function privateV6(ip: string) {
  const a = ip.toLowerCase();
  return a === '::1' || a === '::' || a.startsWith('fc') || a.startsWith('fd') || a.startsWith('fe80') || a.startsWith('::ffff:');
}
async function safeUrl(raw: string) {
  let u: URL;
  try { u = new URL(raw); } catch { return null; }
  if (!['http:', 'https:'].includes(u.protocol) || u.port || u.username || u.password) return null;
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (/^(localhost|.*\.local|.*\.internal|.*\.localhost)$/i.test(host)) return null;
  if (/^[\d.]+$/.test(host)) return privateV4(host) ? null : u;
  if (host.includes(':')) return privateV6(host) ? null : u;
  // A name: every address it resolves to must be public.
  try {
    const [v4, v6] = await Promise.all([Deno.resolveDns(host, 'A').catch(() => []), Deno.resolveDns(host, 'AAAA').catch(() => [])]);
    if (!v4.length && !v6.length) return null;
    if (v4.some(privateV4) || v6.some(privateV6)) return null;
  } catch { return null; }
  return u;
}

async function fetchHead(start: string) {
  // Some sites answer a plain request and refuse a browser-like one, others the reverse: try both.
  return (await fetchAs(start, PLAIN)) ?? (await fetchAs(start, BROWSER));
}
async function fetchAs(start: string, ua: string) {
  let url = start;
  for (let hop = 0; hop < 4; hop++) {
    const u = await safeUrl(url);
    if (!u) return null;
    const ac = new AbortController(), timer = setTimeout(() => ac.abort(), 5000);
    try {
      const r = await fetch(u, { redirect: 'manual', signal: ac.signal, headers: { 'User-Agent': ua, Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.9' } });
      if (r.status >= 300 && r.status < 400 && r.headers.get('location')) { url = new URL(r.headers.get('location')!, u).href; await r.body?.cancel(); continue; }
      if (!r.ok || !/text\/html/i.test(r.headers.get('content-type') ?? '')) { await r.body?.cancel(); return null; }
      // Read until </head> or 600 KB, whichever comes first.
      const reader = r.body!.getReader(), dec = new TextDecoder();
      let html = '';
      while (html.length < 600_000) {
        const { value, done } = await reader.read();
        if (done) break;
        html += dec.decode(value, { stream: true });
        if (/<\/head>/i.test(html)) break;
      }
      await reader.cancel().catch(() => {});
      return { html, base: u };
    } catch { return null; } finally { clearTimeout(timer); }
  }
  return null;
}

const PLAIN = 'Mozilla/5.0 (compatible; r4box-preview/1.0; +https://r4box.com)';
const BROWSER = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const RETRY_MS = 24 * 3600e3;

// The photo of the Wikipedia article that best matches the item, if it really is about it:
// the article's title must share a specific word with the item ("Teotihuacan", "pastor"),
// not just a generic one ("metro", "hotel", the city's name).
const GENERIC = new Set(['airport', 'hotel', 'hotels', 'trip', 'trips', 'tour', 'tours', 'line', 'metro', 'city', 'station', 'taxi', 'near', 'from',
  'with', 'night', 'best', 'stay', 'tickets', 'ticket', 'food', 'street', 'restaurant', 'train', 'options', 'center', 'centre', 'downtown', 'park',
  'area', 'local', 'guided', 'visit', 'early', 'late', 'cheap', 'budget', 'family', 'kids', 'route', 'transfer', 'uber', 'walk', 'walking', 'north',
  'south', 'east', 'west', 'york', 'united', 'states', 'mexico', 'resale', 'official']);
const words = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9]+/).filter((w) => w.length > 3);
async function wikiImage(query: string, item: string) {
  const want = new Set(words(item).filter((w) => !GENERIC.has(w)));
  if (!want.size) return null;
  const u = `https://en.wikipedia.org/w/api.php?action=query&format=json&generator=search&gsrlimit=3&gsrsearch=${encodeURIComponent(query)}&prop=pageimages&piprop=thumbnail&pithumbsize=900&origin=*`;
  try {
    const ac = new AbortController(), timer = setTimeout(() => ac.abort(), 5000);
    const r = await fetch(u, { signal: ac.signal, headers: { 'User-Agent': 'r4box-preview/1.0 (https://r4box.com; family trip planner)' } });
    clearTimeout(timer);
    const pages = Object.values((await r.json()).query?.pages ?? {}) as { title: string; index: number; thumbnail?: { source: string } }[];
    // Never an article about an event (news, disasters, crimes): a family trip page shows places and things.
    const EVENT = /\b(1[5-9]|20)\d\d\b|shooting|attack|bomb|crash|disaster|earthquake|massacre|murder|killing|death|riot|war\b|fire\b|flood|explosion|accident|scandal/i;
    // The candidate most about the item: the larger share of its title's words are the item's specific words.
    const share = (p: { title: string }) => { const t = words(p.title); return t.length ? t.filter((w) => want.has(w)).length / t.length : 0; };
    const hit = pages.filter((p) => p.thumbnail?.source && !EVENT.test(p.title) && share(p) > 0)
      .sort((a, b) => share(b) - share(a) || a.index - b.index)[0];
    return hit ? { image: hit.thumbnail!.source, credit: `Wikipedia: ${hit.title}`, credit_url: `https://en.wikipedia.org/wiki/${encodeURIComponent(hit.title.replace(/ /g, '_'))}` } : null;
  } catch { return null; }
}
const WIKI_TOPICS = ['food', 'activities', 'tickets', 'transport'];

const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
function meta(html: string, keys: string[]) {
  for (const k of keys) {
    const re = new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]*>`, 'i'), tag = html.match(re)?.[0];
    const v = tag?.match(/content=["']([^"']*)["']/i)?.[1];
    if (v) return decode(v).trim();
  }
  return '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer /, '');
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return json({ error: 'Sign in first.' }, 401);
  if (!['parent', 'kid'].includes(user.app_metadata?.r4_role)) return json({ error: 'Not for this account.' }, 403);
  let body: { item?: string };
  try { body = await req.json(); } catch { return json({ error: 'Bad request.' }, 400); }
  const { data: it } = await admin.from('trip_items').select('id, kind, topic, title, link, preview, trips(place)').eq('id', String(body.item ?? '')).maybeSingle();
  if (!it) return json({ error: 'Not found.' }, 404);
  const pv = it.preview, wikiOk = WIKI_TOPICS.includes(it.topic) || it.kind === 'plan';
  // Kept: a preview for this link that has a picture, or a title (once the Wikipedia
  // picture has been tried where it applies), or that was fetched within the day.
  const fresh = pv && Date.now() - Date.parse(pv.fetched_at ?? 0) < RETRY_MS;
  if (pv && (pv.url ?? null) === (it.link ?? null) && (pv.image || (pv.title && (!wikiOk || pv.wiki)) || fresh)) return json({ preview: pv });

  const page = it.link ? await fetchHead(it.link) : null;
  let preview: Record<string, string | null> = { url: it.link ?? null, fetched_at: new Date().toISOString() };
  if (page) {
    const title = meta(page.html, ['og:title', 'twitter:title']) || decode(page.html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? '').trim();
    let image = meta(page.html, ['og:image', 'og:image:url', 'twitter:image', 'twitter:image:src']);
    try { image = image ? new URL(image, page.base).href : ''; } catch { image = ''; }
    if (!/^https:\/\//.test(image)) image = '';   // only https pictures on an https page
    preview = { ...preview, title: title.slice(0, 200), description: meta(page.html, ['og:description', 'twitter:description', 'description']).slice(0, 400),
      image: image.slice(0, 800), site: meta(page.html, ['og:site_name']).slice(0, 80) || page.base.hostname.replace(/^www\./, '') };
  }
  if (!preview.image && wikiOk) {
    preview.wiki = 'tried';
    // "Tickets: Estadio GNP Seguros (resale)" -> "Estadio GNP Seguros"
    const q = String(it.title).replace(/^[A-Za-z ]{2,20}:\s*/, '').replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
    const place = String((it as { trips?: { place?: string } }).trips?.place ?? '').split(/[,+&]/)[0].trim();
    // From the most specific search to the loosest: the whole title, its main part
    // ("Tacos al pastor at El Vilsito" -> "Tacos al pastor"), its first two words.
    const main = q.split(/\s+(?:at|in|near|from|to|via|with|and)\s+|\s+[-–—|]\s+/i)[0];
    const two = q.split(' ').slice(0, 2).join(' ');
    const tries = [...new Set([q, main, two])].flatMap((x) => place ? [`${x} ${place}`, x] : [x]);
    let w = null;
    for (const t of tries) { w = await wikiImage(t, q); if (w) break; }
    if (w) preview = { ...preview, image: w.image, credit: w.credit, credit_url: w.credit_url };
  }
  // Saved even when nothing could be read, so the page doesn't ask again for a day.
  await admin.from('trip_items').update({ preview }).eq('id', it.id);
  return json({ preview });
});
