-- A practice pickup (pickup function): a parent tries "On my way" without the kid hearing about it.
-- Only that parent sees it (no card in the family chat), and the alerts the kid would get go to
-- the parent instead, marked 🧪.
alter table public.pickups add column test boolean not null default false;
drop policy "family reads pickups" on public.pickups;
create policy "family reads pickups" on public.pickups for select to authenticated
  using ((select public.r4_is_family()) and (not test or driver = (select auth.uid())));
