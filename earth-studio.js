/* Sound-only additions for lifting and shelf magic; original EarthExam and app.js are unchanged. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 function rackSound(e){const card=e.target.closest('[data-piece]');if(!card)return;const magic=document.querySelector('[data-spell][aria-pressed="true"]')?.dataset.spell;
  if(magic==='earth'){if(card.getAttribute('aria-pressed')!=='true')window.AcademySFX?.play('lift');}
  else if(card.classList.contains('on-board')===false)window.AcademySFX?.play({water:'water',fire:'ignite',wind:'wind'}[magic]);
 }
 $('rack').addEventListener('click',rackSound,{capture:true});
 $('board').addEventListener('click',e=>{const cell=e.target.closest('.cell');if(!cell||document.querySelector('[data-spell][aria-pressed="true"]')?.dataset.spell!=='earth')return;if($('placementTools').hidden&&cell.classList.contains('occupied'))window.AcademySFX?.play('lift');},{capture:true});
})();
