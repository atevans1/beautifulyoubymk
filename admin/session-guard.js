(async()=>{
  try{
    const response=await fetch('/api/session',{credentials:'same-origin'});
    if(!response.ok) throw new Error('Sign-in required');
    window.beautifulYouSession=await response.json();
  }catch(error){location.replace('login.html');}
})();
