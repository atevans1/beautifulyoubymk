import {readAccessToken} from './_auth.js';

export default async function handler(req,res){
  const token=readAccessToken(req),url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon=process.env.SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!token||!url||!anon||!service)return res.status(401).json({error:'Authorised access required.'});
  const auth=await fetch(`${url}/auth/v1/user`,{headers:{apikey:anon,Authorization:`Bearer ${token}`}});
  if(!auth.ok)return res.status(401).json({error:'Sign-in expired.'});
  const user=await auth.json(),headers={apikey:service,'Accept-Profile':'beautiful_you'};
  const membership=await fetch(`${url}/rest/v1/members?user_id=eq.${user.id}&status=eq.active&select=role`,{headers});
  if(!membership.ok)return res.status(503).json({error:'Unable to verify Beautiful You membership.'});
  const roles=await membership.json();
  if(!roles.some(row=>['owner','admin','manager'].includes(row.role)))return res.status(403).json({error:'Case-management access denied.'});
  const endpoint=`${url}/rest/v1/cases`;
  if(req.method==='GET'){
    const result=await fetch(`${endpoint}?select=id,help_request_id,case_reference,status,created_at&order=created_at.desc`,{headers});
    return res.status(result.status).json(await result.json());
  }
  if(req.method==='POST'){
    const helpRequestId=String(req.body?.help_request_id||''),summary=String(req.body?.support_summary||'').trim();
    if(!/^[0-9a-f-]{36}$/i.test(helpRequestId)||summary.length>5000)return res.status(400).json({error:'A valid help request is required.'});
    const result=await fetch(endpoint,{method:'POST',headers:{...headers,'Content-Type':'application/json','Content-Profile':'beautiful_you',Prefer:'return=representation'},body:JSON.stringify({help_request_id:helpRequestId,support_summary:summary||null})});
    if(!result.ok)return res.status(result.status===409?409:400).json({error:'Could not create a case. It may already exist for this help request.'});
    return res.status(201).json(await result.json());
  }
  return res.status(405).json({error:'Method not allowed'});
}
