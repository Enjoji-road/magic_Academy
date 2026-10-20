/* Spoilers: independent model-output, complete DOM flow and save-isolation checks.
   JSDOM is not a real browser, layout or an audio-output test. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require(process.env.STUDIO_JSDOM||'jsdom');
const M=require('../../water-model.js'),BASE='67ed2573815ce0af96a66e3d55188467ed1fee57';
const ROOT=path.resolve(__dirname,'../..');process.chdir(ROOT);let checks=0;
const A=fn=>{fn();checks++;},near=(a,b)=>A(()=>assert(Math.abs(a-b)<1e-6,`${a} != ${b}`));
const read=f=>fs.readFileSync(f,'utf8'),report=JSON.parse(read('research/water/verification.json'));
for(const file of cp.execFileSync('git',['ls-tree','-r','--name-only',BASE],{encoding:'utf8'}).trim().split('\n'))A(()=>assert.deepEqual(fs.readFileSync(file),cp.execFileSync('git',['show',BASE+':'+file]),'existing file changed: '+file));
A(()=>assert.equal(report.all_observations.length,625));
for(const row of report.all_observations){
 const d=row.depths_cm.map(x=>x===null?null:x/100),o=M.observe(d);
 for(let i=0;i<6;i++)near(o.heights[i]*100,row.heights[i]);
 A(()=>assert.deepEqual(o.bubbles,row.bubbles));A(()=>assert.equal(o.cupWaterChanged,false));
}
near(M.sealedHeight()*100,report.closed_height_cm);
A(()=>assert.deepEqual(M.observe([0,0,0,0]).bubbles,[]));A(()=>assert(M.observe([0,0,0,0]).heights.every(h=>h===.9)));
const allPairs=[];for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)allPairs.push([i,j]);
let solutions=0;function visit(prefix){if(prefix.length===6){if(M.correct(prefix))solutions++;return;}for(const p of allPairs)visit([...prefix,p]);}visit([]);
A(()=>assert.equal(solutions,1));A(()=>assert(M.correct(M.PAIRS.map(p=>p.slice().reverse()))));
A(()=>assert(!M.correct(M.PAIRS.map((p,i)=>i?[...p]:[0,0]))));
const observed=M.initial();for(const row of report.all_observations)M.record(observed,row.depths_cm.map(x=>x===null?null:x/100));
A(()=>assert.equal(observed.records.length,625));A(()=>assert.equal(observed.passed,false));A(()=>assert.equal(observed.attempts,0));
A(()=>assert.equal(M.restore(JSON.stringify(observed)).records.length,625));
A(()=>assert.equal(M.restore('{broken'),null));A(()=>assert.equal(M.restore(JSON.stringify({...M.initial(),version:0,passed:true})),null));A(()=>assert.equal(M.restore(JSON.stringify({...M.initial(),puzzle:'old',passed:true})),null));
A(()=>assert.equal(M.restore(JSON.stringify({...M.initial(),draft:[[9],[],[],[],[],[]]})),null));
A(()=>assert.equal(M.restore(JSON.stringify({...M.initial(),current:[0,0,0,0]})).current,null));
const fake={...M.initial(),records:[[.1,.1,.3,.5]],heights:[999],bubbles:[999]};A(()=>assert.equal(M.restore(JSON.stringify(fake)).heights,undefined));
for(const page of['water-experiment.html','academy-water-preview.html']){
 const dom=new JSDOM(read(page)),doc=dom.window.document,ids=[...doc.querySelectorAll('[id]')].map(e=>e.id);
 A(()=>assert.equal(ids.length,new Set(ids).size));
 for(const el of doc.querySelectorAll('script[src],link[href],a[href]')){const url=el.getAttribute('src')||el.getAttribute('href');if(!url||/^(https?:|#)/.test(url))continue;A(()=>assert(fs.existsSync(url.split(/[?#]/)[0]),url));}
 A(()=>assert(!doc.querySelector('audio[autoplay],audio[loop]')));dom.window.close();
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function open(page='water-experiment.html',seed={},options={}){
 const errors=[],virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(read(page),{url:'https://enjoji-road.github.io/magic_Academy/'+page,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole});
 const w=dom.window,doc=w.document,played=[],requests=[];let now=1000;
 for(const[k,v]of Object.entries(seed))w.localStorage.setItem(k,v);
 if(options.storageBlocked){w.Storage.prototype.getItem=()=>{throw Error('blocked');};w.Storage.prototype.setItem=()=>{throw Error('blocked');};}
 w.confirm=()=>true;w.matchMedia=()=>({matches:true});w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
 Object.defineProperty(w.performance,'now',{value:()=>now});
 if(!options.audioMissing){
  const gain=()=>({gain:{value:0,setValueAtTime(){},linearRampToValueAtTime(){},cancelScheduledValues(){},cancelAndHoldAtTime(){}},connect(){},disconnect(){}});
  w.AudioContext=class{constructor(){this.state='suspended';this.currentTime=0;this.destination={};}createGain(){return gain();}resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}decodeAudioData(raw){return Promise.resolve({duration:1.1,tag:raw.tag});}createBufferSource(){const source={connect(){},disconnect(){},start(){played.push(source.buffer.tag);},stop(){}};return source;}};
 }
 w.fetch=url=>{requests.push(String(url));if(options.audioFailed)return Promise.reject(Error('offline'));return Promise.resolve({ok:true,arrayBuffer:()=>Promise.resolve({tag:path.basename(new URL(url).pathname,'.mp3')})});};
 for(const el of doc.querySelectorAll('script[src]'))w.eval(read(el.getAttribute('src').split('?')[0]));
 function click(selector){const el=doc.querySelector(selector);assert(el,selector);now+=400;el.click();}
 function select(i,value){const el=doc.querySelector(`[data-outlet="${i}"]`);el.value=String(value);el.dispatchEvent(new w.Event('change',{bubbles:true}));}
 function submit(){now+=400;doc.querySelector('#answerForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}
 function data(){return JSON.parse(w.localStorage.getItem(M.KEY));}
 function seedNow(){const out={};for(let i=0;i<w.localStorage.length;i++){const k=w.localStorage.key(i);out[k]=w.localStorage.getItem(k);}return out;}
 return{w,doc,click,select,submit,data,seedNow,played,requests,errors};
}
async function complete(a){
 for(let i=0;i<3;i++){a.click('#profiles button:nth-child('+(i+1)+')');a.click('#pour');await flush();}
 for(let i=0;i<6;i++)for(const j of M.PAIRS[i])a.click(`[data-room="${i}"][data-destination="${j}"]`);
 a.submit();await flush();
}
(async()=>{
 const originalFire=JSON.stringify({version:4,puzzle:'fire-archive-six-leaves-20261020',passed:true}),originalEarth=JSON.stringify({untouched:true,passed:true});
 let a=open('water-experiment.html',{'magic-academy-fire-experiment-v4':originalFire,'magic-academy-earth-v2':originalEarth});await flush();
 A(()=>assert.equal(a.played.length,0));A(()=>assert.equal(a.requests.length,0));A(()=>assert(a.doc.querySelector('#pass').hidden));A(()=>assert.equal(a.doc.querySelectorAll('[data-spell]').length,4));
 A(()=>assert.equal(a.doc.querySelectorAll('#scene .tank-water').length,6));A(()=>assert.equal(a.doc.querySelectorAll('#profiles button').length,3));
 a.click('#pour');await flush();A(()=>assert.equal(a.data().records.length,1));A(()=>assert.equal(a.data().passed,false));A(()=>assert.equal(a.played.at(-1),'water'));
 a.click('#pour');await flush();A(()=>assert.equal(a.data().records.length,1));
 a.click('[data-spell="fire"]');a.click('#pour');A(()=>assert.equal(a.doc.querySelectorAll('#scene .bubble').length,0));A(()=>assert.equal(a.data().records.length,1));a.click('[data-spell="water"]');
 a.click('#enlarge');await flush();A(()=>assert(a.doc.querySelector('#zoomDialog').open));
 const allIds=[...a.doc.querySelectorAll('[id]')].map(x=>x.id);A(()=>assert.equal(allIds.length,new Set(allIds).size));a.click('#closeZoom');
 a.click('#recordList button');A(()=>assert(a.doc.querySelector('#zoomTitle').textContent.includes('観測')));a.click('#closeZoom');
 a.click('#drain');A(()=>assert.equal(a.data().current,null));A(()=>assert.equal(a.data().records.length,1));
 for(let i=0;i<4;i++)a.select(i,'null');a.click('#pour');await flush();A(()=>assert(a.doc.querySelector('#recordList').textContent.includes('9.4')));A(()=>assert(a.doc.querySelector('#recordList').textContent.includes('気泡は出なかった')));
 a.click('[data-spell="fire"]');a.click('#pour');A(()=>assert(a.doc.querySelector('#status').textContent.includes('銀縁')));A(()=>assert.equal(a.data().records.length,2));
 a.click('[data-spell="wind"]');a.click('#pour');A(()=>assert(a.doc.querySelector('#status').textContent.includes('布')));
 a.click('[data-spell="earth"]');a.click('#pour');A(()=>assert(a.doc.querySelector('#status').textContent.includes('石製')));
 a.click('[data-spell="water"]');
 const notes=a.doc.querySelector('#notes');notes.value='仮説\n<script>window.bad=true</script>';notes.dispatchEvent(new a.w.Event('input',{bubbles:true}));A(()=>assert(!a.w.bad));A(()=>assert.equal(a.data().notes,notes.value));
 a.click('[data-room="0"][data-destination="0"]');a.click('[data-room="0"][data-destination="1"]');a.click('[data-room="0"][data-destination="2"]');A(()=>assert.equal(a.data().draft[0].length,2));
 a.submit();await flush();const wrong=a.doc.querySelector('#answerStatus').textContent;A(()=>assert(a.doc.querySelector('#pass').hidden));
 a.click('[data-room="0"][data-destination="0"]');a.submit();A(()=>assert.equal(a.doc.querySelector('#answerStatus').textContent,wrong));a.click('[data-room="0"][data-destination="1"]');
 a.click('[data-settings]');A(()=>assert(a.doc.querySelector('#academySettings').open));a.click('#academySoundToggle');a.click('#academySettingsClose');const quiet=a.played.length;
 await complete(a);A(()=>assert(a.data().passed));A(()=>assert(!a.doc.querySelector('#pass').hidden));A(()=>assert.equal(a.played.length,quiet));
 A(()=>assert.equal(a.w.localStorage.getItem('magic-academy-fire-experiment-v4'),originalFire));A(()=>assert.equal(a.w.localStorage.getItem('magic-academy-earth-v2'),originalEarth));
 let saved=a.seedNow();a.w.close();a=open('water-experiment.html',saved);await flush();A(()=>assert(!a.doc.querySelector('#pass').hidden));A(()=>assert.equal(a.played.length,0));A(()=>assert.equal(a.requests.length,0));A(()=>assert.equal(a.doc.querySelector('#notes').value,notes.value));A(()=>assert(!a.doc.querySelector('#pass').classList.contains('just-passed')));
 a.click('#reset');A(()=>assert(a.doc.querySelector('#resetDialog').open));a.click('#cancelReset');A(()=>assert(a.data().passed));a.click('#reset');a.click('#confirmReset');A(()=>assert(!a.data().passed));A(()=>assert.equal(a.data().records.length,0));A(()=>assert(a.data().notes.includes('仮説')));A(()=>assert.equal(a.doc.querySelector('#draftCount').textContent,'記入 0 / 12 本'));a.click('#clearNotes');A(()=>assert.equal(a.data().notes,''));a.w.close();
 for(const options of[{},{audioMissing:true},{audioFailed:true},{storageBlocked:true}]){
  const b=open('water-experiment.html',{},options);await complete(b);A(()=>assert(!b.doc.querySelector('#pass').hidden));A(()=>assert.equal(b.errors.length,0));
  if(options.storageBlocked)A(()=>assert(b.doc.querySelector('#saveStatus').textContent.includes('保存できません')));
  else A(()=>assert(b.data().passed));
  if(!options.audioMissing&&!options.audioFailed)A(()=>assert.equal(b.played.filter(x=>x==='pass').length,1));
  const n=b.played.length;b.submit();await flush();A(()=>assert.equal(b.played.length,n));b.w.close();
 }
 const corrupt=open('water-experiment.html',{[M.KEY]:'bad'});A(()=>assert(corrupt.doc.querySelector('#saveStatus').textContent.includes('読み取れず')));A(()=>assert(corrupt.doc.querySelector('#pass').hidden));corrupt.w.close();
 const hall=open('academy-water-preview.html',saved);const before=hall.seedNow();A(()=>assert(hall.doc.querySelector('#water-action').textContent.includes('再入室')));A(()=>assert(hall.doc.querySelector('#academy-progress').textContent.includes('2 / 4')));A(()=>assert.equal(hall.doc.querySelector('#water-door').getAttribute('href'),'water-experiment.html'));A(()=>assert.deepEqual(hall.seedNow(),before));A(()=>assert.equal(hall.played.length,0));A(()=>assert.equal(hall.requests.length,0));A(()=>assert.equal(hall.errors.length,0));hall.w.close();
 const blockedHall=open('academy-water-preview.html',{}, {storageBlocked:true});A(()=>assert(blockedHall.doc.querySelector('#hall-save-note').textContent.includes('確認できません')));A(()=>assert.equal(blockedHall.errors.length,0));blockedHall.w.close();
 A(()=>assert(read('water-experiment.css').includes('prefers-reduced-motion')));A(()=>assert(!read('water-app.js').includes('innerHTML')));A(()=>assert.equal(a.errors.length,0));
 console.log(JSON.stringify({checks,status:'passed',physics:'625 independent Python/JS comparisons',scope:'model, DOM, storage, grading, existing-file preservation; no real-browser layout or sound-output test'},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
