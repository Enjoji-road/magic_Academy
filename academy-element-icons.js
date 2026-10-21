/* Arcane Academy official elemental emblems. Shared paths for navigation, spell selectors and casting. */
(()=>{
'use strict';
const paths={
 fire:'<path d="M12 2.5c.7 4.5 5.9 6.6 5.9 11.6 0 3.7-2.5 6.4-5.9 6.4-3.7 0-6-2.6-6-6.1 0-2.8 1.8-5.1 3.6-7.2-.3 3.1.3 4.8 1.7 5.7 2-3.5.5-6.2.7-10.4Z"/><path d="M12.4 12.4c.2 2 2.6 3.3 2.1 5.3-.2 1.2-1.2 2.1-2.5 2.1-1.6 0-2.4-1.1-2.3-2.4.1-1.7 1.7-3.2 2.7-5Z" fill="currentColor" fill-opacity=".24"/>',
 water:'<path d="M12 2.6c-1.9 4.1-6.8 8.8-6.8 12A6.8 6.8 0 0 0 12 21.4a6.8 6.8 0 0 0 6.8-6.8c0-3.2-4.9-7.9-6.8-12Z"/><path d="M8.4 14.9a3.8 3.8 0 0 0 3.7 3.5"/><path d="M5.4 23h13.2"/>',
 wind:'<path d="M3 8.2h12.8c3.5 0 3.7-5 .5-5-1.8 0-2.5 1.1-2.4 2.3"/><path d="M2 12.5h17c3.7 0 3.9 5.1.7 5.1-1.6 0-2.5-1.1-2.3-2.5"/><path d="M5 17h8c3.4 0 3.4 4.7.8 4.7-1.4 0-2-.7-2-1.7"/>',
 earth:'<path d="m12 2.7 8 4.7v9.2l-8 4.7-8-4.7V7.4Z"/><path d="m4 7.4 8 4.7 8-4.7M12 12.1v9.2"/><path d="m7.5 5.5 4.5 2.7 4.5-2.7"/>'
};
const labels={fire:'炎',water:'水',wind:'風',earth:'土'};
function glyph(spell,variant='tab'){
 if(!Object.hasOwn(paths,spell))return '';
 const inner=paths[spell];
 if(variant==='vfx')return '<g transform="translate(98 98) scale(3.5)" stroke="currentColor" stroke-width=".8" fill="none" stroke-linecap="round" stroke-linejoin="round">'+inner+'</g>';
 return '<svg class="academy-element-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+inner+'</svg>';
}
function apply(root=document){
 root.querySelectorAll('[data-spell],[data-magic]').forEach(button=>{
  const spell=button.dataset.spell||button.dataset.magic;
  if(!Object.hasOwn(labels,spell)||button.dataset.academyIcon==='v1')return;
  const oldText=button.textContent.trim(); // preserve semantic label as text, not an emoji
  button.replaceChildren();
  const span=document.createElement('span');span.className='academy-element-text';span.textContent=labels[spell];
  button.insertAdjacentHTML('afterbegin',glyph(spell));
  button.append(span);
  button.classList.add('academy-element-button');
  button.dataset.academyIcon='v1';
  if(oldText && !oldText.includes(labels[spell]))button.title=oldText;
 });
 root.querySelectorAll('.classroom-door').forEach(door=>{
  const match=door.className.match(/door-(fire|water|wind|earth)/);
  if(!match)return;
  const svg=door.querySelector('.door-arch > svg');
  if(!svg||svg.dataset.academyIcon==='v1')return;
  svg.setAttribute('viewBox','0 0 24 24');
  svg.setAttribute('fill','none');
  svg.setAttribute('stroke','currentColor');
  svg.setAttribute('stroke-width','1.45');
  svg.setAttribute('stroke-linecap','round');
  svg.setAttribute('stroke-linejoin','round');
  svg.innerHTML=paths[match[1]];
  svg.dataset.academyIcon='v1';
  svg.classList.add('academy-door-symbol');
 });
 root.querySelectorAll('.symbol[data-element]').forEach(host=>{
  const spell=host.dataset.element;if(!Object.hasOwn(labels,spell))return;
  host.innerHTML=glyph(spell);host.classList.add('academy-symbol-icon');
 });
}
window.AcademyElementIcons={paths,glyph,apply};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>apply(),{once:true});
else apply();
})();
