/* Presentation, explanatory example and private notes. The exam model/app are reused unchanged. */
(()=>{
 'use strict';
 const M=window.FireArchive,$=id=>document.getElementById(id),NOTE='magic-academy-fire-notes-v1';let serial=0;
 for(const id of['observFirst','observSecond'])$(id).setAttribute('viewBox','0 0 700 360');
 function decorate(svg){
  if(!svg||svg.querySelector('[data-studio-defs]'))return;
  const id='studio-'+(++serial),base=svg.querySelector('rect');
  const defs=`<defs data-studio-defs="true"><linearGradient id="${id}-floor" x2="1" y2="1"><stop stop-color="#30373b"/><stop offset=".55" stop-color="#1a2b32"/><stop offset="1" stop-color="#352c2c"/></linearGradient><linearGradient id="${id}-brass"><stop stop-color="#6e5031"/><stop offset=".35" stop-color="#cfad70"/><stop offset=".58" stop-color="#927143"/><stop offset=".8" stop-color="#e2c38a"/><stop offset="1" stop-color="#6f5033"/></linearGradient><radialGradient id="${id}-glow"><stop stop-color="#ffd69a" stop-opacity=".53"/><stop offset="1" stop-color="#e2a35f" stop-opacity="0"/></radialGradient></defs>`;
  if(base){base.setAttribute('fill',`url(#${id}-floor)`);base.setAttribute('stroke','#b49562');}
  const lamps=Array.from(svg.querySelectorAll('[data-target^="lamp:"]'));
  svg.insertAdjacentHTML('afterbegin',defs);
  for(const lamp of lamps){
   const rect=lamp.querySelector('rect'),flame=lamp.querySelector('path'),dot=lamp.querySelector('circle');if(!rect||!flame||!dot)continue;
   const x=Number(dot.getAttribute('cx')),y=Number(dot.getAttribute('cy'))+1,lit=flame.getAttribute('fill')==='#ebbd73',open=dot.getAttribute('fill')==='#fff0c4';
   rect.setAttribute('fill',`url(#${id}-brass)`);rect.setAttribute('stroke',open?'#f6d79a':'#aa8855');rect.setAttribute('stroke-width','2');
   if(lit)flame.setAttribute('class','studio-flame');
   lamp.insertAdjacentHTML('afterbegin',`<g pointer-events="none"><circle class="studio-aura" cx="${x}" cy="${y-8}" r="63" fill="url(#${id}-glow)" opacity="${open?1:lit?.25:0}"/><ellipse cx="${x}" cy="${y+31}" rx="37" ry="8" fill="#0b191c" opacity=".5"/><path d="M${x-31} ${y+29}Q${x} ${y+18} ${x+31} ${y+29}L${x+24} ${y+34}H${x-24}Z" fill="url(#${id}-brass)" stroke="#caab6d"/></g>`);
   if(lit)flame.setAttribute('fill','#f3bf70');
  }
 }
 function decorateZoom(){const box=$('zoomContent');if($('zoomTitle').textContent==='配置図')box.querySelectorAll('svg').forEach(decorate);}
 decorate($('room'));
 const roomObserver=new MutationObserver(()=>decorate($('room')));roomObserver.observe($('room'),{childList:true});
 const zoomObserver=new MutationObserver(decorateZoom);zoomObserver.observe($('zoomContent'),{childList:true});
 const svgPath=points=>'M'+points.map(([x,z])=>`${(65+70*x).toFixed(2)},${(68-70*z).toFixed(2)}`).join('L')+'Z';
 function sample(mask,label){return `<figure><figcaption>${label}</figcaption><svg viewBox="0 0 130 140" aria-hidden="true"><rect x="11" y="8" width="108" height="120" rx="9" fill="#514e43" stroke="#ba9a62" stroke-width="2"/>${Object.entries(M.HOLES).map(([key,points])=>`<path d="${svgPath(points)}" fill="${mask&(1<<(key.charCodeAt(0)-97))?'#f6dda7':'#393d37'}"/>`).join('')}</svg></figure>`;}
 $('mechanismDiagram').innerHTML=sample(M.MASKS[4],'説明用の札：4')+sample(M.MASKS[7],'説明用の札：7')+sample(M.MASKS[4]&M.MASKS[7],'重なったとき');
 try{const saved=JSON.parse(localStorage.getItem(NOTE)||'null');if(saved?.version===1&&typeof saved.value==='string')$('experimentNotes').value=saved.value.slice(0,8000);}catch{}
 function saveNote(){const value=$('experimentNotes').value.slice(0,8000);$('notesCount').textContent=value.length+' / 8000';try{localStorage.setItem(NOTE,JSON.stringify({version:1,value}));$('notesStatus').textContent='この端末に保存しました';}catch{$('notesStatus').textContent='このブラウザではメモを保存できません';}}
 $('notesCount').textContent=$('experimentNotes').value.length+' / 8000';$('experimentNotes').addEventListener('input',saveNote);
 $('clearNotes').addEventListener('click',()=>{if(!confirm('実習ノートのメモを消しますか？'))return;$('experimentNotes').value='';saveNote();});
 let wasPassed=!$('pass').hidden;
 const passObserver=new MutationObserver(()=>{const passed=!$('pass').hidden;if(passed&&!wasPassed)$('pass').classList.add('just-passed');else if(!passed)$('pass').classList.remove('just-passed');wasPassed=passed;});passObserver.observe($('pass'),{attributes:true,attributeFilter:['hidden']});
 document.querySelectorAll('[data-zoom]').forEach(button=>button.addEventListener('click',()=>{const side=button.dataset.zoom,record=$(side==='first'?'observFirst':'observSecond');if(!record.getAttribute('aria-label')?.includes('未観測'))window.AcademySFX?.play('paper');}));
 $('compare').addEventListener('click',()=>{if(!['observFirst','observSecond'].every(id=>$(id).getAttribute('aria-label')?.includes('未観測')))window.AcademySFX?.play('paper');});
 $('mechanism').addEventListener('toggle',()=>{if($('mechanism').open)window.AcademySFX?.play('paper');});
 function objectSound(e){const target=e.target.closest('[data-target]');if(!target||target.dataset.target.startsWith('lamp:'))return;const magic=document.querySelector('[data-magic][aria-pressed="true"]')?.dataset.magic;window.AcademySFX?.play({fire:'ignite',water:'water',wind:'wind',earth:'lift'}[magic]);}
 for(const id of['room','zoomContent']){$(id).addEventListener('click',objectSound);$(id).addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')objectSound(e);});}
})();
