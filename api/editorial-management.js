import {readAccessToken} from './_auth.js';
import {anonKey,profileHeaders,publicGalleryImages,supabaseUrl,validUuid,sanitizeEditorBody} from './_editorial.js';
const fields=['title','slug','excerpt','body','content_type','category','status','published_at','subtitle','author_name','author_id','cover_gallery_item_id','related_album_ids','tags','seo_title','seo_description','featured','editorial_format','body_format'];
const roles=new Set(['owner','admin','manager','editor']);
const slugOk=value=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value||''))&&String(value).length<=120;
const cleanText=(value,max)=>String(value??'').trim().slice(0,max);
function replyError(res,status,error){return res.status(status).json({error});}
async function readRows(url,key,table,query){const response=await fetch(`${url}/rest/v1/${table}?${query}`,{headers:profileHeaders(key)});if(!response.ok)throw new Error(`Unable to read ${table}.`);return response.json();}
async function writeRows(url,key,table,method,body,query=''){
  return fetch(`${url}/rest/v1/${table}${query?`?${query}`:''}`,{method,headers:{...profileHeaders(key),'Content-Type':'application/json','Content-Profile':'beautiful_you',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body)});
}
async function authorized(req){
  const token=readAccessToken(req),url=supabaseUrl(),anon=anonKey(),service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!token||!url||!anon||!service)return {error:'Sign in with an authorised Beautiful You account.',status:401};
  const auth=await fetch(`${url}/auth/v1/user`,{headers:{apikey:anon,Authorization:`Bearer ${token}`}});if(!auth.ok)return {error:'Sign-in expired.',status:401};const user=await auth.json();
  if(user.app_metadata?.beautiful_you_force_password_change===true)return {error:'Choose a new password before continuing.',status:403};
  const result=await fetch(`${url}/rest/v1/members?user_id=eq.${encodeURIComponent(user.id)}&status=eq.active&select=role&limit=1`,{headers:profileHeaders(service)});if(!result.ok)return {error:'Unable to verify Beautiful You membership.',status:503};
  const role=(await result.json())[0]?.role;if(!roles.has(role))return {error:'Editorial access denied.',status:403};
  return {token,url,anon,service,user,role};
}
async function validCategory(url,key,slug){if(!slug)return null;const rows=await readRows(url,key,'post_categories',`select=slug,name&slug=eq.${encodeURIComponent(slug)}&active=eq.true&limit=1`);return rows[0]||null;}
async function activeAuthor(url,key,id){if(!id)return null;const rows=await readRows(url,key,'post_authors',`select=id,name&id=eq.${encodeURIComponent(id)}&active=eq.true&limit=1`);return rows[0]||null;}
async function preparePost(input,url,key,role,user){
  const data=Object.fromEntries(fields.filter(name=>Object.hasOwn(input||{},name)).map(name=>[name,input[name]]));
  if(Object.hasOwn(data,'title'))data.title=cleanText(data.title,200);if(Object.hasOwn(data,'slug'))data.slug=cleanText(data.slug,120);
  if(Object.hasOwn(data,'excerpt'))data.excerpt=cleanText(data.excerpt,600);if(Object.hasOwn(data,'subtitle'))data.subtitle=cleanText(data.subtitle,240);
  if(Object.hasOwn(data,'seo_title'))data.seo_title=cleanText(data.seo_title,180);if(Object.hasOwn(data,'seo_description'))data.seo_description=cleanText(data.seo_description,320);
  if(Object.hasOwn(data,'author_name'))data.author_name=cleanText(data.author_name,120);
  if(Object.hasOwn(data,'tags'))data.tags=[...new Set((Array.isArray(data.tags)?data.tags:String(data.tags||'').split(',')).map(t=>cleanText(t,40).toLowerCase()).filter(t=>t&&/^[a-z0-9][a-z0-9 -]*$/.test(t)))].slice(0,20);
  if(Object.hasOwn(data,'related_album_ids'))data.related_album_ids=[...new Set((Array.isArray(data.related_album_ids)?data.related_album_ids:[]).filter(validUuid))].slice(0,10);
  if(data.title!==undefined&&!data.title)return {error:'Add an article title.'};if(data.slug!==undefined&&!slugOk(data.slug))return {error:'Use a URL slug with lowercase letters, numbers and single hyphens.'};
  if(data.content_type&&!['article','guide','resource','video','download','news'].includes(data.content_type))return {error:'Choose a supported article type.'};
  if(data.status&&!['draft','in_review','published','archived'].includes(data.status))return {error:'Choose a valid publication status.'};
  if(data.editorial_format&&!['standard','evolve_story'].includes(data.editorial_format))return {error:'Choose a valid editorial format.'};
  if(data.body_format&&!['plain','html'].includes(data.body_format))return {error:'Choose a valid article format.'};
  if(role==='editor'&&data.status&&!['draft','in_review'].includes(data.status))return {error:'Editors can save drafts or submit for review, but cannot publish or archive articles.'};
  if(data.category){const category=await validCategory(url,key,data.category);if(!category)return {error:'Choose an active editorial category.'};}
  if(data.author_id){const author=await activeAuthor(url,key,data.author_id);if(!author)return {error:'Choose an active author.'};data.author_name=author.name;}
  const galleryIds=[data.cover_gallery_item_id,...(data.related_album_ids||[])].filter(validUuid);
  if(typeof data.body==='string')galleryIds.push(...[...data.body.matchAll(/data-gallery-item\s*=\s*["']?([0-9a-f-]{36})/gi)].map(match=>match[1]));
  const images=await publicGalleryImages(galleryIds);
  if(data.cover_gallery_item_id&&!images.has(String(data.cover_gallery_item_id).toLowerCase()))data.cover_gallery_item_id=null;
  if(data.body_format==='html'&&typeof data.body==='string'){
    const validInline=[...images.keys()];data.body=sanitizeEditorBody(data.body,validInline);
    data.body=data.body.replace(/<figure\b[^>]*data-gallery-item=["']?([0-9a-f-]{36})["']?[^>]*>\s*<\/figure>/gi,(whole,id)=>images.has(id.toLowerCase())?whole:'');
  }
  if(data.related_album_ids?.length){const albums=await readRows(url,key,'gallery_albums',`select=id&status=eq.published&id=in.(${data.related_album_ids.join(',')})`);const valid=new Set(albums.map(a=>a.id));data.related_album_ids=data.related_album_ids.filter(id=>valid.has(id));}
  if(data.status==='published'&&role==='editor')return {error:'Editors cannot publish articles.'};
  if(data.status==='published'&&!data.published_at)data.published_at=new Date().toISOString();
  if(data.body!==undefined&&String(data.body).length>60000)return {error:'Article body is too long. Keep it under 60,000 characters.'};
  if(data.slug!==undefined&&data.updated_by===undefined)data.updated_by=user.id;
  return {data};
}
async function manageTaxonomy(req,res,context,action){
  if(!['owner','admin','manager'].includes(context.role))return replyError(res,403,'Only owners, admins and managers can manage authors or categories.');
  const table=action==='category'?'post_categories':action==='author'?'post_authors':null;if(!table)return replyError(res,400,'Choose an author, category, or article action.');
  const allowed=action==='category'?['name','slug','description','sort_order','active']:['name','slug','role_label','bio','avatar_url','active'],body=req.body||{},data=Object.fromEntries(allowed.filter(k=>Object.hasOwn(body,k)).map(k=>[k,body[k]]));
  if(data.name!==undefined)data.name=cleanText(data.name,120);if(data.slug!==undefined)data.slug=cleanText(data.slug,120);
  if(data.slug!==undefined&&!slugOk(data.slug))return replyError(res,400,'Use a URL slug with lowercase letters, numbers and single hyphens.');
  if(data.name!==undefined&&!data.name)return replyError(res,400,'A name is required.');
  if(data.avatar_url!==undefined&&!/^https:\/\//i.test(String(data.avatar_url||''))&&data.avatar_url!==null)return replyError(res,400,'Author images must use a secure https URL.');
  if(req.method==='POST'){const result=await writeRows(context.url,context.service,table,'POST',data);return res.status(result.status).json(await result.json());}
  if(req.method==='PATCH'){
    if(!body.id)return replyError(res,400,'A record ID is required.');
    const previous=(await readRows(context.url,context.service,table,`select=slug&id=eq.${encodeURIComponent(body.id)}&limit=1`))[0];
    const result=await writeRows(context.url,context.service,table,'PATCH',data,`id=eq.${encodeURIComponent(body.id)}`);const updated=await result.json();
    if(result.ok&&action==='category'&&previous?.slug&&data.slug&&previous.slug!==data.slug)await writeRows(context.url,context.service,'posts','PATCH',{category:data.slug},`category=eq.${encodeURIComponent(previous.slug)}`);
    return res.status(result.status).json(updated);
  }
  return replyError(res,405,'Method not allowed.');
}
export default async function handler(req,res){
  const context=await authorized(req);if(context.error)return replyError(res,context.status,context.error);res.setHeader('Cache-Control','private, no-store');
  const action=String(req.query?.action||'');
  if(req.method==='GET'){
    try{
      if(action==='options'){
        const [categories,authors,albums,photos]=await Promise.all([
          readRows(context.url,context.service,'post_categories','select=*&order=sort_order.asc,name.asc'),
          readRows(context.url,context.service,'post_authors','select=*&order=name.asc'),
          readRows(context.url,context.service,'gallery_albums','select=id,title,slug,cover_item_id,status&status=eq.published&order=title.asc&limit=200'),
          readRows(context.url,context.service,'gallery_items','select=id,title,alt_text,caption,album_id,status,consent_confirmed&status=eq.published&consent_confirmed=eq.true&order=sort_order.asc,created_at.desc&limit=200')
        ]);
        const liveAlbumIds=new Set(albums.map(a=>a.id)),visiblePhotos=photos.filter(p=>!p.album_id||liveAlbumIds.has(p.album_id)),imageMap=await publicGalleryImages(visiblePhotos.map(p=>p.id));
        const gallery_items=visiblePhotos.filter(p=>imageMap.has(p.id)).map(p=>({...p,image_url:imageMap.get(p.id).image_url}));
        return res.status(200).json({categories,authors,albums:albums.map(a=>({...a,cover_url:imageMap.get(a.cover_item_id)?.image_url||null})),gallery_items});
      }
      const posts=await readRows(context.url,context.service,'posts','select=*&order=updated_at.desc.nullslast,created_at.desc&limit=500');
      return res.status(200).json(posts);
    }catch(error){return replyError(res,502,'Unable to load editorial records.');}
  }
  if(action==='category'||action==='author')return manageTaxonomy(req,res,context,action);
  if(action!=='post')return replyError(res,400,'Choose an editorial action.');
  if(req.method==='POST'){
    const prepared=await preparePost(req.body,context.url,context.service,context.role,context.user);if(prepared.error)return replyError(res,400,prepared.error);
    const body={...prepared.data,created_by:context.user.id,updated_by:context.user.id};if(!body.status)body.status='draft';if(!body.content_type)body.content_type='article';
    const result=await writeRows(context.url,context.service,'posts','POST',body);return res.status(result.status).json(await result.json());
  }
  if(req.method==='PATCH'){
    const id=req.body?.id;if(!id)return replyError(res,400,'A record ID is required.');
    const current=(await readRows(context.url,context.service,'posts',`select=id,slug,status&id=eq.${encodeURIComponent(id)}&limit=1`))[0];if(!current)return replyError(res,404,'Article not found.');
    if(context.role==='editor'&&!['draft','in_review'].includes(current.status))return replyError(res,403,'Editors can only edit drafts or stories in review.');
    const prepared=await preparePost(req.body,context.url,context.service,context.role,context.user);if(prepared.error)return replyError(res,400,prepared.error);
    const data={...prepared.data,updated_by:context.user.id};
    const result=await writeRows(context.url,context.service,'posts','PATCH',data,`id=eq.${encodeURIComponent(id)}`),updated=await result.json();
    const newSlug=data.slug;if(result.ok&&current.status==='published'&&newSlug&&newSlug!==current.slug){await writeRows(context.url,context.service,'post_slug_redirects','POST',{from_slug:current.slug,to_slug:newSlug},'on_conflict=from_slug');}
    return res.status(result.status).json(updated);
  }
  if(req.method==='DELETE')return replyError(res,405,'Articles are archived instead of deleted.');
  return replyError(res,405,'Method not allowed.');
}
