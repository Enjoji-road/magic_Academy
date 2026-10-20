'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process'),M=require('../../fire-model.js');
let checks=0;function check(f){f();checks++;}
const golden=JSON.parse(fs.readFileSync('research/fire/projection-verification.json','utf8')).B_two_depths_containment;
function n(x){if(typeof x==='number')return x;const [a,b]=x.split('/').map(Number);return b?a/b:a;}
for(const side of['left','right']){
 const actual=M.shadows(side),expected=golden.projected[side];
 for(let i=0;i<5;i++){
  check(()=>assert.equal(actual[i].id,expected[i].id));
  for(const[a,b]of[['x','center'],['width','width'],['scale','scale']])check(()=>assert(Math.abs(actual[i][a]-n(expected[i][b]))<1e-12));
  check(()=>assert.equal(Math.max(...actual[i].polygon.map(v=>v[0]))-Math.min(...actual[i].polygon.map(v=>v[0])),actual[i].width));
  const p=M.PLATES[i],l=M.LAMPS[side];
  for(const sign of[-1,1])check(()=>{const edge=p.x+sign*p.width/2,wall=l.x+(edge-l.x)*actual[i].scale;assert(Math.abs(wall-(actual[i].x+sign*actual[i].width/2))<1e-12);});
 }
 check(()=>assert.equal(M.observation(side).length,6));
}
check(()=>assert.equal(M.restore({passed:true,version:1}),null));
check(()=>assert.equal(M.restore({version:2,puzzle:'other',passed:true}),null));
check(()=>assert.equal(M.restore('malformed'),null));
check(()=>assert.deepEqual(M.restore(JSON.stringify(M.initial())),M.initial()));
check(()=>{const a=M.initial();assert.equal(M.submit(a),'not_observed');assert.equal(a.attempts,0);M.light(a,'left');M.light(a,'right');assert.equal(M.submit(a),'not_selected');assert.equal(a.attempts,0);});
let winners=[];for(let slot=1;slot<=9;slot++)check(()=>{const s=M.initial();M.light(s,'left');M.light(s,'right');s.selected=slot;if(M.submit(s)==='pass')winners.push(slot);assert.equal(s.attempts,1);});check(()=>assert.deepEqual(winners,[3]));
check(()=>{const a=M.initial();M.light(a,'left');M.light(a,'right');a.magic='water';M.light(a,'right');assert.equal(a.view,'');assert.equal(a.lit.right,false);assert.equal(a.seen.right,true);a.magic='fire';M.light(a,'left');a.magic='wind';M.light(a,'left');assert.equal(a.lit.left,false);assert.equal(a.seen.left,true);});
check(()=>{const a=M.initial();M.light(a,'left');M.light(a,'right');a.selected=1;M.submit(a);a.selected=3;M.submit(a);assert.equal(a.passed,true);assert.equal(a.firstCorrect,false);a.selected=8;M.submit(a);assert.equal(a.passed,true);assert.equal(M.restore(a).passed,true);});
for(const path of['earth.html','app.js','engine.js','style.css'])check(()=>assert.deepEqual(fs.readFileSync(path),cp.execFileSync('git',['show','78e00e5e977b407220eb01320bcb859ea8d44607:'+path])));
check(()=>assert.deepEqual(fs.readFileSync('fire-prototype-01.html'),cp.execFileSync('git',['show','78e00e5e977b407220eb01320bcb859ea8d44607:fire.html'])));
check(()=>{const html=fs.readFileSync('fire.html','utf8'),js=fs.readFileSync('fire-app.js','utf8');for(const text of['測光糸','ヒントを見る','otherPosition','leftOwner','rightOwner','同じ原因','両方で同じ位置'])assert(!html.includes(text)&&!js.includes(text),text);assert(!/<select\b/.test(html));assert(html.includes('href="index.html"'));});
console.log(JSON.stringify({fire_model_checks:checks,passed:true}));
