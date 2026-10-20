/* The hall reads existing exam records. It never creates, repairs or changes them. */
(function(root,factory){
'use strict';
const api=factory();
if(typeof module==='object'&&module.exports)module.exports=api;
if(root.document){
 root.AcademyHallProgress=api;
 const refresh=()=>{let progress;try{progress=api.readProgress(root.localStorage);}catch{progress=api.readProgress(null);}api.render(root.document,progress);};
 refresh();root.addEventListener('pageshow',refresh);root.addEventListener('storage',refresh);
}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const FIRE_KEY='magic-academy-fire-experiment-v4',EARTH_KEY='magic-academy-earth-v2';
const FIRE_PUZZLE='fire-archive-six-leaves-20261020',PIECES='ABCDEFGHI';
function object(value){return value!==null&&typeof value==='object'&&!Array.isArray(value);}
function parse(raw){try{const value=JSON.parse(raw||'null');return object(value)?value:null;}catch{return null;}}
function fireState(data){
 if(!data||data.version!==4||data.puzzle!==FIRE_PUZZLE)return'new';
 if(data.passed===true)return'passed';
 return data.seen?.first===true||data.seen?.second===true||typeof data.answer==='string'&&data.answer.trim()!==''||Number.isSafeInteger(data.attempts)&&data.attempts>0?'in-progress':'new';
}
function earthState(data){
 if(!data||!object(data.pieces))return'new';
 for(const id of PIECES){const p=data.pieces[id];if(!object(p)||!Number.isInteger(p.rot)||p.rot<0||p.rot>3||typeof p.flip!=='boolean'||p.at!==null&&(!Array.isArray(p.at)||p.at.length!==2||!p.at.every(Number.isInteger)))return'new';}
 if(data.passed===true)return'passed';
 const changed=[...PIECES].some(id=>{const p=data.pieces[id];if(p.rot!==0||p.flip)return true;return id==='C'?!(Array.isArray(p.at)&&p.at[0]===2&&p.at[1]===2):p.at!==null;});
 return Number.isSafeInteger(data.moves)&&data.moves>0||data.discovered===true||changed?'in-progress':'new';
}
function readProgress(storage){
 let available=Boolean(storage&&typeof storage.getItem==='function');
 function get(key){try{return parse(storage.getItem(key));}catch{available=false;return null;}}
 const fire=fireState(get(FIRE_KEY)),earth=earthState(get(EARTH_KEY));
 return{fire,earth,passed:Number(fire==='passed')+Number(earth==='passed'),storageAvailable:available};
}
function render(document,progress){
 for(const kind of['fire','earth']){
  const state=progress[kind],badge=document.getElementById(kind+'-status'),action=document.getElementById(kind+'-action'),door=document.getElementById(kind+'-door'),seal=document.getElementById(kind+'-seal');
  badge.textContent={new:'未受験','in-progress':'挑戦中',passed:'合格済み ✓'}[state];
  badge.classList.toggle('passed',state==='passed');badge.classList.toggle('in-progress',state==='in-progress');
  door.classList.toggle('passed',state==='passed');
  action.textContent={new:'入室する →','in-progress':'続きから →',passed:'再入室する →'}[state];
  seal.classList.toggle('passed',state==='passed');seal.querySelector('.seal-state').textContent=state==='passed'?'合格':'未合格';
 }
 document.getElementById('academy-progress').textContent='合格 '+progress.passed+' / 4 科目';
 document.getElementById('graduation-note').textContent=progress.passed===2?'炎・土の合格を記録しています。水・風の開室をお待ちください。':'現在受験できるのは、炎・土の二教室です。';
 document.getElementById('hall-save-note').textContent=progress.storageAvailable?'途中経過と合格記録は、この端末のブラウザに保存されます。':'このブラウザでは保存記録を確認できません。各教室の保存状況をご確認ください。';
}
return{FIRE_KEY,EARTH_KEY,fireState,earthState,readProgress,render};
});
