import {randomUUID} from 'node:crypto';
import {readAccessToken} from './_auth.js';

const bucket='beautiful-you-gallery-private';
const extensions={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif'};
export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed.'});
  const token=readAccessToken(req),url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!token||!url||!anon||!service)return res.status(401).json({error:'Sign in to upload a gallery photo.'});
  const auth=await fetch(`${url}/auth/v1/user`,{headers:{apikey:anon,Authorization:`Bearer ${token}`}});if(!auth.ok)return res.status(401).json({error:'Sign-in expired. Sign in again and retry.'});const user=await auth.json();
  if(user.app_metadata?.beautiful_you_force_password_change===true)return res.status(403).json({password_change_required:true,error:'Choose a new password before continuing.'});
  const membership=await fetch(`${url}/rest/v1/members?user_id=eq.${encodeURIComponent(user.id)}&status=eq.active&select=role`,{headers:{apikey:service,'Accept-Profile':'beautiful_you'}});if(!membership.ok)return res.status(503).json({error:'Unable to verify Beautiful You membership.'});const roles=(await membership.json()).map(item=>item.role);if(!roles.some(role=>['owner','admin','manager'].includes(role)))return res.status(403).json({error:'Only owners, admins and managers can upload gallery photos.'});
  const mime=req.body?.mime,thumbnailMime=req.body?.thumbnail_mime||null;if(!Object.hasOwn(extensions,mime)||thumbnailMime&&!Object.hasOwn(extensions,thumbnailMime))return res.status(415).json({error:'Use a JPG, PNG, WebP or AVIF photo.'});
  const base=`gallery/${user.id}/${randomUUID()}`;
  async function sign(path){const encoded=path.split('/').map(encodeURIComponent).join('/');const response=await fetch(`${url}/storage/v1/object/upload/sign/${bucket}/${encoded}`,{method:'POST',headers:{apikey:service,'Content-Type':'application/json'},body:'{}'});if(!response.ok){const detail=await response.text();throw new Error(`Private upload could not be prepared (${response.status}). Confirm the gallery migration is applied. ${detail.slice(0,160)}`);}const data=await response.json();return /^https?:\/\//i.test(data.url)?data.url:`${url}/storage/v1${String(data.url||'').startsWith('/')?'':'/'}${data.url}`;}
  try{const path=`${base}.${extensions[mime]}`,thumbnailPath=thumbnailMime?`${base}-thumb.${extensions[thumbnailMime]}`:null;const [uploadUrl,thumbnailUrl]=await Promise.all([sign(path),thumbnailPath?sign(thumbnailPath):Promise.resolve(null)]);return res.status(200).json({storage_path:path,upload_url:uploadUrl,thumbnail_path:thumbnailPath,thumbnail_upload_url:thumbnailUrl});}
  catch(error){return res.status(502).json({error:error.message||'Unable to prepare private photo upload.'});}
}
