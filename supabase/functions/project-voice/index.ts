// Voices and sound effects for projects (r4box.com/projects.html), made by ElevenLabs. A project
// calls r4.say(text, voice) or r4.sfx(description, seconds) in its sandboxed preview; the
// workbench passes the ask here and hands the clip's URL back to the frame, which plays it.
//
// POST { say: { text, voice? } }         -> { url, cached }   a line spoken (voices: VOICES below)
// POST { sfx: { text, seconds? } }       -> { url, cached }   a sound effect from a description
// POST {}                                -> { left, voices }  clips left today and the voice names
//
// Each clip is made once and kept in the public project-audio bucket under a hash of what made it
// (118), so the same line again costs nothing and doesn't count. Kids get CAP new clips a day;
// parents, no cap. What was spoken is logged in project_audio.
//
// Secrets: ELEVENLABS_API_KEY. SUPABASE_* are automatic.

import { createClient } from 'npm:@supabase/supabase-js@2.117.2';

const CAP = 40;
const TTS_MODEL = 'eleven_flash_v2_5';
// Friendly names for ElevenLabs' stock voices; a project picks one by name.
const VOICES: Record<string, string> = {
  narrator: 'JBFqnCBsd6RMkjVDRZzb',   // George: warm storyteller
  friendly: 'EXAVITQu4vr4xnSDxMaL',   // Sarah
  cheerful: 'cgSgspJ2msm6clMCkdW9',   // Jessica
  announcer: 'TX3LPaxmHKxFdv7VOQHJ',  // Liam: energetic
  deep: 'nPczCjzI2devNBz1zQrb',       // Brian
  calm: 'pFZP5JQG7iQjIQuC4Bku',       // Lily
  gravelly: 'N2lVS1w4EtoT3dr4eOWO',   // Callum
  playful: 'IKne3meq5aSn9XLyUdCD',    // Charlie
};
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

function local(tz: string) {
  const now = new Date();
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    .formatToParts(now).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  const offset = asUtc - Math.floor(now.getTime() / 1000) * 1000;
  return new Date(Date.UTC(+p.year, +p.month - 1, +p.day) - offset);
}
const sha = async (s: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))))
  .map((b) => b.toString(16).padStart(2, '0')).join('');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer /, '');
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return json({ error: 'Sign in first.' }, 401);
  const role = user.app_metadata?.r4_role;
  if (role !== 'kid' && role !== 'parent') return json({ error: 'Not for this account.' }, 403);
  let body: { say?: { text?: unknown; voice?: unknown }; sfx?: { text?: unknown; seconds?: unknown } };
  try { body = await req.json(); } catch { return json({ error: 'Bad request.' }, 400); }

  const { data: set } = await admin.from('tutor_settings').select('tz').eq('kid', user.id).maybeSingle();
  const since = local(set?.tz ?? 'America/New_York').toISOString();
  const { count } = await admin.from('project_audio').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('at', since);
  const leftOf = (n: number) => (role === 'parent' ? null : Math.max(0, CAP - n));
  const made = count ?? 0;

  const kind = body.say ? 'say' : body.sfx ? 'sfx' : null;
  if (!kind) return json({ left: leftOf(made), voices: Object.keys(VOICES) });
  const text = String((body.say ?? body.sfx)!.text ?? '').replace(/\s+/g, ' ').trim().slice(0, kind === 'say' ? 300 : 200);
  if (!text) return json({ error: kind === 'say' ? 'Nothing to say.' : 'Describe the sound.' }, 400);
  const vname = kind === 'say' ? (String(body.say!.voice ?? '').toLowerCase() in VOICES ? String(body.say!.voice).toLowerCase() : 'narrator') : null;
  const secs = kind === 'sfx' && Number.isFinite(+body.sfx!.seconds!) && body.sfx!.seconds != null ? Math.min(10, Math.max(0.5, +body.sfx!.seconds!)) : null;

  const hash = await sha(kind === 'say' ? `say|${TTS_MODEL}|${vname}|${text}` : `sfx|${secs ?? 'auto'}|${text}`);
  const path = `${kind}/${hash}.mp3`;
  const url = admin.storage.from('project-audio').getPublicUrl(path).data.publicUrl;
  const { data: have } = await admin.from('project_audio').select('id').eq('hash', hash).maybeSingle();
  if (have) return json({ url, cached: true, left: leftOf(made) });

  if (role === 'kid' && made >= CAP) return json({ error: 'That’s all the new sounds for today. Ones you’ve made still play. Back tomorrow!', left: 0 }, 429);
  const key = Deno.env.get('ELEVENLABS_API_KEY');
  if (!key) return json({ error: 'Voices are not set up.' }, 503);

  const r = kind === 'say'
    ? await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICES[vname!]}?output_format=mp3_44100_128`, {
        method: 'POST', headers: { 'xi-api-key': key, 'content-type': 'application/json', accept: 'audio/mpeg' },
        body: JSON.stringify({ text, model_id: TTS_MODEL }) })
    : await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', {
        method: 'POST', headers: { 'xi-api-key': key, 'content-type': 'application/json', accept: 'audio/mpeg' },
        body: JSON.stringify({ text, prompt_influence: 0.4, ...(secs ? { duration_seconds: secs } : {}) }) });
  if (!r.ok) { console.error('elevenlabs', r.status, (await r.text()).slice(0, 300)); return json({ error: 'Couldn’t make that sound just now. Try again.' }, 502); }
  const audio = new Uint8Array(await r.arrayBuffer());
  const up = await admin.storage.from('project-audio').upload(path, audio, { contentType: 'audio/mpeg', upsert: true, cacheControl: '31536000' });
  if (up.error) { console.error('storage', up.error.message); return json({ error: 'Couldn’t keep that sound. Try again.' }, 502); }
  await admin.from('project_audio').upsert({ hash, kind, voice: vname, text, user_id: user.id }, { onConflict: 'hash', ignoreDuplicates: true });
  return json({ url, cached: false, left: leftOf(made + 1) });
});
