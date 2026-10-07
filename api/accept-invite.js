export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const token=String(req.body?.access_token||'');
  if(!token)return res.status(400).json({error:'Open the invitation email link to verify this account.'});
  const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon=process.env.SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!anon||!service)return res.status(500).json({error:'Invitation acceptance is not configured.'});
  const authHeaders={apikey:anon,Authorization:`Bearer ${token}`};
  const userResponse=await fetch(`${url}/auth/v1/user`,{headers:authHeaders});
  if(!userResponse.ok)return res.status(401).json({error:'This invitation link is invalid or expired. Ask the site owner to send a new invitation.'});
  const user=await userResponse.json();
  const memberResponse=await fetch(`${url}/rest/v1/members?user_id=eq.${encodeURIComponent(user.id)}&status=eq.invited&select=id,role`,{headers:{apikey:service,'Accept-Profile':'beautiful_you'}});
  if(!memberResponse.ok)return res.status(503).json({error:'We could not verify the invited account. Please contact the site owner.'});
  const memberships=await memberResponse.json();
  if(!memberships.length)return res.status(403).json({error:'This account does not have a pending site invitation.'});
  const activation=await fetch(`${url}/rest/v1/members?user_id=eq.${encodeURIComponent(user.id)}&status=eq.invited`,{method:'PATCH',headers:{apikey:service,'Content-Type':'application/json','Content-Profile':'beautiful_you',Prefer:'return=representation'},body:JSON.stringify({status:'active'})});
  if(!activation.ok)return res.status(503).json({error:'We verified your invitation, but could not activate your member record. Please contact the site owner.'});
  const activatedRows=await activation.json();
  if(!activatedRows.length)return res.status(403).json({error:'This invitation was already used or withdrawn. Ask the owner to review your member record.'});
  return res.status(200).json({message:'Your email is verified and your invitation is accepted. The site owner will send you a one-time password separately. You will choose your own password the first time you sign in.'});
}
