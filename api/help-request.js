export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const {contact,message,urgent,consent}=req.body||{};
  if(!contact||!message||consent!==true) return res.status(400).json({error:'Contact details, a message, and consent are required.'});
  const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!service) return res.status(500).json({error:'Help requests are not configured yet.'});
  const isEmail=contact.includes('@');
  const payload={safe_email:isEmail?contact:null,safe_phone:isEmail?null:contact,preferred_contact_method:isEmail?'email':'phone',support_needed:message,short_description:message.slice(0,500),immediate_safety_concern:urgent==='true'||urgent===true,consent_acknowledged_at:new Date().toISOString()};
  const result=await fetch(`${url}/rest/v1/help_requests`,{method:'POST',headers:{apikey:service,Authorization:`Bearer ${service}`,'Content-Type':'application/json','Content-Profile':'beautiful_you',Prefer:'return=minimal'},body:JSON.stringify(payload)});
  if(!result.ok) return res.status(500).json({error:'We could not send your request. Please try again when safe.'});
  return res.status(200).json({message:'Your request was sent confidentially. We will respond when it is safe to do so.'});
}
