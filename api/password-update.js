import {setSessionCookie} from './_auth.js';

export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed.'});
  const token=String(req.body?.access_token||''),password=String(req.body?.password||'');
  if(!token||password.length<12||password.length>128)return res.status(400).json({error:'Use the password reset email and choose a password between 12 and 128 characters.'});
  const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!anon||!service)return res.status(503).json({error:'Password update is not configured.'});
  const authHeaders={apikey:anon,Authorization:`Bearer ${token}`};
  try{
    const userResponse=await fetch(`${url}/auth/v1/user`,{headers:authHeaders});
    if(!userResponse.ok)return res.status(401).json({error:'This reset link is invalid or expired. Request a new one.'});
    const user=await userResponse.json();
    const membership=await fetch(`${url}/rest/v1/members?user_id=eq.${encodeURIComponent(user.id)}&status=eq.active&select=id`,{headers:{apikey:service,'Accept-Profile':'beautiful_you'}});
    if(!membership.ok)return res.status(503).json({error:'Unable to verify site membership. Contact the site owner.'});
    if(!(await membership.json()).length)return res.status(403).json({error:'This account does not have active site access.'});
    const updated=await fetch(`${url}/auth/v1/user`,{method:'PUT',headers:{...authHeaders,'Content-Type':'application/json'},body:JSON.stringify({password})});
    if(!updated.ok)return res.status(400).json({error:'Password could not be updated. Choose a different password and try again.'});
    setSessionCookie(res,token,3600);
    return res.status(200).json({message:'Password updated. Opening the admin workspace.'});
  }catch{return res.status(503).json({error:'Password update is temporarily unavailable. Please try again.'});}
}
