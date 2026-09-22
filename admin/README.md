# Beautiful You administration

Admin pages are static files, so the browser can request their HTML. Private data is returned only by server-side API routes after those routes validate the Supabase session and the Beautiful You membership. The browser must never receive the Supabase Secret key.

## Roles enforced by the current API

- `owner`: full access, including member invitations and role changes.
- `admin`: manage content, enquiries and support operations; cannot invite or manage members.
- `manager`: manage content, enquiries, help requests and cases; cannot invite or manage members or manage giving/impact data.
- `editor`: create and edit draft programmes and resources; cannot publish, delete, or manage gallery items.

## Current access paths

- `/admin/login`: sign in with an approved Supabase account.
- `/admin`: workspace links.
- `/admin/members`: owner-only invitations and membership management.
- `/admin/enquiries`: partnership, volunteer, professional and giving enquiries.
- `/admin/help-requests` and `/admin/case-notes`: restricted support operations.
- `/admin/programmes`, `/admin/resources` and `/admin/gallery`: content editors.

The APIs use `beautiful_you.members` as the role source. Because server routes use the server-only Secret key, each route must continue checking the authenticated user and allowed role before accessing private tables.
