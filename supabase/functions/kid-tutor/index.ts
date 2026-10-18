// The kids' tutor: Claude for phoenix_lord and obanai_rocks, from the input box
// on r4box.com. Text only, no tools: it cannot reach the box, files or anything
// else. Every message is also read by a small second model that decides whether
// a parent should see the chat (danger, distress, abuse, strangers...); only
// those chats are visible to a parent, who gets a push when one is flagged.
// Each kid has a daily cap and open hours (public.tutor_settings, set by a
// parent); the cap is shared with their trip-helper and family-chat @claude asks. Parents may use it too, without limits, to try it.
//
// POST { text, chat? }   -> { chat, title, reply, left }
// POST { action: 'status' } -> { open, left, cap, hours }
//
// Secrets (Supabase > Edge Functions > Secrets): ANTHROPIC_API_KEY, and the
// notify function's VAPID_* for the parent's push. SUPABASE_* are automatic.

import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import webpush from 'npm:web-push@3.6.7';

const MODEL = 'claude-sonnet-5-5';
const WATCHER = 'claude-haiku-4-5-20251001';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const tutorPrompt = (name: string) => `You are the tutor in a family's private home app, talking with ${name}, a teenager in the family (around 14 to 18).

How you help:
- Homework and school work: be a guide, not an answer key. Ask what they already know, give one hint or one step at a time, and let them do the thinking. Check their work and explain mistakes kindly. If they are truly stuck after trying, show a worked example of a similar problem rather than doing theirs.
- Curious questions (science, history, how things work, coding, art, careers...): answer well and with enthusiasm, then invite them to go one step further.
- Writing: help them plan, give feedback and suggest improvements; don't write their essays or assignments for them.
- Keep replies short and conversational (a few sentences, or a short list). Plain language. No long lectures.

Boundaries:
- Keep everything appropriate for a teenager. Decline sexual content, graphic violence, and help with anything dangerous or illegal, kindly and without preaching, and offer something useful instead.
- Don't ask for or encourage sharing personal details (address, school, passwords, photos). Never arrange to meet anyone.
- You are an AI. Never pretend to be a person.
- If they seem upset, scared, hurt, or mention self-harm, abuse, or someone making them uncomfortable: respond with warmth, take it seriously, encourage them to talk to their dad or another trusted adult, and if they might be in danger, tell them to call or text 988 (Suicide & Crisis Lifeline, US) or 911.
- If they ask who can see the chat: their chats are private, except that if something sounds like they might be in danger or need help, their dad will be shown that conversation.`;

const watcherPrompt = `You help a parent keep their teenagers safe while respecting their privacy. You read one message a teenager wrote to an AI tutor (with a little context) and decide whether the parent should see this conversation.

Flag ONLY for: self-harm or suicide; abuse, violence, or being threatened or hurt; contact from strangers, grooming, or plans to meet someone from online; sharing personal information with strangers; sexual content; drugs, alcohol, weapons, or dangerous stunts; serious bullying (either side); signs of serious distress or crisis.

Do NOT flag: ordinary homework, curiosity, mild frustration or stress about school, ordinary teen topics, jokes, games, mild language.

Answer with JSON only, no other text: {"flag": true or false, "reason": "a few words for the parent, without quoting the message"}`;

async function claude(model: string, system: string, messages: { role: string; content: string }[], maxTokens: number) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model, system, messages, max_tokens: maxTokens }),
  });
  if (!r.ok) throw new Error(`anthropic ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const d = await r.json();
  return (d.content ?? []).filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('').trim();
}

// The local clock in the kid's timezone: the hour now, and when today began.
function local(tz: string) {
  const now = new Date();
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    .formatToParts(now).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  const offset = asUtc - Math.floor(now.getTime() / 1000) * 1000;
  return { hour: +p.hour, dayStart: new Date(Date.UTC(+p.year, +p.month - 1, +p.day) - offset) };
}

async function pushParents(title: string, body: string) {
  try {
    webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT') ?? 'mailto:alerts@example.com', Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!);
    const { data } = await admin.auth.admin.listUsers({ perPage: 100 });
    const parents = (data?.users ?? []).filter((u) => u.app_metadata?.r4_role === 'parent').map((u) => u.id);
    if (!parents.length) return;
    const { data: subs } = await admin.from('push_subscriptions').select('*').in('user_id', parents);
    const payload = JSON.stringify({ title, body, url: 'https://r4box.com/#tutor', tag: 'tutor-flag' });
    await Promise.all((subs ?? []).map((s) =>
      webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload).catch(() => {})));
  } catch { /* the flag is saved either way */ }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer /, '');
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return json({ error: 'Sign in first.' }, 401);
  const role = user.app_metadata?.r4_role;
  if (role !== 'kid' && role !== 'parent') return json({ error: 'Not for this account.' }, 403);
  const { data: prof } = await admin.from('profiles').select('username').eq('id', user.id).maybeSingle();
  const name = prof?.username ?? 'there';

  const { data: set } = await admin.from('tutor_settings').select('*').eq('kid', user.id).maybeSingle();
  const s = { daily_cap: 40, start_hour: 7, end_hour: 21, tz: 'America/New_York', ...(set ?? {}) };
  const { hour, dayStart } = local(s.tz);
  const open = role === 'parent' || (hour >= s.start_hour && hour < s.end_hour);
  const since = dayStart.toISOString();
  const [{ count: a }, { count: b }, { count: c }] = await Promise.all([
    admin.from('tutor_messages').select('id', { count: 'exact', head: true }).eq('kid', user.id).eq('role', 'user').gte('created_at', since),
    admin.from('trip_asks').select('id', { count: 'exact', head: true }).eq('asker', user.id).gte('created_at', since),
    admin.from('chat_messages').select('id', { count: 'exact', head: true }).eq('author', user.id).eq('asks_claude', true).gte('created_at', since),
  ]);
  const left = role === 'parent' ? 999 : Math.max(0, s.daily_cap - (a ?? 0) - (b ?? 0) - (c ?? 0));
  const hours = `${s.start_hour}:00 to ${s.end_hour}:00`;

  let body: { text?: string; chat?: string; action?: string };
  try { body = await req.json(); } catch { return json({ error: 'Bad request.' }, 400); }
  if (body.action === 'status') return json({ open, left, cap: role === 'parent' ? null : s.daily_cap, hours, ready: !!Deno.env.get('ANTHROPIC_API_KEY') });
  if (!Deno.env.get('ANTHROPIC_API_KEY')) return json({ error: 'The tutor is not set up yet.' }, 503);
  if (!open) return json({ error: `The tutor is open ${hours}. See you then!`, open, left }, 429);
  if (left <= 0) return json({ error: "That's all the questions for today. Back tomorrow!", open, left }, 429);
  const text = String(body.text ?? '').trim().slice(0, 4000);
  if (!text) return json({ error: 'Type a question first.' }, 400);

  // The chat: theirs, or a new one named after the first question.
  let chat = body.chat, title = '';
  if (chat) {
    const { data: c } = await admin.from('tutor_chats').select('id, title, kid').eq('id', chat).maybeSingle();
    if (!c || c.kid !== user.id) return json({ error: 'Chat not found.' }, 404);
    title = c.title;
  } else {
    title = text.length > 48 ? text.slice(0, 46).trimEnd() + '…' : text;
    const { data: c, error } = await admin.from('tutor_chats').insert({ kid: user.id, title }).select('id').single();
    if (error) return json({ error: 'Could not start a chat.' }, 500);
    chat = c.id;
  }
  const { data: mine } = await admin.from('tutor_messages').insert({ chat, kid: user.id, role: 'user', content: text }).select('id').single();
  const { data: past } = await admin.from('tutor_messages').select('role, content').eq('chat', chat).order('id', { ascending: false }).limit(30);
  const history = (past ?? []).reverse();
  while (history.length && history[0].role !== 'user') history.shift();

  const context = history.slice(-5, -1).map((m) => `${m.role === 'user' ? 'Teen' : 'Tutor'}: ${m.content.slice(0, 500)}`).join('\n');
  const [reply, watch] = await Promise.allSettled([
    claude(MODEL, tutorPrompt(name), history, 1024),
    claude(WATCHER, watcherPrompt, [{ role: 'user', content: `${context ? 'Earlier in the chat:\n' + context + '\n\n' : ''}The teen's new message:\n${text}` }], 100),
  ]);
  if (reply.status === 'rejected') {
    await admin.from('tutor_messages').delete().eq('id', mine!.id);   // a failed try does not count
    console.error(reply.reason);
    return json({ error: 'The tutor could not answer just now. Try again in a minute.' }, 502);
  }
  let flag = { flag: false, reason: '' };
  if (watch.status === 'fulfilled') { try { flag = JSON.parse(watch.value.replace(/^```(json)?|```$/g, '')); } catch { /* unreadable: no flag */ } }
  await admin.from('tutor_messages').insert({ chat, kid: user.id, role: 'assistant', content: reply.value });
  const upd: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (flag.flag && role === 'kid') {
    Object.assign(upd, { flagged: true, flag_reason: String(flag.reason).slice(0, 200), flagged_at: new Date().toISOString() });
    await admin.from('tutor_messages').update({ flagged: true }).eq('id', mine!.id);
    await pushParents(`${name}'s tutor chat was flagged`, String(flag.reason).slice(0, 120) || 'Have a look when you can.');
  }
  await admin.from('tutor_chats').update(upd).eq('id', chat);
  return json({ chat, title, reply: reply.value, left: role === 'parent' ? 999 : left - 1 });
});
