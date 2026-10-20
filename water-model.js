/* Water-room research model. SI units; isothermal ideal gas; quasi-static endpoints. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WaterExam=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION=1,PUZZLE='water-six-chambers-20261021',KEY='magic-academy-water-experiment-v1';
const ROOMS=['A','B','C','D','E','F'],OUTLETS=['I','II','III','IV'];
const C={atmosphere:101325,density:998,gravity:9.81,head:.9,height:1.2,area:.001,pipeVolume:.0001};
const PAIRS=[[1,3],[0,2],[2,3],[0,1],[0,3],[1,2]];
const DEPTHS=[0,.1,.3,.5,null];
const PROFILES=[{name:'測定札 I',depths:[.1,.1,.3,.5]},{name:'測定札 II',depths:[.1,.3,.3,.5]},{name:'測定札 III',depths:[.5,.3,.1,.5]}];
function clone(v){return JSON.parse(JSON.stringify(v));}
function validDepths(d){return Array.isArray(d)&&d.length===4&&d.every(x=>DEPTHS.includes(x));}
function volume(h){return C.area*(C.height-h)+C.pipeVolume;}
function sealedHeight(){
 let lo=0,hi=C.head;const initial=volume(0);
 for(let i=0;i<70;i++){const h=(lo+hi)/2,p=C.atmosphere*initial/volume(h),feed=C.atmosphere+C.density*C.gravity*(C.head-h);if(p>feed)hi=h;else lo=h;}
 return(lo+hi)/2;
}
function chamber(pair,depths){
 const shut=sealedHeight(),pressureClosed=C.density*C.gravity*(C.head-shut);
 const open=pair.filter(i=>depths[i]!==null),minimum=open.length?Math.min(...open.map(i=>depths[i])):Infinity;
 const threshold=C.density*C.gravity*minimum;
 if(threshold>=pressureClosed)return{height:shut,pressure:pressureClosed,vents:[],airLitres:0,sealed:true};
 const height=C.head-minimum,pressure=threshold,vents=open.filter(i=>depths[i]===minimum);
 const airLitres=1000*(volume(0)-(C.atmosphere+pressure)*volume(height)/C.atmosphere);
 return{height,pressure,vents,airLitres,sealed:false};
}
function observe(depths,pairs=PAIRS){
 if(!validDepths(depths))throw Error('Invalid measurement profile');
 const rooms=pairs.map(p=>chamber(p,depths)),bubbles=[...new Set(rooms.flatMap(r=>r.vents).filter(i=>depths[i]>0))].sort();
 return{depths:depths.slice(),heights:rooms.map(r=>r.height),pressures:rooms.map(r=>r.pressure),bubbles,airLitres:rooms.reduce((s,r)=>s+r.airLitres,0),cupWaterChanged:false};
}
function initial(){return{version:VERSION,puzzle:PUZZLE,depths:PROFILES[0].depths.slice(),current:null,records:[],draft:ROOMS.map(()=>[]),notes:'',passed:false,attempts:0};}
function validPair(p){return Array.isArray(p)&&p.length<=2&&p.every(x=>Number.isInteger(x)&&x>=0&&x<4)&&new Set(p).size===p.length;}
function restore(raw){
 let s;try{s=JSON.parse(raw);}catch{return null;}
 if(!s||s.version!==VERSION||s.puzzle!==PUZZLE||!validDepths(s.depths)||!Array.isArray(s.draft)||s.draft.length!==6||!s.draft.every(validPair))return null;
 const out=initial();out.depths=s.depths.slice();out.draft=s.draft.map(p=>p.slice().sort());out.notes=typeof s.notes==='string'?s.notes.slice(0,8000):'';out.passed=s.passed===true;
 out.attempts=Number.isSafeInteger(s.attempts)&&s.attempts>=0?Math.min(s.attempts,1000000):0;
 out.current=validDepths(s.current)&&s.current.every((d,i)=>d===out.depths[i])?s.current.slice():null;
 // Store inputs, never trust saved results as physical truth. Recompute on display.
 out.records=Array.isArray(s.records)?[...new Map(s.records.filter(validDepths).map(d=>[JSON.stringify(d),d])).values()].slice(-625).map(d=>d.slice()):[];
 return out;
}
function record(state,depths){
 if(!validDepths(depths))return false;
 state.current=depths.slice();state.depths=depths.slice();
 if(!state.records.some(d=>JSON.stringify(d)===JSON.stringify(depths)))state.records.push(depths.slice());
 return true;
}
function correct(draft){return Array.isArray(draft)&&draft.length===6&&draft.every((p,i)=>validPair(p)&&p.length===2&&p.slice().sort().join(',')===PAIRS[i].slice().sort().join(','));}
function grade(state){state.attempts++;const ok=correct(state.draft);if(ok)state.passed=true;return ok;}
return{VERSION,PUZZLE,KEY,ROOMS,OUTLETS,C,PAIRS,DEPTHS,PROFILES,clone,validDepths,volume,sealedHeight,chamber,observe,initial,restore,record,correct,grade};
});
