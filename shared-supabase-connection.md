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

Use the existing project URL and Supabase Publishable key for public access. Put the Supabase Secret key in the server-only `SUPABASE_SERVICE_ROLE_KEY` compatibility variable used by the current API routes. Send Publishable and Secret keys only in the `apikey` header; send a signed-in user's access token separately as `Authorization: Bearer <user-token>`. Never expose or commit the Secret key.

## Migration gate

Before applying any migration to the shared project, inspect the remote schema, policies, triggers, functions, storage buckets and existing migrations; check naming conflicts; test RLS; review the schema diff; confirm backup/recovery; and obtain approval.
