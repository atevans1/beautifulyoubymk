-- Beautiful You brand boundary inside the existing LOI Supabase project.
-- Review the shared project before applying; never reset the database.
create schema if not exists beautiful_you;

create table if not exists beautiful_you.members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','manager','editor')),
  status text not null default 'active' check (status in ('active','suspended','invited')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table beautiful_you.members enable row level security;
-- No public policies. Membership is resolved server-side for authorised admin routes.
