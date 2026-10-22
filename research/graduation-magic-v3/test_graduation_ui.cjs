/* Graduation presentation, share draft, and save-history browser checks.
   Requires Playwright. Optional BROWSER_EXECUTABLE, JAPANESE_FONT_DIR, EVIDENCE_DIR.
   X requests are intercepted to verify navigation without posting or needing login.
*/
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),cp=require('node:child_process');
const {chromium}=require('playwright');
const HERE=__dirname,ROOT=path.resolve(HERE,'../..'),KEY='magic-academy-graduation-magic-v3-research-1';
const evidence=process.env.EVIDENCE_DIR||path.join(HERE,'local-evidence');fs.mkdirSync(evidence,{recursive:true});
const official={
 'magic-academy-fire-experiment-v4':'{"sentinel":"fire-preserved"}',
 'magic-academy-water-insight-v1':'{"sentinel":"water-preserved"}',
 'magic-academy-wind-ribbon-v1':'{"sentinel":"wind-preserved"}',
 'magic-academy-earth-v2':'{"sentinel":"earth-preserved"}',
 'magic-academy-fire-notes-v1':'existing notes',
 'magic-academy-sfx-enabled':'false',
 'unrelated-key':'unchanged'
};
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.woff2':'font/woff2','.woff':'font/woff'};
const server=http.createServer((req,res)=>{
 let p=decodeURIComponent(req.url.split('?')[0]),f;
 if(p.startsWith('/_test-fonts/')&&process.env.JAPANESE_FONT_DIR)f=path.join(process.env.JAPANESE_FONT_DIR,p.slice(13));
 else{if(p.endsWith('/'))p+='index.html';f=path.join(ROOT,p);if(!f.startsWith(ROOT+path.sep)){res.writeHead(403);res.end();return;}}
 try{res.setHeader('Content-Type',mime[path.extname(f)]||'text/plain');res.end(fs.readFileSync(f));}catch{res.writeHead(404);res.end();}
});
const results={schema:1,base_commit:'4e2a7c3f407679ce68bf5704ddafd7b3b99f8b0f',checks:[],viewports:[],page_errors:[],share_verification:'Official intent URL, decoded draft, new tab, and retained game state. External X UI intercepted; no account access or actual post.'};
let browser,base;
function ok(value,label){assert.ok(value,label);results.checks.push(label);}
const saved=page=>page.evaluate(k=>localStorage.getItem(k),KEY);
const select=(page,id)=>page.locator('[data-spell="'+id+'"]').click();
async function font(page){if(!process.env.JAPANESE_FONT_DIR)return;await page.addStyleTag({url:base+'/_test-fonts/400.css'});await page.addStyleTag({content:'*{font-family:"Noto Sans JP",sans-serif!important}'});await page.evaluate(()=>document.fonts.ready);}
async function open(viewport={width:1280,height:900},reducedMotion='no-preference',fixture=null){
 const context=await browser.newContext({viewport,reducedMotion});const page=await context.newPage();page.on('pageerror',e=>results.page_errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto(base+'/research/graduation-magic-v3/');await page.evaluate(({official,key,fixture})=>{for(const[k,v]of Object.entries(official))localStorage.setItem(k,v);if(fixture)localStorage.setItem(key,fixture);},{official,key:KEY,fixture});
 if(fixture)await page.reload();await font(page);return{page,context};
}
async function prepare(page){
 await select(page,'fire');await page.locator('#castObject').click();
 for(const[r,s]of[['water','fire'],['wind','water'],['earth','wind'],['fire','earth']]){await select(page,r);await page.locator('[data-target="'+s+'"]').click();}
}
async function timeline(page){await page.evaluate(()=>{window.uiPhases=[];const el=document.getElementById('graduationScreen');new MutationObserver(()=>{window.uiPhases.push({phase:el.dataset.phase,time:performance.now()});}).observe(el,{attributes:true,attributeFilter:['data-phase']});});}
async function ready(page){await page.locator('#graduationScreen[data-phase="ready"]').waitFor();}
async function close(page){await page.locator('#returnToStudy').click();await page.locator('#graduationScreen').waitFor({state:'hidden'});}
async function checkBounds(page,label){const b=await page.evaluate(()=>{const ids=['graduationTitle','graduationMessage','shareGraduation','returnToStudy'];const d=document.getElementById('graduationScreen').getBoundingClientRect();return{width:innerWidth,height:innerHeight,dialog:{x:d.x,y:d.y,width:d.width,height:d.height},items:Object.fromEntries(ids.map(id=>{const r=document.getElementById(id).getBoundingClientRect();return[id,{x:r.x,y:r.y,right:r.right,bottom:r.bottom}];}))};});ok(Math.abs(b.dialog.x)<1&&Math.abs(b.dialog.y)<1&&Math.abs(b.dialog.width-b.width)<1&&Math.abs(b.dialog.height-b.height)<1,label+': full viewport dialog');ok(Object.values(b.items).every(r=>r.x>=0&&r.y>=0&&r.right<=b.width+1&&r.bottom<=b.height+1),label+': message and both actions visible without scrolling');results.viewports.push({...b,label});}
async function preserved(page,label){const data=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));for(const[k,v]of Object.entries(official))assert.equal(data[k],v);ok(Object.keys(data).every(k=>k===KEY||Object.hasOwn(official,k)),label+': official saves and unrelated keys unchanged');}
(async()=>{
 const original=cp.execFileSync('git',['show',results.base_commit+':research/graduation-magic-v3/magic-model.js'],{cwd:ROOT});
 ok(original.equals(fs.readFileSync(path.join(HERE,'magic-model.js'))),'Spell rules, grade, state calculation, finite charge, and save format are byte-for-byte unchanged');
 await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-proxy-server']});results.browser_version=browser.version();
 const {page,context}=await open();
 await select(page,'fire');await page.locator('#castObject').click();await page.locator('#release').click();
 ok(!await page.locator('#graduationScreen').evaluate(el=>el.open),'An incorrect release never starts the celebration');
 ok(!await page.locator('[data-replay-graduation]').isVisible(),'Replay is unavailable before graduation');
 await page.locator('#notes').fill('演出を追加しても残す自由メモ。');await prepare(page);await timeline(page);
 await page.locator('#release').focus();await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
 ok(await page.evaluate(()=>scrollY>0),'Success is tested while scrolled away from the top');await page.keyboard.press('Enter');
 ok(await page.locator('#graduationScreen').evaluate(el=>el.open&&el.matches(':modal')&&el.dataset.phase==='observe'),'Correct release immediately opens the modal observation stage');
 ok((await page.locator('#graduationObservedScene').textContent()).includes('あなたが残した光'),'The observation stage shows the already-settled new light');
 ok(await page.locator('.graduation-curtain').evaluate(el=>Number(getComputedStyle(el).opacity)===0),'The light is unobscured before fading starts');
 ok(JSON.parse(await saved(page)).graduated,'The existing graduation record is saved before the animation finishes');
 await page.keyboard.press('Escape');ok(await page.locator('#graduationScreen').evaluate(el=>el.open),'Escape cannot interrupt the transition');
 ok(!await page.evaluate(()=>window.GraduationPresentation.celebrate(document.querySelector('#apparatus svg'))),'A second celebration cannot start while one is active');
 await ready(page);const phases=await page.evaluate(()=>window.uiPhases);
 const observe=phases.find(x=>x.phase==='observe'),out=phases.find(x=>x.phase==='fade-out'),inside=phases.find(x=>x.phase==='fade-in');
 ok(out.time-observe.time>=800,'The settled light is shown for about 0.9 seconds before darkening');
 ok(inside.time-out.time>=1000&&inside.time-out.time<1600,'The fade-out lasts about 1.1 seconds');results.normal_motion_phases=phases;
 assert.equal(await page.locator('#graduationTitle').textContent(),'卒業おめでとうございます');assert.equal(await page.locator('#graduationMessage').textContent(),'あなたの灯した光が、次の生徒を迎えます。');ok(true,'The requested two-line graduation message is displayed exactly');
 await checkBounds(page,'Desktop');await page.screenshot({path:path.join(evidence,'graduation-desktop.png'),fullPage:false});
 let requested=null;await context.route(url=>url.origin==='https://x.com'&&url.pathname==='/intent/tweet',async route=>{requested=route.request().url();await route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Intent navigation verification</title>'});});
 const beforeShare=await saved(page);const popupPromise=context.waitForEvent('page');await page.locator('#shareGraduation').click();const popup=await popupPromise;await popup.waitForLoadState('domcontentloaded');
 const intent=new URL(requested);assert.equal(intent.searchParams.get('text'),'🪄 魔法学校を卒業しました！🎓\n\n四つの魔法を学び、最後の卒業試験にも合格しました。\n\nあなたも魔法学校に入学してみませんか？');assert.equal(intent.searchParams.get('url'),'https://enjoji-road.github.io/magic_Academy/');ok(true,'X intent receives exact Japanese, emoji, newlines, and the official entrance URL');
 ok(await popup.evaluate(()=>window.opener===null),'The share tab cannot access the research window');await popup.close();
 ok(await page.locator('#graduationScreen').evaluate(el=>el.open&&el.dataset.phase==='ready')&&await saved(page)===beforeShare,'Closing the X tab keeps the graduation screen and saved state intact');
 const beforeClose=await saved(page);await close(page);ok(await saved(page)===beforeClose,'Returning to the trial room does not alter the completed state or record');
 ok((await page.locator('#apparatus').textContent()).includes('あなたが残した光'),'The completed light can be observed again after returning');
 await page.locator('[data-replay-graduation]').click();await ready(page);ok(await saved(page)===beforeClose,'Replay does not require recasting or alter saves');await close(page);
 await page.reload();await font(page);ok(!await page.locator('#graduationScreen').evaluate(el=>el.open)&&JSON.parse(await saved(page)).graduated,'Reload preserves graduation without forced replay');
 await select(page,'fire');await page.locator('#castObject').click();await page.locator('#release').click();const changed=JSON.parse(await saved(page));ok(changed.graduated&&changed.circuits.hall.nodes.fire.from===null,'Breaking the current spell does not erase historical graduation');
 await page.locator('[data-replay-graduation]').click();await ready(page);ok(true,'A historical graduation can be replayed while the current light is absent');await close(page);
 await page.locator('#resetRoom').click();ok(JSON.parse(await saved(page)).graduated,'Resetting only the current room retains the graduation record');
 ok((await page.locator('#notes').inputValue())==='演出を追加しても残す自由メモ。','Notes remain unchanged through celebration, sharing, replay, and room reset');
 await preserved(page,'Desktop');const oldRecord=await saved(page);await context.close();
 for(const viewport of[{width:320,height:568},{width:390,height:844},{width:844,height:390}]){
  const q=await open(viewport,'reduce',oldRecord);ok(!await q.page.locator('#graduationScreen').evaluate(el=>el.open),viewport.width+'px: an existing graduation does not auto-play');
  await q.page.locator('[data-replay-graduation]').click();await ready(q.page);await checkBounds(q.page,viewport.width+'px');
  if(viewport.width===390)await q.page.screenshot({path:path.join(evidence,'graduation-mobile.png'),fullPage:false});await close(q.page);await preserved(q.page,viewport.width+'px');await q.context.close();
 }
 // OS reduced-motion and the game's own setting both use a static transition.
 for(const manual of[false,true]){
  const q=await open({width:390,height:844},manual?'no-preference':'reduce');
  if(manual){await q.page.locator('#settings').click();await q.page.locator('#reduced').check();await q.page.locator('[data-close="settingsDialog"]').click();}
  await prepare(q.page);await q.page.locator('#focusBench').click();await timeline(q.page);await q.page.locator('#release').click();await ready(q.page);
  const events=await q.page.evaluate(()=>window.uiPhases);ok(!events.some(x=>['fade-out','fade-in','revealing'].includes(x.phase)),(manual?'Manual':'OS')+' reduced motion uses a static switch without fades');
  await checkBounds(q.page,(manual?'Manual':'OS')+' reduced motion');await close(q.page);
  ok(await q.page.evaluate(()=>document.body.classList.contains('focus-bench')&&getComputedStyle(document.querySelector('.workbench')).position==='fixed'),'Returning retains focused observation mode');
  await q.context.close();
 }
 ok(results.page_errors.length===0,'No JavaScript errors in any presentation scenario');results.total_checks=results.checks.length;results.result='pass';fs.writeFileSync(path.join(HERE,'graduation-ui-verification.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify({result:results.result,total_checks:results.total_checks,browser:results.browser_version,normal_motion_phases:results.normal_motion_phases},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
