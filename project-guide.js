/* Contextual guide; session-only progress stays in this browser. */
(function(){
 'use strict';
 const $=(s,root=document)=>root.querySelector(s);
 const grid=$('#projects'),modal=$('#case'),home=Boolean(grid&&modal);
 const storage={get(key){try{return JSON.parse(sessionStorage.getItem('portfolio-guide-'+key)||'null')}catch(_){return null}},set(key,value){try{sessionStorage.setItem('portfolio-guide-'+key,JSON.stringify(value))}catch(_){}}};
 const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!=null)el.textContent=text;return el};
 const guide=make('aside','project-guide');guide.setAttribute('aria-label','Portfolio guide');
 const figure=make('div','project-guide-avatar');figure.setAttribute('aria-hidden','true');figure.innerHTML="<svg viewBox=\"0 0 210 165\" aria-hidden=\"true\"><ellipse cx=\"94\" cy=\"151\" rx=\"44\" ry=\"6\" fill=\"#000\" opacity=\".25\"/><g class=\"analyst-body\"><g class=\"analyst-leg leg-back\"><path d=\"M85 104L85 126\" stroke=\"#44523d\" stroke-width=\"13\" stroke-linecap=\"round\"/><g class=\"analyst-shin shin-back\"><path d=\"M85 126L82 147\" stroke=\"#44523d\" stroke-width=\"12\" stroke-linecap=\"round\"/><g class=\"analyst-foot foot-back\"><path d=\"M79 148H94\" stroke=\"#e0e6d0\" stroke-width=\"9\" stroke-linecap=\"round\"/></g></g></g><g class=\"analyst-leg leg-front\"><path d=\"M102 104L102 126\" stroke=\"#6c7a5d\" stroke-width=\"13\" stroke-linecap=\"round\"/><g class=\"analyst-shin shin-front\"><path d=\"M102 126L103 147\" stroke=\"#6c7a5d\" stroke-width=\"12\" stroke-linecap=\"round\"/><g class=\"analyst-foot foot-front\"><path d=\"M100 149H117\" stroke=\"#f2f3e9\" stroke-width=\"9\" stroke-linecap=\"round\"/></g></g></g><path d=\"M83 61Q94 55 105 65L113 102Q97 114 77 102Z\" fill=\"#d7fc70\"/><g class=\"analyst-free-arm\"><path d=\"M84 69L72 87L82 99\" stroke=\"#87583c\" stroke-width=\"10\" stroke-linecap=\"round\" fill=\"none\"/></g><g class=\"analyst-head\"><path d=\"M92 49V64\" stroke=\"#87583c\" stroke-width=\"12\" stroke-linecap=\"round\"/><ellipse cx=\"94\" cy=\"36\" rx=\"20\" ry=\"24\" fill=\"#a97550\"/><path d=\"M75 34Q70 13 88 11Q103 4 113 20L113 33L106 29L103 22L96 24L89 21L82 27L81 36Z\" fill=\"#252b24\"/><circle cx=\"77\" cy=\"37\" r=\"5\" fill=\"#a97550\"/><circle cx=\"102\" cy=\"34\" r=\"2\" fill=\"#21251d\"/><path d=\"M109 39L115 42L108 44\" fill=\"#a97550\"/><path d=\"M101 48Q106 52 111 47\" fill=\"none\" stroke=\"#543b2d\" stroke-width=\"1.8\" stroke-linecap=\"round\"/></g><g class=\"sorting-arm\"><path d=\"M103 70L122 82L143 73\" stroke=\"#a97550\" stroke-width=\"10\" stroke-linecap=\"round\" fill=\"none\"/><path d=\"M142 73L153 70\" stroke=\"#a97550\" stroke-width=\"5\" stroke-linecap=\"round\"/><circle class=\"sort-cursor\" cx=\"156\" cy=\"70\" r=\"9\" fill=\"none\" stroke=\"#d7fc70\" stroke-width=\"1.5\"/><circle cx=\"156\" cy=\"70\" r=\"3\" fill=\"#d7fc70\"/></g><path d=\"M84 70L95 75\" stroke=\"#b1d15b\" stroke-width=\"2\" stroke-linecap=\"round\"/></g></svg>";
 const copy=make('div','project-guide-copy'),label=make('span','project-guide-label','A little curiosity goes a long way'),message=make('p','project-guide-message'),hint=make('span','project-guide-hint'),link=make('a','project-guide-link','Back to selected work ↗');
 link.href='index.html#work';link.hidden=home;copy.append(label,message,hint);guide.append(figure,copy,link);
 const live=make('span','project-guide-live');live.setAttribute('role','status');live.setAttribute('aria-live','polite');live.setAttribute('aria-atomic','true');guide.append(live);
 function pose(name){guide.classList.remove('is-pointing','is-reading','is-celebrating');if(name)guide.classList.add(name)}
 function say(text,detail,state,announce=false){message.textContent=text;hint.textContent=detail||'';pose(state);if(announce)live.textContent=text}
 function celebrate(text,detail){say(text,detail,'is-celebrating',true)}
 document.addEventListener('visibilitychange',()=>guide.classList.toggle('is-resting',document.hidden));
 if(home){
  const work=$('#work'),slot=make('div','project-guide-home-slot'),filters=$('.filters',work);if(filters)filters.insertAdjacentElement('afterend',slot);else work.prepend(slot);slot.append(guide);
  let current=null,read=false,inside=false,lastPointed='';
  function idle(){say('What would you like to explore?','Choose a project below. I’ll show you around.','');lastPointed=''}
  function projectFrom(target){const button=target.closest?.('[data-project]')||target.closest?.('.project')?.querySelector('[data-project]');if(!button)return null;const card=button.closest('.project');return{id:button.dataset.project,title:card?.querySelector('h3')?.textContent?.trim()||'this project'}}
  function point(e){if(inside)return;const project=projectFrom(e.target);if(!project||project.id===lastPointed)return;lastPointed=project.id;say(project.title,'Open the project to explore its question, process, and findings.','is-pointing')}
  grid.addEventListener('pointerover',point);grid.addEventListener('focusin',point);
  grid.addEventListener('click',e=>{const project=projectFrom(e.target);if(!project||!modal.open)return;current=project;read=false;inside=true;modal.append(guide);say('Let’s look closer.','Explore the overview, then open the full project if it catches your interest.','is-reading');requestAnimationFrame(checkRead)});
  function checkRead(){if(inside&&modal.open&&modal.scrollTop+modal.clientHeight>=modal.scrollHeight-24)read=true}
  modal.addEventListener('scroll',checkRead,{passive:true});
  const fullLink=$('#caselink');fullLink?.addEventListener('click',()=>{if(!current)return;const href=fullLink.getAttribute('href')||'';if(href&&!href.startsWith('#'))storage.set('pending',{...current,path:href.split('#')[0]})},true);
  modal.addEventListener('close',()=>{slot.append(guide);inside=false;lastPointed='';if(current&&read){const seen=storage.get('overviews')||[];if(!seen.includes(current.id)){seen.push(current.id);storage.set('overviews',seen)}celebrate('Overview explored.','Choose another project whenever you’re ready.')}else idle();current=null;read=false});
  work.addEventListener('click',e=>{if(e.target.closest?.('[data-filter]')&&!inside)idle()});
  const completed=storage.get('completed');if(completed?.title){celebrate('Welcome back.','You reached the end of '+completed.title+' Explore another project below.');storage.set('completed',null)}else idle();
 }else{
  const footer=$('.sitefooter')||$('footer');if(!footer)return;
  const slot=make('div','project-guide-end');slot.append(guide);footer.insertAdjacentElement('beforebegin',slot);
  const pending=storage.get('pending'),page=location.pathname.split('/').pop()||'index.html';
  const matches=pending&&pending.path.split('/').pop()===page;
  const title=matches?pending.title:(document.title.split('—')[0].trim()||'this project');
  say('There’s more to explore.','Return to the collection when you’re ready.','is-pointing');
  let done=false;
  function finish(){if(done)return;done=true;celebrate('That’s the story.','Explore another project, or get in touch about your own data.');if(matches){storage.set('completed',{id:pending.id,title});storage.set('pending',null)}}
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){finish();observer.disconnect()}},{threshold:.15});observer.observe(slot)}else finish();
 }
})();