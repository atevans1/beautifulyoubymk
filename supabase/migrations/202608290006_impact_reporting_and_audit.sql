-- Verified impact metrics and audit events.
create table if not exists public.impact_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_key text not null,
  metric_label text not null,
  value numeric not null check (value >= 0),
  period_start date not null,
  period_end date not null,
  source_note text,
  approved boolean not null default false,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  check (period_end >= period_start)
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.impact_metrics enable row level security;
alter table public.activity_logs enable row level security;
drop policy if exists "approved impact is public" on public.impact_metrics;
create policy "approved impact is public" on public.impact_metrics for select using (approved = true);
-- Activity logs are private; no public policy is created.
