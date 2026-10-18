-- 098: a video on a trip item (food and things to do, mostly): a YouTube link,
-- played on the item's page in YouTube's privacy-enhanced mode. Added by the
-- trip helper from what it finds, or pasted by the family.
alter table public.trip_items add column if not exists video text
  check (video is null or (length(video) <= 300 and video ~ '^https://(www\.|m\.)?(youtube\.com/(watch\?v=|shorts/|embed/)|youtu\.be/)[A-Za-z0-9_-]{11}'));
