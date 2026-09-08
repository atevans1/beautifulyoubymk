import { createClient } from './server';
export async function getBeautifulYouMembership() { const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)return null; const {data}=await supabase.schema('beautiful_you').from('members').select('role,status').eq('user_id',user.id).eq('status','active').maybeSingle(); return data; }
