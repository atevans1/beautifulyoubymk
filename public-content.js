(async()=>{
  const type=document.body.dataset.contentType;
  if(!type) return;
  const selectors={programmes:'.cards',gallery:'.gallery-grid',posts:'.resource-list'};
  const target=document.querySelector(selectors[type]);
  if(!target) return;
  try{
    const response=await fetch(`/api/public-content?type=${type}`);
    const records=await response.json();
    if(!response.ok||!Array.isArray(records)||records.length===0) return;
    if(type==='programmes') target.innerHTML=records.map(item=>`<article><h2>${escapeHtml(item.name)}</h2><p>${escapeHtml(item.summary||item.description||'')}</p></article>`).join('');
    if(type==='gallery') target.innerHTML=records.map(item=>`<article class="gallery-card"><img src="${escapeAttribute(item.image_url)}" alt="${escapeAttribute(item.title)}" loading="lazy"><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.caption||'')}</p></article>`).join('');
    if(type==='posts') target.innerHTML=records.map(item=>`<article><p class="eyebrow">${escapeHtml(item.category||item.content_type||'Resource')}</p><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.excerpt||'')}</p></article>`).join('');
  }catch(error){console.warn('Published content could not be loaded.');}
  function escapeHtml(value){const node=document.createElement('div');node.textContent=String(value||'');return node.innerHTML;}
  function escapeAttribute(value){return String(value||'').replace(/["'&<>]/g,char=>({"\"":'&quot;',"'":'&#39;','&':'&amp;','<':'&lt;','>':'&gt;'}[char]));}
})();
