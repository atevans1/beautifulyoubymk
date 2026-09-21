import {readAccessToken,clearSessionCookie} from './_auth.js';
export default async function handler(req,res){
  if(req.method==='DELETE'){clearSessionCookie(res);return res.status(204).end();}
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  const token=readAccessToken(req),url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!token||!url||!anon||!service) return res.status(401).json({error:'Sign-in required.'});
  const auth=await fetch(`${url}/auth/v1/user`,{headers:{apikey:anon,Authorization:`Bearer ${token}`}});
  if(!auth.ok){clearSessionCookie(res);return res.status(401).json({error:'Sign-in expired.'});}
  const user=await auth.json();
  const membership=await fetch(`${url}/rest/v1/members?user_id=eq.${user.id}&status=eq.active&select=role,status`,{headers:{apikey:service,Authorization:`Bearer ${service}`,'Accept-Profile':'beautiful_you'}});
  const rows=membership.ok?await membership.json():[];
  if(rows.length===0) return res.status(403).json({error:'Beautiful You membership is required.'});
  return res.status(200).json({user:{id:user.id,email:user.email},role:rows[0].role,status:rows[0].status});
}
