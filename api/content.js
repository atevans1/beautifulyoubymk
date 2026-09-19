const tables = new Set(['posts', 'programmes', 'gallery_items']);
export default async function handler(req, res) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const table = String(req.query?.table || '');
  if (!token || !tables.has(table)) return res.status(400).json({ error: 'Valid sign-in and content area are required.' });
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) return res.status(500).json({ error: 'Content management is not configured.' });
  const auth = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } });
  if (!auth.ok) return res.status(401).json({ error: 'Sign-in expired.' });
  const user = await auth.json();
  const member = await fetch(`${url}/rest/v1/members?user_id=eq.${user.id}&status=eq.active&select=role`, { headers: { apikey: service, Authorization: `Bearer ${service}`, 'Accept-Profile':'beautiful_you' } });
  const roles = member.ok ? await member.json() : [];
  if (!roles.some(row => ['owner','admin','manager','editor'].includes(row.role))) return res.status(403).json({ error: 'Content access denied.' });
  const endpoint = `${url}/rest/v1/${table}`;
  if (req.method === 'GET') { const result = await fetch(`${endpoint}?select=*`, { headers: { apikey: service, Authorization: `Bearer ${service}`, 'Accept-Profile':'beautiful_you' } }); return res.status(result.status).json(await result.json()); }
  if (!['POST','PATCH','DELETE'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });
  const result = await fetch(endpoint, { method:req.method, headers:{ apikey:service, Authorization:`Bearer ${service}`, 'Content-Type':'application/json', 'Content-Profile':'beautiful_you', Prefer:'return=representation' }, body:req.method==='DELETE'?undefined:JSON.stringify(req.body||{}) });
  return res.status(result.status).json(await result.json());
}
