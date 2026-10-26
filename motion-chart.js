/* Shared motion preference; load after Chart.js and before dashboard constructors. */
(function(){
 'use strict';
 const media=window.matchMedia('(prefers-reduced-motion: reduce)');
 let saved;try{saved=localStorage.getItem('portfolio-motion')}catch(_){}
 let enabled=!media.matches&&saved!=='off';
 function apply(){document.documentElement.dataset.motion=enabled?'on':'off';window.dispatchEvent(new CustomEvent('portfolio:motion',{detail:{enabled}}))}
 const api={get enabled(){return enabled},get reduced(){return media.matches},set(value){enabled=Boolean(value)&&!media.matches;try{localStorage.setItem('portfolio-motion',enabled?'on':'off')}catch(_){}apply()}};
 window.PortfolioMotion=api;
 media.addEventListener?.('change',()=>{let choice;try{choice=localStorage.getItem('portfolio-motion')}catch(_){}enabled=!media.matches&&choice!=='off';apply()});
 apply();
 if(window.Chart){
  Chart.defaults.animation={duration:1000,easing:'easeOutQuart'};
  Chart.register({id:'portfolioMotionPreference',beforeInit(chart){if(!api.enabled)chart.options.animation=false},beforeUpdate(chart){if(!api.enabled)chart.options.animation=false}});
 }
})();