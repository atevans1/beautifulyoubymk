# Beautiful You ↔ LOI Intelligence Supabase boundary

Beautiful You is an independent website, repository and deployment. It uses the existing LOI Intelligence Supabase project as shared infrastructure only.

## Required boundary

- Beautiful You tables live under `beautiful_you.*`.
- Beautiful You roles are separate from LOI platform roles.
- An authenticated LOI user is not automatically a Beautiful You administrator.
- Public reads are limited to explicitly published Beautiful You content.
- Private help requests, cases, applications, donor records and internal notes remain restricted by Beautiful You policies.
- Beautiful You never queries LOI customers, billing, AI generations, organisations or private files directly.

## Connection contract

Use the existing project URL and public anon key through environment variables. Privileged operations belong in server-side routes only. Do not commit credentials or service-role keys.

## Migration gate

Before applying any migration to the shared project, inspect the remote schema, policies, triggers, functions, storage buckets and existing migrations; check naming conflicts; test RLS; review the schema diff; confirm backup/recovery; and obtain approval.
