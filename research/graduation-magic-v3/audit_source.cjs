/* Read-only audit of the canonical source. Writes its report only to stdout. */
'use strict';
const fs=require('node:fs'), path=require('node:path'), cp=require('node:child_process'), crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||'');
if(!fs.existsSync(path.join(root,'fire-experiment-model.js')))throw Error('Pass the canonical source directory');
const load=name=>require(path.join(root,name));
const F=load('fire-experiment-model.js'),W=load('water-insight-model.js'),V=load('wind-ribbon-model.js'),E=load('engine.js');
const design=JSON.parse(fs.readFileSync(path.join(root,'research/design.json'),'utf8'));
const normalEarth=E.initial();
for(const [id,placement] of Object.entries(design.solution)){
 const wanted=JSON.stringify([...placement.cells].sort((a,b)=>a[0]-b[0]||a[1]-b[1]));let found;
 for(const flip of [false,true])for(let rot=0;rot<4;rot++){
  const shape=E.shapeFor(id,rot,flip),cells=shape.cells.map(([x,y])=>[x+placement.x,y+placement.y]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  if(JSON.stringify(cells)!==wanted)continue;
  const trial=E.clone(normalEarth);trial.pieces[id]={rot,flip,at:[placement.x,placement.y]};
  // Pins break some orientation symmetries: choose the orientation fitting its printed mark.
  const target=E.TARGETS.find(t=>t.id===id);
  if(target&&(shape.mark[0]+placement.x!==target.at[0]||shape.mark[1]+placement.y!==target.at[1]))continue;
  found={rot,flip,at:[placement.x,placement.y]};
 }
 if(!found)throw Error('No source orientation for '+id);normalEarth.pieces[id]=found;
}
if(!E.evaluate(normalEarth).ok)throw Error('Canonical earth solution no longer passes');
normalEarth.passed=true;
const lifted=E.clone(normalEarth);lifted.pieces.C.at=null;
const liftedReach=E.waterReach(lifted,0,3);
const ws=W.initial();W.act(ws,'open');W.act(ws,'fill');
const fs0=F.initial();F.submit(fs0,'989161');
const files=cp.execFileSync('git',['ls-files','-z'],{cwd:root}).toString().split('\0').filter(Boolean);
const hashes=Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')]));
const gradeResults={fire:fs0.passed,water:W.grade(ws,'2730'),wind:V.grade('夜明けを継ぐ糸'),earth:E.evaluate(normalEarth).ok};
if(Object.values(gradeResults).some(v=>v!==true))throw Error('Normal pass regression');
const out={
 schema:1,commit:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root}).toString().trim(),
 tracked_file_count:files.length,status:cp.execFileSync('git',['status','--porcelain'],{cwd:root}).toString(),hashes,
 normal_grades:gradeResults,
 fire:{key:F.KEY,puzzle:F.PUZZLE,plates:F.PLATES,masks:F.MASKS,observations:{first:F.observation('first'),second:F.observation('second')}},
 water:{key:W.KEY,puzzle:W.PUZZLE,constants:W.C,before:W.measure(W.physicalInitial()),after:W.measure(ws.physical),physical_after:ws.physical},
 wind:{key:'magic-academy-wind-ribbon-v1',data:V.D,text:V.trace().text,omit_task:V.trace({omitTask:true}).text,ordinary_ring:V.trace({twisted:false}).text},
 earth:{key:'magic-academy-earth-v2',base:E.BASE,targets:E.TARGETS,state:normalEarth,evaluation:E.evaluate(normalEarth),initial_water_cells:E.waterReach(E.initial(),0,0).length,full_board_water_cells:E.waterReach(normalEarth,0,0).length,lifted_C_water:liftedReach,passed_after_lift:E.restore(JSON.stringify(lifted)).passed}
};
process.stdout.write(JSON.stringify(out,null,2)+'\n');
