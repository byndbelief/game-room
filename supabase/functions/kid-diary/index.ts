// The kids' diaries: every night, for each kid, what they asked Claude (tutor,
// trips, family chat) since the last build is filed into topics with events and
// written up as the day's entry, by Claude; finished games become events on a
// topic per game, counted straight from public.results. The topics grow the
// kid's world on r4box.com/diary.html (tutor = trees, chat = flowers,
// trip = constellations, game = animals).
//
// POST { action: 'nightly' }   from pg_cron, with the X-R4-Cron secret from Vault.
//   Answers at once and builds in the background.
//
// Secrets: ANTHROPIC_API_KEY. SUPABASE_* are automatic.

import { createClient } from 'npm:@supabase/supabase-js@2.117.2';

const MODEL = 'claude-sonnet-5-5';
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void };

const KINDS = ['spark', 'deepen', 'branch', 'pivot', 'merge', 'park', 'revive', 'ship'];
const STAGES = ['spark', 'explored', 'prototyped', 'shipped', 'parked'];
const GAMES: Record<string, string> = { golf: 'Putt Post', duel: 'Hilltop Duel', battleship: 'Battleship', gauntlet: 'The Gauntlet', cards: 'Chaos Cards', war: 'War' };
const FIRST_WINDOW_DAYS = 30;   // a kid's first build looks this far back
const clip = (s: unknown, n: number) => { const t = String(s ?? '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
// The same for an entry's text, keeping its paragraphs.
const cut = (s: unknown, n: number) => { const t = String(s ?? '').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
const localDay = (iso: string, tz: string) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));

const TOOL = {
  name: 'file_diary',
  description: "File the kid's diary for this period: the entry for each day with material, the topics touched, and one event per distinct development.",
  input_schema: {
    type: 'object', required: ['entries', 'topics', 'events'],
    properties: {
      entries: { type: 'array', items: { type: 'object', required: ['day', 'body'], properties: {
        day: { type: 'string', description: 'YYYY-MM-DD, a day that has material' },
        body: { type: 'string', description: '3 to 6 warm sentences to the kid ("you"), about what they explored that day' } } } },
      topics: { type: 'array', items: { type: 'object', required: ['slug', 'title', 'source'], properties: {
        slug: { type: 'string', description: 'existing slug to reuse, or a new one: lowercase-with-hyphens' },
        title: { type: 'string', description: 'short name, 1 to 4 words, e.g. "Volcanoes", "Quadratic equations"' },
        source: { type: 'string', enum: ['tutor', 'trip', 'chat'] },
        summary: { type: 'string', description: 'one or two sentences: what this topic is for them, so far' },
        stage: { type: 'string', enum: STAGES },
        parent: { type: 'string', description: 'slug of the topic this one grew out of, only for a genuine branch' },
        seed: { type: 'string', description: "only when this topic is one of the seeds they planted, now actually started: that seed's id from the list" } } } },
      events: { type: 'array', items: { type: 'object', required: ['slug', 'day', 'kind', 'effort'], properties: {
        slug: { type: 'string' },
        day: { type: 'string', description: 'YYYY-MM-DD, the day it happened' },
        kind: { type: 'string', enum: KINDS },
        summary: { type: 'string', description: 'one sentence' },
        effort: { type: 'integer', minimum: 1, maximum: 5, description: '1 = a quick question, 5 = a long, deep session' } } } },
    },
  },
};

function prompt(name: string) {
  return `You keep ${name}'s private diary in their family's home app. ${name} is a teenager (around 14 to 18). Only they read it.

From what they asked an AI tutor, a trip planner and the family chat (and the games they played), you file:
- topics: their lasting interests and projects. Reuse an existing topic whenever the material is about the same thing; make a new one only for something genuinely new. Tutor topics are subjects or questions they're learning about ("Photosynthesis", "Essay on The Giver"); trip topics are trips; chat topics are small curiosities, grouped into themes ("Baseball facts").
- events, one per distinct development: spark (a topic first appears), deepen (more of the same), branch (a new direction grows out of a topic: a new topic with parent set), pivot (the topic turns into something different), merge, park (they said they're done with it), revive (back after a while), ship (they finished something: handed in, built, solved).
- an entry for each day with material: 3 to 6 sentences, written to them ("you"), warm and specific about what they explored and figured out. Celebrate effort and curiosity; no lectures, no advice, no grades.

Rules:
- Never quote them word for word, and never include personal details (addresses, schools, people outside the family, passwords, health details).
- If something sounds upset, scary or very personal, keep it gentle and general ("you talked through something hard") or leave it out. Never record details of it.
- Games: mention them lightly in the entry if listed; their events are filed for you.
- Seeds: things they planted in their world as what they want to grow next. When the material shows they actually started on one, file its topic with that seed's id (a spark, and say so warmly in the entry: their seed sprouted). Don't file a seed they haven't started on.
- Keep everything kind and family friendly. If a day has nothing worth a diary line, leave it out.
Call file_diary exactly once.`;
}

type Kid = { id: string; username: string; tz: string };

async function buildKid(kid: Kid) {
  const now = new Date().toISOString();
  const { data: last } = await admin.from('kid_diary_runs').select('covered_to').eq('kid', kid.id).is('note', null).order('covered_to', { ascending: false }).limit(1).maybeSingle();
  const from = last?.covered_to ?? new Date(Date.now() - FIRST_WINDOW_DAYS * 86400e3).toISOString();

  const [{ data: tutor }, { data: trips }, { data: asks }, { data: games }, { data: topics }] = await Promise.all([
    admin.from('tutor_messages').select('chat, role, content, created_at, tutor_chats(title)').eq('kid', kid.id).gt('created_at', from).lte('created_at', now).order('id').limit(400),
    admin.from('trip_asks').select('text, reply, created_at, trips(name)').eq('asker', kid.id).gt('created_at', from).lte('created_at', now).order('created_at').limit(100),
    admin.from('chat_messages').select('id, body, created_at').eq('author', kid.id).eq('asks_claude', true).gt('created_at', from).lte('created_at', now).order('id').limit(100),
    admin.from('results').select('kind, winners, finished_at').contains('players', [kid.id]).gt('finished_at', from).lte('finished_at', now).limit(500),
    admin.from('kid_topics').select('id, slug, title, source, summary, stage').eq('kid', kid.id),
  ]);
  const known = new Map((topics ?? []).map((t) => [t.slug, t]));
  let items = 0;

  // Games: one topic per game, one event per day it was played. No model needed.
  const byDay = new Map<string, { kind: string; day: string; played: number; won: number }>();
  for (const g of games ?? []) {
    if (!GAMES[g.kind]) continue;
    const day = localDay(g.finished_at, kid.tz), k = `${g.kind}|${day}`;
    const r = byDay.get(k) ?? { kind: g.kind, day, played: 0, won: 0 };
    r.played++; if ((g.winners ?? []).includes(kid.id)) r.won++;
    byDay.set(k, r);
  }
  const played = [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));
  const gameLine = (r: { kind: string; played: number; won: number }) => `Played ${r.played} ${r.played === 1 ? 'game' : 'games'} of ${GAMES[r.kind]}${r.won ? `, won ${r.won}` : ''}.`;
  const gameLines = played.map((r) => `${r.day}: ${gameLine(r)}`);
  // Written only once Claude has answered: a failed build writes nothing, so the
  // next one (which starts from the same place) doesn't count these games twice.
  async function fileGames() {
  for (const r of played) {
    const slug = `game-${r.kind}`;
    let t = known.get(slug);
    const isNew = !t;
    if (!t) {
      const { data } = await admin.from('kid_topics').insert({ kid: kid.id, slug, title: GAMES[r.kind], source: 'game', created: r.day, stage: 'explored' }).select('id, slug, title, source, summary, stage').single();
      if (!data) continue;
      t = data; known.set(slug, data);
    }
    await admin.from('kid_events').insert({ kid: kid.id, topic: t!.id, day: r.day, kind: isNew ? 'spark' : 'deepen', summary: gameLine(r), effort: Math.min(5, r.played), meta: { played: r.played, won: r.won } });
    items++;
  }
  }

  // Everything they asked Claude, by source, with dates in their own timezone.
  const lines: string[] = [];
  let chat = '';
  for (const m of tutor ?? []) {
    if (m.chat !== chat) { chat = m.chat; lines.push(`\n[tutor chat "${clip((m as { tutor_chats?: { title?: string } }).tutor_chats?.title, 60)}"]`); }
    lines.push(`${localDay(m.created_at, kid.tz)} ${m.role === 'user' ? kid.username : 'tutor'}: ${clip(m.content, m.role === 'user' ? 400 : 200)}`);
  }
  for (const a of trips ?? []) lines.push(`\n[trip planner, trip "${clip((a as { trips?: { name?: string } }).trips?.name, 60)}"] ${localDay(a.created_at, kid.tz)} ${kid.username} asked: ${clip(a.text, 300)} / Claude: ${clip(a.reply, 200)}`);
  for (const c of asks ?? []) lines.push(`\n[family chat] ${localDay(c.created_at, kid.tz)} ${kid.username} asked @claude: ${clip(c.body, 300)}`);
  let material = lines.join('\n');
  if (material.length > 24000) material = material.slice(-24000);   // the most recent part

  if (material.trim()) {
    const existing = [...known.values()].filter((t) => t.source !== 'game')
      .map((t) => `- ${t.slug} (${t.source}, ${t.stage}): ${t.title}${t.summary ? ' — ' + clip(t.summary, 160) : ''}`).join('\n') || '(none yet)';
    // Seeds they planted (108): a topic that starts one makes it sprout, and the seed goes.
    const { data: seeds } = await admin.from('kid_seeds').select('id, title, kind').eq('kid', kid.id);
    const seedList = (seeds ?? []).map((s) => `- [${s.id.slice(0, 8)}] ${clip(s.title, 60)} (${s.kind === 'tutor' ? 'to learn' : s.kind === 'chat' ? 'a wonder' : 'somewhere to go'})`).join('\n');
    const user = `Topics so far:\n${existing}\n\n${seedList ? 'Seeds they planted (not started yet):\n' + seedList + '\n\n' : ''}${gameLines.length ? 'Games (already filed):\n' + gameLines.join('\n') + '\n\n' : ''}What ${kid.username} asked, ${localDay(from, kid.tz)} to ${localDay(now, kid.tz)}:\n${material}`;
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, system: prompt(kid.username), max_tokens: 4096, tools: [TOOL],
        messages: [{ role: 'user', content: user }] }),
    });
    if (!r.ok) throw new Error(`anthropic ${r.status}: ${(await r.text()).slice(0, 200)}`);
    // The model can't be forced to use the tool, so check that it did: no diary filed is a failed build.
    const out = (await r.json()).content?.find((b: { type: string; name?: string }) => b.type === 'tool_use' && b.name === 'file_diary')?.input;
    if (!out) throw new Error('Claude answered without filing the diary');
    await fileGames();
    const first = localDay(from, kid.tz), lastDay = localDay(now, kid.tz);
    const okDay = (d: unknown) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && d >= first && d <= lastDay;
    const okSlug = (s: unknown) => typeof s === 'string' && /^[a-z0-9][a-z0-9-]{0,60}$/.test(s);

    for (const t of (out.topics ?? []).slice(0, 30)) {
      if (!okSlug(t.slug) || !['tutor', 'trip', 'chat'].includes(t.source)) continue;
      const v: Record<string, unknown> = { title: clip(t.title, 80) || t.slug };
      if (t.summary) v.summary = clip(t.summary, 1000);
      if (STAGES.includes(t.stage)) v.stage = t.stage;
      if (t.parent && known.get(t.parent)) v.parent = known.get(t.parent)!.id;
      const had = known.get(t.slug);
      if (had && had.source !== 'game') {
        await admin.from('kid_topics').update(v).eq('id', had.id);
      } else if (!had) {
        const { data } = await admin.from('kid_topics').insert({ kid: kid.id, slug: t.slug, source: t.source, created: lastDay, ...v }).select('id, slug, title, source, summary, stage').single();
        if (data) known.set(t.slug, data);
      }
      const seed = typeof t.seed === 'string' && t.seed.length >= 6 ? (seeds ?? []).find((x) => x.id.startsWith(t.seed.toLowerCase().slice(0, 8))) : null;
      if (seed && known.get(t.slug)) await admin.from('kid_seeds').delete().eq('id', seed.id).eq('kid', kid.id);
    }
    // A new topic's created day is its first event's day.
    const firstDay = new Map<string, string>();
    for (const e of (out.events ?? []).slice(0, 80)) {
      const t = known.get(e.slug);
      if (!t || t.source === 'game' || !KINDS.includes(e.kind) || !okDay(e.day)) continue;
      await admin.from('kid_events').insert({ kid: kid.id, topic: t.id, day: e.day, kind: e.kind, summary: clip(e.summary, 500) || null, effort: Math.max(1, Math.min(5, Math.round(+e.effort || 1))) });
      if (!firstDay.has(t.id) || e.day < firstDay.get(t.id)!) firstDay.set(t.id, e.day);
      items++;
    }
    for (const [id, day] of firstDay) await admin.from('kid_topics').update({ created: day }).eq('id', id).gt('created', day);
    for (const en of (out.entries ?? []).slice(0, 40)) {
      if (!okDay(en.day) || !en.body) continue;
      const { data: had } = await admin.from('kid_entries').select('body').eq('kid', kid.id).eq('day', en.day).maybeSingle();
      const body = cut(had ? had.body + '\n\n' + en.body : en.body, 4000);
      await admin.from('kid_entries').upsert({ kid: kid.id, day: en.day, body });
    }
  } else if (gameLines.length) {
    await fileGames();
    // Only games: a short entry of their own, without the model.
    const days = [...new Set([...byDay.values()].map((r) => r.day))];
    for (const day of days) {
      const ls = [...byDay.values()].filter((r) => r.day === day).map((r) => `${r.played} of ${GAMES[r.kind]}${r.won ? ` (won ${r.won})` : ''}`);
      const { data: had } = await admin.from('kid_entries').select('body').eq('kid', kid.id).eq('day', day).maybeSingle();
      const line = `Game time: you played ${ls.join(', ')}.`;
      await admin.from('kid_entries').upsert({ kid: kid.id, day, body: cut(had ? had.body + '\n\n' + line : line, 4000) });
    }
  }
  await admin.from('kid_diary_runs').insert({ kid: kid.id, covered_to: now, items });
  return items;
}

async function buildAll() {
  const [{ data: users }, { data: prof }, { data: sets }] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 100 }),
    admin.from('profiles').select('id, username'),
    admin.from('tutor_settings').select('kid, tz'),
  ]);
  const kids: Kid[] = (users?.users ?? []).filter((u) => u.app_metadata?.r4_role === 'kid').map((u) => ({
    id: u.id, username: (prof ?? []).find((p) => p.id === u.id)?.username ?? 'you',
    tz: (sets ?? []).find((s) => s.kid === u.id)?.tz ?? 'America/New_York',
  }));
  await Promise.all(kids.map((k) => buildKid(k).then(
    (n) => console.log(`kid-diary ${k.username}: ${n} items`),
    async (e) => { console.error(`kid-diary ${k.username}`, e); await admin.from('kid_diary_runs').insert({ kid: k.id, covered_to: new Date(0).toISOString(), items: 0, note: clip(String(e), 300) }); })));
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  const { data: ok } = await admin.rpc('r4_diary_secret_ok', { p: req.headers.get('X-R4-Cron') ?? '' });
  if (!ok) return json({ error: 'forbidden' }, 403);
  if (!Deno.env.get('ANTHROPIC_API_KEY')) return json({ error: 'not set up' }, 503);
  EdgeRuntime.waitUntil(buildAll());
  return json({ ok: true, started: true }, 202);
});
