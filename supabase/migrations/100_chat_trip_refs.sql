-- 100: the family chat and the trip planner, connected. A chat message may
-- carry a reference to something in a trip (ref): a shared trip item, a trip
-- poll (voted on right in the chat), or what @claude just added to a trip.
-- Only the family-chat Edge Function writes messages, and it builds ref from the
-- database (the page sends only the type and id), so a ref can't claim a title
-- or picture the item doesn't have.
alter table public.chat_messages add column if not exists ref jsonb;
