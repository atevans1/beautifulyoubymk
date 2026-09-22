import {readAccessToken} from './_auth.js';

const tables={partnership:'partnership_enquiries',volunteer:'volunteer_applications',professional:'professional_applications',donation:'donors',impact:'impact_metrics'};
const statuses={partnership:['new','under_review','contacted','active','closed','declined'],volunteer:['new','under_review','contacted','approved','declined','archived'],professional:['new','under_review','contacted','approved','declined','archived']};

export default async function handler(req,res){
  const token=readAccessToken(req);
  const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon=process.env.SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!token||!url||!anon||!service)return res.status(401).json({error:'Authorised access required.'});
  const auth=await fetch(`${url}/auth/v1/user`,{headers:{apikey:anon,Authorization:`Bearer ${token}`}});
  if(!auth.ok)return res.status(401).json({error:'Sign-in expired.'});
  const user=await auth.json(),headers={apikey:service,'Accept-Profile':'beautiful_you'};
  const member=await fetch(`${url}/rest/v1/members?user_id=eq.${user.id}&status=eq.active&select=role`,{headers});
  if(!member.ok)return res.status(503).json({error:'Unable to verify Beautiful You membership.'});
  const roles=await member.json(),area=String(req.query?.area||''),table=tables[area];
  if(!table)return res.status(400).json({error:'Invalid operations area.'});
  const allowedRoles=area==='impact'||area==='donation'?['owner','admin']:['owner','admin','manager'];
  if(!roles.some(row=>allowedRoles.includes(row.role)))return res.status(403).json({error:area==='impact'?'Impact reporting access denied.':'Operations access denied.'});
  const endpoint=`${url}/rest/v1/${table}`;
  if(req.method==='GET'){
    const result=await fetch(`${endpoint}?select=*&order=created_at.desc`,{headers});
    return res.status(result.status).json(await result.json());
  }
  if(req.method==='PATCH'&&statuses[area]){
    const id=String(req.body?.id||''),status=String(req.body?.status||'');
    if(!/^[0-9a-f-]{36}$/i.test(id)||!statuses[area].includes(status))return res.status(400).json({error:'Choose a valid record and status.'});
    const changes={status};
    if(Object.hasOwn(req.body||{},'assigned_to'))changes.assigned_to=req.body.assigned_to||null;
    const result=await fetch(`${endpoint}?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{...headers,'Content-Type':'application/json','Content-Profile':'beautiful_you',Prefer:'return=representation'},body:JSON.stringify(changes)});
    return res.status(result.status).json(await result.json());
  }
  return res.status(405).json({error:'Method not allowed'});
}
