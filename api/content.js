import {readAccessToken} from './_auth.js';
const allowedTables=new Set(['posts','programmes','gallery_items']);
const editableFields={posts:new Set(['title','slug','excerpt','body','content_type','category','status']),programmes:new Set(['name','slug','summary','description','eligibility','status']),gallery_items:new Set(['title','image_url','caption','category','consent_confirmed','status','sort_order'])};
const rolesAllowed=new Set(['owner','admin','manager','editor']);
function pickFields(input,allowed){return Object.fromEntries(Object.entries(input||{}).filter(([key])=>allowed.has(key)));}
export default async function handler(req,res){
  const token=readAccessToken(req);
  const table=String(req.query?.table||'');
  if(!token||!allowedTables.has(table)) return res.status(400).json({error:'Valid sign-in and content area are required.'});
  const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon=process.env.SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!anon||!service) return res.status(500).json({error:'Content management is not configured.'});
  const auth=await fetch(`${url}/auth/v1/user`,{headers:{apikey:anon,Authorization:`Bearer ${token}`}});
  if(!auth.ok) return res.status(401).json({error:'Sign-in expired.'});
  const user=await auth.json();
  const serviceHeaders={apikey:service,'Accept-Profile':'beautiful_you'};
  const membership=await fetch(`${url}/rest/v1/members?user_id=eq.${user.id}&status=eq.active&select=role`,{headers:serviceHeaders});
  if(!membership.ok) return res.status(503).json({error:'Unable to verify Beautiful You membership.'});
  const members=await membership.json(),role=members[0]?.role;
  if(!rolesAllowed.has(role)) return res.status(403).json({error:'Content access denied.'});
  if(role==='editor'&&table==='gallery_items') return res.status(403).json({error:'Gallery management is available to owners, admins and managers.'});
  const endpoint=`${url}/rest/v1/${table}`;
  if(req.method==='GET'){
    const order=table==='gallery_items'?'sort_order.asc,created_at.desc':'updated_at.desc.nullslast,created_at.desc';
    const result=await fetch(`${endpoint}?select=*&order=${order}`,{headers:serviceHeaders});
    return res.status(result.status).json(await result.json());
  }
  const writeHeaders={...serviceHeaders,'Content-Type':'application/json','Content-Profile':'beautiful_you',Prefer:'return=representation'};
  if(req.method==='POST'){
    const body=pickFields(req.body,editableFields[table]);
    if(role==='editor'&&body.status==='published') return res.status(403).json({error:'Editors can save drafts but cannot publish.'});
    if(table==='gallery_items'&&body.status==='published'&&body.consent_confirmed!==true) return res.status(400).json({error:'Confirm documented consent before publishing this image.'});
    body.created_by=user.id;
    const result=await fetch(endpoint,{method:'POST',headers:writeHeaders,body:JSON.stringify(body)});
    return res.status(result.status).json(await result.json());
  }
  if(req.method==='PATCH'){
    const id=req.body?.id;
    if(!id) return res.status(400).json({error:'A record ID is required.'});
    const changes=pickFields(req.body,editableFields[table]);
    if(role==='editor'&&changes.status!=='draft') return res.status(403).json({error:'Editors can only manage draft content.'});
    if(table==='gallery_items'&&changes.status==='published'&&changes.consent_confirmed!==true) return res.status(400).json({error:'Confirm documented consent before publishing this image.'});
    if(table!=='gallery_items') changes.updated_by=user.id;
    const result=await fetch(`${endpoint}?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:writeHeaders,body:JSON.stringify(changes)});
    return res.status(result.status).json(await result.json());
  }
  if(req.method==='DELETE'){
    if(role==='editor') return res.status(403).json({error:'Editors cannot delete content.'});
    const id=req.body?.id;
    if(!id) return res.status(400).json({error:'A record ID is required.'});
    const result=await fetch(`${endpoint}?id=eq.${encodeURIComponent(id)}`,{method:'DELETE',headers:writeHeaders});
    return res.status(result.status).json(await result.json());
  }
  return res.status(405).json({error:'Method not allowed'});
}
