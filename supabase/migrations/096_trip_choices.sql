-- 096: choices instead of votes. Some parts of a trip are one-or-the-other
-- decisions (dates, flights, stay, tickets, transport): the trip page's
-- Choices card lists each part's options, and a parent or the trip's starter
-- picks one by tapping it. A chosen idea is marked chosen (at most one per part
-- per trip); the trip helper builds on choices. Votes are no longer shown;
-- public.trip_votes is left as it is.

alter table public.trip_items add column if not exists chosen boolean not null default false;
create unique index if not exists trip_items_one_choice on public.trip_items (trip, topic) where chosen;

-- Only a parent or the trip's starter changes what is chosen, however the row is updated.
create or replace function public.trip_items_guard_choice() returns trigger
  language plpgsql security definer set search_path = '' as $$
begin
  if new.chosen is distinct from old.chosen and auth.uid() is not null
     and not (public.r4_is_parent() or exists (select 1 from public.trips t where t.id = new.trip and t.created_by = auth.uid())) then
    raise exception 'only a parent or the trip''s starter makes choices';
  end if;
  return new;
end $$;
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trip_items_guard_choice' and tgrelid = 'public.trip_items'::regclass) then
    create trigger trip_items_guard_choice before update on public.trip_items
      for each row execute function public.trip_items_guard_choice();
  end if;
end $$;

-- Choose an option (or un-choose it), in one step: the part's other option is released first.
create or replace function public.trip_choose(p_item uuid, p_on boolean) returns void
  language plpgsql security definer set search_path = '' as $$
declare it public.trip_items;
begin
  select * into it from public.trip_items where id = p_item;
  if it.id is null then raise exception 'no such item'; end if;
  if not (public.r4_is_parent() or exists (select 1 from public.trips t where t.id = it.trip and t.created_by = auth.uid())) then
    raise exception 'only a parent or the trip''s starter makes choices';
  end if;
  if it.topic is null then raise exception 'this idea is not one of the trip''s choices'; end if;
  if p_on then
    update public.trip_items set chosen = false, updated_at = now() where trip = it.trip and topic = it.topic and chosen and id <> it.id;
  end if;
  update public.trip_items set chosen = p_on, updated_at = now() where id = it.id;
end $$;
revoke execute on function public.trip_choose(uuid, boolean) from public, anon;
grant execute on function public.trip_choose(uuid, boolean) to authenticated;
