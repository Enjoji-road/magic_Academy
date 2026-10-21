'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const M=require(path.join(root,'wind-ribbon-model.js'));
const samples=JSON.parse(fs.readFileSync(path.join(__dirname,'independent-geometry-samples.json'),'utf8'));
let maxError=0;
for(const sample of samples){const actual=M.point(sample.s,sample.v,sample.wind);sample.point.forEach((n,i)=>{maxError=Math.max(maxError,Math.abs(n-actual[i]));});}
assert(maxError<1e-8);
const independent=JSON.parse(fs.readFileSync(path.join(__dirname,'verification.json'),'utf8'));
assert.equal(M.trace().text,independent.reading.answer);
assert.equal(M.trace({twisted:false}).text,independent.reading.twist_omitted);
assert.equal(M.trace({omitTask:true}).text,independent.reading.task_omitted);
assert(M.grade('ヨアケヲツグイト'));
assert(M.grade('よ あ け を つ ぐ い と'));
assert(M.grade('夜明けを継ぐ糸'));
for(const input of['','よ','よぐいと','よあけをつぐい','よあけをつぐいとの','よあけをつぐいと<script>'])assert(!M.grade(input));
const recovered=M.restore({version:1,wind:'bogus',view:'bogus',notes:'a'.repeat(9000),records:[{wind:'still',view:'front'},{wind:'bad',view:'bad'}]});
assert.equal(recovered.wind,'still');assert.equal(recovered.notes.length,8000);assert.equal(recovered.records.length,1);

// Integration test runs the actual page scripts and DOM events. Canvas is a
// recording stub here; actual rendering is checked separately in the browser.
const {JSDOM}=require('/workspace/scratch/cf66052cee58/studio-test-deps/node_modules/jsdom');
const html=fs.readFileSync(path.join(root,'wind-ribbon-experiment.html'),'utf8');
let drawCalls=0;
const gradient={addColorStop(){}};
function ctx(){return new Proxy({}, {get(target,key){if(key==='createLinearGradient')return()=>gradient;if(key==='measureText')return()=>({width:100});return (...args)=>{if(key==='drawImage')drawCalls++;};},set(){return true;}});}
const key='magic-academy-wind-ribbon-v1';
function enter(stored={}){
 const dom=new JSDOM(html,{url:'https://example.test/wind-ribbon-experiment.html',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.HTMLCanvasElement.prototype.getContext=function(){return ctx();};
 w.matchMedia=()=>({matches:false,addEventListener(){}});
 w.HTMLElement.prototype.scrollIntoView=function(){};
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
 w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
 for(const[k,v]of Object.entries(stored))w.localStorage.setItem(k,v);
 for(const name of['wind-ribbon-data.js','wind-ribbon-model.js','wind-ribbon-app.js'])w.eval(fs.readFileSync(path.join(root,name),'utf8'));
 return dom;
}
let dom=enter({'old-earth-save':'KEEP_EARTH','magic-academy-sfx-v1':'off','old-water-save':'KEEP_WATER'}),w=dom.window,d=w.document;
const click=id=>d.getElementById(id).click();
function input(id,value){const e=d.getElementById(id);e.value=value;e.dispatchEvent(new w.Event('input',{bubbles:true}));}
click('sound');d.getElementById('reduced').checked=true;d.getElementById('reduced').dispatchEvent(new w.Event('change'));
for(let k=0;k<60;k++){
 d.querySelector(`[data-wind="${Object.keys(M.D.winds)[k%4]}"]`).click();
 d.querySelector(`[data-view="${Object.keys(M.D.views)[k%4]}"]`).click();
 assert(d.getElementById('pass').hidden);
}
input('notes','二つの留め具。風を変えて観察する。');
input('answer','よぐいと');d.getElementById('answerForm').dispatchEvent(new w.Event('submit',{cancelable:true}));
assert(d.getElementById('pass').hidden);
assert(d.getElementById('answerStatus').textContent.includes('一致しません'));
for(let k=0;k<28;k++){d.querySelector(`[data-wind="${Object.keys(M.D.winds)[k%4]}"]`).click();click('record');}
assert.equal(JSON.parse(w.localStorage.getItem(key)).records.length,24);
click('enlarge');assert(d.getElementById('zoomDialog').contains(d.getElementById('workbench')));click('closeZoom');assert(d.getElementById('observatory').contains(d.getElementById('workbench')));
input('answer',M.trace().text);d.getElementById('answerForm').dispatchEvent(new w.Event('submit',{cancelable:true}));
assert(!d.getElementById('pass').hidden);
const stored={};for(let i=0;i<w.localStorage.length;i++){const k=w.localStorage.key(i);stored[k]=w.localStorage.getItem(k);}
dom.window.close();dom=enter(stored);w=dom.window;d=w.document;
assert(!d.getElementById('pass').hidden);assert.equal(d.getElementById('notes').value,'二つの留め具。風を変えて観察する。');
assert.equal(d.getElementById('answer').value,M.trace().text);
click('reset');click('cancelReset');assert(!d.getElementById('pass').hidden);
click('reset');click('confirmReset');assert(d.getElementById('pass').hidden);
assert.equal(d.getElementById('notes').value,'二つの留め具。風を変えて観察する。');
assert.equal(d.getElementById('answer').value,'');assert.equal(JSON.parse(w.localStorage.getItem(key)).records.length,0);
assert.equal(w.localStorage.getItem('old-earth-save'),'KEEP_EARTH');assert.equal(w.localStorage.getItem('old-water-save'),'KEEP_WATER');assert.equal(w.localStorage.getItem('magic-academy-sfx-v1'),'off');
assert(drawCalls>100);
const result={geometry_reference_samples:samples.length,geometry_max_error:maxError,operations_without_answer_never_pass:60,record_limit:24,pass_persists:true,reset_isolated:true,notes_preserved:true,zoom_controls_live:true,canvas_projection_calls:drawCalls,browser_rendering:'not tested by this stub'};
fs.writeFileSync(path.join(__dirname,'ui-verification.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));dom.window.close();
