-- 118: projects that talk and make sounds (ElevenLabs, through the project-voice Edge Function).
-- A project calls r4.say(text, voice) or r4.sfx(description) in its preview; the workbench asks
-- project-voice, which makes the clip once and keeps it in the public project-audio bucket under
-- a hash of what made it (say/<sha256>.mp3, sfx/<sha256>.mp3). The same line again is free.
-- project_audio: one row per clip, who made it first and what it says, so a parent can see what
-- was spoken; a kid's new clips a day are counted from it (cached ones don't count).
create table if not exists public.project_audio (
  id bigint generated always as identity primary key,
  hash text not null unique,
  kind text not null check (kind in ('say', 'sfx')),
  voice text,
  text text not null,
  user_id uuid references auth.users(id) on delete set null,
  at timestamptz not null default now()
);
create index if not exists project_audio_user on public.project_audio (user_id, at desc);
alter table public.project_audio enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_audio' and policyname = 'own clips') then
    create policy "own clips" on public.project_audio for select to authenticated using (user_id = (select auth.uid()));
  end if;
end $$;
revoke all on public.project_audio from anon;
grant select on public.project_audio to authenticated;

-- Public: a project's preview is a sandboxed frame with no sign-in, so it plays the clip by its URL.
-- Only the function (service role) writes here.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-audio', 'project-audio', true, 2097152, array['audio/mpeg'])
on conflict (id) do nothing;
