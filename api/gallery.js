const bucket='beautiful-you-gallery-private';
const base=()=>process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
function headers(key,profile){return {apikey:key,...(profile?{'Accept-Profile':profile}:{})};}
async function signedUrl(path,expires,key,url){
  if(!path)return null;
  const response=await fetch(`${url}/storage/v1/object/sign/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`,{method:'POST',headers:{...headers(key),'Content-Type':'application/json'},body:JSON.stringify({expiresIn:expires})});
  if(!response.ok)return null;const data=await response.json();return data.signedURL?.startsWith('http')?data.signedURL:`${url}/storage/v1${data.signedURL}`;
}
async function rows(url,key,table,query){const r=await fetch(`${url}/rest/v1/${table}?${query}`,{headers:headers(key,'beautiful_you')});if(!r.ok)throw new Error('Gallery content is temporarily unavailable.');return r.json();}
export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed.'});
  const url=base(),anon=process.env.SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!anon||!service)return res.status(503).json({error:'Gallery content is not configured.'});
  try{
    const id=String(req.query?.id||'');
    if(id&&req.query?.original==='true'){
      const list=await rows(url,service,'gallery_items',`select=id,status,consent_confirmed,storage_path,image_url,album_id&id=eq.${encodeURIComponent(id)}&limit=1`),item=list[0];
      if(!item||item.status!=='published'||item.consent_confirmed!==true)return res.status(404).json({error:'This photograph is not available.'});
      if(item.album_id){const parent=await rows(url,service,'gallery_albums',`select=id,status&id=eq.${encodeURIComponent(item.album_id)}&limit=1`);if(!parent[0]||parent[0].status!=='published')return res.status(404).json({error:'This photograph is not available.'});}
      const image=item.storage_path?await signedUrl(item.storage_path,900,service,url):item.image_url;
      if(!image)return res.status(503).json({error:'The photograph could not be opened. Please retry.'});
      res.setHeader('Cache-Control','private, no-store');return res.status(200).json({image_url:image});
    }
    const categories=await rows(url,anon,'gallery_categories','select=id,name,slug,description,sort_order&active=eq.true&order=sort_order.asc');
    const albumFilter=req.query?.album?`&slug=eq.${encodeURIComponent(String(req.query.album))}`:'';
    const featuredAlbumFilter=req.query?.featured==='true'?'&featured=eq.true':'';
    const albums=await rows(url,anon,'gallery_albums',`select=id,title,slug,introduction,category_id,cover_item_id,event_date,location,featured,sort_order,status&status=eq.published${albumFilter}${featuredAlbumFilter}&order=featured.desc,sort_order.asc,event_date.desc.nullslast`);
    if(req.query?.album&&!albums.length)return res.status(404).json({error:'This gallery is not available.'});
    const stories=albums.length?await rows(url,service,'gallery_albums',`select=id,story,story_consent_confirmed,anonymous_story&id=in.(${albums.map(a=>a.id).join(',')})&status=eq.published&story_consent_confirmed=eq.true`):[];
    const storyByAlbum=new Map(stories.filter(a=>a.story).map(a=>[a.id,{story:a.story,anonymous_story:a.anonymous_story}]));
    const publicAlbums=albums.map(album=>({...album,...(storyByAlbum.get(album.id)||{})}));
    const itemAlbum=req.query?.album&&albums[0]?`&album_id=eq.${encodeURIComponent(albums[0].id)}`:'';
    const page=Math.max(0,Math.min(500,Number.parseInt(req.query?.page||'0',10)||0)),limit=60,offset=page*limit;
    let featuredFilter='';if(req.query?.featured==='true'){const clauses=['featured.eq.true'];const coverIds=albums.map(a=>a.cover_item_id).filter(Boolean);if(coverIds.length)clauses.push(`id.in.(${coverIds.join(',')})`);if(albums.length)clauses.push(`album_id.in.(${albums.map(a=>a.id).join(',')})`);featuredFilter=`&or=(${clauses.join(',')})`;}
    const items=await rows(url,anon,'gallery_items',`select=id,title,caption,category,consent_confirmed,status,sort_order,image_url,album_id,alt_text,photographer_credit,event_date,featured,thumbnail_path,storage_path&status=eq.published&consent_confirmed=eq.true${itemAlbum}${featuredFilter}&order=featured.desc,sort_order.asc,created_at.desc&limit=${limit}&offset=${offset}`);
    let visible=items.filter(item=>!item.album_id||albums.some(album=>album.id===item.album_id));
    if(req.query?.featured==='true'){const featuredAlbumIds=new Set(albums.map(a=>a.id)),coverIds=new Set(albums.map(a=>a.cover_item_id).filter(Boolean));visible=visible.filter(item=>item.featured||coverIds.has(item.id)||(item.album_id&&featuredAlbumIds.has(item.album_id)));}
    const output=await Promise.all(visible.map(async item=>{const preview=item.thumbnail_path?await signedUrl(item.thumbnail_path,600,service,url):(item.storage_path?await signedUrl(item.storage_path,600,service,url):item.image_url);const {storage_path,thumbnail_path,...publicItem}=item;return {...publicItem,image_url:preview,preview_url:preview};}));
    res.setHeader('Cache-Control','public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({categories,albums:publicAlbums,items:output,has_more:items.length===limit,page});
  }catch(error){return res.status(502).json({error:error.message||'Gallery content is temporarily unavailable.'});}
}
