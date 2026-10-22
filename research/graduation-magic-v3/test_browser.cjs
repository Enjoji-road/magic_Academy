/* Real Chromium checks. Run with Node + Playwright; no test code in the game UI.
   Optional: BROWSER_EXECUTABLE, JAPANESE_FONT_DIR (test-host fallback), EVIDENCE_DIR.
*/
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),HERE=__dirname,ROOT=path.resolve(HERE,'../..');
const evidence=process.env.EVIDENCE_DIR||path.join(HERE,'local-evidence');fs.mkdirSync(evidence,{recursive:true});
const key='magic-academy-graduation-magic-v3-research-1';
const official={
 'magic-academy-fire-experiment-v4':'{"sentinel":"fire-do-not-touch"}',
 'magic-academy-water-insight-v1':'{"sentinel":"water-do-not-touch"}',
 'magic-academy-wind-ribbon-v1':'{"sentinel":"wind-do-not-touch"}',
 'magic-academy-earth-v2':'{"sentinel":"earth-do-not-touch"}',
 'magic-academy-fire-notes-v1':'keep these notes',
 'magic-academy-sfx-enabled':'false',
 'unrelated-key':'preserve'
};
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.woff2':'font/woff2','.woff':'font/woff','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{let name=decodeURIComponent(req.url.split('?')[0]),f;
 if(name.startsWith('/_test-fonts/')&&process.env.JAPANESE_FONT_DIR)f=path.join(process.env.JAPANESE_FONT_DIR,name.slice('/_test-fonts/'.length));
 else{if(name.endsWith('/'))name+='index.html';f=path.join(ROOT,name);if(!f.startsWith(ROOT+path.sep)){res.writeHead(403);res.end();return;}}
 try{res.setHeader('Content-Type',mime[path.extname(f)]||'text/plain');res.end(fs.readFileSync(f));}catch{res.writeHead(404);res.end();}
});
let browser,base,checks=0;const errors=[];const results={schema:3,engine:'Chromium',checks:[],viewports:[]};
function ok(value,label){assert.ok(value,label);checks++;results.checks.push(label);}
async function font(page){if(!process.env.JAPANESE_FONT_DIR)return;await page.addStyleTag({url:base+'/_test-fonts/400.css'});await page.addStyleTag({content:'*{font-family:"Noto Sans JP",sans-serif!important}'});await page.evaluate(()=>document.fonts.ready);}
async function open(viewport={width:1280,height:1000},reducedMotion='reduce'){
 const context=await browser.newContext({viewport,reducedMotion});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto(base+'/research/graduation-magic-v3/');await page.evaluate(values=>{for(const[k,v]of Object.entries(values))localStorage.setItem(k,v);},official);await font(page);return {page,context};
}
const spell=(p,id)=>p.locator('[data-spell="'+id+'"]').click();
const room=(p,id)=>p.locator('[data-room="'+id+'"]').click();
const target=(p,id)=>p.locator('[data-target="'+id+'"]').click();
async function exists(p,id){return !await p.locator('[data-target="'+id+'"]').evaluate(el=>el.classList.contains('empty'));}
async function active(p,id){return p.locator('[data-target="'+id+'"]').evaluate(el=>!el.classList.contains('empty')&&!el.classList.contains('dormant'));}
async function isSaved(p){return p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);}
async function solve(p){await room(p,'hall');await spell(p,'fire');await p.locator('#castObject').click();for(const[r,s]of[['water','fire'],['wind','water'],['earth','wind'],['fire','earth']]){await spell(p,r);await target(p,s);}await p.locator('#release').click();}
async function dismissGraduation(p){await p.locator('#graduationScreen[data-phase="ready"]').waitFor();await p.locator('#returnToStudy').click();await p.locator('#graduationScreen').waitFor({state:'hidden'});}
async function preservation(p){const values=await p.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));for(const[k,v]of Object.entries(official))assert.equal(values[k],v);ok(Object.keys(values).every(k=>k===key||Object.hasOwn(official,k)),'Only research key is created or changed');}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-proxy-server']});results.browser_version=browser.version();
 const {page,context}=await open();
 await page.screenshot({path:path.join(evidence,'desktop-initial.png'),fullPage:true});
 for(const id of ['fire','water','wind','earth']){await spell(page,id);await page.locator('#castObject').click();}await page.locator('#release').click();ok(!(await isSaved(page)).graduated,'Four spells on the ordinary seat do not graduate');
 await page.locator('#resetRoom').click();
 // Observe the full binary table through the UI, including wrong pairs and self.
 const takes={fire:'earth',water:'fire',wind:'water',earth:'wind'};
 for(const source of ['fire','water','wind','earth'])for(const recipient of ['fire','water','wind','earth']){
  await page.locator('#resetRoom').click();await spell(page,source);await page.locator('#castObject').click();
  await spell(page,recipient);await target(page,source);await page.locator('#selectedSupport').click();
  ok(await active(page,recipient)===(takes[recipient]===source),'UI pair '+recipient+' <- '+source+' matches the positive/negative law');
 }
 await page.locator('#resetRoom').click();
 const pairs=[['fire','water'],['water','wind'],['wind','earth'],['earth','fire']];
 for(const[native,recipient]of pairs){
  await room(page,native);await spell(page,native);await page.locator('#castObject').click();ok(await active(page,native),native+': primary spell creates visible result');
  await spell(page,recipient);await target(page,native);await page.locator('#selectedSupport').click();ok(await active(page,recipient),native+': cross-attribute result remains when only recipient hand releases');
  await page.locator('#release').click();ok(!await active(page,recipient),native+': open chain fades when donor hand releases');
  await page.locator('#hold').click();await page.locator('#record').click();
  if(native==='wind'){
   await page.getByRole('button',{name:'風の尾を中央一周ぶん追う'}).click();ok((await page.locator('#apparatus').textContent()).includes('反対側の縁'),'Wind: center lap swaps the boundary side');
   await page.getByRole('button',{name:'風の尾を中央一周ぶん追う'}).click();ok((await page.locator('#apparatus').textContent()).includes('同じ始点'),'Wind: two center laps return');
   await page.screenshot({path:path.join(evidence,'wind-observation.png'),fullPage:true});
  }
 }
 await page.locator('#notes').fill('初見テスト用の自由メモ。灯りと手の関係。');await page.reload();await font(page);ok(await page.locator('#notes').inputValue()==='初見テスト用の自由メモ。灯りと手の関係。','Notes survive reload');
 await solve(page);ok((await isSaved(page)).graduated,'Regular UI sequence leaves the new light');ok(await page.locator('#graduation').isVisible(),'Graduation responds to actual settled state');await dismissGraduation(page);
 await page.locator('#arrival').click();ok(await page.locator('#nextArrival').isVisible(),'Next student sees the additional light');await preservation(page);
 await page.reload();await font(page);ok((await isSaved(page)).graduated,'Graduation record survives reload');
 const d=page.locator('details').filter({has:page.locator('#night')});await d.locator('summary').click();for(let n=0;n<8;n++)await page.locator('#night').click();ok((await isSaved(page)).circuits.hall.charge===0,'Eight simulated nights consume the finite charge');
 await spell(page,'fire');await target(page,'earth');await page.locator('#release').click();ok((await isSaved(page)).circuits.hall.charge===8,'Fire replenishment preserves the same structure');
 await page.screenshot({path:path.join(evidence,'desktop-graduated.png'),fullPage:true});await context.close();
 // Early discovery: no room visits; all four relations can be created in reverse order.
 const fresh=await open({width:390,height:844});const p=fresh.page;
 for(const id of ['earth','wind','water','fire']){await spell(p,id);await p.locator('#castObject').click();}
 await spell(p,'fire');await target(p,'fire');await p.locator('#selectedSupport').click();ok(!await active(p,'fire'),'Wrong self-support fades by the same law');
 await p.locator('#hold').click();
 for(const[r,s]of[['fire','earth'],['earth','wind'],['wind','water'],['water','fire']]){await spell(p,r);await target(p,s);}
 await p.locator('#focusBench').click();
 await p.screenshot({path:path.join(evidence,'mobile-focus.png'),fullPage:false});
 const bounds=await p.evaluate(()=>{const ids=['apparatus','traces','release'];return{height:innerHeight,width:innerWidth,docWidth:document.documentElement.scrollWidth,items:Object.fromEntries(ids.map(id=>{const r=document.getElementById(id).getBoundingClientRect();return[id,{top:r.top,bottom:r.bottom,width:r.width}];}))};});
 ok(bounds.docWidth<=bounds.width,'390px viewport has no document overflow');ok(Object.values(bounds.items).every(r=>r.top>=0&&r.bottom<=bounds.height),'390px focus mode keeps apparatus, target effects, and release control visible together');results.viewports.push({width:390,height:844,bounds});
 await p.locator('#release').click();ok((await isSaved(p)).graduated,'Reverse construction and zero room visits also work');await preservation(p);await fresh.context.close();
 for(const size of [{width:320,height:568},{width:375,height:812},{width:768,height:1024}]){
  const q=await open(size);await q.page.locator('#focusBench').click();
  const dims=await q.page.evaluate(()=>({inner:innerWidth,doc:document.documentElement.scrollWidth,focus:document.querySelector('.workbench').getBoundingClientRect().width}));ok(dims.doc<=dims.inner,size.width+'px viewport has no horizontal overflow');
  await q.page.locator('#focusBench').click();await room(q.page,'wind');await spell(q.page,'wind');await q.page.locator('#castObject').click();await spell(q.page,'earth');await target(q.page,'wind');await q.page.locator('#selectedSupport').click();ok(await active(q.page,'earth'),size.width+'px observes persistent cross-attribute change with reduced motion');
  const anim=await q.page.locator('.spell-flow').first().evaluate(el=>getComputedStyle(el).animationName);ok(anim==='none','Reduced-motion setting disables animation at '+size.width+'px');
  if(size.width===320)await q.page.screenshot({path:path.join(evidence,'mobile-320-wind.png'),fullPage:true});results.viewports.push({...size,...dims});await q.context.close();
 }
 ok(errors.length===0,'No JavaScript page errors');results.total_checks=checks;results.page_errors=errors;results.result='pass';results.screenshots='Captured locally by EVIDENCE_DIR; not required by the game or committed as binary assets.';fs.writeFileSync(path.join(HERE,'browser-verification.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify({result:results.result,total_checks:checks,browser:results.browser_version,viewports:results.viewports.map(v=>v.width)},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
