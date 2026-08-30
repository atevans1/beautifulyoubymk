-- Donations and partnership enquiries. Payment processing remains provider-agnostic.
create table if not exists beautiful_you.donation_campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  status text not null default 'draft' check (status in ('draft','active','paused','archived')),
  created_at timestamptz not null default now()
);

create table if not exists beautiful_you.donors (
  id uuid primary key default gen_random_uuid(),
  display_name text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists beautiful_you.donations (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid references beautiful_you.donors(id) on delete set null,
  campaign_id uuid references beautiful_you.donation_campaigns(id) on delete set null,
  provider_name text,
  provider_reference text unique,
  amount_minor bigint,
  currency text,
  frequency text not null default 'one_time' check (frequency in ('one_time','recurring')),
  status text not null default 'pending' check (status in ('pending','succeeded','failed','refunded','cancelled')),
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists beautiful_you.partnership_enquiries (
  id uuid primary key default gen_random_uuid(),
  organisation_name text,
  contact_name text,
  email text,
  category text,
  message text,
  status text not null default 'new' check (status in ('new','under_review','contacted','active','closed','declined')),
  assigned_to uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table beautiful_you.donation_campaigns enable row level security;
alter table beautiful_you.donors enable row level security;
alter table beautiful_you.donations enable row level security;
alter table beautiful_you.partnership_enquiries enable row level security;
-- Public policies are intentionally omitted. Provider webhooks and admin reads
-- must use authenticated server-side paths with finance/partnership permissions.
