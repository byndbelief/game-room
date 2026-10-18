// Admin tools behind r4box.com/admin.html, and r4box's health reports.
//
// From the admin page (a parent's sign-in):
//   POST { action: 'test_push', user } -> { sent, failed }   a test alert to everyone of that person's devices
// From the box (r4os, every few minutes; the public anon key plus the X-R4-Box secret):
//   POST { action: 'health', checks: [{ name, ok, detail }] } -> { ok }   replaces public.box_health
//
// Secrets: BOX_HEALTH_SECRET (also in ~/.config/r4os/box-health.secret on r4box),
// and the notify function's VAPID_*. SUPABASE_* are automatic.

import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import webpush from 'npm:web-push@3.6.7';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

// Compared in constant time, so the secret can't be guessed a character at a time.
function same(a: string, b: string) {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i];
  return d === 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  let body: { action?: string; user?: string; checks?: { name?: string; ok?: boolean; detail?: string }[] };
  try { body = await req.json(); } catch { return json({ error: 'Bad request.' }, 400); }

  if (body.action === 'health') {
    const secret = Deno.env.get('BOX_HEALTH_SECRET') ?? '';
    if (!secret || !same(req.headers.get('X-R4-Box') ?? '', secret)) return json({ error: 'forbidden' }, 403);
    const now = new Date().toISOString();
    const rows = (body.checks ?? []).slice(0, 40)
      .filter((c) => typeof c.name === 'string' && /^[\w .:-]{1,40}$/.test(c.name))
      .map((c) => ({ name: c.name!, ok: !!c.ok, detail: String(c.detail ?? '').slice(0, 300), checked_at: now }));
    if (!rows.length) return json({ error: 'no checks' }, 400);
    const { error } = await admin.from('box_health').upsert(rows);
    if (error) return json({ error: error.message }, 500);
    // Checks the box no longer reports go away.
    await admin.from('box_health').delete().lt('checked_at', now);
    return json({ ok: true });
  }

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer /, '');
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return json({ error: 'Sign in first.' }, 401);
  if (user.app_metadata?.r4_role !== 'parent') return json({ error: 'Parents only.' }, 403);

  if (body.action === 'test_push') {
    const { data: subs } = await admin.from('push_subscriptions').select('*').eq('user_id', String(body.user ?? ''));
    if (!subs?.length) return json({ sent: 0, failed: 0 });
    webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT') ?? 'mailto:alerts@example.com', Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!);
    const payload = JSON.stringify({ title: 'r4box', body: 'Test alert from the admin page. Alerts work on this device.', url: 'https://r4box.com/', tag: 'test' });
    let sent = 0, failed = 0;
    await Promise.all(subs.map((s) => webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
      .then(() => { sent++; })
      .catch(async (e: { statusCode?: number }) => {
        failed++;
        if (e.statusCode === 404 || e.statusCode === 410) await admin.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
      })));
    return json({ sent, failed });
  }
  return json({ error: 'Unknown action.' }, 400);
});
