/* Read-only audit of every pre-existing tracked file and the normal graders. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const HERE=__dirname,ROOT=path.resolve(HERE,'../..'),base=JSON.parse(fs.readFileSync(path.join(HERE,'source-baseline.json'),'utf8'));
const changed=[];
for(const[f,expected]of Object.entries(base.hashes)){
 const actual=crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,f))).digest('hex');if(actual!==expected)changed.push(f);
}
assert.equal(changed.length,0,'An official file differs from the canonical baseline');
const diff=cp.execFileSync('git',['diff','--name-only',base.commit,'--'],{cwd:ROOT}).toString().trim().split('\n').filter(Boolean);
assert.ok(diff.every(f=>f.startsWith('research/graduation-magic-v3/')),'Tracked change outside the research directory');
const audit=JSON.parse(cp.execFileSync(process.execPath,[path.join(HERE,'audit_source.cjs'),ROOT],{maxBuffer:8*1024*1024}).toString());
assert.ok(Object.values(audit.normal_grades).every(Boolean));
const app=fs.readFileSync(path.join(HERE,'app.js'),'utf8'),model=fs.readFileSync(path.join(HERE,'magic-model.js'),'utf8');
const officialKeys=['magic-academy-fire-experiment-v4','magic-academy-water-insight-v1','magic-academy-wind-ribbon-v1','magic-academy-earth-v2','magic-academy-fire-notes-v1'];
assert.ok(officialKeys.every(k=>!app.includes(k)&&!model.includes(k)),'Research runtime mentions an official storage key');
const report={schema:3,base_commit:base.commit,existing_files_checked:Object.keys(base.hashes).length,changed_existing_files:changed,tracked_diff_paths_restricted_to_research:true,normal_grades:audit.normal_grades,normal_model_results_unchanged:true,official_storage_keys_in_runtime:false,research_storage_key:'magic-academy-graduation-magic-v3-research-1',dependencies_read_only:['wind-ribbon-data.js','wind-ribbon-model.js'],scope:'Unmodified canonical files and independent prototype only; future integration still needs regression tests.'};
fs.writeFileSync(path.join(HERE,'preservation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
