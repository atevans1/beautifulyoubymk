import {readAccessToken} from './_auth.js';

const fields=new Set(['metric_key','metric_label','value','period_start','period_end','source_note']);
export default async function handler(req,res){
  const token=readAccessToken(req),url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon=process.env.SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!token||!url||!anon||!service)return res.status(401).json({error:'Authorised access required.'});
  const auth=await fetch(`${url}/auth/v1/user`,{headers:{apikey:anon,Authorization:`Bearer ${token}`}});
  if(!auth.ok)return res.status(401).json({error:'Sign-in expired.'});
  const user=await auth.json(),headers={apikey:service,'Accept-Profile':'beautiful_you'};
  const member=await fetch(`${url}/rest/v1/members?user_id=eq.${user.id}&status=eq.active&select=role`,{headers});
  if(!member.ok)return res.status(503).json({error:'Unable to verify Beautiful You membership.'});
  const roles=await member.json();
  if(!roles.some(row=>['owner','admin'].includes(row.role)))return res.status(403).json({error:'Impact reporting access denied.'});
  const endpoint=`${url}/rest/v1/impact_metrics`;
  if(req.method==='GET'){const result=await fetch(`${endpoint}?select=*&order=period_start.desc`,{headers});return res.status(result.status).json(await result.json());}
  if(req.method==='POST'){
    const input=Object.fromEntries(Object.entries(req.body||{}).filter(([key])=>fields.has(key)));
    const value=Number(input.value);
    if(!input.metric_key||!input.metric_label||!Number.isFinite(value)||value<0||!input.period_start||!input.period_end)return res.status(400).json({error:'Enter a metric, non-negative value, and reporting period.'});
    input.value=value;
    const result=await fetch(endpoint,{method:'POST',headers:{...headers,'Content-Type':'application/json','Content-Profile':'beautiful_you',Prefer:'return=representation'},body:JSON.stringify({...input,approved:false,approved_by:null,approved_at:null,created_by:user.id})});
    if(result.ok)await fetch(`${url}/rest/v1/activity_logs`,{method:'POST',headers:{...headers,'Content-Type':'application/json','Content-Profile':'beautiful_you'},body:JSON.stringify({actor_id:user.id,action:'impact_metric_created',entity_type:'impact_metric',metadata:{}})});
    return res.status(result.status).json(await result.json());
  }
  return res.status(405).json({error:'Method not allowed'});
}
