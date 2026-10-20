/* Additional research hall. Read-only adapter: original halls and exam records stay intact. */
(()=>{
'use strict';
const M=window.WaterExam,$=id=>document.getElementById(id);
function refresh(){
 let data=null,available=true;try{data=M.restore(localStorage.getItem(M.KEY));}catch{available=false;}
 const state=data?.passed?'passed':data&&(data.records.length||data.draft.some(p=>p.length)||data.notes||data.attempts)?'in-progress':'new';
 const text={new:['未受験','入室する →'],'in-progress':['挑戦中','続きから →'],passed:['合格済み ✓','再入室する →']};
 $('water-status').textContent=text[state][0];$('water-action').textContent=text[state][1];$('water-status').classList.toggle('passed',state==='passed');$('water-status').classList.toggle('in-progress',state==='in-progress');$('water-door').classList.toggle('passed',state==='passed');$('water-seal').classList.toggle('passed',state==='passed');$('water-seal').querySelector('.seal-state').textContent=state==='passed'?'合格':'未合格';
 let progress;try{progress=window.AcademyHallProgress.readProgress(localStorage);}catch{progress={passed:0,storageAvailable:false};}
 $('academy-progress').textContent='合格 '+(progress.passed+Number(state==='passed'))+' / 4 科目';
 $('graduation-note').textContent='炎・水・土の三教室へ入室できます。風魔法学と卒業試験は準備中です。';
 if(!available||!progress.storageAvailable)$('hall-save-note').textContent='このブラウザでは保存記録を確認できません。各教室の保存状況をご確認ください。';
}
refresh();window.addEventListener('pageshow',refresh);window.addEventListener('storage',refresh);
})();
