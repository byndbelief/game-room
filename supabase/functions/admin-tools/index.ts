// Admin tools behind r4box.com/admin.html, and r4box's health reports.
//
// From the admin page (a parent's sign-in):
//   POST { action: 'test_push', user } -> { sent, failed }   a test alert to everyone of that person's devices
// From the box (r4os, every few minutes; the public anon key plus the X-R4-Box secret):
//   POST { action: 'health', checks: [{ name, ok, detail }] } -> { ok }   replaces public.box_health
//   POST { action: 'status', apps: [{ app, line, hot, detail }] } -> { ok }   the home's app lines (box_status, 106)
//   POST { action: 'clearing', ideas: [...], events: [...] } -> { topics, events }   Dad's Clearing diary,
//        filed as his world (kid_topics / kid_events under the parent's id): no idea bodies, no entries
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
  let body: { action?: string; user?: string; checks?: { name?: string; ok?: boolean; detail?: string }[];
    apps?: { app?: string; line?: string; hot?: boolean; detail?: string }[];
    ideas?: { id?: string; title?: string; created?: string; stage?: string; parent?: string | null }[];
    events?: { idea?: string; date?: string; kind?: string; summary?: string; effort?: number }[] };
  try { body = await req.json(); } catch { return json({ error: 'Bad request.' }, 400); }

  // ---- from the box ----
  const fromBox = () => { const secret = Deno.env.get('BOX_HEALTH_SECRET') ?? ''; return !!secret && same(req.headers.get('X-R4-Box') ?? '', secret); };
  if (body.action === 'status') {
    if (!fromBox()) return json({ error: 'forbidden' }, 403);
    const APPS = ['os', 'term', 'code', 'browser', 'ntfy', 'diary'], now = new Date().toISOString();
    const rows = (body.apps ?? []).filter((a) => APPS.includes(a.app ?? '') && typeof a.line === 'string')
      .map((a) => ({ app: a.app!, line: a.line!.slice(0, 120), hot: !!a.hot, detail: a.detail ? String(a.detail).slice(0, 200) : null, at: now }));
    if (!rows.length) return json({ error: 'no apps' }, 400);
    const { error } = await admin.from('box_status').upsert(rows);
    if (error) return json({ error: error.message }, 500);
    await admin.from('box_status').delete().lt('at', now);
    return json({ ok: true });
  }
  if (body.action === 'clearing') {
    if (!fromBox()) return json({ error: 'forbidden' }, 403);
    // The one parent: Dad's world is his diary.
    const { data: users } = await admin.auth.admin.listUsers({ perPage: 100 });
    const parents = (users?.users ?? []).filter((u) => u.app_metadata?.r4_role === 'parent');
    if (parents.length !== 1) return json({ error: 'expected one parent' }, 409);
    const dad = parents[0].id;
    const STAGES = ['spark', 'explored', 'prototyped', 'shipped', 'parked'], KINDS = ['spark', 'deepen', 'branch', 'pivot', 'merge', 'park', 'revive', 'ship'];
    const day = (x: unknown) => (typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) ? x : null);
    const ideas = (body.ideas ?? []).slice(0, 500).filter((i) => typeof i.id === 'string' && /^[a-z0-9][a-z0-9-]{0,60}$/.test(i.id) && typeof i.title === 'string');
    if (!ideas.length) return json({ error: 'no ideas' }, 400);
    const { data: topics, error: e1 } = await admin.from('kid_topics').upsert(ideas.map((i) => ({
      kid: dad, slug: i.id!, title: i.title!.trim().slice(0, 80) || i.id!, source: 'tutor',
      stage: STAGES.includes(i.stage ?? '') ? i.stage : 'spark', created: day(i.created) ?? new Date().toISOString().slice(0, 10), parent: null,
    })), { onConflict: 'kid,slug' }).select('id, slug');
    if (e1) return json({ error: e1.message }, 500);
    const idOf = Object.fromEntries((topics ?? []).map((t) => [t.slug, t.id]));
    // Forks keep their parent; ideas gone from the diary go from his world.
    for (const i of ideas) if (i.parent && idOf[i.parent]) await admin.from('kid_topics').update({ parent: idOf[i.parent] }).eq('id', idOf[i.id!]);
    const gone = (await admin.from('kid_topics').select('id, slug').eq('kid', dad)).data?.filter((t) => !idOf[t.slug]).map((t) => t.id) ?? [];
    if (gone.length) await admin.from('kid_topics').delete().in('id', gone);
    // Events are immutable in the diary, but ids aren't kept here: replace them all.
    const evs = (body.events ?? []).slice(0, 5000).filter((e) => idOf[e.idea ?? ''] && day(e.date) && KINDS.includes(e.kind ?? ''))
      .map((e) => ({ kid: dad, topic: idOf[e.idea!], day: e.date!, kind: e.kind!, summary: e.summary ? String(e.summary).slice(0, 500) : null,
        effort: Number.isInteger(e.effort) && e.effort! >= 1 && e.effort! <= 5 ? e.effort : 1 }));
    await admin.from('kid_events').delete().eq('kid', dad);
    for (let k = 0; k < evs.length; k += 500) { const { error } = await admin.from('kid_events').insert(evs.slice(k, k + 500)); if (error) return json({ error: error.message }, 500); }
    return json({ topics: ideas.length, events: evs.length });
  }

  if (body.action === 'health') {
    if (!fromBox()) return json({ error: 'forbidden' }, 403);
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
    const payload = JSON.stringify({ title: 'r4box', body: 'Test alert from the admin page. Alerts work on this device.', url: 'https://r4box.com/', tag: 'test', kind: 'turn' });
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
