# Owner-only member invitations

## Current flow

1. The owner signs in and opens **Admin → Members**.
2. The owner enters an email address and chooses `admin`, `manager` or `editor`.
3. `/api/invite-member` verifies the caller's Supabase user and active `owner` row before sending an Auth invitation.
4. The invitee opens the email link and confirms it on `/admin/accept-invite`; this verifies the email and activates the preassigned membership without creating an admin session.
5. The owner opens **Admin → Members**, creates a one-time password for the now-active member, and shares it through a separate secure channel.
6. The member signs in with that one-time password and must choose a private replacement before any admin page or protected API is available.

## Safeguards and known operational gaps

- There is no public signup flow that grants Beautiful You roles.
- The browser never receives the Supabase Secret key.
- Temporary passwords are generated server-side, shown once to the owner, and never stored in the member table. The first-login requirement is stored in Supabase `app_metadata` and checked by protected APIs.
- Every private API checks the session and role server-side before using the Secret key; protected admin APIs also block accounts marked for a password change.
- Invitations depend on Supabase email delivery and the exact redirect URL `https://www.beautifulyoumk.com/admin/accept-invite` being permitted in Supabase Auth URL Configuration. The email template must use `{{ .ConfirmationURL }}` so it honors the requested redirect.
- Shared durable rate limiting and a complete private audit trail are not implemented yet.
