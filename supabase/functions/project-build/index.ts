// Claude on the workbench (r4box.com/projects.html): someone asks for a change to a project
// and Claude makes it. A kit project is built from a few settings (colours, speed, emoji,
// lines, panels…), so Claude returns new settings; when the settings can't do what they want
// (a lap counter on a timer, a second player…), Claude rebuilds it as real code, and from then
// on it's a code project: a project grows past its kit instead of hitting a wall. A code
// project is real files, so Claude returns the files it changed, or new ones for something
// completely different. The page turns any of these into a new version. Claude can also just
// answer ("explain main.js", "why is it broken?") without changing anything.
//
// POST { project, ask, files?, logs?, image?, html?, chat?, start? } -> { say, note?, change?, files?, name?, next?, brief?, wall?, left }
//   project: its id; only its maker or a helper may ask (projects.collab, 110)
//   files:   a code project's unsaved draft, if the person is editing (else its current version)
//   logs:    the last console lines from the preview, for "why is it broken?"
//   image:   a JPEG data URL: the full-screen preview with the person's red marks drawn on it
//   html:    a kit project's page as the kit builds it now, for rebuilding it as code
//   chat:    the ✦ Vibes chat so far ([{ me, t }], last 10), so Claude doesn't repeat itself
//   start:   a project just started from an idea (still its first version): Claude builds the whole idea;
//            a kid's first START_FREE of those a day don't use a build (logged as 'start', 120)
//   next:    two or three short things to ask next, for where the project is (the page's chips)
//   brief:   the project's brief, when Claude rewrote it (projects.brief, 112)
//   wall:    what they asked hit a limit of r4box, not their code: what r4box would need, in a few words
//            (the page offers a parent to send it to Claude on r4box). Claude is told what a project can't do.
// Claude also reads the project's commit notes and its brief (its own running note on the project:
// what it is, what's done, ideas and decisions, what's next), so any visit picks up where it left off.
// POST { project, explain: { file, src } } -> { help: [{ n, text, terms }], glossary: [{ term, means, example }], left }
//   💡 Help on the code bench: a short note for the lines worth explaining. A question, not a build.
//
// Kids get 8 builds a day (a build = Claude changed something), 3 free starts and 30 answers; parents, no cap.
// Each one is a project_builds row. What Claude writes always runs in a sandboxed frame.
//
// Code projects can talk, play sound effects and music, and hold a conversation (r4.say / r4.sfx / r4.music /
// r4.talk, made by project-voice); the prompt tells Claude how, with the family's own voices by name (project_voices, 119).
// When no voice fits (Mitsuri: high, sweet, squeaky), Claude names one to make with a description; it's designed
// and kept through project-voice as the person asking (their daily limits apply), first take, as a family voice.
//
// Secrets: ANTHROPIC_API_KEY. SUPABASE_* are automatic.

import { createClient } from 'npm:@supabase/supabase-js@2.117.2';

const MODEL = 'claude-sonnet-5-5';
const CAP = 8, ASK_CAP = 30, START_FREE = 3;
// What the ready-made voices sound like (keep in step with VOICE_ABOUT in project-voice).
const STOCK = 'narrator (man, older, British, warm storyteller), friendly (young woman, American, soft and kind), cheerful (young woman, American, lively and expressive), announcer (young man, American, energetic), deep (man, American, deep and smooth), calm (woman, British, warm and calm), gravelly (man, gravelly and intense), playful (young man, Australian, casual), bubbly (young woman, American, upbeat, quirky and bubbly), warm (woman, American, warm and friendly), bright (woman, British, clear and confident), grandpa (old man, American, wise and crackly), newsreader (man, British, crisp and formal)';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

// What each kit is built from, and the bounds the page's builder expects.
type Field = { t: 'str' | 'emoji' | 'color' | 'num' | 'int' | 'bool' | 'lines' | 'panels'; min?: number; max?: number; d: string };
const COMMON: Record<string, Field> = {
  title: { t: 'str', max: 40, d: 'the name shown at the top' },
  color: { t: 'color', d: 'the main colour, #rrggbb' },
  bg: { t: 'color', d: 'the background colour, #rrggbb' },
  size: { t: 'num', min: 0.6, max: 2, d: 'how big everything is (1 = normal)' },
  sound: { t: 'bool', d: 'sound on or off' },
};
const KITS: Record<string, { name: string; fields: Record<string, Field> }> = {
  catch: { name: 'Catch game (move to catch falling things)', fields: { ...COMMON, sprite: { t: 'emoji', d: 'the player, one emoji' }, item: { t: 'emoji', d: 'what falls, one emoji' }, speed: { t: 'num', min: 0.3, max: 4, d: 'how fast things fall (1 = normal)' } } },
  timer: { name: 'Timer app (a countdown with a big button)', fields: { ...COMMON, minutes: { t: 'int', min: 1, max: 120, d: 'minutes to count down' } } },
  page: { name: 'About-me page', fields: { ...COMMON, sprite: { t: 'emoji', d: 'the big emoji at the top' }, lines: { t: 'lines', max: 12, d: 'the lines on the page, each up to 80 characters' } } },
  comic: { name: 'Comic strip', fields: { ...COMMON, panels: { t: 'panels', max: 12, d: 'the panels in order, each { e: one emoji, t: its line up to 80 characters }' } } },
  drums: { name: 'Drum pad', fields: { ...COMMON, pads: { t: 'int', min: 2, max: 8, d: 'how many pads (an even number)' } } },
};

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
const oneEmoji = (s: unknown) => { const m = String(s ?? '').match(/\p{Extended_Pictographic}(️|‍\p{Extended_Pictographic}|\p{Emoji_Modifier})*/u); return m ? m[0] : null; };
function clean(kit: string, change: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, f] of Object.entries(KITS[kit].fields)) {
    if (!(k in change)) continue;
    const v = change[k];
    if (f.t === 'str' && typeof v === 'string' && v.trim()) out[k] = v.trim().slice(0, f.max ?? 80);
    if (f.t === 'emoji') { const e = oneEmoji(v); if (e) out[k] = e; }
    if (f.t === 'color' && typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)) out[k] = v;
    if (f.t === 'num' && Number.isFinite(+v!)) out[k] = +clamp(+v!, f.min!, f.max!).toFixed(2);
    if (f.t === 'int' && Number.isFinite(+v!)) { let n = Math.round(clamp(+v!, f.min!, f.max!)); if (k === 'pads') n = n % 2 ? n + 1 : n; out[k] = clamp(n, f.min!, f.max!); }
    if (f.t === 'bool' && typeof v === 'boolean') out[k] = v;
    if (f.t === 'lines' && Array.isArray(v)) out[k] = v.filter((x) => typeof x === 'string' && x.trim()).slice(0, f.max).map((x) => x.trim().slice(0, 80));
    if (f.t === 'panels' && Array.isArray(v)) out[k] = v.filter((x) => x && typeof x.t === 'string').slice(0, f.max).map((x) => ({ e: oneEmoji(x.e) ?? '✨', t: String(x.t).trim().slice(0, 80) }));
  }
  if (Array.isArray(out.lines) && !out.lines.length) delete out.lines;
  if (Array.isArray(out.panels) && !out.panels.length) delete out.panels;
  return out;
}
const FILE = /^[\w.-]{1,40}$/;
function cleanFiles(files: unknown) {
  if (!files || typeof files !== 'object') return null;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(files as Record<string, unknown>).slice(0, 8)) if (FILE.test(k) && typeof v === 'string') out[k] = v.slice(0, 60_000);
  return Object.keys(out).length ? out : null;
}

function local(tz: string) {
  const now = new Date();
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    .formatToParts(now).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  const offset = asUtc - Math.floor(now.getTime() / 1000) * 1000;
  return new Date(Date.UTC(+p.year, +p.month - 1, +p.day) - offset);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer /, '');
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return json({ error: 'Sign in first.' }, 401);
  const role = user.app_metadata?.r4_role;
  if (role !== 'kid' && role !== 'parent') return json({ error: 'Not for this account.' }, 403);
  let body: { project?: string; ask?: string; files?: unknown; logs?: unknown; image?: unknown; html?: unknown; chat?: unknown; start?: unknown; explain?: { file?: unknown; src?: unknown } };
  try { body = await req.json(); } catch { return json({ error: 'Bad request.' }, 400); }

  // How many builds are left today (also what the page asks with no project).
  const { data: set } = await admin.from('tutor_settings').select('tz').eq('kid', user.id).maybeSingle();
  const since = local(set?.tz ?? 'America/New_York').toISOString();
  const { data: today } = await admin.from('project_builds').select('kind').eq('user_id', user.id).gte('at', since);
  const builds = (today ?? []).filter((b) => b.kind === 'build').length, starts = (today ?? []).filter((b) => b.kind === 'start').length, asks = (today ?? []).length - builds - starts;
  const leftOf = (b: number) => (role === 'parent' ? null : Math.max(0, CAP - b));
  if (!body.project) return json({ left: leftOf(builds) });

  const { data: p } = await admin.from('projects').select('*').eq('id', String(body.project)).maybeSingle();
  // Reading a project (💡 Help) is for anyone who can see it; changing it, its maker and helpers.
  const mayChange = !!p && (p.owner === user.id || (p.collab ?? []).includes(user.id));
  if (!p || !(mayChange || (body.explain && p.published))) return json({ error: 'Remix it to change it.' }, 403);
  if (!Deno.env.get('ANTHROPIC_API_KEY')) return json({ error: 'Claude is not set up.' }, 503);
  if (role === 'kid' && asks >= ASK_CAP + CAP) return json({ say: 'That’s enough questions for today. Back tomorrow!', error: 'That’s enough questions for today. Back tomorrow!', left: leftOf(builds) }, body.explain ? 429 : 200);

  if (body.explain) {
    const file = String(body.explain.file ?? 'main.js').slice(0, 40), src = String(body.explain.src ?? '').slice(0, 30_000);
    const numbered = src.split('\n').map((l, i) => `${i + 1}| ${l}`).join('\n');
    const er = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 6000,
        system: `You help ${role === 'parent' ? 'a parent' : 'a teen'} learn to code by explaining their file line by line, like a friendly tutor sitting beside them. For each line or small group of lines that does something worth knowing, write one short plain-words note (under 20 words) on what it does and why; skip blank lines, closing brackets and lines that repeat an idea already explained. Put a group's note on its first line. In each note, list the key words a beginner might not know (exactly as they appear in the note, like "variable", "console", "event listener"), and give each key word once in the glossary: what it means in one or two plain sentences, and a tiny code example. Always answer by calling explain_lines.`,
        tools: [{ name: 'explain_lines', description: 'The notes, by line number.', input_schema: { type: 'object', required: ['lines', 'glossary'], properties: {
          lines: { type: 'array', items: { type: 'object', required: ['n', 'text'], properties: { n: { type: 'integer' }, text: { type: 'string' }, terms: { type: 'array', items: { type: 'string' }, description: 'key words in this note, as written in it' } } } },
          glossary: { type: 'array', items: { type: 'object', required: ['term', 'means'], properties: { term: { type: 'string' }, means: { type: 'string' }, example: { type: 'string', description: 'a tiny code example, a line or two' } } } } } } }],
        messages: [{ role: 'user', content: `${file}:\n${numbered}` }] }),
    });
    if (!er.ok) { console.error('anthropic', er.status, (await er.text()).slice(0, 300)); return json({ error: 'Claude couldn’t read it just now. Try again.' }, 502); }
    const ed = await er.json(), tu = (ed.content ?? []).find((b: { type: string }) => b.type === 'tool_use');
    const max = src.split('\n').length;
    // (forcing the tool isn't allowed on this model: if it answered in words, read "12: note" lines from them)
    const said = (ed.content ?? []).filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('\n');
    const fromText = [...said.matchAll(/^\s*(?:line\s*)?(\d+)\s*[:|.)-]\s*(.+)$/gim)].map((m) => ({ n: +m[1], text: m[2].trim() }));
    const help = (tu?.input?.lines ?? fromText).filter((x: { n?: number; text?: string }) => Number.isInteger(x?.n) && x.n! >= 1 && x.n! <= max && typeof x.text === 'string')
      .slice(0, 400).map((x: { n: number; text: string; terms?: unknown }) => ({ n: x.n, text: x.text.slice(0, 240),
        terms: Array.isArray(x.terms) ? x.terms.filter((t) => typeof t === 'string' && t.trim()).slice(0, 6).map((t: string) => t.trim().slice(0, 40)) : [] }));
    const glossary = (Array.isArray(tu?.input?.glossary) ? tu.input.glossary : []).filter((g: { term?: unknown; means?: unknown }) => typeof g?.term === 'string' && typeof g?.means === 'string')
      .slice(0, 80).map((g: { term: string; means: string; example?: unknown }) => ({ term: g.term.trim().slice(0, 40), means: g.means.slice(0, 400), example: typeof g.example === 'string' ? g.example.slice(0, 300) : '' }));
    await admin.from('project_builds').insert({ user_id: user.id, project: p.id, kind: 'ask' });
    return json({ help, glossary, left: leftOf(builds) });
  }
  if (!mayChange) return json({ error: 'Remix it to change it.' }, 403);
  const ask = String(body.ask ?? '').trim().slice(0, 2000);
  if (!ask) return json({ error: 'Say what to change.' }, 400);
  // a start: the first version of the person's own project, built whole; free for a kid's first few a day
  const start = !!body.start && p.owner === user.id && (p.versions ?? []).length === 1;
  const freeStart = start && (role === 'parent' || starts < START_FREE);
  const canBuild = role === 'parent' || freeStart || builds < CAP;

  const v = p.versions[p.cur] ?? p.versions[p.versions.length - 1];
  const code = p.kit === 'code' || !!v.files;   // a version with files: it already outgrew its kit
  const kit = KITS[p.kit];
  const files = code ? (cleanFiles(body.files) ?? v.files ?? {}) : null;
  const logs = Array.isArray(body.logs) ? body.logs.slice(-12).map((l) => (Array.isArray(l) ? `${l[0]}: ${String(l[1]).slice(0, 300)}` : '')).join('\n') : '';
  const img = typeof body.image === 'string' ? body.image.match(/^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]{100,2000000})$/) : null;
  const chat = Array.isArray(body.chat) ? body.chat.slice(-10).filter((m) => m && typeof m.t === 'string')
    .map((m) => `${m.me ? 'They' : 'You'}: ${String(m.t).slice(0, 800)}`).join('\n') : '';
  const history = (p.versions ?? []).slice(-20).map((x: { v: number; note?: string }) => `v${x.v}: ${String(x.note ?? '').slice(0, 100)}`).join('\n');
  const who = role === 'parent' ? 'a parent' : 'a kid (a teen, around 14 to 18)';
  const { data: fv } = await admin.from('project_voices').select('name, description').order('created_at').limit(30);
  const voiceNames = (fv ?? []).map((x: { name: string; description: string }) => `${x.name}${x.description ? ` (${x.description.slice(0, 80)})` : ''}`).join('; ');

  const kitHtml = !code && typeof body.html === 'string' ? body.html.slice(0, 60_000) : '';
  const NAME = { type: 'string', description: 'a new name, only if it became something different' };
  const VOICES_NEW = { type: 'array', maxItems: 2, description: 'voices to make for this project, only when none of the ready-made or family voices fit what they asked for (a pitch, age, accent or character). Each is made from its description and kept as a family voice; the code uses it by name.',
    items: { type: 'object', required: ['name', 'description'], properties: {
      name: { type: 'string', description: 'its name, short, like "Mitsuri"; the code passes this to r4.say / r4.talk' },
      description: { type: 'string', description: 'how it sounds, for a voice designer, 20 to 400 characters: gender, age, pitch, accent, tone, pace and character, like "A young woman with a high-pitched, sweet, airy voice, bright and a little squeaky, gushing and easily flustered"' } } } };
  const write = { name: 'write_files', description: 'Change the project: give every file you change, whole (not a diff). Only when they asked for a change.',
    input_schema: { type: 'object', required: ['note', 'files'], properties: {
      note: { type: 'string', description: 'what changed, a few words, like a commit message' },
      files: { type: 'object', description: 'file name -> its whole new content', additionalProperties: { type: 'string' } }, name: NAME, voices: VOICES_NEW } } };
  const rebuild = { name: 'rebuild_as_code', description: 'When the settings can\'t do what they ask: rebuild the project as real code that does everything it does now plus what they asked. It becomes a code project from then on.',
    input_schema: { type: 'object', required: ['note', 'files'], properties: {
      note: { type: 'string', description: 'what changed, a few words, like "Added a lap counter"' },
      files: { type: 'object', description: 'index.html (the page, without its own script), style.css and main.js (runs after the page)', additionalProperties: { type: 'string' } }, name: NAME, voices: VOICES_NEW } } };
  const tools = code ? [write] : [{ name: 'change_project', description: 'Change the project: give only the settings that change.',
        input_schema: { type: 'object', required: ['note', 'change'], properties: {
          note: { type: 'string', description: 'what changed, a few words, like "Faster, red background"' },
          change: { type: 'object', properties: Object.fromEntries(Object.entries(kit.fields).map(([k, f]) => [k,
            f.t === 'lines' ? { type: 'array', items: { type: 'string' }, description: f.d }
            : f.t === 'panels' ? { type: 'array', items: { type: 'object', properties: { e: { type: 'string' }, t: { type: 'string' } } }, description: f.d }
            : { type: f.t === 'bool' ? 'boolean' : f.t === 'num' || f.t === 'int' ? 'number' : 'string', description: f.d + (f.min != null ? ` (${f.min} to ${f.max})` : '') }])) } } } }, ...(kitHtml ? [rebuild] : [])];

  const system = `You help ${who} make things on their family's home app r4box. They're on the workbench of a project and asked you something. Reply in one or two short, friendly sentences, plain text.
${code
  ? `This is a code project: real files (index.html, style.css, main.js, maybe more) that run in a sandboxed preview. main.js runs after the page. To change it, call write_files with each changed file in full; keep their code and style, change only what's needed, and make sure it still runs. If they want it to become something completely different, that's fine: write the new files (and give it a new name). To explain or debug, just answer (point to the line). They're learning, so say what you changed and why in plain words.`
  : `It started as a "${kit.name}" made from a few settings. If the settings can do what they ask, call change_project with only the settings that change, within their bounds. If they can't (a new feature, a different layout, something completely different), don't say no: call rebuild_as_code with index.html, style.css and main.js that keep what it does now and add what they asked, and say it's now real code they can keep growing. The page as the kit builds it now is below; its script is inline, so move it into main.js. Everything runs in a sandboxed frame: no outside libraries, plain HTML, CSS and JavaScript, phone friendly.`}
It can talk, make sounds and music, and hold a conversation (all made by ElevenLabs, through the page): \`r4.say(text, voice)\` speaks a line, \`r4.sfx(description, seconds)\` plays a sound effect made from a short description like "cartoon boing" or "crowd cheering" (seconds optional, up to 10), and \`r4.music(description, seconds)\` plays a looping instrumental track like "chill 8-bit adventure" (5 to 60 seconds, default 30) and resolves with its Audio so you can \`.pause()\` it. say and sfx return a promise that resolves when the clip ends. Voices (pick by who's speaking; a voice's gender, age and accent matter): ${STOCK}${voiceNames ? `; and the family's own: ${voiceNames}` : ''}. When none of them fit what they want (a particular pitch, age, accent or a known character), make one: give it under voices in your tool call with a name and a full description of how it sounds, and use that name in the code (the app tells them it made the voice, so you needn't). Delivery tags in square brackets make a line expressive, like r4.say('[gasps] Oh no! [giggles] Just kidding!', 'bubbly'): [excited], [whispers], [laughs], [giggles], [sighs], [gasps], [shouting], [nervous]; use them for characters with big feelings. \`r4.talk({ persona, voice, first, onMessage, onMode })\` starts a live spoken conversation with a character (persona: who it is and how it acts, in a sentence or two; first: its opening line; onMessage gets { who: 'character' | 'me', text } for captions; onMode gets 'speaking' or 'listening', good for a mouth or glow); it resolves with every line when it ends, a talk bar on the page lets them hang up, and \`r4.hangup()\` ends it. Start it from a button they tap. Each new line, sound or track is made once and costs one of their daily new sounds, so keep the wording fixed (no scores or random numbers inside the text; say "Nice catch!" not "Score 12!"), call \`r4.load('sfx', text)\`, \`r4.load('music', text)\` or \`r4.load('say', text, voice)\` at the start for ones played often so they're instant, and only play sounds after the first tap. Use them when they ask for talking, a voice, narration, sound effects, music or a character to talk to; the tone() beep is still there for quick blips.
${start ? 'They just started this project from an idea, and its files are only the starter it began from. Build the whole idea they describe as a complete, polished, working thing in one go: write every file new (replace the starter entirely), make it feel finished and fun on a phone (touch controls first, keys too on a computer), give it a clear look with its own colours, and keep the code tidy and readable, with short comments, since they will learn from it and keep growing it. Keep it compact enough to write in one go: under about 350 lines in all, so it fits the time a build has. Say what you built and two or three things they could add next.\n' : ''}${img ? 'They marked up a picture of the preview: red lines and circles point at what they mean. Read the marks with their words.\n' : ''}Don't repeat what you already said in the chat; build on it.
What a project can and can't do on r4box (its preview is a sandboxed frame with no origin of its own; this is r4box's doing, not their code's):
- Works: canvas, WebGL, Web Audio, touch and keys; the microphone for sound (getUserMedia({ audio: … }) from a tap: the page listens for it with a bar saying so, and gives it an ordinary stream; ask for echoCancellation, noiseSuppression and autoGainControl false for music or pitch); localStorage and sessionStorage (r4box keeps the project's own on this device); fetch to web APIs that allow any origin (CORS *), WebSockets; scripts, ES modules, images and fonts from CDNs like cdn.jsdelivr.net (plain code is still best for a small thing).
- Doesn't work (it fails or does nothing): the camera; location; IndexedDB and cookies (beyond r4box's stand-in); the clipboard; fullscreen; pointer lock; the screen wake lock; navigator.share; downloads; window.open and pop-ups; links or forms to other pages (they stay put, with a note in the console); fetch to sites that don't allow other origins; speech recognition; notifications. alert, confirm and prompt work only on the workbench, nowhere else: draw your own dialogs.
Plan around these from the start. When what they ask needs one of them, don't keep rewriting their code or only polish the error message: say plainly, in one sentence, that r4box doesn't let projects do that yet (it's not their code), offer what can be done instead, and on its own line write WALL: and, in a few words for the grown-up who runs r4box, what r4box would need to allow (like "WALL: the camera in project previews"). Write WALL only for a limit of r4box, never for a bug in their code.
The project's brief is your own running note on it, so you pick up where you left off next time. When this exchange adds something worth remembering (what it is or is becoming, a feature done, an idea or decision, what they want next), or there's no brief yet, rewrite the whole brief inside <brief></brief>: a few short lines, under 120 words, plain words, about the project (never about the person). Otherwise leave it out.
Then, on its own last line, write NEXT: and two or three short things they could ask you next (each under 6 words, separated by |), right for where this project is now: a new one might want to understand it or make it theirs; a broken one, a fix; a working one, the next feature or polish that fits what it is. Like: NEXT: add a score | make it faster
Write all of that (your words, any brief, any WALL line, the NEXT line) before you call a tool.
Keep everything family friendly; decline anything unkind, scary or inappropriate, kindly. You can only change this project.${canBuild ? '' : ' They have no builds left today: answer, but do not change anything; say they can use the parts shelf, or ask again tomorrow.'}`;
  const content = `The project "${p.name}", ${p.versions.length} version${p.versions.length === 1 ? '' : 's'} so far:\n${history}\n\nThe brief: ${p.brief ? `\n${String(p.brief).slice(0, 1500)}` : '(none yet)'}\n${chat ? `\nThe chat so far:\n${chat}\n` : ''}\n` + (code
    ? `The files:\n${Object.entries(files!).map(([k, s]) => `--- ${k}\n${s}`).join('\n')}\n${logs ? `\nThe preview's console:\n${logs}\n` : ''}\nThey ask: ${ask}`
    : `The project "${p.name}" now: ${JSON.stringify(v.params)}${kitHtml ? `\n\nIts page as the kit builds it:\n${kitHtml}` : ''}\n\nThey ask: ${ask}`);

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, system, max_tokens: code || kitHtml ? 12000 : 1200, messages: [{ role: 'user', content: img ? [{ type: 'image', source: { type: 'base64', media_type: 'image/' + img[1], data: img[2] } }, { type: 'text', text: content }] : content }], tools: canBuild ? tools : [] }),
  });
  if (!r.ok) { console.error('anthropic', r.status, (await r.text()).slice(0, 300)); return json({ error: 'Claude couldn’t answer just now. Try again.' }, 502); }
  const d = await r.json();
  const said = (d.content ?? []).filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('').trim();
  const bm = said.match(/<brief>([\s\S]*?)<\/brief>/i);
  const brief = bm ? bm[1].trim().slice(0, 1200) : '';
  // WALL: a limit of r4box itself (not their code), in a few words for the parent who runs it; the page offers to send it there
  const wm = said.match(/^\s*WALL:\s*(.+)$/im);
  const wall = wm ? wm[1].trim().slice(0, 200) : '';
  const words = said.replace(/\s*<brief>[\s\S]*?(<\/brief>|$)\s*/gi, '\n').replace(/^\s*WALL:.*$/gim, '').trim();
  const nm = words.match(/\n?\s*NEXT:\s*(.+)\s*$/i);
  const say = (nm ? words.slice(0, nm.index) : words).trim();
  const next = nm ? nm[1].split('|').map((x) => x.trim().replace(/^["'`]+|["'`.]+$/g, '')).filter((x) => x && x.length <= 40).slice(0, 3) : [];
  const use = (d.content ?? []).find((b: { type: string; name?: string }) => b.type === 'tool_use');
  let change: Record<string, unknown> | null = null, newFiles: Record<string, string> | null = null, note = '', name = '';
  if (use && canBuild) {
    note = String(use.input?.note ?? '').trim().slice(0, 80);
    name = typeof use.input?.name === 'string' ? use.input.name.trim().slice(0, 60) : '';
    if (use.name === 'write_files') { const f = cleanFiles(use.input?.files); if (f) newFiles = { ...files!, ...f }; }
    else if (use.name === 'rebuild_as_code') { const f = cleanFiles(use.input?.files); if (f && f['index.html'] != null) newFiles = { 'style.css': '', 'main.js': '', ...f }; }
    else { const c = clean(p.kit, use.input?.change ?? {}); if (Object.keys(c).length) change = c; }
  }
  const built = !!(change || newFiles);
  // New voices it asked for: designed and kept through project-voice as this person (their limits apply), first take.
  const made: string[] = [], missed: string[] = [];
  if (newFiles && Array.isArray(use?.input?.voices)) {
    const pv = (q: unknown) => fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/project-voice`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(q) }).then((x) => x.json()).catch(() => ({ error: 'Voices aren’t answering just now.' }));
    const have = new Set((fv ?? []).map((x: { name: string }) => x.name.toLowerCase()));
    for (const nv of use.input.voices.slice(0, 2)) {
      const vn = String(nv?.name ?? '').trim().slice(0, 30), vd = String(nv?.description ?? '').trim().slice(0, 400);
      if (!vn || vd.length < 20 || have.has(vn.toLowerCase())) continue;
      const dz = await pv({ design: { text: vd } });
      const t = dz.previews?.[0];
      const kz = t ? await pv({ keep: { id: t.id, audio: t.audio, name: vn, text: vd } }) : dz;
      if (kz.voice) made.push(vn); else missed.push(`${vn} (${kz.error ?? 'it didn’t come out'})`);
    }
  }
  const voiceNote = (made.length ? ` I made the voice${made.length > 1 ? 's' : ''} ${made.join(' and ')}: hear or remake ${made.length > 1 ? 'them' : 'it'} in Settings › Voices.` : '')
    + (missed.length ? ` I couldn’t make the voice ${missed.join(', ')}, so it’ll use the narrator until there is one by that name.` : '');
  if (brief && brief !== p.brief) await admin.from('projects').update({ brief }).eq('id', p.id);
  await admin.from('project_builds').insert({ user_id: user.id, project: p.id, kind: built ? (freeStart ? 'start' : 'build') : 'ask' });
  return json({ say: (say || (built ? `Done: ${note || 'changed it'}.` : 'Hmm, I’m not sure how to do that one. Try saying it another way?')) + voiceNote,
    note: built ? (note || 'Claude’s change') : undefined, change: change ?? undefined, files: newFiles ?? undefined, name: newFiles && name ? name : undefined, next: next.length ? next : undefined, wall: wall || undefined, brief: brief && brief !== p.brief ? brief : undefined, left: leftOf(builds + (built && !freeStart ? 1 : 0)) });
});
