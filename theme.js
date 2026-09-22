(()=>{
  let saved=null;
  try{saved=localStorage.getItem('by-theme')}catch{}
  const prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;
  const apply=dark=>{
    document.body.classList.toggle('dark',dark);
    try{localStorage.setItem('by-theme',dark?'dark':'light')}catch{}
    const button=document.querySelector('.theme-toggle');
    if(button)button.textContent=dark?'☀ Light':'◐ Dark';
  };
  window.toggleTheme=()=>apply(!document.body.classList.contains('dark'));
  apply(saved==='dark'||(saved===null&&prefersDark));
  if(!document.querySelector('.theme-toggle')){
    const button=document.createElement('button');
    button.type='button';button.className='theme-toggle';button.setAttribute('aria-label','Toggle colour theme');
    button.style.cssText='position:fixed;top:1rem;right:1rem;z-index:20';
    button.onclick=window.toggleTheme;document.body.append(button);
    button.textContent=document.body.classList.contains('dark')?'☀ Light':'◐ Dark';
  }else document.querySelector('.theme-toggle').onclick=window.toggleTheme;
})();
