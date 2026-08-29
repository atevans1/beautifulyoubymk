# Content publishing layer

`posts.json` is the temporary content contract for the public Resources hub. Each entry has a stable slug, type, category, title, excerpt and editorial status.

When the backend is connected, replace this file with a server-side query. Public pages must return only `published` records. Drafts, internal notes, contributor details and survivor information must remain private.

Planned admin capabilities: create, edit, preview, approve, publish, unpublish, archive, tag and schedule content.
