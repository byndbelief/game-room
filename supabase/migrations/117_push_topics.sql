-- 117: what each device wants alerts for. Settings has a switch per kind:
-- 'games' (your turn, game over, Chaos rounds), 'chat' (family chat and Claude's answers to you),
-- 'calls' (video calls). Tutor flags to parents and the admin's test push always go.
alter table public.push_subscriptions
  add column if not exists topics text[] not null default '{games,chat,calls}';
