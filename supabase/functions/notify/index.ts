// Sends "your turn" phone/desktop alerts after a move.
//
// The web app calls this right after it creates a game, places ships or fires.
// It works out who needs to hear about the game's new state and sends each of
// their registered devices a Web Push message.
//
// Secrets it needs (Supabase > Edge Functions > Secrets):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (a mailto: address)
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided
// automatically.

import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import webpush from 'npm:web-push@3.6.7';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') ?? 'mailto:alerts@example.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  let gameId: string, kind = 'battleship';
  try {
    ({ game_id: gameId, kind = 'battleship' } = await req.json());
  } catch {
    return json({ error: 'Send {"game_id": "..."}' }, 400);
  }

  const url = Deno.env.get('SUPABASE_URL')!;
  // Read the game as the caller, so row-level security proves they're in it.
  const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: { user } } = await caller.auth.getUser();
  if (!user) return json({ error: 'Sign in first' }, 401);
  if (kind === 'golf' || kind === 'duel' || kind === 'cards' || kind === 'war') return otherGame(kind, gameId, user.id, caller);
  const { data: game } = await caller.from('games').select('*').eq('id', gameId).maybeSingle();
  if (!game) return json({ error: 'Game not found' }, 404);
  // A Chaos round just ended: whoever opens the next one hears about it in a single alert.
  const nudged = game.status === 'over' && game.gauntlet_id ? await gauntletNudge(game.gauntlet_id, user.id) : null;

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: profiles } = await admin.from('profiles').select('id, username').in('id', game.players);
  const name = (id: string) => profiles?.find((p) => p.id === id)?.username ?? 'Someone';
  const me = name(user.id);
  const others = (game.players as string[]).filter((id) => id !== user.id);

  let recipients: string[] = [], over = false;
  let title = 'Family Battleship';
  let body = '';
  if (game.status === 'over') {
    recipients = others; over = true;
    title = `${name(game.winner)} won!`;
    body = `The game is over. Tap to see every fleet.`;
  } else if (game.status === 'playing') {
    const next = game.players[game.turn];
    if (next !== user.id) recipients = [next];
    title = 'Your turn';
    body = game.move === 0 ? 'All ships are placed. You fire first.' : `${me} just fired. Your move.`;
  } else if (user.id === game.created_by) {
    // Setup: the creator has just started the game (before placing their own
    // ships), so invite everyone else. Later setup calls send nothing.
    const { data: placed } = await admin.from('fleets').select('player_id').eq('game_id', gameId);
    const done = new Set((placed ?? []).map((f) => f.player_id));
    if (!done.has(user.id)) recipients = others;
    title = 'New game';
    body = `${me} started a game with you. Place your ships.`;
  }
  if (over) return overAlert(recipients, nudged, title, body, `./#game=${gameId}`, gameId);
  return send(recipients, title, body, `./#game=${gameId}`, { tag: `game-${gameId}`, kind: 'turn' });
});

// Putt Post, Hilltop Duel, Chaos Cards and War: tell whoever is up next.
const TABLE: Record<string, string> = { golf: 'golf_games', duel: 'duel_games', cards: 'card_games', war: 'war_games', battleship: 'games' };
const LABEL: Record<string, string> = { golf: 'Putt Post', duel: 'Hilltop Duel', cards: 'Chaos Cards', war: 'War', battleship: 'Battleship' };
async function otherGame(kind: string, gameId: string, callerId: string, caller: ReturnType<typeof createClient>) {
  const { data: game } = await caller.from(TABLE[kind]).select('*').eq('id', gameId).maybeSingle();
  if (!game) return json({ error: 'Game not found' }, 404);
  const nudged = game.status === 'over' && game.gauntlet_id ? await gauntletNudge(game.gauntlet_id, callerId) : null;
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: profiles } = await admin.from('profiles').select('id, username').in('id', game.players);
  const name = (id: string) => profiles?.find((p) => p.id === id)?.username ?? 'Someone';
  const others = (game.players as string[]).filter((id) => id !== callerId);
  const label = LABEL[kind];
  let recipients: string[] = [], title = label, body = '';
  if (game.status === 'over') {
    recipients = others;
    title = `${label}: game over`;
    body = kind === 'duel' ? `${name(game.winner)} took the hill. Tap to see.` : kind === 'cards' ? `${name(game.winner)} emptied their hand. Tap to see.`
      : kind === 'war' ? `${name(game.winner)} won the war. Tap to see.` : 'The round is over. Tap for the final scores.';
    return overAlert(recipients, nudged, title, body, `./${kind}.html#game=${gameId}`, gameId);
  } else if (kind === 'war') {
    // Everyone still to flip this battle (robots flip by themselves), except whoever just flipped.
    recipients = (game.players as string[]).filter((id, s) => game.flips[s] === '' && id !== callerId);
    title = 'Your flip: War';
    body = `Battle ${game.battle}: ${name(callerId)} flipped. Your card is waiting.`;
  } else {
    const next = kind === 'golf' ? game.players[game.t % game.players.length] : game.players[game.turn];
    if (next !== callerId) recipients = [next];
    title = `Your turn: ${label}`;
    body = kind === 'golf' ? `Hole ${game.start + Math.floor(game.t / game.players.length) + 1} is waiting. ${name(callerId)} just played.`
      : kind === 'cards' ? `${name(callerId)} just played. Your cards.` : `${name(callerId)} just fired. Your shot.`;
  }
  return send(recipients, title, body, `./${kind}.html#game=${gameId}`, { tag: `game-${gameId}`, kind: 'turn' });
}

// Game over is news, not a call to play: a quiet alert (no sound, no buzz). In a Chaos round the people
// the next round's alert already reached hear nothing more, and the rest get it under the Chaos's tag,
// so a phone shows one alert for the round change, not two.
type Nudged = { gauntletId: string; to: string[]; over: boolean };
function overAlert(recipients: string[], nudged: Nudged | null, title: string, body: string, url: string, gameId: string) {
  if (!nudged) return send(recipients, title, body, url, { tag: `game-${gameId}`, kind: 'over', silent: true });
  if (nudged.over) return json({ sent: 0 });   // the Chaos's own "who's champion" alert went to everyone
  return send(recipients.filter((p) => !nudged.to.includes(p)), title, body, url, { tag: `chaos-${nudged.gauntletId}`, kind: 'over', silent: true });
}

// opt.kind tells the service worker which buzz to use (sw.js BUZZ); opt.silent makes it quiet.
async function send(recipients: string[], title: string, body: string, url: string, opt: { tag: string; kind: string; silent?: boolean }) {
  if (!recipients.length) return json({ sent: 0 });
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  // Only devices that keep game alerts on (Settings, 117).
  const { data: subs } = await admin.from('push_subscriptions').select('*').in('user_id', recipients).contains('topics', ['games']);
  const payload = JSON.stringify({ title, body, url, tag: opt.tag, kind: opt.kind, silent: !!opt.silent });
  let sent = 0;
  await Promise.all((subs ?? []).map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
      sent++;
    } catch (e) {
      // 404/410: the device unsubscribed or the browser dropped it.
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await admin.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
    }
  }));
  return json({ sent });
}

// A Chaos (Gauntlet) round just ended: tell whoever opens the next round, with who won this one.
// Returns who was told, so the round's game-over alert can leave them out.
async function gauntletNudge(gauntletId: string, callerId: string): Promise<Nudged | null> {
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: gt } = await admin.from('gauntlets').select('*').eq('id', gauntletId).maybeSingle();
  if (!gt) return null;
  const players = gt.players as string[];
  const { data: profiles } = await admin.from('profiles').select('id, username').in('id', players);
  const name = (id: string) => profiles?.find((p) => p.id === id)?.username ?? 'Someone';
  const tag = `chaos-${gauntletId}`;
  if (gt.status === 'over') {
    // One quiet alert for everyone: the round's own game-over alert is folded into it.
    const top = Math.max(...(gt.scores as number[])), champs = players.filter((_, i) => gt.scores[i] === top);
    const to = players.filter((p) => p !== callerId);
    await send(to, `🌀 ${champs.map(name).join(' & ')} won the Chaos!`, 'Tap to see the final scores.', './', { tag, kind: 'over', silent: true });
    return { gauntletId, to, over: true };
  }
  const kind = gt.current_kind as string;
  const { data: g } = await admin.from(TABLE[kind]).select('*').eq('id', gt.current_game).maybeSingle();
  if (!g) return null;
  // Battleship starts with everyone placing ships; the other games have a first player.
  const recipients = kind === 'battleship' ? (g.players as string[])
    : kind === 'war' ? (g.players as string[]).filter((_, s) => g.flips[s] === '')
    : [kind === 'golf' ? g.players[g.t % g.players.length] : g.players[g.turn]];
  const last = (gt.history as { kind: string; winners?: string[] }[] | null)?.at(-1);
  const won = last?.winners?.length ? `${last.winners.map(name).join(' & ')} took the ${LABEL[last.kind] ?? 'last'} round. ` : '';
  const url = kind === 'battleship' ? `./#game=${g.id}` : `./${kind}.html#game=${g.id}`;
  const to = recipients.filter((p) => p !== callerId);
  await send(to, `🌀 Chaos round ${gt.round} of ${gt.rounds}`, `${won}${LABEL[kind]} is up. Your move!`, url, { tag, kind: 'round' });
  return { gauntletId, to, over: false };
}
