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
  if(user.app_metadata?.beautiful_you_force_password_change===true)return res.status(403).json({password_change_required:true,error:'Choose a new password before continuing.'});
  const owner = await fetch(`${url}/rest/v1/members?user_id=eq.${user.id}&role=eq.owner&status=eq.active&select=id`, { headers: { apikey: service,  'Accept-Profile':'beautiful_you' } });
  if (!owner.ok || (await owner.json()).length === 0) return res.status(403).json({ error: 'Owner access required.' });
  const adminHeaders={apikey:service,Authorization:`Bearer ${service}`};
  const existing=await fetch(`${url}/auth/v1/admin/users?page=1&per_page=1000`,{headers:adminHeaders});
  if(!existing.ok)return res.status(503).json({error:'Unable to check existing accounts before inviting.'});
  const existingUsers=(await existing.json()).users||[],existingUser=existingUsers.find(account=>String(account.email||'').toLowerCase()===email);
  let replacedPending=false;
  if(existingUser){
    const member=await fetch(`${url}/rest/v1/members?user_id=eq.${encodeURIComponent(existingUser.id)}&select=id,status,role`,{headers:{apikey:service,'Accept-Profile':'beautiful_you'}});
    if(!member.ok)return res.status(503).json({error:'Unable to check this account’s Beautiful You membership.'});
    const rows=await member.json();
    if(rows.some(row=>row.status==='active'))return res.status(409).json({error:'This person already has active site access.'});
    const pending=rows.find(row=>row.status==='invited');
    if(pending){
      if(req.body?.resend_pending!==true)return res.status(409).json({code:'pending_invite',role:pending.role,error:'There is already a pending invitation. If its link went to the wrong site, you can replace that unconfirmed invite and send a fresh one.'});
      if(existingUser.email_confirmed_at||existingUser.confirmed_at)return res.status(409).json({error:'This account has already confirmed its email, so it was not removed or re-invited. Ask the invitee to use the existing account or contact the owner.'});
      const removed=await fetch(`${url}/auth/v1/admin/users/${encodeURIComponent(existingUser.id)}`,{method:'DELETE',headers:adminHeaders});
      if(!removed.ok)return res.status(503).json({error:'The old unconfirmed invitation could not be safely replaced. No new invitation was sent.'});
      replacedPending=true;
    }
    if(rows.some(row=>row.status==='suspended'))return res.status(409).json({error:'This person has a suspended membership. Review their member status instead of sending a new invitation.'});
    if(!replacedPending)return res.status(409).json({error:'An Auth account already exists for this email without a matching invitation. Review the account before proceeding.'});
  }
  const redirectTo='https://www.beautifulyoumk.com/admin/accept-invite';
  const invited = await fetch(`${url}/auth/v1/invite?redirect_to=${encodeURIComponent(redirectTo)}`, { method:'POST', headers:{ ...adminHeaders, 'Content-Type':'application/json' }, body:JSON.stringify({ email }) });
  const invitedData = await invited.json();
  if (!invited.ok) return res.status(400).json({ error: invitedData.msg || invitedData.message || invitedData.error_description || invitedData.error || 'Invitation failed.' });
  if(!invitedData.id)return res.status(502).json({error:'Supabase accepted the invite but did not return the account ID. Check Auth users before retrying.'});
  const insert = await fetch(`${url}/rest/v1/members`, { method:'POST', headers:{ apikey: service,  'Content-Type':'application/json', 'Content-Profile':'beautiful_you', Prefer:'return=minimal' }, body:JSON.stringify({ user_id: invitedData.id, role, status:'invited' }) });
  if (!insert.ok) {
    const removed=await fetch(`${url}/auth/v1/admin/users/${encodeURIComponent(invitedData.id)}`,{method:'DELETE',headers:adminHeaders});
    if(!removed.ok)return res.status(503).json({error:'Invitation setup failed and the pending Auth account could not be cleaned up. Do not retry yet; check Supabase Auth users and Beautiful You members.'});
    return res.status(400).json({ error: 'Membership assignment failed. The pending Auth account was removed; if an invitation email arrived, its link will no longer work. Correct the membership setup before inviting again.' });
  }
  return res.status(200).json({ message: `Invitation sent to ${email}.`, role });
}
