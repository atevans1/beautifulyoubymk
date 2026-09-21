(async()=>{
  try{
    const response=await fetch('/api/session',{credentials:'include'});
    if(!response.ok){
      const data=await response.json().catch(()=>({}));
      if(response.status===401) return location.replace('login.html');
      document.body.insertAdjacentHTML('afterbegin',`<p style="padding:1rem;background:#ffe6e0;color:#6b2418">Admin access check failed: ${data.error||'server configuration error'}</p>`);
      throw new Error(data.error||'Admin access check failed.');
    }
    window.beautifulYouSession=await response.json();
  }catch(error){console.error(error);}
})();
