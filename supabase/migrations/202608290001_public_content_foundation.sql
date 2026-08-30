-- Beautiful You By M.K. public content foundation
-- Apply only after confirming the target Supabase project.
create extension if not exists pgcrypto;`r`ncreate schema if not exists beautiful_you;

create table if not exists beautiful_you.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('super_admin','administrator','content_manager','finance_manager','case_manager','volunteer_manager')),
  created_at timestamptz not null default now()
);

create table if not exists beautiful_you.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body text,
  content_type text not null default 'article' check (content_type in ('article','guide','resource','video','download','news')),
  category text,
  status text not null default 'draft' check (status in ('draft','in_review','published','archived')),
  published_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists beautiful_you.programmes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  summary text,
  description text,
  eligibility text,
  status text not null default 'draft' check (status in ('draft','published','paused','archived')),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists beautiful_you.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  caption text,
  image_url text not null,
  category text,
  consent_confirmed boolean not null default false,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  sort_order integer not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists beautiful_you.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table beautiful_you.user_roles enable row level security;
alter table beautiful_you.posts enable row level security;
alter table beautiful_you.programmes enable row level security;
alter table beautiful_you.gallery_items enable row level security;
alter table beautiful_you.site_settings enable row level security;

drop policy if exists "published posts are public" on beautiful_you.posts;
create policy "published posts are public" on beautiful_you.posts for select using (status = 'published' and published_at <= now());
drop policy if exists "published programmes are public" on beautiful_you.programmes;
create policy "published programmes are public" on beautiful_you.programmes for select using (status = 'published');
drop policy if exists "consented published gallery is public" on beautiful_you.gallery_items;
create policy "consented published gallery is public" on beautiful_you.gallery_items for select using (status = 'published' and consent_confirmed = true);

-- Admin write policies are intentionally deferred until the organisation confirms role assignments.
