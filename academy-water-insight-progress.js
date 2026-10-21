/* Read-only hall for the new water trial. No legacy record writes. */
(()=>{
'use strict';
const M=window.WaterInsight,$=id=>document.getElementById(id);
function refresh(){
 let s=null,available=true;try{s=M.restore(localStorage.getItem(M.KEY));}catch{available=false;}
 const status=s?.passed?'passed':s&&(s.records.length>1||s.answer||s.notes||s.attempts)?'in-progress':'new';
 const labels={new:['未受験','入室する →'],'in-progress':['挑戦中','続きから →'],passed:['合格済み ✓','再入室する →']};
 $('water-status').textContent=labels[status][0];$('water-action').textContent=labels[status][1];$('water-status').classList.toggle('passed',status==='passed');$('water-status').classList.toggle('in-progress',status==='in-progress');$('water-door').classList.toggle('passed',status==='passed');$('water-seal').classList.toggle('passed',status==='passed');$('water-seal').querySelector('.seal-state').textContent=status==='passed'?'合格':'未合格';
 let old;try{old=window.AcademyHallProgress.readProgress(localStorage);}catch{old={passed:0,storageAvailable:false};}
 $('academy-progress').textContent='合格 '+(old.passed+Number(status==='passed'))+' / 4 科目';$('graduation-note').textContent='この回廊の水魔法学は第2研究試作です。風魔法学と卒業試験は準備中です。';
 if(!available||!old.storageAvailable)$('hall-save-note').textContent='保存記録を確認できません。各教室の保存状況をご確認ください。';
}
refresh();window.addEventListener('pageshow',refresh);window.addEventListener('storage',refresh);
})();
