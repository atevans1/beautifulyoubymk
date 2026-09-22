# Owner-only member invitations

## Current flow

1. The owner signs in and opens **Admin → Members**.
2. The owner enters an email address and chooses `admin`, `manager` or `editor`.
3. `/api/invite-member` verifies the caller's Supabase user and active `owner` row before sending an Auth invitation.
4. The invitee opens the email link, sets a password on `/admin/accept-invite`, and the server activates the preassigned membership.
5. The new member can then sign in and use the pages allowed for their role.

## Safeguards and known operational gaps

- There is no public signup flow that grants Beautiful You roles.
- The browser never receives the Supabase Secret key.
- Every private API checks the session and role server-side before using the Secret key.
- Invitations depend on Supabase email delivery and the redirect URL `https://www.beautifulyoumk.com/admin/accept-invite` being permitted in the Supabase Auth redirect URL settings. The homepage also routes invitation returns to the setup screen if Supabase falls back to the site URL.
- Shared durable rate limiting and a complete private audit trail are not implemented yet.
