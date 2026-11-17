-- Additive editorial tools for Beautiful You by M.K.
-- Existing post text, slugs, dates and relationships remain untouched.

create table if not exists beautiful_you.post_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists beautiful_you.post_authors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  role_label text,
  bio text,
  avatar_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table beautiful_you.posts
  add column if not exists subtitle text,
  add column if not exists author_name text,
  add column if not exists author_id uuid references beautiful_you.post_authors(id) on delete set null,
  add column if not exists cover_gallery_item_id uuid references beautiful_you.gallery_items(id) on delete set null,
  add column if not exists related_album_ids uuid[] not null default '{}',
  add column if not exists tags text[] not null default '{}',
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists featured boolean not null default false,
  add column if not exists editorial_format text not null default 'standard',
  add column if not exists body_format text not null default 'plain';

alter table beautiful_you.posts
  drop constraint if exists posts_editorial_format_check,
  add constraint posts_editorial_format_check check (editorial_format in ('standard','evolve_story')),
  drop constraint if exists posts_body_format_check,
  add constraint posts_body_format_check check (body_format in ('plain','html'));

create table if not exists beautiful_you.post_slug_redirects (
  from_slug text primary key,
  to_slug text not null,
  created_at timestamptz not null default now(),
  constraint post_slug_redirects_not_self check (from_slug <> to_slug)
);

insert into beautiful_you.post_categories(name,slug,description,sort_order) values
  ('Beauty & Self-Care','beauty-self-care','Makeup, skincare, beauty routines and personal care.',10),
  ('Fashion & Lifestyle','fashion-lifestyle','Style, accessories, handbags and lifestyle features.',20),
  ('Women & Empowerment','women-empowerment','Confidence, development, mentorship and opportunity.',30),
  ('EVOLVE Stories','evolve-stories','Consent-aware EVOLVE programme stories and updates.',40),
  ('Relationships & Personal Growth','relationships-personal-growth','Self-worth, emotional wellness, boundaries and growth.',50),
  ('Events & Community Impact','events-community-impact','Workshops, outreach, partnerships and community events.',60),
  ('From MK''s Desk','from-mks-desk','Reflections and messages from BeautifulYou by M.K.',70)
on conflict (slug) do nothing;

alter table beautiful_you.post_categories enable row level security;
alter table beautiful_you.post_authors enable row level security;
alter table beautiful_you.post_slug_redirects enable row level security;

drop policy if exists "active editorial categories are public" on beautiful_you.post_categories;
create policy "active editorial categories are public" on beautiful_you.post_categories
  for select to anon, authenticated using (active = true);
drop policy if exists "active editorial authors are public" on beautiful_you.post_authors;
create policy "active editorial authors are public" on beautiful_you.post_authors
  for select to anon, authenticated using (active = true);
drop policy if exists "content managers manage editorial categories" on beautiful_you.post_categories;
create policy "content managers manage editorial categories" on beautiful_you.post_categories
  for all to authenticated
  using (beautiful_you.has_role(array['owner','admin','manager']))
  with check (beautiful_you.has_role(array['owner','admin','manager']));
drop policy if exists "content managers manage editorial authors" on beautiful_you.post_authors;
create policy "content managers manage editorial authors" on beautiful_you.post_authors
  for all to authenticated
  using (beautiful_you.has_role(array['owner','admin','manager']))
  with check (beautiful_you.has_role(array['owner','admin','manager']));

grant usage on schema beautiful_you to anon, authenticated, service_role;
grant select on beautiful_you.post_categories, beautiful_you.post_authors to anon, authenticated;
grant insert, update, delete on beautiful_you.post_categories, beautiful_you.post_authors to authenticated;
grant all on beautiful_you.post_categories, beautiful_you.post_authors, beautiful_you.post_slug_redirects to service_role;

create index if not exists posts_published_editorial_idx
  on beautiful_you.posts(status, published_at desc)
  where status = 'published';
create index if not exists posts_featured_published_idx
  on beautiful_you.posts(published_at desc)
  where status = 'published' and featured = true;
create index if not exists posts_category_published_idx
  on beautiful_you.posts(category, published_at desc)
  where status = 'published';
create index if not exists posts_author_id_idx on beautiful_you.posts(author_id);
create index if not exists posts_cover_gallery_item_id_idx on beautiful_you.posts(cover_gallery_item_id);
create index if not exists posts_tags_gin_idx on beautiful_you.posts using gin(tags);
create index if not exists post_authors_active_idx on beautiful_you.post_authors(active, name);

