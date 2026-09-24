export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed.'});
  const email=String(req.body?.email||'').trim().toLowerCase();
  if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({error:'Enter a valid email address.'});
  const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!anon)return res.status(503).json({error:'Password reset is not configured.'});
  const redirectTo='https://www.beautifulyoumk.com/admin/reset-password';
  try{
    const response=await fetch(`${url}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`,{method:'POST',headers:{apikey:anon,'Content-Type':'application/json'},body:JSON.stringify({email})});
    if(!response.ok)return res.status(502).json({error:'We could not request a reset email right now. Please try again later.'});
    return res.status(200).json({message:'If this email belongs to an account, password reset instructions will be sent. Check your inbox and spam folder.'});
  }catch{return res.status(503).json({error:'Password reset is temporarily unavailable. Please try again later.'});}
}
