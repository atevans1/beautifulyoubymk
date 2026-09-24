# Authentication activation checklist

1. Confirm the intended Supabase project URL and ownership.
2. Add the project URL and public anon key to local or hosting environment variables.
3. Enable email login and add the exact production redirects `https://www.beautifulyoumk.com/admin/accept-invite` and `https://www.beautifulyoumk.com/admin/reset-password` to Supabase Auth URL Configuration. Set the Site URL to the production site.
4. Create administrator accounts only through the owner-only invite screen; there is no public signup. Never seed passwords in source control.
5. Configure production SMTP and test invitation and password recovery delivery. Supabase's default email sender is rate-limited and best-effort; do not treat a successful API response alone as proof an email arrived.
5. Insert each administrator’s role in `public.user_roles` through a protected server-side process.
6. Add server-side session checks to every `/admin/*` route.
7. Add role-specific write policies for posts, programmes, gallery items and settings.
8. Test unauthenticated, wrong-role and expired-session access before enabling production routes.

No service-role key belongs in HTML, browser JavaScript, public environment variables or Git history.
