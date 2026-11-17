export const BUCKET='beautiful-you-gallery-private';
export const supabaseUrl=()=>process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL||'';
export const anonKey=()=>process.env.SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'';
export const serviceKey=()=>process.env.SUPABASE_SERVICE_ROLE_KEY||'';
export const profileHeaders=(key,profile='beautiful_you')=>({apikey:key,'Accept-Profile':profile});
export const validUuid=value=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value||''));
export const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function safeHref(value){const url=String(value||'').trim();if(/^https:\/\//i.test(url)||/^mailto:/i.test(url)||/^tel:/i.test(url)||(/^\/(?!\/)/.test(url)&&!/[\u0000-\u001f]/.test(url)))return url;return '';}
function decodeEntities(value){return String(value).replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&amp;/gi,'&');}

function sanitizeHtml(input,{trustedImages=new Set(),validGalleryIds=new Set()}={}){
  const source=String(input||'').replace(/<(script|style|iframe|object|embed|svg|math|form|textarea|select|button|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,'').replace(/<!--[\s\S]*?-->/g,'');
  const allowed=new Set(['p','br','h2','h3','h4','blockquote','ul','ol','li','strong','em','b','i','u','a','figure','figcaption','hr','span','img']);
  const voidTags=new Set(['br','hr']);const token=/<\/?[a-z][^>]*>/gi;let output='',cursor=0,match;
  while((match=token.exec(source))){output+=escapeHtml(decodeEntities(source.slice(cursor,match.index)));cursor=token.lastIndex;const raw=match[0],closing=/^<\//.test(raw),tagMatch=raw.match(/^<\/?\s*([a-z0-9]+)/i);if(!tagMatch)continue;const tag=tagMatch[1].toLowerCase();if(!allowed.has(tag))continue;
    if(closing){if(!voidTags.has(tag))output+=`</${tag}>`;continue;}
    if(tag==='figure'){
      const id=(raw.match(/\bdata-gallery-item\s*=\s*["']?([0-9a-f-]{36})/i)||[])[1];
      if(id&&validGalleryIds.has(id.toLowerCase()))output+=`<figure data-gallery-item="${escapeHtml(id)}">`;else output+='<figure>';
    }else if(tag==='a'){
      const hrefMatch=raw.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i),href=safeHref(hrefMatch?.[1]??hrefMatch?.[2]??hrefMatch?.[3]);
      output+=`<a${href?` href="${escapeHtml(href)}"`:''} rel="noopener noreferrer">`;
    }else if(tag==='img'){
      const srcMatch=raw.match(/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i),src=srcMatch?.[1]??srcMatch?.[2]??srcMatch?.[3]??'';if(!trustedImages.has(src))continue;
      const altMatch=raw.match(/\balt\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]*))/i),alt=altMatch?.[1]??altMatch?.[2]??altMatch?.[3]??'';output+=`<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async">`;
    }else output+=`<${tag}>`;
  }
  output+=escapeHtml(decodeEntities(source.slice(cursor)));
  return output.replace(/<\/span>/g,'</span>');
}

async function signedPreview(path,url,key){
  if(!path)return null;
  const response=await fetch(`${url}/storage/v1/object/sign/${BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`,{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({expiresIn:3600})});
  if(!response.ok)return null;const data=await response.json();return data.signedURL?.startsWith('http')?data.signedURL:`${url}/storage/v1${data.signedURL}`;
}

export async function publicGalleryImages(ids){
  const unique=[...new Set((ids||[]).map(v=>String(v).toLowerCase()).filter(validUuid))];if(!unique.length)return new Map();
  const url=supabaseUrl(),key=serviceKey();if(!url||!key)return new Map();
  const params=`select=id,title,alt_text,caption,image_url,storage_path,thumbnail_path,album_id,status,consent_confirmed&id=in.(${unique.join(',')})&status=eq.published&consent_confirmed=eq.true`;
  const response=await fetch(`${url}/rest/v1/gallery_items?${params}`,{headers:profileHeaders(key)});if(!response.ok)return new Map();const rows=await response.json();
  const albumIds=[...new Set(rows.map(row=>row.album_id).filter(validUuid))];let publishedAlbums=new Set();
  if(albumIds.length){const albums=await fetch(`${url}/rest/v1/gallery_albums?select=id,status&id=in.(${albumIds.join(',')})&status=eq.published`,{headers:profileHeaders(key)});if(albums.ok)publishedAlbums=new Set((await albums.json()).map(row=>row.id));}
  const output=new Map();
  await Promise.all(rows.map(async row=>{
    if(row.album_id&&!publishedAlbums.has(row.album_id))return;
    const imageUrl=row.thumbnail_path?await signedPreview(row.thumbnail_path,url,key):(row.storage_path?await signedPreview(row.storage_path,url,key):safeHref(row.image_url));if(!imageUrl)return;
    output.set(row.id,{id:row.id,title:row.title,alt_text:row.alt_text||row.title||'',caption:row.caption||'',image_url:imageUrl});
  }));
  return output;
}

export async function renderArticleBody(post){
  if(post.body_format!=='html')return String(post.body||'').split(/\r?\n\s*\r?\n/).filter(Boolean).map(part=>`<p>${escapeHtml(part).replace(/\r?\n/g,'<br>')}</p>`).join('');
  let body=String(post.body||'');const figures=[...body.matchAll(/<figure\b[^>]*\bdata-gallery-item\s*=\s*["']?([0-9a-f-]{36})["']?[^>]*>([\s\S]*?)<\/figure>/gi)];
  const ids=figures.map(match=>match[1].toLowerCase()),images=await publicGalleryImages(ids),trusted=new Set(),valid=new Set(ids);
  for(const match of figures){const item=images.get(match[1].toLowerCase());if(!item){body=body.replace(match[0],'<p class="article-media-withdrawn">A photograph in this story is no longer available.</p>');continue;}
    const caption=(match[2].match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)||[])[1]||item.caption;const captionText=caption.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();trusted.add(item.image_url);
    const safeFigure=`<figure><img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.alt_text)}" loading="lazy" decoding="async">${captionText?`<figcaption>${escapeHtml(captionText)}</figcaption>`:''}</figure>`;body=body.replace(match[0],safeFigure);
  }
  return sanitizeHtml(body,{trustedImages:trusted,validGalleryIds:valid});
}

export function sanitizeEditorBody(body,validGalleryIds=[]){return sanitizeHtml(body,{validGalleryIds:new Set(validGalleryIds.map(v=>String(v).toLowerCase()).filter(validUuid))});}
export function readingMinutes(body){const text=String(body||'').replace(/<[^>]*>/g,' ').replace(/\{\{gallery:[^}]+\}\}/g,' ');return Math.max(1,Math.ceil(text.trim().split(/\s+/).filter(Boolean).length/200));}
export function xmlEscape(value){return String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));}
