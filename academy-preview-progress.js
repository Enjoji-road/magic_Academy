/* Four-exam, read-only hall progression. Uses existing versioned localStorage keys; never writes to exam records. */
(function(root,factory){
'use strict';
const api=factory(root);
if(typeof module==='object'&&module.exports)module.exports=api;
if(root.document){
 root.AcademyHallProgress=api;
 const refresh=()=>{let progress;try{progress=api.readProgress(root.localStorage);}catch{progress=api.readProgress(null);}api.render(root.document,progress);};
 refresh();root.addEventListener('pageshow',refresh);root.addEventListener('storage',refresh);
}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const FIRE_KEY='magic-academy-fire-experiment-v4',EARTH_KEY='magic-academy-earth-v2';
const WATER_KEY='magic-academy-water-insight-v1',WIND_KEY='magic-academy-wind-ribbon-v1';
const FIRE_PUZZLE='fire-archive-six-leaves-20261020',WATER_PUZZLE='water-insight-displacement-20261021',PIECES='ABCDEFGHI';
const kinds=['fire','water','wind','earth'];
const statusLabels={new:'未受験','in-progress':'挑戦中',passed:'合格済み ✓'};
const actionLabels={new:'入室する →','in-progress':'続きから →',passed:'再入室する →'};
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
function waterState(data){
 if(!data||data.version!==1||data.puzzle!==WATER_PUZZLE||!object(data.physical)||!Array.isArray(data.records))return'new';
 // Validate through the actual exam model when present (same checks as loading the room).
 if(root.WaterInsight&& !root.WaterInsight.restore(JSON.stringify(data)))return'new';
 if(data.passed===true)return'passed';
 return data.records.length>1||typeof data.answer==='string'&&data.answer.trim()!==''||typeof data.notes==='string'&&data.notes.trim()!==''||Number.isSafeInteger(data.attempts)&&data.attempts>0?'in-progress':'new';
}
function windState(data){
 if(!data||data.version!==1||!Array.isArray(data.records)||!['still','left','right','up'].includes(data.wind)||!['front','left','right','low'].includes(data.view))return'new';
 if(data.passed===true)return'passed';
 return data.wind!=='still'||data.view!=='front'||data.records.length>0||typeof data.answer==='string'&&data.answer.trim()!==''||typeof data.notes==='string'&&data.notes.trim()!==''?'in-progress':'new';
}
function readProgress(storage){
 let available=Boolean(storage&&typeof storage.getItem==='function');
 const get=key=>{try{return parse(storage?.getItem(key));}catch{available=false;return null;}};
 const statuses={
  fire:fireState(get(FIRE_KEY)),water:waterState(get(WATER_KEY)),
  wind:windState(get(WIND_KEY)),earth:earthState(get(EARTH_KEY))
 };
 return{...statuses,passed:kinds.filter(kind=>statuses[kind]==='passed').length,storageAvailable:available};
}
function render(document,progress){
 for(const kind of kinds){
  const state=progress[kind],badge=document.getElementById(kind+'-status'),action=document.getElementById(kind+'-action'),door=document.getElementById(kind+'-door'),seal=document.getElementById(kind+'-seal');
  if(badge){badge.textContent=statusLabels[state];badge.classList.toggle('passed',state==='passed');badge.classList.toggle('in-progress',state==='in-progress');}
  if(action)action.textContent=actionLabels[state];
  if(door)door.classList.toggle('passed',state==='passed');
  if(seal){seal.classList.toggle('passed',state==='passed');const status=seal.querySelector('.seal-state');if(status)status.textContent=state==='passed'?'合格':'未合格';}
 }
 const summary=document.getElementById('academy-progress');if(summary)summary.textContent='合格 '+progress.passed+' / 4 科目';
 const graduate=document.getElementById('graduation-note');if(graduate)graduate.textContent=progress.passed===4?
  '四科目の修了を確認しました。最後の課題へ進めます。':
  '四つの試験室に入室できます。合格記録は各教室を出ても保持されます。';
 const note=document.getElementById('hall-save-note');if(note)note.textContent=progress.storageAvailable?
  '途中経過と合格記録は、この端末のブラウザに保存されます。':
  'このブラウザでは保存記録を確認できません。各教室の保存状況をご確認ください。';
}
return{FIRE_KEY,WATER_KEY,WIND_KEY,EARTH_KEY,fireState,waterState,windState,earthState,readProgress,render};
});
