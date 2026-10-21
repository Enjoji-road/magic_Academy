/* Spoilers. Pure model + real page DOM controls. Not a browser layout/audio-output test. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require(process.env.STUDIO_JSDOM||'jsdom'),M=require('../../water-insight-model.js');
process.chdir(path.resolve(__dirname,'../..'));
const BASE='ed257d3e3bc7acdbf810cdfc65bf26bd82f51dcd',read=f=>fs.readFileSync(f,'utf8'),report=JSON.parse(read('research/water-insight/verification.json'));let checks=0;
const A=fn=>{fn();checks++;},near=(a,b)=>A(()=>assert(Math.abs(a-b)<1e-5,`${a} != ${b}`));
for(const file of cp.execFileSync('git',['ls-tree','-r','--name-only',BASE],{encoding:'utf8'}).trim().split('\n'))A(()=>assert.deepEqual(fs.readFileSync(file),cp.execFileSync('git',['show',BASE+':'+file]),'legacy file changed: '+file));
for(const sample of report.cross_language_samples){let p=M.physicalInitial();for(const action of sample.actions)p=M.physicalStep(p,action).physical;for(const field of['water','air','bell','lost'])near(p[field],sample.physical[field]);A(()=>assert.equal(p.open,sample.physical.open));A(()=>assert(M.validPhysical(p)));}
let inverse=[];for(let r=0;r<=5000;r+=10){let p=M.physicalInitial(r);p=M.physicalStep(p,'open').physical;p=M.physicalStep(p,'fill').physical;if(M.measure(p).full&&M.measure(p).bellWater===report.B.full_observation.water_in_bell_ml)inverse.push(r);}
A(()=>assert.deepEqual(inverse,report.B.solutions));
for(let n=0;n<3125;n++){let code=n,s=M.initial();for(let k=0;k<5;k++){M.act(s,['small','fill','open','close','bath'][code%5]);code=Math.floor(code/5);}A(()=>assert(!s.passed));A(()=>assert.equal(s.attempts,0));A(()=>assert(M.validPhysical(s.physical)));}
for(const value of['2730','２７３０','2,730',' ２，７３０ ']){const s=M.initial();A(()=>assert(M.grade(s,value)));}
let correct=0;for(let n=0;n<=5000;n++){const s=M.initial();if(M.grade(s,String(n)))correct++;}A(()=>assert.equal(correct,1));
A(()=>assert.equal(M.restore('{invalid'),null));A(()=>assert.equal(M.restore(JSON.stringify({...M.initial(),version:0})),null));A(()=>assert.equal(M.restore(JSON.stringify({...M.initial(),puzzle:'water-six-chambers-20261021'})),null));
const corrupt=M.initial();corrupt.physical.bell+=100;A(()=>assert.equal(M.restore(JSON.stringify(corrupt)),null));
const fake=M.initial();fake.records[0].reading=2730;A(()=>assert.equal(M.measure(M.restore(JSON.stringify(fake)).records[0].physical).displayWater,3430));
for(const page of['water-insight-experiment.html','academy-water-insight-preview.html']){
 const dom=new JSDOM(read(page)),doc=dom.window.document,ids=[...doc.querySelectorAll('[id]')].map(e=>e.id);A(()=>assert.equal(ids.length,new Set(ids).size));
 for(const el of doc.querySelectorAll('script[src],link[href],a[href]')){const link=el.getAttribute('src')||el.getAttribute('href');if(!link||/^(https?:|#)/.test(link))continue;A(()=>assert(fs.existsSync(link.split(/[?#]/)[0]),link));}
 A(()=>assert(!doc.querySelector('audio[autoplay],audio[loop]')));dom.window.close();
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function open(page='water-insight-experiment.html',seed={},options={}){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(read(page),{url:'https://enjoji-road.github.io/magic_Academy/'+page,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});const w=dom.window,doc=w.document,played=[],requests=[];let now=1000;
 for(const[k,v]of Object.entries(seed))w.localStorage.setItem(k,v);
 if(options.storageBlocked){w.Storage.prototype.getItem=()=>{throw Error('blocked');};w.Storage.prototype.setItem=()=>{throw Error('blocked');};}
 w.confirm=()=>true;w.matchMedia=()=>({matches:true});w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLElement.prototype.scrollBy=function(v){this.scrollLeft+=v.left||0;};
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
 Object.defineProperty(w.performance,'now',{value:()=>now});
 if(!options.audioMissing){const gain=()=>({gain:{value:0,setValueAtTime(){},linearRampToValueAtTime(){},cancelScheduledValues(){},cancelAndHoldAtTime(){}},connect(){},disconnect(){}});w.AudioContext=class{constructor(){this.state='suspended';this.currentTime=0;this.destination={};}createGain(){return gain();}resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}decodeAudioData(raw){return Promise.resolve({duration:1.1,tag:raw.tag});}createBufferSource(){const s={connect(){},disconnect(){},start(){played.push(s.buffer.tag);},stop(){}};return s;}};}
 w.fetch=url=>{requests.push(String(url));if(options.audioFailed)return Promise.reject(Error('unavailable'));return Promise.resolve({ok:true,arrayBuffer:()=>Promise.resolve({tag:path.basename(new URL(url).pathname,'.mp3')})});};
 for(const el of doc.querySelectorAll('script[src]'))w.eval(read(el.getAttribute('src').split('?')[0]));
 const click=q=>{now+=400;const el=doc.querySelector(q);assert(el,q);el.click();};
 const input=(q,value)=>{const el=doc.querySelector(q);el.value=value;el.dispatchEvent(new w.Event('input',{bubbles:true}));};
 const submit=value=>{if(value!==undefined)input('#answer',value);now+=400;doc.querySelector('#answerForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));};
 const seedNow=()=>{const out={};for(let i=0;i<w.localStorage.length;i++){const k=w.localStorage.key(i);out[k]=w.localStorage.getItem(k);}return out;};
 return{w,doc,click,input,submit,seedNow,played,requests,errors,data:()=>JSON.parse(w.localStorage.getItem(M.KEY))};
}
(async()=>{
 const E=require('../../engine.js'),oldEarth=E.initial();oldEarth.passed=true;
 const seed={'magic-academy-fire-experiment-v4':JSON.stringify({version:4,puzzle:'fire-archive-six-leaves-20261020',passed:true}),'magic-academy-earth-v2':JSON.stringify(oldEarth),'magic-academy-water-experiment-v1':JSON.stringify(require('../../water-model.js').initial()),'magic-academy-sfx-v1':'on'};
 let a=open('water-insight-experiment.html',seed);await flush();A(()=>assert.equal(a.played.length,0));A(()=>assert.equal(a.requests.length,0));A(()=>assert(a.doc.querySelector('#liveReading').textContent.includes('3,430')));A(()=>assert.equal(a.doc.querySelectorAll('#recordList .journal').length,1));A(()=>assert(a.doc.querySelector('#pass').hidden));
 a.click('#fullPour');await flush();A(()=>assert(a.data().physical.water>2730));A(()=>assert(a.data().physical.water<5000));A(()=>assert(a.doc.querySelector('#liveReading').textContent.includes('3,430')));A(()=>assert(!a.data().passed));
 a.click('#fullPour');await flush();A(()=>assert(a.doc.querySelector('#status').textContent.includes('すでに止まって')));A(()=>assert.equal(a.data().records.length,2));
 const water=a.data().physical.water;a.click('#valve');await flush();near(a.data().physical.water,water);A(()=>assert(a.doc.querySelectorAll('#scene .bubble').length>0));A(()=>assert(a.doc.querySelector('#status').textContent.includes('注水せず')));
 a.click('#fullPour');await flush();A(()=>assert.equal(a.doc.querySelector('#fullFlag').textContent,'上限到達'));A(()=>assert(a.doc.querySelector('#liveReading').textContent.includes('1,160')));A(()=>assert(a.doc.querySelector('#pass').hidden));
 a.click('#fullPour');await flush();A(()=>assert(a.doc.querySelector('#status').textContent.includes('到達したまま')));
 const list=a.doc.querySelector('#recordList');Object.defineProperty(list,'scrollWidth',{value:1000,configurable:true});list.scrollLeft=137;a.click('#fullPour');A(()=>assert.equal(list.scrollLeft,137));a.click('#nextRecord');A(()=>assert(list.scrollLeft>137));a.click('#previousRecord');
 a.click('#firstRecord');A(()=>assert.equal(list.scrollLeft,0));a.click('#lastRecord');A(()=>assert.equal(list.scrollLeft,1000));
 a.click('#enlarge');A(()=>assert(a.doc.querySelector('#zoomDialog').open));const ids=[...a.doc.querySelectorAll('[id]')].map(e=>e.id);A(()=>assert.equal(ids.length,new Set(ids).size));a.click('#closeZoom');a.click('#recordList button');A(()=>assert(a.doc.querySelector('#zoomTitle').textContent.includes('実験前')));a.click('#closeZoom');
 for(const sp of['fire','wind','earth']){const before=JSON.stringify(a.data().physical);a.click(`[data-spell="${sp}"]`);a.click('#otherMagic');A(()=>assert.equal(JSON.stringify(a.data().physical),before));A(()=>assert.equal(a.doc.querySelectorAll('#scene .bubble').length,0));}a.click('[data-spell="water"]');
 a.input('#notes','仮説\n<script>window.bad=true</script>');A(()=>assert(!a.w.bad));A(()=>assert(a.data().notes.includes('仮説')));
 let wrongMessage;for(const n of['3430','1160','2270','5000','2731','']){a.submit(n);await flush();A(()=>assert(a.doc.querySelector('#pass').hidden));const m=a.doc.querySelector('#answerStatus').textContent;if(wrongMessage)A(()=>assert.equal(m,wrongMessage));wrongMessage=m;}
 a.submit('２，７３０');await flush();A(()=>assert(a.data().passed));A(()=>assert(!a.doc.querySelector('#pass').hidden));A(()=>assert.equal(a.played.filter(x=>x==='pass').length,1));a.submit();await flush();A(()=>assert.equal(a.played.filter(x=>x==='pass').length,1));
 for(const[k,v]of Object.entries(seed))A(()=>assert.equal(a.w.localStorage.getItem(k),v));
 const saved=a.seedNow();a.w.close();a=open('water-insight-experiment.html',saved);await flush();A(()=>assert(!a.doc.querySelector('#pass').hidden));A(()=>assert.equal(a.played.length,0));A(()=>assert.equal(a.requests.length,0));A(()=>assert(!a.doc.querySelector('#pass').classList.contains('just-passed')));A(()=>assert(a.doc.querySelector('#notes').value.includes('仮説')));
 a.click('#restart');A(()=>assert(a.data().passed));A(()=>assert.equal(a.data().physical.water,2730));A(()=>assert(a.data().records.some(r=>r.action==='fill')));const repeated=a.seedNow();a.w.close();a=open('water-insight-experiment.html',repeated);A(()=>assert.equal(a.data().records.at(-1).action,'restart'));A(()=>assert(a.doc.querySelector('#liveReading').textContent.includes('3,430')));
 a.click('#reset');a.click('#cancelReset');A(()=>assert(a.data().passed));a.click('#reset');a.click('#confirmReset');A(()=>assert(!a.data().passed));A(()=>assert.equal(a.data().records.length,1));A(()=>assert(a.data().notes.includes('仮説')));A(()=>assert.equal(a.doc.querySelector('#answer').value,''));a.click('#clearNotes');A(()=>assert.equal(a.data().notes,''));A(()=>assert.equal(a.errors.length,0));a.w.close();
 let midway=open();midway.click('#fullPour');await flush();const midSeed=midway.seedNow(),midVolume=midway.data().physical.water;midway.w.close();midway=open('water-insight-experiment.html',midSeed);near(midway.data().physical.water,midVolume);A(()=>assert.equal(midway.data().physical.open,false));midway.click('#valve');A(()=>assert(midway.doc.querySelector('#liveReading').textContent.includes('3,320')));midway.click('#fullPour');await flush();A(()=>assert(midway.doc.querySelector('#liveReading').textContent.includes('1,160')));A(()=>assert(!midway.data().passed));midway.w.close();
 for(const options of[{audioMissing:true},{audioFailed:true},{storageBlocked:true}]){const b=open('water-insight-experiment.html',{},options);b.click('#valve');b.click('#fullPour');await flush();b.submit('2730');await flush();A(()=>assert(!b.doc.querySelector('#pass').hidden));A(()=>assert.equal(b.errors.length,0));if(options.storageBlocked)A(()=>assert(b.doc.querySelector('#saveStatus').textContent.includes('保存できません')));b.w.close();}
 const quiet=open('water-insight-experiment.html');quiet.click('[data-settings]');quiet.click('#academySoundToggle');quiet.click('#academySettingsClose');quiet.click('#valve');quiet.click('#fullPour');await flush();quiet.submit('2730');await flush();A(()=>assert.equal(quiet.played.length,0));A(()=>assert(quiet.data().passed));quiet.w.close();
 const malformed=open('water-insight-experiment.html',{[M.KEY]:'bad'});A(()=>assert(malformed.doc.querySelector('#saveStatus').textContent.includes('読み取れず')));A(()=>assert(malformed.doc.querySelector('#pass').hidden));malformed.w.close();
 const hall=open('academy-water-insight-preview.html',saved),before=hall.seedNow();A(()=>assert(hall.doc.querySelector('#water-action').textContent.includes('再入室')));A(()=>assert(hall.doc.querySelector('#academy-progress').textContent.includes('3 / 4')));A(()=>assert.equal(hall.doc.querySelector('#water-door').getAttribute('href'),'water-insight-experiment.html'));A(()=>assert.deepEqual(hall.seedNow(),before));A(()=>assert.equal(hall.played.length,0));A(()=>assert.equal(hall.errors.length,0));hall.w.close();
 A(()=>assert(read('water-insight-experiment.css').includes('prefers-reduced-motion')));A(()=>assert(read('water-experiment.css').includes('scroll-snap-type:x')));A(()=>assert(!read('water-insight-app.js').includes('innerHTML')));
 console.log(JSON.stringify({checks,result:'passed',scope:'78 legacy files, independent physical samples, inverse uniqueness, no actuation auto-pass, actual DOM flow, saves, reset, horizontal record controls, audio-control failure paths; no real-browser or real-device test'},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
