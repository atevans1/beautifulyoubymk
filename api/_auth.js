export function readAccessToken(req){
  const bearer=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  if(bearer) return bearer;
  const cookie=String(req.headers.cookie||'').split(';').map(value=>value.trim()).find(value=>value.startsWith('by_access='));
  return cookie?decodeURIComponent(cookie.slice('by_access='.length)):'';
}
export function setSessionCookie(res,token,expiresIn){
  const age=Math.max(60,Math.min(Number(expiresIn)||3600,3600));
  res.setHeader('Set-Cookie',`by_access=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`);
}
export function clearSessionCookie(res){res.setHeader('Set-Cookie','by_access=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');}
