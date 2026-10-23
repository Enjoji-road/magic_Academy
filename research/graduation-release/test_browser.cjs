/* Full official flow through real Chromium. Contains puzzle spoilers. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'../..'),KEY='magic-academy-graduation-v1';
const F=require(path.join(ROOT,'fire-experiment-model.js')),W=require(path.join(ROOT,'water-insight-model.js'));
const V=require(path.join(ROOT,'wind-ribbon-model.js')),E=require(path.join(ROOT,'engine.js'));
const baseline=JSON.parse(fs.readFileSync(path.join(ROOT,'research/graduation-magic-v3/source-baseline.json')));
const earthSolution=baseline.earth.state;
const pages={fire:'fire-studio.html',water:'water-insight-experiment.html',wind:'wind-ribbon-experiment.html',earth:'earth-studio.html'};
const officialKeys=[F.KEY,W.KEY,'magic-academy-wind-ribbon-v1','magic-academy-earth-v2'];
const results={checks:[],viewports:[],errors:[]};
const evidence=process.env.EVIDENCE_DIR||'/tmp/magic-academy-release-evidence';fs.mkdirSync(evidence,{recursive:true});
const mime={'.js':'text/javascript','.html':'text/html','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{
 let name=decodeURIComponent(req.url.split('?')[0]),file;
 if(name.startsWith('/_test-fonts/')&&process.env.JAPANESE_FONT_DIR)file=path.join(process.env.JAPANESE_FONT_DIR,name.slice(13));
 else {if(name.endsWith('/'))name+='index.html';file=path.join(ROOT,name);if(!file.startsWith(ROOT+path.sep)){res.writeHead(403);res.end();return;}}
 try{res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}
});
let browser,base;
function ok(value,label){assert.ok(value,label);results.checks.push(label);}
async function context(viewport={width:390,height:844},reducedMotion='reduce'){
 const ctx=await browser.newContext({viewport,reducedMotion});const p=await ctx.newPage();
 await ctx.route('**/functions/v1/academy-statistics**',route=>route.fulfill({contentType:'application/json',body:JSON.stringify(route.request().method()==='GET'?{ok:true,entrants:0,started_at:null,fire:{attempted:0,passed:0},water:{attempted:0,passed:0},wind:{attempted:0,passed:0},earth:{attempted:0,passed:0},graduation:{attempted:0,passed:0}}:{ok:true})}));
 p.on('pageerror',e=>results.errors.push(e.message));p.on('dialog',d=>d.accept());
 await p.goto(base+'/');return {p,ctx};
}
const frame=p=>p.frameLocator('iframe');
const spell=(p,s)=>p.locator('[data-spell="'+s+'"]').click();
const trace=(p,s)=>p.locator('[data-target="'+s+'"]').click();
const saved=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
const examSaves=p=>p.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),officialKeys);
const active=(p,s)=>p.locator('[data-target="'+s+'"]').evaluate(e=>!e.classList.contains('dormant')&&!e.classList.contains('empty'));
async function observe(p){await p.locator('#afterglow button').click();await frame(p).locator('#castInstruction').filter({hasText:'魔法を選択中'}).waitFor();return frame(p);}
async function closeObservation(p){await p.locator('.academy-observation-head button').click();}
async function screenshot(p,name){
 if(process.env.JAPANESE_FONT_DIR){for(const f of p.frames()){await f.addStyleTag({url:base+'/_test-fonts/400.css'});await f.addStyleTag({content:'*{font-family:"Noto Sans JP",sans-serif!important}'});await f.evaluate(()=>document.fonts.ready);}}
 await p.screenshot({path:path.join(evidence,name+'.png'),fullPage:false});
}
async function seedPassed(p){
 const fire=F.initial();F.submit(fire,F.PLATES.map(p=>p.digit).join(''));
 const water=W.initial();W.act(water,'open');W.act(water,'fill');W.grade(water,'2730');
 const wind=V.initial();wind.passed=true;
 await p.evaluate(seed=>{for(const[k,v]of Object.entries(seed))localStorage.setItem(k,JSON.stringify(v));},{[F.KEY]:fire,[W.KEY]:water,'magic-academy-wind-ribbon-v1':wind,'magic-academy-earth-v2':earthSolution});
}
async function inspectLights(p,label){
 const before=await p.evaluate(()=>JSON.stringify(Object.entries(localStorage).sort()));
 await p.locator('#inspectWelcomeLights').click();
 const dialog=p.locator('#welcomeLightsDialog');
 ok(await dialog.isVisible(),label+': the lights have a separate observation window');
 ok(await dialog.locator('svg text').filter({hasText:'期'}).count()===3,label+': alumni lights and their period marks are visible');
 ok(await p.locator('iframe').count()===0&&!await p.locator('.academy-observation-dialog').isVisible(),label+': inspecting lights never loads the final trial');
 ok(await dialog.locator('iframe,[data-spell],#taskTitle,#castObject').count()===0,label+': the light window contains no trial or magic controls');
 ok((await dialog.textContent()).includes('術者の手へ伸びる尾はありません')&&(await dialog.textContent()).includes('七夜ごとに'),label+': the original visible light and maintenance clues are preserved');
 await p.locator('#closeWelcomeLights').click();
 ok(await p.locator('#inspectWelcomeLights').evaluate(e=>e===document.activeElement),label+': closing returns focus to the inspection button');
 assert.equal(await p.evaluate(()=>JSON.stringify(Object.entries(localStorage).sort())),before);
 ok(true,label+': inspecting lights changes no saved data');
}
async function solve(p){
 await spell(p,'fire');await p.locator('#castObject').click();
 for(const [recipient,source]of [['water','fire'],['wind','water'],['earth','wind'],['fire','earth']]){await spell(p,recipient);await trace(p,source);}
 await p.locator('#release').click();
}
async function placeStones(p){
 await p.locator('#board [data-x="2"][data-y="2"]').click();await p.locator('#cancel').click();
 for(const [id,want]of Object.entries(earthSolution.pieces)){
  await p.locator('[data-piece="'+id+'"]').click();
  if(want.flip)await p.locator('#flip').click();
  for(let i=0;i<want.rot;i++)await p.locator('#rotate').click();
  await p.locator('#board [data-x="3"][data-y="3"]').click();
  const actual=await p.locator('#board .ghost').evaluateAll(cells=>[Math.min(...cells.map(c=>+c.dataset.x)),Math.min(...cells.map(c=>+c.dataset.y))]);
  for(const [axis,delta]of [[0,want.at[0]-actual[0]],[1,want.at[1]-actual[1]]]){
   for(let i=0;i<Math.abs(delta);i++)await p.locator('[data-nudge="'+(axis===0?[Math.sign(delta),0]:[0,Math.sign(delta)]).join(',')+'"]').click();
  }
  assert.equal(await p.locator('#cast').isEnabled(),true,'Placement must be valid: '+id);
  await p.locator('#cast').click();
 }
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-proxy-server']});results.browser=browser.version();
  const {p,ctx}=await context({width:390,height:844},'no-preference');
  ok(await p.locator('#enterGraduation').isDisabled(),'Fresh entrance requires four real exam passes');
  ok(!await p.locator('#hallGraduationReplay').isVisible(),'A fresh entrance hides the graduation replay button');
  ok(await p.locator('#hallGraduationReplay').isDisabled(),'A fresh entrance disables the graduation replay button');
  await p.locator('#hallGraduationReplay').dispatchEvent('click');
  ok(!await p.locator('.academy-observation-dialog').isVisible(),'An unearned replay click cannot open any observation or graduation screen');
  ok(await p.locator('.welcome-lantern:not([hidden])').count()===3,'Three alumni lights exist before any exam');
  await inspectLights(p,'Fresh entrance');
  await p.locator('#inspectWelcomeLights').click();await screenshot(p,'hall-read-only-lights');await p.keyboard.press('Escape');
  ok(!await p.locator('#welcomeLightsDialog').isVisible(),'Escape closes the read-only lights');
  let f;

  // A genuine early revisit. No synthetic pass or visit flag is written.
  await p.goto(base+'/'+pages.water);const waterBefore=await p.evaluate(k=>JSON.parse(localStorage.getItem(k))?.physical||window.WaterInsight.physicalInitial(),W.KEY);
  f=await observe(p);await spell(f,'water');await f.locator('#castObject').click();
  ok((await f.locator('#pageTitle').textContent()).includes('術の余韻')&&!(await f.locator('#pageTitle').textContent()).includes('手を離した'),'Early classroom observations use their classroom title');
  await spell(f,'wind');await trace(f,'water');await f.locator('#selectedSupport').click();
  ok(await active(f,'wind'),'An early cross-attribute observation remains after its own hand releases');
  await f.locator('#release').click();ok(!await active(f,'wind'),'An open chain fades without the donor hand');
  assert.deepEqual(await p.evaluate(k=>JSON.parse(localStorage.getItem(k)).physical,W.KEY),waterBefore);ok(true,'Early water revisit preserves the sealed physical experiment');
  ok(!(await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),W.KEY)).passed,'Revisiting does not pass the normal exam');
  await closeObservation(p);
  await p.locator('#notes').fill('水の実験メモ・卒業後も保持');await p.locator('#valve').click();await p.locator('#fullPour').click();
  ok((await p.locator('#liveReading').textContent()).includes('1,160'),'The original water experiment still measures 1,160 mL');
  await p.locator('#answer').fill('1160');await p.locator('#answerForm button[type=submit]').click();ok(!await p.locator('#pass').isVisible(),'An incorrect normal answer remains incorrect');
  await p.locator('#answer').fill('2730');await p.locator('#answerForm button[type=submit]').click();ok(await p.locator('#pass').isVisible(),'Water passes through its original answer form');
  await p.goto(base+'/'+pages.earth);await placeStones(p);ok(await p.locator('#success').isVisible(),'All nine stones pass through actual placement controls');
  await p.goto(base+'/'+pages.wind);await p.locator('[data-wind="right"]').click();await p.locator('[data-view="right"]').click();await p.locator('#notes').fill('風の実験メモ・保持');await p.locator('#answer').fill(V.trace().text);await p.locator('#answerForm button[type=submit]').click();ok(await p.locator('#pass').isVisible(),'Wind passes with its unchanged inscription');
  await p.goto(base+'/'+pages.fire);await p.locator('[data-lamp="first"]').click();await p.locator('[data-lamp="second"]').click();await p.locator('#experimentNotes').fill('炎の実験メモ・保持');await p.locator('#answer').fill(F.PLATES.map(v=>v.digit).join(''));await p.locator('#answerForm button[type=submit]').click();ok(await p.locator('#pass').isVisible(),'Fire passes with both original observations');
  await p.locator('.academy-next-trial a').click();await frame(p).locator('#castInstruction').filter({hasText:'魔法を選択中'}).waitFor();
  ok(await p.locator('.subject-seals .passed').count()===4,'The hall reflects all four independent normal records');
  ok(!await frame(p).locator('#castObject').isDisabled(),'The fourth pass opens the official graduation seat');
  ok(!await p.locator('#hallGraduationReplay').isVisible()&&await p.locator('#hallGraduationReplay').isDisabled(),'Four exam passes alone do not enable graduation replay');
  ok(await frame(p).locator('body').evaluate(()=>window.GraduationPresentation.replay())===false,'The presentation also rejects replay before graduation');
  await closeObservation(p);await screenshot(p,'hall-four-passes');

  // Visit real classroom pages in an order different from the exams.
  let journalText='四教室を見比べる卒業用メモ';
  for(const native of ['wind','fire','earth','water']){
   await p.goto(base+'/'+pages[native]+'#afterglow');f=frame(p);await f.locator('#castInstruction').filter({hasText:'魔法を選択中'}).waitFor();
   await f.locator('#resetRoom').click();await spell(f,native);await f.locator('#castObject').click();
   const before=await examSaves(p),recipient={fire:'water',water:'wind',wind:'earth',earth:'fire'}[native];
   await spell(f,recipient);await trace(f,native);await f.locator('#selectedSupport').click();
   ok(await active(f,recipient),native+': accepted pair is observable inside its actual classroom');
   assert.deepEqual(await examSaves(p),before);ok(true,native+': touching a result never writes normal exam saves');
   await f.locator('#release').click();ok(!await active(f,recipient),native+': the same law explains losing donor support');
   if(native==='wind'){
    await f.locator('#hold').click();await f.getByRole('button',{name:'風の尾を中央一周ぶん追う'}).click();ok((await f.locator('#apparatus').textContent()).includes('反対側'),'The actual ribbon model still swaps the boundary side after one center lap');
    await screenshot(p,'wind-revisit');
   }
   if(native==='fire')await f.locator('#notes').fill(journalText);
   if(native==='earth')ok(await f.locator('#notes').inputValue()===journalText,'The graduation notebook follows between real classroom pages');
   ok(!(await saved(p)).graduated,'A classroom observation alone never graduates');
  }
  f=frame(p);await f.locator('[data-room="hall"]').click();await frame(p).locator('#castInstruction').filter({hasText:'魔法を選択中'}).waitFor();f=frame(p);
  const beforeFinal=await examSaves(p);
  for(const s of ['fire','water','wind','earth']){await spell(f,s);await f.locator('#castObject').click();}await f.locator('#release').click();
  ok(!(await saved(p)).graduated,'Using every spell on the seat alone does not graduate');
  await f.locator('#resetRoom').click();await f.locator('#focusBench').click();
  await solve(f);await f.locator('#graduationScreen[data-phase="observe"]').waitFor();
  ok(await f.locator('#graduationObservation').isVisible(),'The persistent light is shown before darkening');
  ok(await p.locator('.academy-observation-dialog').evaluate(d=>d.classList.contains('is-celebrating')),'The celebration covers the parent observation window');
  ok((await saved(p)).graduated,'The actual settled state earns a persistent graduation record');
  await f.locator('#graduationScreen[data-phase="fade-out"]').waitFor();
  await p.keyboard.press('Escape');ok(await f.locator('#graduationScreen').isVisible(),'Escape cannot interrupt the success transition');
  await f.locator('#graduationScreen[data-phase="ready"]').waitFor();
  ok(await f.locator('#graduationTitle').textContent()==='卒業おめでとうございます','The full-screen message announces graduation immediately');
  await screenshot(p,'graduation-mobile');
  const intent=await f.locator('#shareGraduation').getAttribute('href'),u=new URL(intent);
  ok(u.origin==='https://x.com'&&u.pathname==='/intent/tweet','Sharing uses the official X post intent');
  ok(u.searchParams.get('url')==='https://enjoji-road.github.io/magic_Academy/','The shared URL is the official entrance');
  ok(u.searchParams.get('text').startsWith('🪄 魔法学校を卒業しました！🎓\n\n')&&!u.searchParams.get('text').includes('支え'),'The Japanese, emoji and newlines decode without a puzzle spoiler');
  ok(u.searchParams.get('text').includes('#road謎'),'The X draft retains #road謎');
  await ctx.route('https://x.com/intent/tweet**',route=>route.fulfill({body:'Intent request checked; no post submitted.'}));
  const popupPromise=ctx.waitForEvent('page');await f.locator('#shareGraduation').click();const popup=await popupPromise;await popup.waitForLoadState();ok(popup.url()===intent,'X opens a separate posting window with the exact draft');await popup.close();
  await f.locator('#returnToStudy').click();ok(!await f.locator('#graduationScreen').isVisible(),'Returning reveals the completed spell state');
  ok(await f.locator('[data-target="fire"]').evaluate(e=>!e.classList.contains('dormant')),'The completed light remains observable after returning');
  await spell(f,'fire');await f.locator('#castObject').click();await f.locator('#release').click();ok((await saved(p)).graduated,'Rebuilding and breaking the current spell preserves graduation history');
  assert.deepEqual(await examSaves(p),beforeFinal);ok(true,'The entire final spell, celebration and sharing preserve all four exam saves');
  await closeObservation(p);await p.reload();ok(await p.locator('#hallGraduationReplay').isVisible(),'Graduation can be replayed from the entrance after reload');
  const earnedGraduation=await saved(p);
  ok(await p.locator('.welcome-lantern:not([hidden])').count()===4,'The graduate adds a fourth welcoming light');
  ok(!await p.locator('.academy-observation-dialog').isVisible(),'Reloading the entrance does not force a celebration');
  await p.locator('#hallGraduationReplay').click();await frame(p).locator('#graduationScreen[data-phase="ready"]').waitFor();ok(true,'Saved graduation replays without reconstructing a spell');await frame(p).locator('#returnToStudy').click();await closeObservation(p);
  // Clear only the earned graduation in this test context, keeping the
  // existing iframe alive to catch stale availability after an explicit reset.
  await p.locator('#enterGraduation').click();const resetFrame=frame(p);await resetFrame.locator('#castInstruction').filter({hasText:'魔法を選択中'}).waitFor();const beforeReset=await examSaves(p);
  await resetFrame.locator('#settings').click();await resetFrame.locator('#resetAll').click();
  ok(!(await saved(p)).graduated,'An explicit graduation reset clears its own history');
  ok(!await p.locator('#hallGraduationReplay').isVisible()&&await p.locator('#hallGraduationReplay').isDisabled(),'The entrance removes replay immediately after the graduation reset');
  ok(await resetFrame.locator('body').evaluate(()=>window.GraduationPresentation.replay())===false,'The already-loaded presentation loses replay permission after reset');
  await closeObservation(p);await p.locator('#hallGraduationReplay').dispatchEvent('click');
  ok(!await p.locator('.academy-observation-dialog').isVisible(),'A stale replay click cannot reopen the existing window after reset');
  assert.deepEqual(await examSaves(p),beforeReset);ok(true,'Clearing graduation preserves all four exam saves');
  await p.goto(base+'/'+pages.water);ok(await p.locator('#notes').inputValue()==='水の実験メモ・卒業後も保持','Normal water notes survive the complete graduation');
  await p.goto(base+'/'+pages.fire);ok(await p.locator('#experimentNotes').inputValue()==='炎の実験メモ・保持','Normal fire notes survive the complete graduation');
  await ctx.close();

  // Every pre-admission route must remain outside the final trial.
  for(const passed of [0,1,2,3]){
   const gate=await context();await seedPassed(gate.p);
   await gate.p.evaluate(({keys,passed})=>keys.slice(passed).forEach(k=>localStorage.removeItem(k)),{keys:officialKeys,passed});
   await gate.p.goto(base+'/index.html?admission='+passed);
   ok(await gate.p.locator('#enterGraduation').isDisabled(),passed+' passes: final trial entry stays disabled');
   await inspectLights(gate.p,passed+' passes');
   await gate.p.locator('#enterGraduation').dispatchEvent('click');
   ok(await gate.p.locator('iframe').count()===0,passed+' passes: synthetic entry clicks cannot open the trial');
   await gate.p.goto(base+'/index.html?admission='+passed+'#afterglow');
   ok(await gate.p.locator('iframe').count()===0,passed+' passes: the observation hash cannot open the final trial');
   await gate.p.goto(base+'/index.html?exam-entry='+passed+'#graduation-exam');
   ok(await gate.p.locator('iframe').count()===0,passed+' passes: the final-trial hash cannot bypass admission');
   await gate.p.goto(base+'/graduation.html?room=hall&embedded=1');
   await gate.p.waitForURL(base+'/index.html#graduation-exam');
   ok(await gate.p.locator('iframe').count()===0&&!await gate.p.locator('#graduationContent').count(),passed+' passes: a direct trial URL returns to the corridor');
   await gate.p.goto(base+'/index.html?legacy-entry='+passed);
   await gate.p.evaluate(()=>{const f=document.createElement('iframe');f.src='graduation.html?room=hall&embedded=1';document.body.append(f);});
   await gate.p.waitForURL(base+'/index.html#graduation-exam');
   ok(await gate.p.locator('iframe').count()===0,passed+' passes: an obsolete embedded entry also returns the whole page to the corridor');
   await gate.ctx.close();
  }
  const admitted=await context();await seedPassed(admitted.p);await admitted.p.reload();
  await inspectLights(admitted.p,'Four passes');
  await admitted.p.locator('#enterGraduation').click();await frame(admitted.p).locator('#castInstruction').filter({hasText:'魔法を選択中'}).waitFor();
  ok(await frame(admitted.p).locator('#graduationContent').isVisible(),'Four passes: only the explicit final-trial entry opens the trial');
  const other=await admitted.ctx.newPage();await other.goto(base+'/index.html');await other.evaluate(key=>localStorage.removeItem(key),F.KEY);
  await admitted.p.waitForFunction(expected=>location.href===expected,base+'/index.html#graduation-exam');
  ok(await admitted.p.locator('iframe').count()===0,'Removing a required pass in another tab closes an unearned final trial');
  await admitted.ctx.close();
  const historical=await context();await historical.p.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key:KEY,value:earnedGraduation});await historical.p.reload();
  ok(await historical.p.locator('#hallGraduationReplay').isVisible()&&await historical.p.locator('#enterGraduation').isEnabled(),'An earned graduation stays accessible even if normal exam records were reset');
  await historical.p.locator('#inspectWelcomeLights').click();
  ok((await historical.p.locator('#welcomeLightsScene').textContent()).includes('あなたの灯り'),'The light window includes the graduate’s earned light');
  await historical.p.locator('#closeWelcomeLights').click();await historical.p.locator('#hallGraduationReplay').click();await frame(historical.p).locator('#graduationScreen[data-phase="ready"]').waitFor();
  ok(true,'Historical graduation still replays after normal exam reset');await historical.ctx.close();

  // A research save and a direct link grant no official exam credit.
  const edge=await context();await edge.p.evaluate(()=>localStorage.setItem('magic-academy-graduation-magic-v3-research-1',JSON.stringify({version:3,graduated:true})));
  await edge.p.reload();ok(!await edge.p.locator('#hallGraduationReplay').isVisible(),'A research graduation never enables the official replay button');
  await edge.p.goto(base+'/graduation.html');await edge.p.waitForURL(base+'/index.html#graduation-exam');ok(await edge.p.locator('iframe').count()===0,'A saved research graduation cannot bypass the official four-exam gate');
  await edge.p.goto(base+'/graduation.html?room=earth');await edge.p.waitForURL('**/earth-studio.html#afterglow');ok(true,'Direct classroom links return to the real classroom');
  await edge.p.goto(base+'/'+pages.wind+'#afterglow');const quietFrame=frame(edge.p);await quietFrame.locator('#castInstruction').filter({hasText:'魔法を選択中'}).waitFor();
  await quietFrame.locator('#sound').click();await quietFrame.locator('#academySoundToggle').click();await quietFrame.locator('#academySettingsClose').click();
  await edge.p.waitForFunction(()=>window.AcademySFX.isEnabled()===false);
  await edge.p.evaluate(()=>{window.__soundStarts=0;const original=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...args){window.__soundStarts++;return original.apply(this,args);};});
  await spell(quietFrame,'wind');await quietFrame.locator('#castObject').click();
  ok(await edge.p.evaluate(()=>window.__soundStarts)===0,'Shared SFX OFF also silences native wind actions inside a revisit');
  await edge.ctx.close();

  for(const viewport of [{width:320,height:568},{width:390,height:844},{width:768,height:1024},{width:844,height:390},{width:1280,height:900}]){
   const mobile=await context(viewport,viewport.width===1280?'no-preference':'reduce');await seedPassed(mobile.p);await mobile.p.goto(base+'/index.html#graduation-exam');const mf=frame(mobile.p);await mf.locator('#castInstruction').filter({hasText:'魔法を選択中'}).waitFor();
   ok(!await mobile.p.locator('#hallGraduationReplay').isVisible(),viewport.width+': replay remains hidden until graduation');
   if(viewport.width===1280){await mf.locator('#settings').click();await mf.locator('#reduced').check();await mf.locator('[data-close="settingsDialog"]').click();ok((await saved(mobile.p)).reduced,'The in-game reduced-motion setting is saved independently of OS preference');}
   await mf.locator('#focusBench').click();await solve(mf);await mf.locator('#graduationScreen[data-phase="ready"]').waitFor();
   const screen=mobile.p.frames().find(x=>x!==mobile.p.mainFrame());
   const bounds=await screen.evaluate(()=>{const ids=['graduationTitle','graduationMessage','shareGraduation','returnToStudy'];return ids.every(id=>{const r=document.getElementById(id).getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1;});});
   ok(bounds,viewport.width+'x'+viewport.height+': congratulations, message and both actions are in view');
   ok(await mf.locator('.graduation-curtain').evaluate(e=>getComputedStyle(e).transitionDuration==='0s'),viewport.width+': reduced motion uses a static completion');
   const overflow=await mobile.p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);ok(!overflow,viewport.width+': entrance has no horizontal overflow');
   if(viewport.width===320||viewport.width===1280)await screenshot(mobile.p,'graduation-'+viewport.width);
   results.viewports.push(viewport);await mobile.ctx.close();
  }
  if(results.errors.length)console.error('Page errors:',JSON.stringify(results.errors));
  ok(results.errors.length===0,'No page JavaScript exceptions in the complete playthrough');
  results.result='passed';results.check_count=results.checks.length;
  fs.writeFileSync(path.join(__dirname,'browser-verification.json'),JSON.stringify(results,null,2)+'\n');
  console.log(JSON.stringify({result:results.result,checks:results.check_count,browser:results.browser,viewports:results.viewports,evidence},null,2));
 } finally {await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
