/* Research II. SI pressure, mL volume. Equilibria only; no timing clues. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WaterInsight=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION=1,PUZZLE='water-insight-displacement-20261021',KEY='magic-academy-water-insight-v1';
const C={tank:5000,bell:5000,bellWaterBefore:3430,original:2730,dead:20,p0:101325,rho:998,g:9.81,area:.01,head:.8,smallDose:600,resolution:10};
const clone=x=>JSON.parse(JSON.stringify(x));
function gasSpace(p){return C.tank-p.water+C.dead;}
function pressure(p){return C.p0*p.air/gasSpace(p);}
function physicalInitial(original=C.original){return{water:original,air:C.tank-original+C.dead,bell:C.bell-C.bellWaterBefore,lost:0,open:false};}
function collect(p,amount){const accepted=Math.min(Math.max(0,amount),C.bell-p.bell);p.bell+=accepted;p.lost+=Math.max(0,amount-accepted);}
function equalize(p){const target=gasSpace(p);collect(p,p.air-target);p.air=target;}
function closedLimit(p){
 if(p.water>=C.tank)return 0;
 const driving=q=>C.p0+C.rho*C.g*(C.head-(p.water+q)*1e-6/C.area)-C.p0*p.air/(gasSpace(p)-q);
 if(driving(0)<=1e-7)return 0;
 const remaining=C.tank-p.water;if(driving(remaining)>=0)return remaining;
 let lo=0,hi=remaining;for(let i=0;i<70;i++){const q=(lo+hi)/2;if(driving(q)>0)lo=q;else hi=q;}return(lo+hi)/2;
}
function physicalStep(input,action){
 const p=clone(input),oldBell=p.bell;let admitted=0;
 if(action==='open'){p.open=true;equalize(p);}
 else if(action==='close')p.open=false;
 else if(action==='small'||action==='fill'){
  const wanted=action==='fill'?C.tank-p.water:C.smallDose;
  admitted=Math.min(wanted,p.open?C.tank-p.water:closedLimit(p));
  if(admitted<1e-8)admitted=0;
  p.water+=admitted;if(C.tank-p.water<1e-8)p.water=C.tank;
  if(p.open)equalize(p);
 }else if(action!=='bath')throw Error('Unknown operation');
 return{physical:p,admitted,collected:p.bell-oldBell};
}
function measure(p){return{bellWater:Math.max(0,C.bell-p.bell),displayWater:Math.round((C.bell-p.bell)/C.resolution)*C.resolution,full:p.water>=C.tank-1e-7,open:p.open,pressure:pressure(p),clear:true};}
function initial(){const physical=physicalInitial();return{version:VERSION,puzzle:PUZZLE,physical,records:[{action:'before',physical:clone(physical)}],answer:'',notes:'',passed:false,attempts:0};}
function validPhysical(p){
 if(!p||typeof p.open!=='boolean'||!['water','air','bell','lost'].every(k=>Number.isFinite(p[k])))return false;
 if(p.water<C.original-1e-6||p.water>C.tank+1e-6||p.air<0||p.bell<0||p.bell>C.bell||p.lost<0)return false;
 const expected=C.tank-C.original+C.dead+C.bell-C.bellWaterBefore;
 if(Math.abs(p.air+p.bell+p.lost-expected)>1e-4)return false;
 if(p.open&&Math.abs(p.air-gasSpace(p))>1e-5)return false;
 if(pressure(p)<C.p0-1e-4)return false;
 const max=C.p0+C.rho*C.g*(C.head-p.water*1e-6/C.area);
 return pressure(p)<=max+1e-4;
}
function restore(raw){
 let data;try{data=JSON.parse(raw);}catch{return null;}
 if(!data||data.version!==VERSION||data.puzzle!==PUZZLE||!validPhysical(data.physical)||!Array.isArray(data.records))return null;
 const out=initial();out.physical=clone(data.physical);
 const valid=data.records.filter(r=>r&&['before','restart','small','fill','open','close','bath'].includes(r.action)&&validPhysical(r.physical));
 out.records=[out.records[0],...valid.filter(r=>r.action!=='before').map(r=>({action:r.action,physical:clone(r.physical)}))];
 if(JSON.stringify(out.records.at(-1).physical)!==JSON.stringify(out.physical))out.records.push({action:'bath',physical:clone(out.physical)});
 out.answer=typeof data.answer==='string'?data.answer.slice(0,40):'';out.notes=typeof data.notes==='string'?data.notes.slice(0,8000):'';
 out.passed=data.passed===true;out.attempts=Number.isSafeInteger(data.attempts)&&data.attempts>=0?Math.min(data.attempts,1e6):0;return out;
}
function act(state,action){
 const result=physicalStep(state.physical,action);state.physical=result.physical;
 const snapshot={action,physical:clone(state.physical)},key=JSON.stringify(snapshot);
 const index=state.records.findIndex(r=>JSON.stringify(r)===key);if(index<0)state.records.push(snapshot);
 return{...result,newRecord:index<0,index:index<0?state.records.length-1:index};
}
function parseAnswer(text){const normalized=String(text).normalize('NFKC').trim().replaceAll(',','');return /^\d{1,5}$/.test(normalized)?Number(normalized):null;}
function grade(state,text){state.answer=String(text).slice(0,40);state.attempts++;const ok=parseAnswer(text)===C.original;if(ok)state.passed=true;return ok;}
return{VERSION,PUZZLE,KEY,C,clone,gasSpace,pressure,physicalInitial,physicalStep,closedLimit,measure,initial,validPhysical,restore,act,parseAnswer,grade};
});
