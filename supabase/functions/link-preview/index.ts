// Link previews for trip items: when someone opens an item on r4box.com/trip.html,
// the page asks for its link's preview (title, description, image, site name)
// and it is saved on the item (trip_items.preview), so it is fetched only once.
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
  let url = start;
  for (let hop = 0; hop < 4; hop++) {
    const u = await safeUrl(url);
    if (!u) return null;
    const ac = new AbortController(), timer = setTimeout(() => ac.abort(), 5000);
    try {
      const r = await fetch(u, { redirect: 'manual', signal: ac.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; r4box-preview)', Accept: 'text/html' } });
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
  const { data: it } = await admin.from('trip_items').select('id, link, preview').eq('id', String(body.item ?? '')).maybeSingle();
  if (!it) return json({ error: 'Not found.' }, 404);
  if (it.preview && it.preview.url === it.link) return json({ preview: it.preview });
  if (!it.link) return json({ preview: null });

  const page = await fetchHead(it.link);
  let preview: Record<string, string> = { url: it.link };
  if (page) {
    const title = meta(page.html, ['og:title', 'twitter:title']) || decode(page.html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? '').trim();
    let image = meta(page.html, ['og:image', 'og:image:url', 'twitter:image', 'twitter:image:src']);
    try { image = image ? new URL(image, page.base).href : ''; } catch { image = ''; }
    if (!/^https:\/\//.test(image)) image = '';   // only https pictures on an https page
    preview = { url: it.link, title: title.slice(0, 200), description: meta(page.html, ['og:description', 'twitter:description', 'description']).slice(0, 400),
      image: image.slice(0, 800), site: meta(page.html, ['og:site_name']).slice(0, 80) || page.base.hostname.replace(/^www\./, '') };
  }
  // Saved even when nothing could be read, so the page doesn't ask again for this link.
  await admin.from('trip_items').update({ preview }).eq('id', it.id);
  return json({ preview });
});
