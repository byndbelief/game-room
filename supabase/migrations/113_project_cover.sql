-- 113: a project's photo (its cover in the lists): a small square JPEG, snapped from the preview or
-- picked from the phone, made 256px on the page. Only a JPEG data URL, so it can only ever draw.
-- The maker sets it (their own row, 110); whoever can see the project sees it.
alter table public.projects add column if not exists cover text not null default '';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'projects_cover_jpeg') then
    alter table public.projects add constraint projects_cover_jpeg
      check (cover = '' or (cover like 'data:image/jpeg;base64,%' and length(cover) <= 120000));
  end if;
end $$;
