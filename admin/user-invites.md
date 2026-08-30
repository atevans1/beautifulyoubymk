# Owner-only administrator invites

## Approved flow

1. A signed-in user reaches **Admin → Users** only when `beautiful_you.members` contains an active `owner` record for that user.
2. The owner enters an invitee email and selects an allowed role: `admin`, `manager` or `editor`.
3. A server-side action validates the owner session, rate-limits the request and sends the Supabase Auth invitation.
4. The invitee creates their own password through the Supabase recovery/invite flow.
5. The server activates or creates the invitee’s `beautiful_you.members` record with the approved role.
6. Every invite, acceptance, role change and suspension is recorded in a private audit trail.

## Non-negotiable safeguards

- No public “create admin” form.
- No automatic admin role for ordinary signup.
- Never trust a role supplied by browser JavaScript.
- Never expose the Supabase service-role key to the browser.
- Do not grant access to LOI Intelligence tables or another brand’s schema.
- Require owner confirmation before changing or suspending an administrator.
