import {randomBytes} from 'node:crypto';
import {readAccessToken} from './_auth.js';

export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed.'});
  const token=readAccessToken(req),url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!token||!url||!anon||!service)return res.status(401).json({error:'Owner sign-in is required.'});
  const auth=await fetch(`${url}/auth/v1/user`,{headers:{apikey:anon,Authorization:`Bearer ${token}`}});
  if(!auth.ok)return res.status(401).json({error:'Sign-in expired. Please sign in again.'});
  const owner=await auth.json();
  const ownerRows=await fetch(`${url}/rest/v1/members?user_id=eq.${encodeURIComponent(owner.id)}&role=eq.owner&status=eq.active&select=id`,{headers:{apikey:service,'Accept-Profile':'beautiful_you'}});
  if(!ownerRows.ok)return res.status(503).json({error:'Unable to verify owner access.'});
  if(!(await ownerRows.json()).length)return res.status(403).json({error:'Only the active site owner can set a temporary password.'});
  const memberId=String(req.body?.member_id||'');
  if(!/^[0-9a-f-]{36}$/i.test(memberId))return res.status(400).json({error:'Choose a valid member.'});
  const targetResponse=await fetch(`${url}/rest/v1/members?id=eq.${encodeURIComponent(memberId)}&select=id,user_id,role,status`,{headers:{apikey:service,'Accept-Profile':'beautiful_you'}});
  if(!targetResponse.ok)return res.status(503).json({error:'Unable to load the selected member.'});
  const targets=await targetResponse.json(),target=targets[0];
  if(!target)return res.status(404).json({error:'Member not found.'});
  if(target.role==='owner'||target.user_id===owner.id)return res.status(400).json({error:'The owner account cannot be changed here.'});
  if(target.status!=='active')return res.status(409).json({error:'Temporary passwords are only available for active members. Invite pending users or review suspended members first.'});
  const adminHeaders={apikey:service,Authorization:`Bearer ${service}`};
  const userResponse=await fetch(`${url}/auth/v1/admin/users/${encodeURIComponent(target.user_id)}`,{headers:adminHeaders});
  if(!userResponse.ok)return res.status(503).json({error:'Unable to load the member’s authentication account.'});
  const authUser=await userResponse.json();
  if(!authUser.email_confirmed_at&&!authUser.confirmed_at)return res.status(409).json({error:'This member has not accepted and verified an invitation yet. Ask them to complete the invitation first.'});
  const temporaryPassword=randomBytes(18).toString('base64url');
  const appMetadata={...(authUser.app_metadata||{}),beautiful_you_force_password_change:true};
  const update=await fetch(`${url}/auth/v1/admin/users/${encodeURIComponent(target.user_id)}`,{method:'PUT',headers:{...adminHeaders,'Content-Type':'application/json'},body:JSON.stringify({password:temporaryPassword,app_metadata:appMetadata})});
  if(!update.ok)return res.status(503).json({error:'Could not set the temporary password. No password was provided.'});
  return res.status(200).json({email:authUser.email||null,temporary_password:temporaryPassword,message:'Temporary password created. Share it with the member through a separate, secure channel. Their first sign-in will require an immediate password change.'});
}
