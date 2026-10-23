-- 119: the rest of the voice kit (project-voice, ElevenLabs).
-- project_audio (118) also keeps music: r4.music(description, seconds), a looping track.
-- project_voices: voices the family designed from a description ("a grumpy old robot"); anyone in
--   the family can use one by name in r4.say / r4.talk. voice_id is ElevenLabs' id for it, sample a
--   public clip of it (project-audio).
-- voice_log: what isn't a kept clip: 'read' (a chat message or journal entry read aloud: private, so
--   only counted, never kept), 'design' (a round of voice previews), 'talk' (a live conversation
--   with a project's character: ref is ElevenLabs' conversation id, detail its persona, then its
--   transcript once it ends). A kid's daily limits are counted from it; parents read every row.
-- voice_config: the function's own settings (the conversation agent's id). Service role only.
alter table public.project_audio drop constraint if exists project_audio_kind_check;
alter table public.project_audio add constraint project_audio_kind_check check (kind in ('say', 'sfx', 'music'));

create table if not exists public.project_voices (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 30),
  description text not null default '',
  voice_id text not null,
  sample text,
  created_at timestamptz not null default now()
);
create unique index if not exists project_voices_name on public.project_voices (lower(name));
alter table public.project_voices enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_voices' and policyname = 'family reads voices') then
    create policy "family reads voices" on public.project_voices for select to authenticated using ((select public.r4_is_family()));
  end if;
end $$;
revoke all on public.project_voices from anon;
grant select on public.project_voices to authenticated;   -- made and removed through project-voice (it frees ElevenLabs' slot too)

create table if not exists public.voice_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('design', 'talk', 'read')),
  ref text,
  detail text,
  at timestamptz not null default now()
);
create index if not exists voice_log_user on public.voice_log (user_id, at desc);
alter table public.voice_log enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'voice_log' and policyname = 'own voice log') then
    create policy "own voice log" on public.voice_log for select to authenticated using (user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'voice_log' and policyname = 'parents read voice log') then
    create policy "parents read voice log" on public.voice_log for select to authenticated using ((select public.r4_is_parent()));
  end if;
end $$;
revoke all on public.voice_log from anon;
grant select on public.voice_log to authenticated;

create table if not exists public.voice_config (key text primary key, value text not null);
alter table public.voice_config enable row level security;
revoke all on public.voice_config from anon, authenticated;
