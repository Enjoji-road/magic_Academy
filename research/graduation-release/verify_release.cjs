/* Independent finite-state verification and regression audit. Contains spoilers. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),vm=require('node:vm'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'../..'),BASE='5cc2e71edfe81e83fc2c6c6b75b810d988ab3bdd';
const M=require(path.join(ROOT,'graduation-magic-model.js')),R=require(path.join(ROOT,'research/graduation-magic-v3/magic-model.js'));
const P=require(path.join(ROOT,'research/graduation-magic-v3/verification.json'));
const protectedFiles=['fire-experiment-model.js','fire-experiment-app.js','fire-studio.js','fire-experiment.css','water-insight-model.js','water-insight-app.js','water-insight-experiment.css','water-experiment.css','wind-ribbon-data.js','wind-ribbon-model.js','wind-ribbon-app.js','wind-ribbon-experiment.css','engine.js','app.js','earth-studio.js','style.css','academy-studio.css','academy-element-icons.js','academy-element-icons.css','academy-magic-vfx.js','academy-magic-vfx.css','academy-studio-sfx.js','academy-studio-sfx.css','research/graduation-magic-v3/app.js','research/graduation-magic-v3/magic-model.js','research/graduation-magic-v3/index.html','research/graduation-magic-v3/style.css','research/graduation-magic-v3/graduation-screen.js'];
const copyOnly=['fire-experiment-app.js','water-insight-app.js','wind-ribbon-app.js'];
for(const file of protectedFiles.filter(f=>!copyOnly.includes(f)))assert.deepEqual(fs.readFileSync(path.join(ROOT,file)),cp.execFileSync('git',['show',BASE+':'+file],{cwd:ROOT}),file+' must remain unchanged');
for(const file of copyOnly){
 let before=cp.execFileSync('git',['show',BASE+':'+file],{cwd:ROOT,encoding:'utf8'}).replaceAll('この試作','この試験').replaceAll('第2試作','水魔法学');
 if(file==='wind-ribbon-app.js')before=before.replace('function sound(kind){if(!state.sfx)return;','function sound(kind){if(!state.sfx||window.AcademySFX?.isEnabled()===false)return;');
 assert.equal(fs.readFileSync(path.join(ROOT,file),'utf8'),before,file+' may change only terminology and the shared sound guard');
}
assert.notEqual(M.KEY,R.KEY);
for(const fn of ['initialCircuit','initial','circuit','settle','isClosed','cast','support','release','hold','night','restore'])assert.equal(M[fn].toString(),R[fn].toString(),'Accepted rule changed: '+fn);
assert.deepEqual(M.TAKES,R.TAKES);
const ids=M.IDS,choices=[null,...ids],options=[{exists:false,manual:false,from:null},...choices.flatMap(from=>[false,true].map(manual=>({exists:true,manual,from})))];
const hash=crypto.createHash('sha256');let states=0,recoveries=0;
// Independent semantics: enumerate all possible live sets and choose their union
// among fixed points. This uses no propagation loop or source model evaluator.
function independent(c){
 const fixed=[];
 for(let mask=0;mask<16;mask++){
  const live=Object.fromEntries(ids.map((id,i)=>[id,Boolean(mask&(1<<i))]));
  if(ids.every(id=>{const n=c.nodes[id];return live[id]===Boolean(n.exists&&(n.manual||(n.from===({fire:'earth',water:'fire',wind:'water',earth:'wind'})[id]&&live[n.from])));}))fixed.push(mask);
 }
 const greatest=fixed.reduce((a,b)=>a|b,0);assert(fixed.includes(greatest));
 return Object.fromEntries(ids.map((id,i)=>[id,Boolean(greatest&(1<<i))]));
}
for(const a of options)for(const b of options)for(const c of options)for(const d of options){
 const circuit={nodes:Object.fromEntries(ids.map((id,i)=>[id,[a,b,c,d][i]])),charge:8};
 assert.deepEqual(M.settle(circuit),independent(circuit));
 const bits=ids.map(id=>Number(M.settle(circuit)[id])).join('');hash.update(bits+Number(M.isClosed(circuit))+'\n');states++;
 const restored=M.restore(JSON.stringify({version:M.VERSION,circuits:{hall:circuit}})).circuits.hall;assert.deepEqual(M.settle(restored),M.settle(circuit));
 const repair=M.clone(circuit);for(const id of ids)M.cast(repair,id,null);for(const id of ids)M.cast(repair,id,M.TAKES[id]);M.release(repair);assert(M.isClosed(repair));recoveries++;
}
const fingerprint=hash.digest('hex');assert.equal(fingerprint,P.independent_semantics.fingerprint_sha256);
let finals=0,solutions=0;
for(const a of choices)for(const b of choices)for(const c of choices)for(const d of choices){
 const s=M.initialCircuit();ids.forEach((id,i)=>{s.nodes[id]={exists:true,manual:false,from:[a,b,c,d][i]};});s.charge=8;finals++;if(M.isClosed(s))solutions++;
}assert.equal(solutions,1);
function permutations(xs){if(!xs.length)return [[]];return xs.flatMap((x,i)=>permutations(xs.filter((_,j)=>i!==j)).map(rest=>[x,...rest]));}
for(const order of permutations(ids)){const c=M.initialCircuit();for(const id of ids)M.cast(c,id,null);for(const id of order)M.cast(c,id,M.TAKES[id]);M.release(c);assert(M.isClosed(c));}

// Verify the new namespace and merge behavior without any browser API stubs
// inside the actual game. Here old records are opaque sentinels.
const values=new Map(['fire','water','wind','earth','notes'].map(k=>['old-'+k,'keep-'+k]));
let passes=0;
const window={GraduationMagic:M,AcademyHallProgress:{readProgress:()=>({passed:passes})}};
const localStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
vm.runInNewContext(fs.readFileSync(path.join(ROOT,'graduation-state.js'),'utf8'),{window,localStorage});
const S=window.AcademyGraduationStore;
assert(!S.admitted());passes=3;assert(!S.admitted());passes=4;assert(S.admitted());
const first=S.read(),stale=S.read();first.room='fire';M.cast(M.circuit(first),'fire',null);first.notes='shared note';first.graduated=true;S.saveRoom(first,{notes:true});
stale.room='water';M.cast(M.circuit(stale),'water',null);S.saveRoom(stale);
const merged=S.read();assert(merged.circuits.fire.nodes.fire.exists);assert(merged.circuits.water.nodes.water.exists);assert(merged.graduated);assert.equal(merged.notes,'shared note');passes=0;assert(S.admitted());
for(const [k,v]of values)if(k!==M.KEY)assert.equal(v,'keep-'+k.slice(4));

const normal=JSON.parse(cp.execFileSync(process.execPath,[path.join(ROOT,'research/graduation-magic-v3/audit_source.cjs'),ROOT],{maxBuffer:8*1024*1024}).toString());
assert(Object.values(normal.normal_grades).every(Boolean));
const read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
for(const file of ['index.html','fire-studio.html','water-insight-experiment.html','wind-ribbon-experiment.html','earth-studio.html','graduation.html']){
 const html=read(file),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,file+' duplicate IDs');
 for(const m of html.matchAll(/(?:src|href)="([^"]+)"/g)){const url=m[1];if(/^(https?:|#|data:)/.test(url))continue;assert(fs.existsSync(path.join(ROOT,url.split(/[?#]/)[0])),file+' link '+url);}
}
const report={result:'passed',baseline_commit:BASE,unchanged_runtime_files:protectedFiles.filter(f=>!copyOnly.includes(f)),presentation_adjusted_files:copyOnly,normal_adjustments:'Only trial terminology and a shared SFX OFF guard; exact normalized source equality checked.',normal_grades:normal.normal_grades,production_storage_key:M.KEY,research_storage_key:R.KEY,accepted_law_functions_identical:true,independent_fixed_point_states:states,fingerprint_sha256:fingerprint,states_recoverable:recoveries,final_configurations:finals,winning_configuration_count:solutions,construction_orders:24,namespace_and_stale_window_merge:'passed',scope:'Finite magical law, current canonical grader results, preserved normal runtimes, storage merge and static links. Human enjoyment and physical simulation are not mathematical claims.'};
fs.writeFileSync(path.join(__dirname,'model-verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
