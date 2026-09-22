import {readAccessToken} from './_auth.js';
export default async function handler(req,res){
  const token=readAccessToken(req),url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!token||!url||!anon||!service) return res.status(401).json({error:'Authorised access required.'});
  const auth=await fetch(`${url}/auth/v1/user`,{headers:{apikey:anon,Authorization:`Bearer ${token}`}});
  if(!auth.ok) return res.status(401).json({error:'Sign-in expired.'});
  const user=await auth.json(),headers={apikey:service,'Accept-Profile':'beautiful_you'};
  const ownerCheck=await fetch(`${url}/rest/v1/members?user_id=eq.${user.id}&role=eq.owner&status=eq.active&select=id,user_id`,{headers});
  const ownerRows=ownerCheck.ok?await ownerCheck.json():[];
  if(ownerRows.length===0) return res.status(403).json({error:'Owner access required.'});
  const endpoint=`${url}/rest/v1/members`;
  if(req.method==='GET'){
    const result=await fetch(`${endpoint}?select=*&order=created_at.desc`,{headers});
    if(!result.ok)return res.status(result.status).json(await result.json());
    const members=await result.json();
    const authUsers=await fetch(`${url}/auth/v1/admin/users?page=1&per_page=1000`,{headers:{apikey:service}});
    const userById=new Map();
    if(authUsers.ok){const data=await authUsers.json();for(const account of data.users||[])userById.set(account.id,account.email||'');}
    return res.status(200).json(members.map(member=>({...member,email:userById.get(member.user_id)||null})));
  }
  if(!['PATCH','DELETE'].includes(req.method)||!req.body?.id) return res.status(400).json({error:'Member and action are required.'});
  const targetResult=await fetch(`${endpoint}?id=eq.${encodeURIComponent(req.body.id)}&select=id,user_id,role`,{headers});
  const targetRows=targetResult.ok?await targetResult.json():[];
  if(targetRows.length===0) return res.status(404).json({error:'Member not found.'});
  if(targetRows[0].role==='owner'||targetRows[0].user_id===user.id) return res.status(400).json({error:'The owner account cannot be changed or removed.'});
  if(req.method==='PATCH'&&!['admin','manager','editor'].includes(req.body.role)) return res.status(400).json({error:'Invalid role.'});
  if(req.method==='PATCH'&&!['active','suspended','invited'].includes(req.body.status)) return res.status(400).json({error:'Invalid status.'});
  const result=await fetch(`${endpoint}?id=eq.${encodeURIComponent(req.body.id)}`,{method:req.method,headers:{...headers,'Content-Type':'application/json','Content-Profile':'beautiful_you',Prefer:'return=representation'},body:req.method==='DELETE'?undefined:JSON.stringify({role:req.body.role,status:req.body.status})});
  return res.status(result.status).json(await result.json());
}
