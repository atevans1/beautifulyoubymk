-- Volunteer and professional applications. Keep private until reviewed.
create table if not exists beautiful_you.volunteer_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  location text,
  profession text,
  skills text,
  availability text,
  area_of_interest text,
  relevant_experience text,
  preferred_programme text,
  internal_notes text,
  status text not null default 'new' check (status in ('new','under_review','contacted','approved','declined','archived')),
  assigned_to uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists beautiful_you.professional_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organisation_name text,
  email text,
  phone text,
  location text,
  professional_category text not null,
  credentials_summary text,
  availability text,
  message text,
  status text not null default 'new' check (status in ('new','under_review','contacted','approved','declined','archived')),
  assigned_to uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table beautiful_you.volunteer_applications enable row level security;
alter table beautiful_you.professional_applications enable row level security;
-- No public policies. Applications require server validation, rate limiting
-- and authenticated volunteer-manager review before any status changes.
