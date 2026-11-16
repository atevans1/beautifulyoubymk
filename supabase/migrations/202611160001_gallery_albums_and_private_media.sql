-- Additive gallery upgrade. Existing gallery rows, URLs, and the legacy public
-- bucket are deliberately preserved. New uploads use a separate private bucket.
create table if not exists beautiful_you.gallery_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists beautiful_you.gallery_albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  introduction text,
  story text,
  story_consent_confirmed boolean not null default false,
  anonymous_story boolean not null default false,
  category_id uuid references beautiful_you.gallery_categories(id) on delete set null,
  cover_item_id uuid,
  event_date date,
  location text,
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  sort_order integer not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table beautiful_you.gallery_items
  add column if not exists album_id uuid references beautiful_you.gallery_albums(id) on delete set null,
  add column if not exists alt_text text,
  add column if not exists photographer_credit text,
  add column if not exists featured boolean not null default false,
  add column if not exists comparison_approved boolean not null default false,
  add column if not exists event_date date,
  add column if not exists storage_path text,
  add column if not exists thumbnail_path text;

alter table beautiful_you.gallery_albums
  drop constraint if exists gallery_albums_cover_item_id_fkey;
alter table beautiful_you.gallery_albums
  add constraint gallery_albums_cover_item_id_fkey
  foreign key (cover_item_id) references beautiful_you.gallery_items(id) on delete set null;

insert into beautiful_you.gallery_categories(name,slug,description,sort_order) values
  ('Beauty & Glamour','beauty-glamour','Makeup, styling, bridal beauty, and signature looks.',10),
  ('EVOLVE','evolve','Approved programme moments and empowerment journeys.',20),
  ('Fashion & Collections','fashion-collections','Products, accessories, and fashion showcases.',30),
  ('Events & Community Impact','events-community-impact','Workshops, outreach, partnerships, and community events.',40)
on conflict (slug) do nothing;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('beautiful-you-gallery-private','beautiful-you-gallery-private',false,10485760,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do nothing;

alter table beautiful_you.gallery_categories enable row level security;
alter table beautiful_you.gallery_albums enable row level security;

drop policy if exists "active gallery managers manage categories" on beautiful_you.gallery_categories;
create policy "active gallery managers manage categories" on beautiful_you.gallery_categories
  for all to authenticated
  using (beautiful_you.has_role(array['owner','admin','manager']))
  with check (beautiful_you.has_role(array['owner','admin','manager']));
drop policy if exists "active gallery categories are public" on beautiful_you.gallery_categories;
create policy "active gallery categories are public" on beautiful_you.gallery_categories
  for select to anon, authenticated using (active = true);

drop policy if exists "active gallery managers manage albums" on beautiful_you.gallery_albums;
create policy "active gallery managers manage albums" on beautiful_you.gallery_albums
  for all to authenticated
  using (beautiful_you.has_role(array['owner','admin','manager']))
  with check (beautiful_you.has_role(array['owner','admin','manager']));

drop policy if exists "published gallery albums are public" on beautiful_you.gallery_albums;
create policy "published gallery albums are public" on beautiful_you.gallery_albums
  for select to anon, authenticated
  using (status = 'published');

create index if not exists gallery_items_album_order_idx
  on beautiful_you.gallery_items(album_id,sort_order,created_at desc);
create index if not exists gallery_items_featured_published_idx
  on beautiful_you.gallery_items(featured,sort_order)
  where status = 'published' and consent_confirmed = true;
create index if not exists gallery_albums_public_order_idx
  on beautiful_you.gallery_albums(status,featured,sort_order,event_date desc);
