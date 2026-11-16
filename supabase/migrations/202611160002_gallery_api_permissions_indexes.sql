-- Keep private album story text out of browser-facing PostgREST responses.
grant usage on schema beautiful_you to anon, authenticated, service_role;
grant select on beautiful_you.gallery_categories to anon, authenticated;
revoke all on beautiful_you.gallery_albums from anon, authenticated;
grant select (id,title,slug,introduction,category_id,cover_item_id,event_date,location,featured,sort_order,status)
  on beautiful_you.gallery_albums to anon, authenticated;
grant insert, update, delete on beautiful_you.gallery_albums to authenticated;
grant select, insert, update, delete on beautiful_you.gallery_categories to authenticated;

create index if not exists gallery_albums_category_id_idx
  on beautiful_you.gallery_albums(category_id);
create index if not exists gallery_albums_cover_item_id_idx
  on beautiful_you.gallery_albums(cover_item_id);
create index if not exists gallery_albums_created_by_idx
  on beautiful_you.gallery_albums(created_by);
