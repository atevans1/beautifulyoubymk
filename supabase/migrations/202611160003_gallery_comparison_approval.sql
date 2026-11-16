alter table beautiful_you.gallery_items
  add column if not exists is_comparison boolean not null default false;
