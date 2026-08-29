# Authentication activation checklist

1. Confirm the intended Supabase project URL and ownership.
2. Add the project URL and public anon key to local or hosting environment variables.
3. Enable email login and configure a recovery redirect for the production domain.
4. Create administrator accounts through Supabase Auth; never seed passwords in source control.
5. Insert each administrator’s role in `public.user_roles` through a protected server-side process.
6. Add server-side session checks to every `/admin/*` route.
7. Add role-specific write policies for posts, programmes, gallery items and settings.
8. Test unauthenticated, wrong-role and expired-session access before enabling production routes.

No service-role key belongs in HTML, browser JavaScript, public environment variables or Git history.
