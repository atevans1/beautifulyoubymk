# Beautiful You role permissions

The site owner is the super administrator for Beautiful You. A client administrator can manage the website without being able to invite users or change roles.

| Role | Content | Gallery | Site settings | Invite/manage users |
|---|---|---|---|---|
| owner | Full | Full | Full | Yes |
| admin | Full | Full | Full | No |
| manager | Full | Full | Full | No |
| editor | Draft/content | No | No | No |

All permissions are enforced by Supabase RLS and server-side checks. The browser must never be trusted with a role value.
