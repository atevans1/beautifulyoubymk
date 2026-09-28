export function readAccessToken(req){
  const bearer=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  if(bearer) return bearer;
  const cookie=String(req.headers.cookie||'').split(';').map(value=>value.trim()).find(value=>value.startsWith('by_access='));
  if(!cookie) return '';
  try{return decodeURIComponent(cookie.slice('by_access='.length));}catch{return '';}
}
export function readTemporaryAccessToken(req){
  const cookie=String(req.headers.cookie||'').split(';').map(value=>value.trim()).find(value=>value.startsWith('by_temp_access='));
  if(!cookie) return '';
  try{return decodeURIComponent(cookie.slice('by_temp_access='.length));}catch{return '';}
}
export function setSessionCookie(res,token,expiresIn){
  const age=Math.max(60,Math.min(Number(expiresIn)||3600,3600));
  appendCookie(res,`by_access=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`);
}
export function setTemporaryAccessCookie(res,token,expiresIn){
  const age=Math.max(60,Math.min(Number(expiresIn)||3600,3600));
  appendCookie(res,`by_temp_access=${encodeURIComponent(token)}; Path=/api/password-update; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`);
}
export function clearTemporaryAccessCookie(res){appendCookie(res,'by_temp_access=; Path=/api/password-update; HttpOnly; Secure; SameSite=Lax; Max-Age=0');}
export function clearSessionCookie(res){appendCookie(res,'by_access=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');}
function appendCookie(res,cookie){const current=res.getHeader?.('Set-Cookie');const values=Array.isArray(current)?current:current?[current]:[];res.setHeader('Set-Cookie',[...values,cookie]);}
