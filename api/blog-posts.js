import {anonKey,profileHeaders,publicGalleryImages,supabaseUrl} from './_editorial.js';
export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed.'});
  const url=supabaseUrl(),key=anonKey();if(!url||!key)return res.status(503).json({error:'Editorial content is not configured.'});
  try{
    const page=Math.max(0,Math.min(500,Number.parseInt(req.query?.page||'0',10)||0)),limit=12,params=new URLSearchParams({select:'id,slug,title,subtitle,excerpt,content_type,category,tags,published_at,author_id,author_name,cover_gallery_item_id,featured,seo_title,seo_description,editorial_format',status:'eq.published',published_at:`lte.${new Date().toISOString()}`,order:'featured.desc,published_at.desc',limit:String(limit+1),offset:String(page*limit)});
    const category=String(req.query?.category||'').trim().slice(0,80),tag=String(req.query?.tag||'').trim().toLowerCase().replace(/[^a-z0-9 -]/g,'').slice(0,60),search=String(req.query?.q||'').replace(/[,*()%\\]/g,' ').trim().slice(0,60);
    if(category)params.set('category',`eq.${category}`);if(tag)params.set('tags',`cs.{${tag}}`);if(search)params.set('or',`(title.ilike.*${search}*,subtitle.ilike.*${search}*,excerpt.ilike.*${search}*,body.ilike.*${search}*)`);
    const [postsResult,categoriesResult]=await Promise.all([
      fetch(`${url}/rest/v1/posts?${params}`,{headers:profileHeaders(key)}),
      fetch(`${url}/rest/v1/post_categories?select=id,name,slug,description,sort_order&active=eq.true&order=sort_order.asc`,{headers:profileHeaders(key)})
    ]);
    if(!postsResult.ok||!categoriesResult.ok)return res.status(502).json({error:'Published stories are temporarily unavailable.'});
    const loaded=await postsResult.json(),categories=await categoriesResult.json(),has_more=loaded.length>limit,items=loaded.slice(0,limit),authorIds=[...new Set(items.map(p=>p.author_id).filter(Boolean))];
    const authorsResult=authorIds.length?await fetch(`${url}/rest/v1/post_authors?select=id,name,role_label,bio,avatar_url&id=in.(${authorIds.join(',')})&active=eq.true`,{headers:profileHeaders(key)}):null;
    const authors=authorsResult?.ok?await authorsResult.json():[],authorMap=new Map(authors.map(a=>[a.id,a]));
    const imageMap=await publicGalleryImages(items.map(p=>p.cover_gallery_item_id));
    const enriched=items.map(post=>({...post,author:authorMap.get(post.author_id)||null,cover_url:imageMap.get(post.cover_gallery_item_id)?.image_url||null}));
    res.setHeader('Cache-Control','public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({items:enriched,categories,page,has_more});
  }catch(error){return res.status(502).json({error:'Published stories are temporarily unavailable.'});}
}
