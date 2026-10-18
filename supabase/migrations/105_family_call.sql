-- Family video calls (chat.html): browsers connect straight to each other (WebRTC);
-- the short handshake that sets up each connection, and who is in the call, go over
-- the private Realtime channel 'family-call', which only family accounts may join.
-- Private and public channels with the same name are separate, so a public
-- 'family-call' (anyone with the publishable key) never sees these messages.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'realtime' and tablename = 'messages' and policyname = 'family hears the call') then
    create policy "family hears the call" on realtime.messages for select to authenticated
      using ((select realtime.topic()) = 'family-call' and realtime.messages.extension in ('broadcast', 'presence') and (select public.r4_is_family()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'realtime' and tablename = 'messages' and policyname = 'family talks in the call') then
    create policy "family talks in the call" on realtime.messages for insert to authenticated
      with check ((select realtime.topic()) = 'family-call' and realtime.messages.extension in ('broadcast', 'presence') and (select public.r4_is_family()));
  end if;
end $$;
