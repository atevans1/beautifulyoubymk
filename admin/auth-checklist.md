# Authentication activation checklist

1. Confirm the intended Supabase project URL and ownership.
2. Add the project URL and public anon key to local or hosting environment variables.
3. Set the Supabase Site URL to the Beautiful You production origin, not another product's domain.
4. Allowlist the exact invitation and reset callbacks: `https://www.beautifulyoumk.com/admin/accept-invite` and `https://www.beautifulyoumk.com/admin/reset-password`. Only add apex or Vercel callbacks if the app actually sends users to those origins.
5. Create administrator accounts only through the owner-only invite screen; there is no public signup. Invitees verify email first; owners then set a one-time password, which must be replaced before access. Never seed passwords in source control or send temporary passwords in the invitation email.
6. Configure production SMTP and test invitation and password recovery delivery. Supabase's default email sender is rate-limited and best-effort; do not treat a successful API response alone as proof an email arrived.
7. Use `beautiful_you.members` as the role and status source. Do not create a parallel `public.user_roles` table for this app.
8. Add server-side session checks to every `/admin/*` route and protected API.
9. Test unauthenticated, wrong-role, forced-password-change and expired-session behavior before enabling production routes.

No service-role key belongs in HTML, browser JavaScript, public environment variables or Git history.
