(function(){
 const story=document.querySelector('.clarity-story');if(!story)return;
 const avatar=story.querySelector('.clarity-avatar'),media=window.matchMedia('(prefers-reduced-motion: reduce)');let timer;
 avatar?.addEventListener('click',()=>{if(media.matches)return;story.classList.remove('clarity-again');requestAnimationFrame(()=>{story.classList.add('clarity-again');clearTimeout(timer);timer=setTimeout(()=>story.classList.remove('clarity-again'),2800)})});
 document.addEventListener('visibilitychange',()=>story.classList.toggle('clarity-resting',document.hidden));
 media.addEventListener?.('change',()=>{if(media.matches){story.classList.remove('clarity-again');clearTimeout(timer)}});
})();