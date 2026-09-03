-- Content permissions for Beautiful You members. Invite/role management remains owner-only.
create or replace function beautiful_you.has_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = beautiful_you, public
as $$
  select exists (
    select 1 from beautiful_you.members m
    where m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = any(required_roles)
  );
$$;

revoke all on function beautiful_you.has_role(text[]) from public;
grant execute on function beautiful_you.has_role(text[]) to authenticated;

drop policy if exists "active content managers can manage posts" on beautiful_you.posts;
create policy "active content managers can manage posts" on beautiful_you.posts
  for all to authenticated
  using (beautiful_you.has_role(array['owner','admin','manager','editor']))
  with check (beautiful_you.has_role(array['owner','admin','manager','editor']));

drop policy if exists "active content managers can manage programmes" on beautiful_you.programmes;
create policy "active content managers can manage programmes" on beautiful_you.programmes
  for all to authenticated
  using (beautiful_you.has_role(array['owner','admin','manager','editor']))
  with check (beautiful_you.has_role(array['owner','admin','manager','editor']));

drop policy if exists "active content managers can manage gallery" on beautiful_you.gallery_items;
create policy "active content managers can manage gallery" on beautiful_you.gallery_items
  for all to authenticated
  using (beautiful_you.has_role(array['owner','admin','manager']))
  with check (beautiful_you.has_role(array['owner','admin','manager']));

drop policy if exists "site managers can manage settings" on beautiful_you.site_settings;
create policy "site managers can manage settings" on beautiful_you.site_settings
  for all to authenticated
  using (beautiful_you.has_role(array['owner','admin','manager']))
  with check (beautiful_you.has_role(array['owner','admin','manager']));

-- There is intentionally no insert/update/delete policy for members.
-- Membership and invitations are owner-only server-side operations.
