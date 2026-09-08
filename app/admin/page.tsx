import { redirect } from 'next/navigation';
import { getBeautifulYouMembership } from '../../lib/supabase/membership';
export default async function AdminPage(){const membership=await getBeautifulYouMembership();if(!membership)redirect('/admin/login?error=unauthorized');return <main style={{fontFamily:'Arial,sans-serif',maxWidth:900,margin:'4rem auto',padding:'1.5rem'}}><h1>Beautiful You Admin</h1><p>Signed in as <strong>{membership.role}</strong>. Content management modules will appear here next.</p></main>}
