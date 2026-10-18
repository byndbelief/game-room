// The ICE servers for a family video call (chat.html): STUN always, and the TURN relay on
// r4box (coturn, r4os deploy/turn) with a login that works for 12 hours: username
// "<expiry>:<user id>", credential base64(HMAC-SHA1(TURN_SECRET, username)), the
// coturn use-auth-secret scheme. Only a family member's sign-in gets one.
//
// POST {} -> { iceServers, ttl }      without TURN_SECRET set: STUN only.
// Secrets: TURN_SECRET (the value install-turn.sh prints). SUPABASE_* are automatic.

import { createClient } from 'npm:@supabase/supabase-js@2.117.2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const TTL = 12 * 3600;
const STUN = { urls: ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer /, '');
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return json({ error: 'Sign in first.' }, 401);
  if (!['kid', 'parent'].includes(user.app_metadata?.r4_role)) return json({ error: 'Not for this account.' }, 403);
  const secret = Deno.env.get('TURN_SECRET');
  if (!secret) return json({ iceServers: [STUN], ttl: TTL });
  const username = `${Math.floor(Date.now() / 1000) + TTL}:${user.id}`;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(username)));
  const credential = btoa(String.fromCharCode(...mac));
  return json({
    iceServers: [STUN, {
      urls: ['turn:turn.r4box.com:3478?transport=udp', 'turn:turn.r4box.com:3478?transport=tcp', 'turns:turn.r4box.com:443?transport=tcp'],
      username, credential,
    }],
    ttl: TTL,
  });
});
