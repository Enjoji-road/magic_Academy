'use strict';
const fs=require('node:fs'),cp=require('node:child_process'),assert=require('node:assert/strict'),M=require('../../fire-experiment-model.js');
const golden=JSON.parse(fs.readFileSync('research/fire-v4/verification.json','utf8'));
let checks=0;function check(f){f();checks++;}
const rational=v=>typeof v==='number'?v:(v.includes('/')?v.split('/').map(Number).reduce((a,b)=>a/b):Number(v));
for(const side of Object.keys(M.LIGHTS)){
 const expected=golden.all_admissible_states[side],actual=M.observation(side);
 check(()=>assert.equal(actual.length,expected.length));
 actual.forEach((o,i)=>{check(()=>assert.equal(o.x,rational(expected[i].x)));check(()=>assert.deepEqual(o.owners,expected[i].owners));check(()=>assert.equal(o.mask,expected[i].mask));check(()=>assert.equal(o.digit,expected[i].digit));});
 for(const p of M.PLATES){const t=M.project(p,side);check(()=>assert(Math.abs(t.z-6)<1e-12));check(()=>assert(Math.abs(t.width-.78)<1e-12));check(()=>assert(Math.abs(t.height-1.32)<1e-12));check(()=>assert(Math.abs(t.x-(p.a-p.b*M.LIGHTS[side].x))<1e-12));}
 for(const poly of M.supports(side))check(()=>assert(poly.every(([x,z])=>Number.isFinite(x)&&z<=5.35+1e-12)));
}
check(()=>assert.deepEqual(M.PLATES.map(p=>p.id),['A','B','C','D','E','F']));
check(()=>assert.equal(M.isAnswer(golden.answer),true));
check(()=>assert.equal(M.isAnswer('９８９１６１'),true));
check(()=>assert.equal(M.isAnswer('989-161'),true));
check(()=>assert.equal(M.isAnswer('9891610'),false));
check(()=>assert.equal(M.isAnswer('98916'),false));
check(()=>assert.throws(()=>M.observation('unknown')));
check(()=>assert.throws(()=>M.observation('first',[1,2])));
check(()=>assert.equal(M.restore('broken'),null));
for(const bad of[{version:2,puzzle:M.PUZZLE,passed:true},{version:4,puzzle:'other',passed:true},{passed:true},null])check(()=>assert.equal(M.restore(bad),null));
check(()=>assert.deepEqual(M.restore(JSON.stringify(M.initial())),M.initial()));
check(()=>{const s=M.initial();M.light(s,'first');M.light(s,'second');assert.deepEqual(s.seen,{first:true,second:true});assert.deepEqual(s.lit,{first:true,second:true});assert.equal(s.view,'second');M.cover(s);assert.equal(s.view,'');assert.deepEqual(s.seen,{first:true,second:true});});
for(const magic of['water','wind'])check(()=>{const s=M.initial();M.light(s,'first');s.magic=magic;M.light(s,'first');assert.equal(s.lit.first,false);assert.equal(s.view,'');assert.equal(s.seen.first,true);});
check(()=>{const s=M.initial();s.magic='earth';M.light(s,'first');assert.deepEqual(s.seen,{first:false,second:false});assert.equal(s.view,'');});
check(()=>{const s=M.initial();assert.equal(M.submit(s,'12'),'format');assert.equal(s.attempts,0);assert.equal(M.submit(s,'000000'),'incorrect');assert.equal(s.attempts,1);assert.equal(s.passed,false);assert.equal(M.submit(s,golden.answer),'pass');assert.equal(s.passed,true);assert.equal(s.attempts,2);assert.equal(M.restore(JSON.stringify(s)).passed,true);});
// Neither lighting nor all observations automatically grades a solution.
for(const order of[['first','second'],['second','first']])check(()=>{const s=M.initial();order.forEach(k=>M.light(s,k));assert.equal(s.passed,false);assert.equal(s.attempts,0);assert.equal(M.submit(s,golden.answer),'pass');});
// Every single-digit error gets exactly the same coarse failure result.
for(let i=0;i<6;i++)for(let n=0;n<10;n++)if(String(n)!==golden.answer[i])check(()=>{const a=golden.answer.slice(0,i)+n+golden.answer.slice(i+1),s=M.initial();assert.equal(M.submit(s,a),'incorrect');assert.equal(s.passed,false);});
check(()=>{const digits=new Set(['first','second'].flatMap(s=>M.observation(s).map(o=>String(o.digit))));assert(!digits.has('8'));assert(golden.answer.includes('8'));});
check(()=>{const s=M.restore({version:4,puzzle:M.PUZZLE,seen:{first:true,second:false},lit:{first:false,second:false},view:'first',attempts:-1,answer:42});assert.equal(s.view,'');assert.equal(s.attempts,0);assert.equal(s.answer,'');});
// Preserve all production pages, models, styles, and earlier backup files.
for(const file of['index.html','fire.html','fire.css','fire-model.js','fire-app.js','fire-prototype-01.html','earth.html','engine.js','app.js','style.css'])check(()=>assert.deepEqual(fs.readFileSync(file),cp.execFileSync('git',['show','2799effe57fd3c2e9be1dc912e578a2f2f2041ac:'+file])));
check(()=>{const html=fs.readFileSync('fire-experiment.html','utf8'),css=fs.readFileSync('fire-experiment.css','utf8');assert(html.includes('inputmode="numeric"'));assert(html.includes('href="index.html"'));assert(html.includes('viewBox'));assert(!html.includes(golden.answer));assert(!/<select\b/.test(html));assert(css.includes('max-width:540px'));assert(css.includes('prefers-reduced-motion'));assert(css.includes('min-height:48px'));});
console.log(JSON.stringify({fire_v4_model_checks:checks,passed:true}));
