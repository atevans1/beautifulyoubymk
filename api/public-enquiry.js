const configurations={
  donation:{table:'donors',required:['display_name','email'],map:i=>({display_name:i.display_name,email:i.email})},
  partnership:{table:'partnership_enquiries',required:['contact_name','email','message'],map:i=>({organisation_name:i.organisation_name||null,contact_name:i.contact_name,email:i.email,category:i.category||null,message:i.message})},
  volunteer:{table:'volunteer_applications',required:['name','email'],map:i=>({name:i.name,email:i.email,phone:i.phone||null,location:i.location||null,profession:i.profession||null,skills:i.skills||i.message||null,availability:i.availability||null,area_of_interest:i.area_of_interest||null,relevant_experience:i.relevant_experience||null,preferred_programme:i.preferred_programme||null})},
  professional:{table:'professional_applications',required:['name','email','professional_category'],map:i=>({name:i.name,organisation_name:i.organisation_name||null,email:i.email,phone:i.phone||null,location:i.location||null,professional_category:i.professional_category,credentials_summary:i.credentials_summary||null,availability:i.availability||null,message:i.message||null})}
};
export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const input=req.body||{},config=configurations[input.kind];
  if(!config||config.required.some(key=>!String(input[key]||'').trim())) return res.status(400).json({error:'Please complete the required fields.'});
  const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!service) return res.status(500).json({error:'Enquiries are not configured.'});
  const result=await fetch(`${url}/rest/v1/${config.table}`,{method:'POST',headers:{apikey:service,Authorization:`Bearer ${service}`,'Content-Type':'application/json','Content-Profile':'beautiful_you',Prefer:'return=minimal'},body:JSON.stringify(config.map(input))});
  if(!result.ok) return res.status(500).json({error:'We could not send your enquiry.'});
  return res.status(200).json({message:'Thank you. Your enquiry was received.'});
}
