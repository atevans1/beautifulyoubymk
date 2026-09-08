import Link from 'next/link';

export default function AdminLoginPage() {
  return <main style={{fontFamily:'Arial,sans-serif',maxWidth:520,margin:'6rem auto',padding:'1.5rem'}}>
    <p><Link href="/">← Beautiful You By M.K.</Link></p>
    <h1>Admin Login</h1>
    <p>This protected sign-in will use the existing LOI Supabase project and Beautiful You membership roles.</p>
    <p><Link href="/admin/login.html">Open the current login preview →</Link></p>
  </main>;
}
