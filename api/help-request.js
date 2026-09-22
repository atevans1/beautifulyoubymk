export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const contact=String(req.body?.contact||'').trim(),message=String(req.body?.message||'').trim(),urgent=req.body?.urgent,consent=req.body?.consent;
  if(!contact||contact.length>254||!message||message.length>5000||consent!==true||!['true','false',true,false].includes(urgent)) return res.status(400).json({error:'Enter valid contact details and a message under 5,000 characters, then confirm consent.'});
  if(contact.includes('@')&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) return res.status(400).json({error:'Enter a valid email address or phone number.'});
  if(!contact.includes('@')&&!/^\+?[0-9().\s-]{7,25}$/.test(contact)) return res.status(400).json({error:'Enter a valid email address or phone number.'});
  const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!service) return res.status(500).json({error:'Help requests are not configured yet.'});
  const isEmail=contact.includes('@');
  const payload={safe_email:isEmail?contact:null,safe_phone:isEmail?null:contact,preferred_contact_method:isEmail?'email':'phone',support_needed:message,short_description:message.slice(0,500),immediate_safety_concern:urgent==='true'||urgent===true,consent_acknowledged_at:new Date().toISOString()};
  const result=await fetch(`${url}/rest/v1/help_requests`,{method:'POST',headers:{apikey:service,'Content-Type':'application/json','Content-Profile':'beautiful_you',Prefer:'return=minimal'},body:JSON.stringify(payload)});
  if(!result.ok) return res.status(500).json({error:'We could not send your request. Please try again when safe.'});
  return res.status(200).json({message:'Your request was sent confidentially. We will respond when it is safe to do so.'});
}
