/* The text grows once on arrival; the gardener keeps caring for it. */
(function(){
 const garden=document.querySelector('.headline-garden');
 if(!garden)return;
 const avatar=garden.querySelector('.garden-avatar');
 const media=window.matchMedia('(prefers-reduced-motion: reduce)');
 let rewardTimer;
 avatar?.addEventListener('click',()=>{
  if(media.matches)return;
  garden.classList.remove('garden-extra-water');
  requestAnimationFrame(()=>{garden.classList.add('garden-extra-water');clearTimeout(rewardTimer);rewardTimer=setTimeout(()=>garden.classList.remove('garden-extra-water'),1800)});
 });
 document.addEventListener('visibilitychange',()=>garden.classList.toggle('garden-resting',document.hidden));
 media.addEventListener?.('change',()=>{if(media.matches){garden.classList.remove('garden-extra-water');clearTimeout(rewardTimer)}});
})();
