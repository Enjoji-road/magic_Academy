'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),E=require('../engine.js');
const data=JSON.parse(fs.readFileSync('research/design.json','utf8'));
let checks=0;function check(f){f();checks++;}
function variantFor(id,p){for(let flip of[false,true])for(let rot=0;rot<4;rot++){const s=E.shapeFor(id,rot,flip),actual=s.cells.map(([x,y])=>`${x},${y}`).sort().join(';'),want=p.orientation.map(([x,y])=>`${x},${y}`).sort().join(';');if(actual!==want)continue;const target=E.TARGETS.find(t=>t.id===id);if(target&&(s.mark[0]+p.x!==target.at[0]||s.mark[1]+p.y!==target.at[1]))continue;return{rot,flip,at:[p.x,p.y]};}throw Error('No orientation '+id);}
const solved=E.initial();for(const[id,p]of Object.entries(data.solution))solved.pieces[id]=variantFor(id,p);
check(()=>assert.equal(E.evaluate(solved).ok,true));
check(()=>assert.equal(E.occupied(solved).size,36));
check(()=>assert.equal(E.evaluate(E.initial()).code,'gaps'));
check(()=>assert.deepEqual(E.restore(JSON.stringify(solved)),{...solved,passed:true,discovered:true}));
check(()=>assert.equal(E.restore('bad-json'),null));
check(()=>{const bad=E.clone(solved);bad.pieces.A.at=[-1,0];assert.equal(E.restore(bad),null);assert.equal(E.evaluate(bad).code,'geometry');});
check(()=>{const bad=E.clone(solved);bad.pieces.B.at=bad.pieces.A.at;assert.equal(E.restore(bad),null);});
check(()=>{const bad=E.clone(solved);bad.pieces.B.rot=0.5;assert.equal(E.restore(bad),null);});
check(()=>{const bad=E.clone(solved);bad.pieces.B.flip='false';assert.equal(E.restore(bad),null);});
check(()=>{const a=E.initial();assert.equal(E.waterReach(a,2,2).length,0);assert.equal(E.waterReach(a,0,0).length,32);assert.deepEqual(E.waterReach(a,-1,0),[]);assert.deepEqual(E.waterReach(solved,0,0),[]);});
check(()=>{const a=E.initial();assert.equal(E.fits(a,'A',0,0),true);assert.equal(E.fits(a,'A',2,2),false);assert.equal(E.fits(a,'A',5,0),false);});
for(const id of Object.keys(E.BASE))for(let rot=0;rot<4;rot++)for(const flip of[false,true])check(()=>{const sh=E.shapeFor(id,rot,flip);assert.equal(sh.cells.length,E.BASE[id].length);assert.equal(Math.min(...sh.cells.map(v=>v[0])),0);assert.equal(Math.min(...sh.cells.map(v=>v[1])),0);if(sh.mark)assert(sh.cells.some(v=>v[0]===sh.mark[0]&&v[1]===sh.mark[1]));});
const initialBlob=fs.readFileSync('prototype-01-4x4.html');
const cp=require('node:child_process');check(()=>assert.deepEqual(initialBlob,cp.execFileSync('git',['show','fcec3bed2a2b9a8a9e322eedd10d636cae19e7d0:index.html'])));
console.log(JSON.stringify({engine_checks:checks,passed:true}));
module.exports={solved,variantFor};
