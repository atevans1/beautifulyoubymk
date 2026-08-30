-- Private case management. Apply only after role and retention review.
create table if not exists beautiful_you.cases (
  id uuid primary key default gen_random_uuid(),
  case_reference text not null unique default ('CASE-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  help_request_id uuid unique references beautiful_you.help_requests(id) on delete set null,
  preferred_name text,
  support_summary text,
  assessment text,
  assistance_approved text,
  support_provided text,
  follow_up text,
  status text not null default 'new_request' check (status in ('new_request','under_review','contacted','assessment','approved','support_active','follow_up','closed','declined','archived')),
  assigned_to uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists beautiful_you.case_notes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references beautiful_you.cases(id) on delete cascade,
  note text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists beautiful_you.case_activity (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references beautiful_you.cases(id) on delete cascade,
  event_type text not null,
  summary text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table beautiful_you.cases enable row level security;
alter table beautiful_you.case_notes enable row level security;
alter table beautiful_you.case_activity enable row level security;
-- Deliberately no public policies. Case-manager policies must be added only
-- after the final role-permission matrix and audit requirements are approved.
