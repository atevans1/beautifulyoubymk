# Beautiful You role permissions

The site owner is the only account that can invite, suspend, remove or change member roles. Client administrators can manage day-to-day operations without granting additional accounts.

| Role | Programmes and resources | Gallery | Enquiries and cases | Giving and impact | Manage members |
|---|---|---|---|---|---|
| `owner` | Full | Full | Full | Full | Yes |
| `admin` | Full | Full | Full | Full | No |
| `manager` | Full | Full | Full | No | No |
| `editor` | Drafts only | No | No | No | No |

Server-side API checks enforce these permissions because the Secret key bypasses Supabase RLS. The UI is not the security boundary.
