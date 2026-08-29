# Secure administration boundary

The future admin application must be served behind authentication and must never be exposed as a public static page.

## Roles

- `super_admin`: full administration and role assignment
- `administrator`: operational management, excluding role assignment
- `content_manager`: posts, programmes, gallery and public settings only
- `finance_manager`: donations and finance records only
- `case_manager`: help requests, beneficiaries and cases only
- `volunteer_manager`: volunteer and professional applications only

## Initial route boundary

All `/admin/*` routes require an authenticated session and a matching role. Public content queries must filter to approved/published records server-side. No browser code may use a Supabase service-role key.

## Before activation

Confirm the Supabase project, administrator accounts, recovery email, retention policy and emergency escalation process. Then add authenticated write policies and server-side session checks.
