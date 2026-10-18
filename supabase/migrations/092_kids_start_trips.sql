-- 092: anyone in the family starts a trip; its starter or a parent changes it;
-- only a parent removes one. Bookings stay parent-only (088).
drop policy if exists "parent adds trips" on public.trips;
drop policy if exists "parent changes trips" on public.trips;
drop policy if exists "family adds trips" on public.trips;
drop policy if exists "starter or parent changes trips" on public.trips;
create policy "family adds trips" on public.trips for insert to authenticated
  with check ((select public.r4_is_family()) and created_by = (select auth.uid()));
create policy "starter or parent changes trips" on public.trips for update to authenticated
  using ((select public.r4_is_family()) and (created_by = (select auth.uid()) or (select public.r4_is_parent())))
  with check ((select public.r4_is_family()) and (created_by = (select auth.uid()) or (select public.r4_is_parent())));
