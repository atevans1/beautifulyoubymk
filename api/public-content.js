const allowed={programmes:{table:'programmes',filter:'status=eq.published'},posts:{table:'posts',filter:'status=eq.published'},gallery:{table:'gallery_items',filter:'status=eq.published&consent_confirmed=eq.true'}};
export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  const config=allowed[req.query?.type];
  if(!config) return res.status(400).json({error:'Invalid content type.'});
  const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key) return res.status(500).json({error:'Public content is not configured.'});
  const result=await fetch(`${url}/rest/v1/${config.table}?select=*&${config.filter}`,{headers:{apikey:key,'Accept-Profile':'beautiful_you'}});
  if(!result.ok) return res.status(502).json({error:'Published content is temporarily unavailable.'});
  res.setHeader('Cache-Control','public, s-maxage=60, stale-while-revalidate=300');
  return res.status(200).json(await result.json());
}
