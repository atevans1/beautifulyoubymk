import {readAccessToken} from './_auth.js';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const token = readAccessToken(req);
  const email = String(req.body?.email || '').trim().toLowerCase();
  const role = String(req.body?.role || 'admin');
  if (!token) return res.status(401).json({ error: 'Sign in as the owner before inviting a member.' });
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !['admin','manager','editor'].includes(role)) return res.status(400).json({ error: 'Enter a valid email address and role.' });
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) return res.status(500).json({ error: 'Member invitations are not configured.' });
  const who = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } });
  if (!who.ok) return res.status(401).json({ error: 'Sign-in expired.' });
  const user = await who.json();
  const owner = await fetch(`${url}/rest/v1/members?user_id=eq.${user.id}&role=eq.owner&status=eq.active&select=id`, { headers: { apikey: service,  'Accept-Profile':'beautiful_you' } });
  if (!owner.ok || (await owner.json()).length === 0) return res.status(403).json({ error: 'Owner access required.' });
  const existing=await fetch(`${url}/auth/v1/admin/users?page=1&per_page=1000`,{headers:{apikey:service}});
  if(!existing.ok)return res.status(503).json({error:'Unable to check existing accounts before inviting.'});
  const existingUsers=(await existing.json()).users||[],existingUser=existingUsers.find(account=>String(account.email||'').toLowerCase()===email);
  if(existingUser){
    const member=await fetch(`${url}/rest/v1/members?user_id=eq.${encodeURIComponent(existingUser.id)}&select=id,status`,{headers:{apikey:service,'Accept-Profile':'beautiful_you'}});
    if(!member.ok)return res.status(503).json({error:'Unable to check this account’s Beautiful You membership.'});
    const rows=await member.json();
    if(rows.some(row=>row.status==='active'))return res.status(409).json({error:'This person already has active site access.'});
    if(rows.some(row=>row.status==='invited'))return res.status(409).json({error:'This person already has a pending invitation. Resend it from Supabase Auth or remove the pending member before inviting again.'});
    if(rows.some(row=>row.status==='suspended'))return res.status(409).json({error:'This person has a suspended membership. Review their member status instead of sending a new invitation.'});
    return res.status(409).json({error:'An Auth account already exists for this email without a matching invitation. Review the account before proceeding.'});
  }
  const redirectTo='https://www.beautifulyoumk.com/admin/accept-invite';
  const invited = await fetch(`${url}/auth/v1/invite?redirect_to=${encodeURIComponent(redirectTo)}`, { method:'POST', headers:{ apikey: service,  'Content-Type':'application/json' }, body:JSON.stringify({ email }) });
  const invitedData = await invited.json();
  if (!invited.ok) return res.status(400).json({ error: invitedData.msg || invitedData.message || invitedData.error_description || invitedData.error || 'Invitation failed.' });
  if(!invitedData.id)return res.status(502).json({error:'Supabase accepted the invite but did not return the account ID. Check Auth users before retrying.'});
  const insert = await fetch(`${url}/rest/v1/members`, { method:'POST', headers:{ apikey: service,  'Content-Type':'application/json', 'Content-Profile':'beautiful_you', Prefer:'return=minimal' }, body:JSON.stringify({ user_id: invitedData.id, role, status:'invited' }) });
  if (!insert.ok) {
    const removed=await fetch(`${url}/auth/v1/admin/users/${encodeURIComponent(invitedData.id)}`,{method:'DELETE',headers:{apikey:service}});
    if(!removed.ok)return res.status(503).json({error:'Invitation setup failed and the pending Auth account could not be cleaned up. Do not retry yet; check Supabase Auth users and Beautiful You members.'});
    return res.status(400).json({ error: 'Membership assignment failed. The pending Auth account was removed; if an invitation email arrived, its link will no longer work. Correct the membership setup before inviting again.' });
  }
  return res.status(200).json({ message: `Invitation sent to ${email}.`, role });
}
