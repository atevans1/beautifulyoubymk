import {readAccessToken} from './_auth.js';
const allowedTables=new Set(['posts','programmes','gallery_items']);
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
  const serviceHeaders={apikey:service,Authorization:`Bearer ${service}`,'Accept-Profile':'beautiful_you'};
  const membership=await fetch(`${url}/rest/v1/members?user_id=eq.${user.id}&status=eq.active&select=role`,{headers:serviceHeaders});
  const roles=membership.ok?await membership.json():[];
  if(!roles.some(row=>['owner','admin','manager','editor'].includes(row.role))) return res.status(403).json({error:'Content access denied.'});
  const endpoint=`${url}/rest/v1/${table}`;
  if(req.method==='GET'){
    const order=table==='gallery_items'?'sort_order.asc,created_at.desc':'updated_at.desc.nullslast,created_at.desc';
    const result=await fetch(`${endpoint}?select=*&order=${order}`,{headers:serviceHeaders});
    return res.status(result.status).json(await result.json());
  }
  const writeHeaders={...serviceHeaders,'Content-Type':'application/json','Content-Profile':'beautiful_you',Prefer:'return=representation'};
  if(req.method==='POST'){
    const body={...(req.body||{}),created_by:user.id};
    const result=await fetch(endpoint,{method:'POST',headers:writeHeaders,body:JSON.stringify(body)});
    return res.status(result.status).json(await result.json());
  }
  if(req.method==='PATCH'){
    const id=req.body?.id;
    if(!id) return res.status(400).json({error:'A record ID is required.'});
    const {id:ignored,...changes}=req.body;
    if(table!=='gallery_items') changes.updated_by=user.id;
    const result=await fetch(`${endpoint}?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:writeHeaders,body:JSON.stringify(changes)});
    return res.status(result.status).json(await result.json());
  }
  if(req.method==='DELETE'){
    const id=req.body?.id;
    if(!id) return res.status(400).json({error:'A record ID is required.'});
    const result=await fetch(`${endpoint}?id=eq.${encodeURIComponent(id)}`,{method:'DELETE',headers:writeHeaders});
    return res.status(result.status).json(await result.json());
  }
  return res.status(405).json({error:'Method not allowed'});
}
