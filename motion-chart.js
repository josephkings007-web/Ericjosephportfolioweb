/* Automatic looping motion. The operating-system reduced-motion preference is respected. */
(function(){
 'use strict';
 const media=window.matchMedia('(prefers-reduced-motion: reduce)');
 const api={get enabled(){return !media.matches},get reduced(){return media.matches}};
 window.PortfolioMotion=api;
 function apply(){document.documentElement.dataset.motion=api.enabled?'on':'off';window.dispatchEvent(new CustomEvent('portfolio:motion',{detail:{enabled:api.enabled}}))}
 media.addEventListener?.('change',apply);apply();
 if(window.Chart){Chart.defaults.animation={duration:1400,easing:'easeOutQuart'};Chart.register({id:'portfolioMotionPreference',beforeInit(chart){if(!api.enabled)chart.options.animation=false},beforeUpdate(chart){if(!api.enabled)chart.options.animation=false}})}
})();