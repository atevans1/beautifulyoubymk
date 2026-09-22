import {readAccessToken} from './_auth.js';

const MAX_BYTES=10*1024*1024;
const MIME_EXTENSIONS={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif'};

function parseMultipart(req){
  return new Promise((resolve,reject)=>{
    const chunks=[];let size=0;
    req.on('data',chunk=>{size+=chunk.length;if(size>MAX_BYTES+1024*1024){reject(Object.assign(new Error('Photo exceeds the 10 MB upload limit.'),{status:413}));req.destroy();return;}chunks.push(chunk);});
    req.on('error',reject);
    req.on('end',()=>{
      const buffer=Buffer.concat(chunks),contentType=String(req.headers['content-type']||''),match=contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
      if(!match)return reject(Object.assign(new Error('Choose a photo file to upload.'),{status:400}));
      const boundary=Buffer.from(`--${match[1]||match[2]}`),parts=[];let start=0;
      while(true){const at=buffer.indexOf(boundary,start);if(at<0)break;const next=buffer.indexOf(boundary,at+boundary.length);if(next<0)break;let part=buffer.subarray(at+boundary.length,next);if(part.subarray(0,2).toString()==='\r\n')part=part.subarray(2);if(part.subarray(-2).toString()==='\r\n')part=part.subarray(0,-2);const split=part.indexOf(Buffer.from('\r\n\r\n'));if(split<0){start=next;continue;}const headers=part.subarray(0,split).toString('utf8'),body=part.subarray(split+4),fileInfo=headers.match(/content-disposition:[^\r\n]*name="image"[^\r\n]*filename="([^"]*)"/i),mime=headers.match(/content-type:\s*([^\r\n;]+)/i);if(fileInfo){parts.push({filename:fileInfo[1],mime:(mime?.[1]||'').toLowerCase(),data:body});break;}start=next;}
      resolve(parts[0]||null);
    });
  });
}

export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed.'});
  const token=readAccessToken(req),url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY,bucket=process.env.SUPABASE_GALLERY_BUCKET;
  if(!token||!url||!anon||!service)return res.status(401).json({error:'Sign in to upload a gallery photo.'});
  if(!bucket)return res.status(503).json({error:'Gallery uploads are not configured yet. The site owner must set SUPABASE_GALLERY_BUCKET in Vercel to an existing public bucket dedicated to consent-approved gallery images.'});
  const auth=await fetch(`${url}/auth/v1/user`,{headers:{apikey:anon,Authorization:`Bearer ${token}`}});if(!auth.ok)return res.status(401).json({error:'Sign-in expired. Sign in again and retry.'});
  const user=await auth.json();
  const membership=await fetch(`${url}/rest/v1/members?user_id=eq.${encodeURIComponent(user.id)}&status=eq.active&select=role`,{headers:{apikey:service,'Accept-Profile':'beautiful_you'}});
  if(!membership.ok)return res.status(503).json({error:'Unable to verify Beautiful You membership.'});
  const roles=(await membership.json()).map(item=>item.role);if(!roles.some(role=>['owner','admin','manager'].includes(role)))return res.status(403).json({error:'Only owners, admins and managers can upload gallery photos.'});
  let file;try{file=await parseMultipart(req)}catch(error){return res.status(error.status||400).json({error:error.message||'Unable to read photo upload.'});}
  if(!file||!file.filename||!file.data.length)return res.status(400).json({error:'Choose a photo file to upload.'});
  if(!Object.hasOwn(MIME_EXTENSIONS,file.mime))return res.status(415).json({error:'Use a JPG, PNG, WebP or AVIF photo.'});
  if(file.data.length>MAX_BYTES)return res.status(413).json({error:'Photo exceeds the 10 MB upload limit.'});
  const signature=file.data.subarray(0,16),valid=file.mime==='image/jpeg'?signature[0]===0xff&&signature[1]===0xd8&&signature[2]===0xff:file.mime==='image/png'?signature.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):file.mime==='image/webp'?signature.subarray(0,4).toString()==='RIFF'&&signature.subarray(8,12).toString()==='WEBP':signature.subarray(4,12).toString()==='ftypavif'||signature.subarray(4,12).toString()==='ftypavis';
  if(!valid)return res.status(415).json({error:'The selected file does not appear to match its image format.'});
  const objectPath=`gallery/${user.id}/${crypto.randomUUID()}.${MIME_EXTENSIONS[file.mime]}`,encodedPath=objectPath.split('/').map(encodeURIComponent).join('/');
  const stored=await fetch(`${url}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`,{method:'POST',headers:{apikey:service,Authorization:`Bearer ${service}`,'Content-Type':file.mime,'x-upsert':'false'},body:file.data});
  if(!stored.ok){const detail=await stored.text();return res.status(502).json({error:`Photo storage rejected the upload (${stored.status}). Check that the configured bucket exists and is writable. ${detail.slice(0,220)}`});}
  const publicUrl=`${url}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodedPath}`;
  return res.status(201).json({image_url:publicUrl});
}
