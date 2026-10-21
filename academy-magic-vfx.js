/* Academy spell choreography v1: purely visual; no puzzle state, timers or grading changes. */
(()=>{
'use strict';
if(window.AcademyMagicVFX)return;
const GLYPHS={
 fire:'<path d="M143 86C145 109 170 115 164 142C159 164 132 172 119 153C110 139 120 124 125 114C123 130 135 139 139 144C150 130 133 112 143 86Z" fill="currentColor" fill-opacity=".24"/><path d="M140 127C139 144 152 150 142 160C133 165 125 155 132 146Z" fill="currentColor"/><path d="M111 152l-10 5m76-29 12-7m-70-30-8-12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
 water:'<path d="M140 87C128 111 115 124 115 144a25 25 0 0 0 50 0c0-20-13-33-25-57Z" fill="currentColor" fill-opacity=".16" stroke="currentColor" stroke-width="3"/><path d="M125 146q7 12 25 0M110 172q30-10 60 0M117 181q23-7 46 0" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>',
 wind:'<path d="M103 124h70c15 0 17-20 5-20-7 0-10 5-10 9M94 140h88c19 0 21 23 7 23-7 0-11-5-11-10M111 157h40c12 0 13 14 6 18-5 3-12-1-11-6" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/><path d="M125 107q18-22 34-23-7 22-28 29" stroke="currentColor" fill="currentColor" fill-opacity=".19" stroke-width="2"/>',
 earth:'<path d="M140 92 174 110 174 150 140 170 106 150 106 110Z" fill="currentColor" fill-opacity=".17" stroke="currentColor" stroke-width="3"/><path d="m140 92 0 41-34 17m34-17 34 17M125 117l15 16 17-18M116 162l17 14m31-14-14 14" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="m128 105 12-6 13 6" fill="none" stroke="currentColor" stroke-width="1.8"/>'
};
const LABEL={fire:'IGNIS',water:'AQUA',wind:'VENTUS',earth:'TERRA'};
const COLORS={fire:'#f0b16b',water:'#8fdfed',wind:'#cbdfe4',earth:'#d3c290'};
const SELECTOR='button, [data-target], [data-piece], .cell';
let active=null,removeTimer=0;
function reduced(){return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || !!document.querySelector('#reduced:checked');}
function selected(){return document.querySelector('[data-magic][aria-pressed="true"]')?.dataset.magic || document.querySelector('[data-spell][aria-pressed="true"]')?.dataset.spell || 'earth';}
function visible(el){
 if(!el)return false;
 const r=el.getBoundingClientRect();
 return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;
}
function pointFor(el,x=.5,y=.5){
 if(!el)return null;
 const r=el.getBoundingClientRect();
 if(!r.width||!r.height)return null;
 return {x:r.left+r.width*x,y:r.top+r.height*y};
}
function emblem(spell){
 const ticks=Array.from({length:16},(_,i)=>{
  const angle=i*Math.PI/8;const x1=140+Math.cos(angle)*88,y1=140+Math.sin(angle)*88,x2=140+Math.cos(angle)*(i%4===0?103:97),y2=140+Math.sin(angle)*(i%4===0?103:97);
  return '<path d="M'+x1.toFixed(2)+' '+y1.toFixed(2)+'L'+x2.toFixed(2)+' '+y2.toFixed(2)+'"/>';
 }).join('');
 const star=Array.from({length:12},(_,i)=>{
  const angle=-Math.PI/2+i*Math.PI/6,r=i%2===0?65:55;
  return (i?'L':'M')+(140+Math.cos(angle)*r).toFixed(2)+' '+(140+Math.sin(angle)*r).toFixed(2);
 }).join('')+'Z';
 const particles=Array.from({length:9},(_,i)=>{
  const a=(i*137.5-75)*Math.PI/180;const d=74+i%3*16;
  const x=140+Math.cos(a)*d,y=140+Math.sin(a)*d;
  const starpath=spell==='earth'?'M-5 0L0-7L5 0L0 7Z':'M0-5L2-2L5 0L2 2L0 5L-2 2L-5 0L-2-2Z';
  return '<path class="amv-spark" style="animation-delay:'+(i*.075).toFixed(3)+'s" transform="translate('+x.toFixed(1)+' '+y.toFixed(1)+') scale('+(i%3===0?1:.62)+')" d="'+starpath+'"/>';
 }).join('');
 return '<svg class="amv-sigil" viewBox="0 0 280 280" aria-hidden="true" focusable="false">'+
 '<circle class="amv-halo" cx="140" cy="140" r="122"/>'+
 '<g class="amv-outer"><circle cx="140" cy="140" r="105"/><circle cx="140" cy="140" r="86"/>'+ticks+'</g>'+
 '<g class="amv-lace"><path d="'+star+'"/><circle cx="140" cy="140" r="57"/><circle cx="140" cy="140" r="50"/><path d="M140 23V42M140 238V257M23 140H42M238 140H257"/></g>'+
 '<g class="amv-element">'+GLYPHS[spell]+'</g><g class="amv-stars">'+particles+'</g>'+
 '<text x="140" y="219" class="amv-label" text-anchor="middle">'+LABEL[spell]+'</text></svg>';
}
function wipe(){clearTimeout(removeTimer);if(active){active.remove();active=null;}}
function cast(spell,anchor,options={}){
 if(!Object.hasOwn(GLYPHS,spell)||document.hidden)return;
 wipe();
 const still=reduced();const p=pointFor(anchor,options.x??.5,options.y??.5);
 if(!p)return;
 const width=Math.min(268,Math.max(178,innerWidth*.57)),margin=width*.3;
 const x=Math.min(Math.max(p.x,margin),innerWidth-margin);
 const y=Math.min(Math.max(p.y,margin),innerHeight-margin);
 const overlay=document.createElement('div');
 overlay.className='academy-magic-vfx amv-'+spell+(still?' amv-reduced':'');
 overlay.style.setProperty('--amv-color',COLORS[spell]);
 overlay.style.left=x+'px';overlay.style.top=y+'px';
 overlay.style.width=width+'px';overlay.style.height=width+'px';
 overlay.setAttribute('aria-hidden','true');
 overlay.innerHTML=emblem(spell);
 const dialog=anchor?.closest('dialog[open]') || document.querySelector('dialog[open]')?.contains(anchor)&&document.querySelector('dialog[open]');
 (dialog||document.body).appendChild(overlay);
 active=overlay;
 removeTimer=setTimeout(()=>{if(active===overlay){overlay.remove();active=null;}},still?480:1130);
}
function fireAnchor(btn){
 const side=btn?.dataset.lamp;
 return (side&&document.querySelector('#room [data-target="lamp:'+side+'"]'))||btn;
}
function handle(source){
 if(!(source instanceof Element))return;
 if(source.closest('dialog#resetDialog'))return;
 let spell=null,anchor=null,opt={};
 // The manual valve, shade cover, view and recording controls are not spells.
 const water=source.closest('#smallPour,#fullPour,#bathPour');
 if(water&&document.getElementById('sceneScroll')){
  spell='water';
  anchor=document.querySelector('.mobile-scene')&&getComputedStyle(document.querySelector('.mobile-scene')).display!=='none'
   ?document.getElementById('mobileScene'):document.getElementById('scene');
  opt={x:water.id==='bathPour'?.85:.18,y:water.id==='bathPour'?.75:.72};
 }
 const wind=source.closest('[data-wind]');
 if(!spell&&wind && wind.dataset.wind!=='still'){
  spell='wind';anchor=document.getElementById('scene')||wind;opt={x:.2,y:.77};
 }
 const lamp=source.closest('[data-lamp]');
 if(!spell&&lamp){spell=selected();anchor=fireAnchor(lamp);}
 const fireTarget=source.closest('#room [data-target],#zoomContent [data-target]');
 if(!spell&&fireTarget){spell=selected();anchor=fireTarget;}
 const other=source.closest('#otherMagic');
 if(!spell&&other){spell=selected();anchor=document.getElementById('scene')||document.getElementById('sceneScroll')||other;opt={x:.24,y:.75};}
 if(!spell && document.getElementById('board')){
  const placed=source.closest('#cast');
  const cell=source.closest('#board .cell');
  const piece=source.closest('#rack [data-piece]');
  if(placed && !placed.disabled){spell='earth';anchor=document.getElementById('board');opt={x:.5,y:.62};}
  else if(cell&&selected()!=='earth'){spell=selected();anchor=cell;}
  else if(piece){spell=selected();anchor=piece;}
  else if(cell&&selected()==='earth'&&cell.classList.contains('occupied')){spell='earth';anchor=cell;}
 }
 if(!spell||!anchor)return;
 if(!visible(anchor)){const button=source.closest(SELECTOR);if(button&&visible(button)){anchor=button;opt={};}else return;}
 cast(spell,anchor,opt);
}
document.addEventListener('click',e=>handle(e.target),true);
document.addEventListener('keydown',e=>{
 if(e.repeat||!['Enter',' '].includes(e.key))return;
 const target=e.target;
 if(target instanceof Element && target.closest('[data-target]') && !target.closest('button'))handle(target);
},true);
window.AcademyMagicVFX={cast};
})();