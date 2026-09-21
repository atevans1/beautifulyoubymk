import {readAccessToken} from './_auth.js';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const token = readAccessToken(req);
  const { email, role = 'admin' } = req.body || {};
  if (!token || !email || !['admin','manager','editor'].includes(role)) return res.status(400).json({ error: 'Valid sign-in, email and role are required.' });
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) return res.status(500).json({ error: 'Member invitations are not configured.' });
  const who = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } });
  if (!who.ok) return res.status(401).json({ error: 'Sign-in expired.' });
  const user = await who.json();
  const owner = await fetch(`${url}/rest/v1/members?user_id=eq.${user.id}&role=eq.owner&status=eq.active&select=id`, { headers: { apikey: service, Authorization: `Bearer ${service}`, 'Accept-Profile':'beautiful_you' } });
  if (!owner.ok || (await owner.json()).length === 0) return res.status(403).json({ error: 'Owner access required.' });
  const invited = await fetch(`${url}/auth/v1/admin/invite`, { method:'POST', headers:{ apikey: service, Authorization:`Bearer ${service}`, 'Content-Type':'application/json' }, body:JSON.stringify({ email }) });
  const invitedData = await invited.json();
  if (!invited.ok) return res.status(400).json({ error: invitedData.msg || invitedData.message || 'Invitation failed.' });
  const insert = await fetch(`${url}/rest/v1/members`, { method:'POST', headers:{ apikey: service, Authorization:`Bearer ${service}`, 'Content-Type':'application/json', 'Content-Profile':'beautiful_you', Prefer:'return=minimal' }, body:JSON.stringify({ user_id: invitedData.id, role, status:'invited' }) });
  if (!insert.ok) return res.status(400).json({ error: 'Invitation sent, but role assignment needs review.' });
  return res.status(200).json({ message: `Invitation sent to ${email}.`, role });
}
