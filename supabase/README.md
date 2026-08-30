# Supabase foundation

The first migration creates the Beautiful You content layer in the dedicated `beautiful_you` schema: posts, programmes, gallery items, site settings and a role registry. Public reads are limited to published content; gallery items additionally require confirmed consent.

Help requests, beneficiaries, cases, notes and documents are intentionally not included yet. Those tables require an approved privacy, retention and least-privilege access model before implementation.

Before applying this migration:

1. Confirm the existing LOI Intelligence Supabase project.
2. Review role names and approval workflow.
3. Configure authenticated admin write policies; do not use the service-role key in browser code.
