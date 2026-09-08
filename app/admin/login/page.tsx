import Link from 'next/link';
import { signIn } from './actions';

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const message = error === 'unauthorized' ? 'This account is not authorised for Beautiful You administration.' : error === 'invalid' ? 'The email or password was not recognised.' : error === 'missing' ? 'Enter your email and password.' : '';
  return <main style={{fontFamily:'Arial,sans-serif',maxWidth:520,margin:'6rem auto',padding:'1.5rem'}}><p><Link href="/">← Beautiful You By M.K.</Link></p><h1>Admin Login</h1><p>Sign in with an approved Beautiful You administrator account.</p><form action={signIn} style={{display:'grid',gap:'1rem'}}><label>Email<input name="email" type="email" autoComplete="email" required style={{display:'block',width:'100%',padding:'.7rem'}} /></label><label>Password<input name="password" type="password" autoComplete="current-password" required style={{display:'block',width:'100%',padding:'.7rem'}} /></label><button type="submit">Sign in</button></form>{message&&<p role="alert" style={{color:'#b44935'}}>{message}</p>}</main>;
}
