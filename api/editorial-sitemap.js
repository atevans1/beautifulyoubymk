import {anonKey,profileHeaders,supabaseUrl,xmlEscape} from './_editorial.js';
const site='https://beautifulyoumk.com';
export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).send('Method not allowed.');
  const url=supabaseUrl(),key=anonKey();if(!url||!key)return res.status(503).send('Sitemap is temporarily unavailable.');
  const now=new Date().toISOString(),params=new URLSearchParams({select:'slug,updated_at,published_at',status:'eq.published',published_at:`lte.${now}`,order:'published_at.desc',limit:'5000'});
  const result=await fetch(`${url}/rest/v1/posts?${params}`,{headers:profileHeaders(key)});if(!result.ok)return res.status(502).send('Sitemap is temporarily unavailable.');
  const posts=await result.json(),staticPaths=['/','/about','/programmes','/gallery','/resources','/donate','/partner','/contact','/privacy','/safeguarding'];
  const urls=staticPaths.map(path=>`<url><loc>${site}${path}</loc></url>`).concat(posts.map(post=>`<url><loc>${site}/resources/${encodeURIComponent(post.slug)}</loc><lastmod>${xmlEscape(post.updated_at||post.published_at)}</lastmod></url>`));
  res.setHeader('Content-Type','application/xml; charset=utf-8');res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=600');return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`);
}
