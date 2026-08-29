-- Confidential help requests. Apply only after privacy/retention review.
create table if not exists public.help_requests (
  id uuid primary key default gen_random_uuid(),
  request_reference text not null unique default ('BY-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  preferred_name text,
  full_name text,
  safe_email text,
  safe_phone text,
  preferred_contact_method text,
  location text,
  support_needed text,
  current_situation text,
  immediate_safety_concern boolean not null default false,
  short_description text,
  consent_acknowledged_at timestamptz,
  status text not null default 'new_request' check (status in ('new_request','under_review','contacted','assessment','approved','support_active','follow_up','closed','declined','archived')),
  assigned_to uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.help_requests enable row level security;
-- No public select/insert/update policies are created intentionally.
-- Submissions must use a server-side, rate-limited endpoint with validation.
-- Case managers receive access only through an explicit least-privilege policy.
