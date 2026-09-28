import {setSessionCookie,setTemporaryAccessCookie} from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = req.body?.password;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return res.status(500).json({ error: 'Authentication is not configured yet.' });
  let response;try{response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });}catch{return res.status(503).json({error:'Sign-in is temporarily unavailable. Please try again.'});}
  let data;try{data=await response.json();}catch{return res.status(502).json({error:'Authentication returned an invalid response.'});}
  if (!response.ok) {
    // Supabase requires invited users to accept the email invitation before
    // password sign-in. Keep other credential failures generic to avoid
    // revealing whether an email is registered.
    if (data?.code === 'email_not_confirmed' || data?.error_code === 'email_not_confirmed') {
      return res.status(401).json({ error: 'Your email invitation has not been accepted yet. Open the latest Beautiful You invitation email and finish setting your password first.' });
    }
    return res.status(401).json({ error: 'Email or password is incorrect. Check the email address, or use “Forgot your password?” to set a new password.' });
  }
  if(!data?.user?.id||!data?.access_token)return res.status(502).json({error:'Authentication returned an incomplete session.'});
  const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!service)return res.status(503).json({error:'Admin membership checks are not configured.'});
  let membership;try{membership=await fetch(`${url}/rest/v1/members?user_id=eq.${encodeURIComponent(data.user.id)}&status=eq.active&select=role`,{headers:{apikey:service,'Accept-Profile':'beautiful_you'}});}catch{return res.status(503).json({error:'Unable to verify Beautiful You membership. Please try again later.'});}
  if(!membership.ok)return res.status(503).json({error:'Unable to verify Beautiful You membership. Please try again later.'});
  let rows;try{rows=await membership.json();}catch{return res.status(502).json({error:'Membership service returned an invalid response.'});}
  if(!rows.some(row=>['owner','admin','manager','editor'].includes(row.role)))return res.status(403).json({error:'This account is not an active Beautiful You member. Ask the site owner for an invitation.'});
  if(data.user.app_metadata?.beautiful_you_force_password_change===true){
    setTemporaryAccessCookie(res,data.access_token,data.expires_in);
    return res.status(200).json({password_change_required:true});
  }
  setSessionCookie(res,data.access_token,data.expires_in);
  return res.status(200).json({ user: { id:data.user?.id, email:data.user?.email } });
}
