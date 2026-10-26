/* Progressive enhancement: existing content and dashboard data remain authoritative. */
(function(){
 'use strict';
 const motion=window.PortfolioMotion||{enabled:false,reduced:true,set(){}};
 const $=(s,root=document)=>root.querySelector(s),$$=(s,root=document)=>Array.from(root.querySelectorAll(s));
 const isHome=Boolean($('.herogrid'));
 const charts=()=>window.Chart?$$('canvas').map(c=>Chart.getChart(c)).filter(Boolean):[];
 const status=document.createElement('div');status.className='motion-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');document.body.append(status);
 let statusTimer;
 function announce(message){status.textContent=message;clearTimeout(statusTimer);statusTimer=setTimeout(()=>{status.textContent=''},3500)}
 function animate(el,frames,options){if(motion.enabled&&typeof el.animate==='function')el.animate(frames,options)}
 function replay(chart){if(!chart)return;chart.stop();if(motion.enabled){chart.options.animation={duration:1400,easing:'easeOutQuart'};chart.reset();chart.update()}else chart.update('none')}
 function button(label,fn){const b=document.createElement('button');b.type='button';b.className='motion-button';b.textContent=label;b.addEventListener('click',fn);return b}
 const bar=document.createElement('div');bar.className='motion-bar';bar.setAttribute('aria-label','Page interaction controls');
 const copy=document.createElement('div');copy.className='motion-bar-copy';copy.innerHTML='<span class="motion-pulse" aria-hidden="true"></span><div>'+(isHome?'A portfolio made to explore.':charts().length?'Go beyond the chart.':'Take a closer look.')+'<small>'+(charts().length?'Charts animate automatically. Hover for details, enlarge, or inspect the data.':isHome?'Filter projects, open a case study, and follow your curiosity.':'The product walkthrough cycles automatically. Choose any workflow to explore.')+'</small></div>';
 const actions=document.createElement('div');actions.className='motion-actions';
 bar.append(copy,actions);
 const anchor=isHome?$('.toolstrip'):$('.sitebar');if(anchor)anchor.insertAdjacentElement('afterend',bar);else document.body.prepend(bar);
 window.addEventListener('portfolio:motion',()=>{charts().forEach(c=>{c.stop();c.options.animation=motion.enabled?{duration:1400,easing:'easeOutQuart'}:false;c.update('none')})});


 /* The focus modal renders an independent chart, preserving the original canvas and data. */
 const focusDialog=document.createElement('dialog');focusDialog.className='motion-focus';focusDialog.setAttribute('aria-labelledby','motion-focus-heading');
 const focusTop=document.createElement('div');focusTop.className='motion-focus-top';
 const focusTitle=document.createElement('h2');focusTitle.id='motion-focus-heading';
 const closeFocus=button('Close ×',()=>focusDialog.close());closeFocus.setAttribute('aria-label','Close chart focus view');focusTop.append(focusTitle,closeFocus);
 const stage=document.createElement('div');stage.className='motion-focus-stage';const focusNote=document.createElement('p');focusNote.className='motion-focus-note';focusNote.textContent='Hover or tap the chart to inspect values. Use its legend to compare series. Press Escape to return.';
 focusDialog.append(focusTop,stage,focusNote);document.body.append(focusDialog);
 let focused=null;
 function copyConfig(value,seen=new WeakMap()){if(value===null||typeof value!=='object')return value;if(seen.has(value))return seen.get(value);const out=Array.isArray(value)?[]:{};seen.set(value,out);Object.keys(value).forEach(k=>{if(k!=='__proto__')out[k]=copyConfig(value[k],seen)});return out}
 function focusChart(chart,title,opener){if(focused)return;const canvas=document.createElement('canvas');canvas.setAttribute('role','img');canvas.setAttribute('aria-label',title+' enlarged chart');stage.replaceChildren(canvas);focusTitle.textContent=title;const overflow=document.body.style.overflow;focusDialog.showModal();document.body.style.overflow='hidden';const options=copyConfig(chart.config.options);options.responsive=true;options.maintainAspectRatio=false;try{const enlarged=new Chart(canvas,{type:chart.config.type,data:copyConfig(chart.data),options,plugins:chart.config.plugins});focused={chart:enlarged,opener,overflow};requestAnimationFrame(()=>{enlarged.resize();replay(enlarged)})}catch(error){document.body.style.overflow=overflow;focusDialog.close();stage.replaceChildren();announce('Focus view is unavailable for this chart. The original chart is unchanged.')}}
 focusDialog.addEventListener('close',()=>{if(!focused)return;const f=focused;focused=null;f.chart.destroy();stage.replaceChildren();document.body.style.overflow=f.overflow;f.opener.focus()});
 focusDialog.addEventListener('click',e=>{if(e.target===focusDialog){const r=focusDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)focusDialog.close()}});

 /* Data inspection never rewrites chart values, labels, or tooltip indexes. */
 function valueText(value){if(value===null||value===undefined)return '—';if(Array.isArray(value))return value.map(valueText).join(' / ');if(typeof value==='object')return Object.entries(value).map(([k,v])=>k+': '+valueText(v)).join(', ');return String(value)}
 function rowsFor(chart){const ds=chart.data.datasets;const n=Math.max(chart.data.labels?.length||0,...ds.map(d=>d.data?.length||0));return Array.from({length:n},(_,i)=>[valueText(chart.data.labels?.[i]??i+1),...ds.map(d=>valueText(d.data?.[i]))])}
 function csvText(headers,rows){return [headers,...rows].map(row=>row.map(v=>{let text=String(v);if(/^[=+@-]/.test(text)&&!/^[-+]?\d/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"'}).join(',')).join('\r\n')}
 function download(name,text){const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 const catalog=[];
 charts().forEach((chart,index)=>{
  const canvas=chart.canvas;const card=canvas.closest('.card,.chart-card,.project-card,.chart-box')||canvas.parentElement;
  const heading=card.querySelector('h2,h3,.chart-title,.card-title');const title=heading?.textContent.trim()||canvas.getAttribute('aria-label')||'Chart '+(index+1);
  canvas.setAttribute('role','img');canvas.setAttribute('aria-label',title+'. Interactive chart; data table available below.');
  if(!card.id)card.id='explore-chart-'+(index+1);catalog.push({chart,card,title});
  const controls=document.createElement('div');controls.className='motion-controls';controls.setAttribute('role','group');controls.setAttribute('aria-label','Explore '+title);
  const focusButton=button('⤢ Focus',()=>focusChart(chart,title,focusButton));
  const panel=document.createElement('div');panel.className='motion-tablepanel';panel.id='chart-data-'+index;panel.hidden=true;let built=false;
  const dataButton=button('≡ Explore data',()=>{const opening=panel.hidden;if(opening&&!built){buildTable();built=true}panel.hidden=!opening;dataButton.setAttribute('aria-expanded',String(opening));if(opening)animate(panel,[{opacity:0,transform:'translateY(-8px)'},{opacity:1,transform:'translateY(0)'}],{duration:300,easing:'ease-out'})});dataButton.setAttribute('aria-expanded','false');dataButton.setAttribute('aria-controls',panel.id);
  controls.append(focusButton,dataButton);
  const wrapper=canvas.parentElement;if(wrapper===card)canvas.insertAdjacentElement('afterend',controls);else wrapper.insertAdjacentElement('afterend',controls);
  controls.insertAdjacentElement('afterend',panel);
  function buildTable(){
   const hint=document.createElement('small');hint.textContent='Original chart values. Search the rows, compare series, or download the data.';panel.append(hint);
   if(chart.data.datasets.length>1){const series=document.createElement('div');series.className='motion-series';chart.data.datasets.forEach((d,i)=>{const label=document.createElement('label');const check=document.createElement('input');check.type='checkbox';check.checked=chart.isDatasetVisible(i);check.addEventListener('change',()=>{chart.setDatasetVisibility(i,check.checked);chart.update(motion.enabled?undefined:'none')});label.append(check,document.createTextNode(d.label||'Series '+(i+1)));series.append(label)});panel.append(series)}
   const label=document.createElement('label');label.textContent='Search chart data';const input=document.createElement('input');input.className='motion-search';input.type='search';input.placeholder='Type a label or value…';input.id='chart-search-'+index;label.htmlFor=input.id;
   const scroll=document.createElement('div');scroll.className='motion-table-scroll';scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label',title+' data');
   const table=document.createElement('table');const caption=document.createElement('caption');caption.textContent=title;caption.style.textAlign='left';caption.style.padding='8px 12px';table.append(caption);
   const headers=['Label',...chart.data.datasets.map((d,i)=>d.label||'Series '+(i+1))];const thead=document.createElement('thead'),tr=document.createElement('tr');headers.forEach(text=>{const th=document.createElement('th');th.scope='col';th.textContent=text;tr.append(th)});thead.append(tr);const tbody=document.createElement('tbody');table.append(thead,tbody);scroll.append(table);
   const count=document.createElement('div');count.className='motion-result';count.setAttribute('role','status');const rows=rowsFor(chart);
   function filtered(){const q=input.value.trim().toLowerCase();return rows.filter(r=>r.some(v=>v.toLowerCase().includes(q)))}
   function render(){const shown=filtered();tbody.replaceChildren(...shown.slice(0,200).map(row=>{const tr=document.createElement('tr');row.forEach(text=>{const td=document.createElement('td');td.textContent=text;tr.append(td)});return tr}));count.textContent=shown.length?'Showing '+Math.min(shown.length,200)+' of '+shown.length+' matching rows.':'No matching rows.'}
   input.addEventListener('input',render);const exportButton=button('↓ Download matching rows (CSV)',()=>{download((canvas.id||'chart')+'-data.csv',csvText(headers,filtered()));announce('Chart data downloaded.')});
   panel.append(label,input,scroll,count,exportButton);render();
  }
 });
 if(catalog.length){const label=document.createElement('label');label.className='motion-actions';const text=document.createElement('span');text.textContent='Jump to';text.style.fontSize='10px';const select=document.createElement('select');select.className='motion-jump';select.setAttribute('aria-label','Jump to a chart');const initial=document.createElement('option');initial.value='';initial.textContent='Choose a chart…';select.append(initial);catalog.forEach(({title},i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=title;select.append(option)});select.addEventListener('change',()=>{if(select.value==='')return;const item=catalog[Number(select.value)];const section=item.card.closest('.section[id^="sec-"]');if(section&&!section.classList.contains('active')&&typeof window.switchTab==='function')window.switchTab(section.id.slice(4));requestAnimationFrame(()=>{item.card.scrollIntoView({behavior:motion.enabled?'smooth':'auto',block:'start'});item.card.tabIndex=-1;item.card.focus({preventScroll:true});replay(item.chart)})});label.append(text,select);actions.append(label)}

 /* Reveal content on entry; charts replay when first visible, including hidden tabs. */
 if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(!entry.isIntersecting)return;const el=entry.target;if(motion.enabled){el.classList.add('motion-visible');if(window.Chart)$$('canvas',el).forEach(c=>replay(Chart.getChart(c)))}observer.unobserve(el)})},{threshold:.08});$$('.project,.card,.chart-card,.stat-box,.kpi,.skillslist details,.contribution article,.aboutgrid,.job,.section-header').forEach(el=>{el.classList.add('motion-card');observer.observe(el)})}
 document.addEventListener('toggle',e=>{if(e.target.tagName==='DETAILS'&&e.target.open)animate(e.target,[{opacity:.5},{opacity:1}],{duration:350})},true);
 const projectGrid=$('#projects');if(projectGrid&&'MutationObserver' in window)new MutationObserver(records=>{records.forEach(r=>{if(r.attributeName==='hidden'&&!r.target.hidden)animate(r.target,[{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}],{duration:450,easing:'ease-out'})})}).observe(projectGrid,{subtree:true,attributes:true,attributeFilter:['hidden']});
 const visual=$('.visual');if(visual&&matchMedia('(pointer:fine)').matches){visual.addEventListener('pointermove',e=>{if(!motion.enabled)return;const r=visual.getBoundingClientRect();visual.style.rotate=((e.clientX-r.left)/r.width-.5)*4+'deg'});visual.addEventListener('pointerleave',()=>{visual.style.rotate=''})}

 /* Loops start automatically, run only while visible, and never change source data. */
 function inView(el){if(document.hidden||!el.getClientRects().length)return false;const r=el.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight}
 const hovered=new Set();
 document.addEventListener('pointerover',e=>{const card=e.target.closest?.('.card,.chart-card,.motion-focus');if(card)hovered.add(card)});
 document.addEventListener('pointerout',e=>{const card=e.target.closest?.('.card,.chart-card,.motion-focus');if(card&&!card.contains(e.relatedTarget))hovered.delete(card)});
 function loopCharts(){if(!motion.enabled||document.hidden)return;charts().forEach(c=>{if(focused&&c!==focused.chart)return;const card=c.canvas.closest('.card,.chart-card,.motion-focus');if(!inView(c.canvas)||hovered.has(card)||card?.contains(document.activeElement))return;replay(c)})}
 setInterval(loopCharts,6500);
 const workflow=$('#workflow'),tabs=$$('[data-view]');
 if(workflow&&tabs.length){
  const stage=$('.productstage');let lastManual=0;
  tabs.forEach((b,i)=>b.addEventListener('click',e=>{if(e.isTrusted)lastManual=Date.now();animate(workflow,[{opacity:.2,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:600,easing:'ease-out'})}));
  setInterval(()=>{if(!motion.enabled||!inView(stage)||Date.now()-lastManual<9000||stage.contains(document.activeElement)||stage.matches(':hover'))return;const next=(tabs.findIndex(b=>b.getAttribute('aria-pressed')==='true')+1)%tabs.length;tabs[next].click()},4000);
 }
 window.PortfolioExplore={rowsFor,csvText,replay};
})();