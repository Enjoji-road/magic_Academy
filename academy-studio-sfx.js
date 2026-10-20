/* Recorded operation sounds only. No synthesis, music, background loops or load-time playback. */
(()=>{
 'use strict';
 if(window.AcademySFX)return;
 const KEY='magic-academy-sfx-v1',VOL='magic-academy-sfx-volume-v1';
 const assetRoot=new URL('assets/studio-sfx/',document.currentScript?.src||location.href);
 const sounds={ignite:['ignite',.66,1],cover:['cover',.31,.8],paper:['paper',.80,.7],lift:['friction',.65,.85],scrape:['friction',.34,.6],stone:['stone',.496,1],water:['water',1,.85],wind:['wind',1.1,.75],pass:['pass',1.1,1]};
 let enabled=true,volume=.55,paused=false,ctx=null,master=null,gesture=false,serial=0,lastName='',lastTime=-Infinity,lastAction='';
 const buffers=new Map(),voices=new Set(),requests=new Map();
 try{enabled=localStorage.getItem(KEY)!=='off';const n=localStorage.getItem(VOL);if(n!==null&&Number.isFinite(+n))volume=Math.max(0,Math.min(1,+n));}catch{}
 const dialog=document.createElement('dialog');dialog.className='academy-settings';dialog.id='academySettings';
 dialog.setAttribute('aria-labelledby','academySettingsTitle');
 dialog.innerHTML='<div class="settings-heading"><div><span class="settings-eyebrow">ACADEMY · PREFERENCES</span><h2 id="academySettingsTitle">学院の設定</h2></div><button type="button" id="academySettingsClose" aria-label="設定を閉じる">閉じる</button></div><div class="settings-row"><div><strong>操作の効果音</strong><p>点火や石の動きに、短い音を添えます。</p></div><button type="button" id="academySoundToggle"></button></div><label class="settings-volume" for="academyVolume">効果音の音量 <output id="academyVolumeValue"></output><input id="academyVolume" type="range" min="0" max="100" step="5"></label><button type="button" class="settings-pause" id="academySoundPause">音を一時停止</button><p class="settings-small" id="academySoundStatus" aria-live="polite"></p><div class="settings-credit"><span>効果音素材</span><a href="https://soundeffect-lab.info/" target="_blank" rel="noopener">効果音ラボ ↗</a><p>火・金属・紙・石・水・風・鈴の録音素材を、操作に合わせて短く使用しています。</p><a href="docs/SFX_STUDIO_REPORT.md" target="_blank" rel="noopener">素材名と利用条件</a></div>';
 document.body.appendChild(dialog);
 dialog.addEventListener('keydown',e=>e.stopPropagation());
 const $=id=>document.getElementById(id);
 function settings(){
  $('academySoundToggle').textContent=enabled?'効果音 ON':'効果音 OFF';$('academySoundToggle').setAttribute('aria-pressed',String(enabled));
  $('academyVolume').value=String(Math.round(volume*100));$('academyVolumeValue').textContent=Math.round(volume*100)+'%';
  $('academySoundPause').textContent=paused?'効果音を再開':'音を一時停止';$('academySoundPause').setAttribute('aria-pressed',String(paused));
  if(master&&ctx)master.gain.setValueAtTime(enabled&&!paused?volume:0,ctx.currentTime);
 }
 function stop(){serial++;for(const voice of voices){try{voice.source.stop();}catch{}}voices.clear();}
 function save(){try{localStorage.setItem(KEY,enabled?'on':'off');localStorage.setItem(VOL,String(volume));}catch{}}
 function context(){if(ctx)return ctx;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;ctx=new C();master=ctx.createGain();master.gain.value=enabled&&!paused?volume:0;master.connect(ctx.destination);return ctx;}catch{return null;}}
 function prime(){gesture=true;if(!enabled||paused)return;const c=context();if(c&&c.state==='suspended')c.resume().catch(()=>{});}
 function load(file){if(buffers.has(file))return Promise.resolve(buffers.get(file));if(requests.has(file))return requests.get(file);const c=context();if(!c)return Promise.reject(Error('Audio unavailable'));const pending=fetch(new URL(file+'.mp3',assetRoot)).then(r=>{if(!r.ok)throw Error('Sound unavailable');return r.arrayBuffer();}).then(raw=>c.decodeAudioData(raw)).then(b=>{buffers.set(file,b);requests.delete(file);return b;}).catch(e=>{requests.delete(file);throw e;});requests.set(file,pending);return pending;}
 async function play(name){
  if(name==='ignite'&&lastAction==='lamp-unchanged')return false;
  if(name==='ignite'&&lastAction==='lamp-already-lit')name='cover';
  if(!enabled||paused||!gesture||document.hidden||!sounds[name])return false;
  if(name==='pass'&&document.getElementById('pass')?.hidden===false)return false;
  if(name==='cover'&&lastAction==='cover-closed')return false;
  const now=performance.now();if(name!=='pass'&&now-lastTime<(name===lastName?260:65))return false;
  lastTime=now;lastName=name;const token=++serial,c=context();if(!c)return false;const started=now;
  try{
   if(c.state==='suspended')await c.resume();
   const [file,length,level]=sounds[name],buffer=await load(file);
   if(token!==serial||!enabled||paused||document.hidden||performance.now()-started>1800)return false;
   for(const old of voices){try{if(old.gain.gain.cancelAndHoldAtTime)old.gain.gain.cancelAndHoldAtTime(c.currentTime);else{old.gain.gain.cancelScheduledValues(c.currentTime);old.gain.gain.setValueAtTime(old.level,c.currentTime);}old.gain.gain.linearRampToValueAtTime(0,c.currentTime+.035);old.source.stop(c.currentTime+.04);}catch{}}
   voices.clear();
   const source=c.createBufferSource(),gain=c.createGain(),duration=Math.min(length,buffer.duration),at=c.currentTime+(name==='pass'?.065:.005);
   source.buffer=buffer;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(level,at+.008);gain.gain.setValueAtTime(level,at+Math.max(.008,duration-.07));gain.gain.linearRampToValueAtTime(0,at+duration);source.connect(gain);gain.connect(master);
   const voice={source,gain,level};voices.add(voice);source.onended=()=>{voices.delete(voice);try{source.disconnect();gain.disconnect();}catch{}};source.start(at,0,duration);return true;
  }catch{const status=$('academySoundStatus');if(status)status.textContent='音を読み込めませんでした。操作と試験はそのまま続けられます。';return false;}
 }
 function openSettings(){if(!dialog.open){if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');}settings();}
 $('academySettingsClose').addEventListener('click',()=>{if(dialog.close)dialog.close();else dialog.removeAttribute('open');});
 $('academySoundToggle').addEventListener('click',()=>{enabled=!enabled;stop();settings();save();});
 $('academyVolume').addEventListener('input',()=>{volume=Math.max(0,Math.min(1,Number($('academyVolume').value)/100));settings();save();});
 $('academySoundPause').addEventListener('click',()=>{paused=!paused;stop();settings();});
 document.querySelectorAll('[data-settings]').forEach(button=>button.addEventListener('click',openSettings));
 document.addEventListener('pointerdown',prime,{capture:true,passive:true});document.addEventListener('keydown',prime,{capture:true});
 document.addEventListener('click',e=>{
  prime();lastAction=e.target.closest?.('#cover')&&document.getElementById('windowState')?.textContent==='観測窓：閉'?'cover-closed':'';
  const lamp=e.target.closest?.('[data-lamp],[data-target^="lamp:"]');
  if(lamp&&document.querySelector('[data-magic="fire"][aria-pressed="true"]')){
   const side=lamp.dataset.lamp||lamp.dataset.target.split(':')[1],button=document.querySelector(`[data-lamp="${side}"]`);
   if(button?.getAttribute('aria-pressed')==='true')lastAction='lamp-unchanged';
   else if(document.querySelector(`#room [data-target="lamp:${side}"] .studio-flame`))lastAction='lamp-already-lit';
  }
 },{capture:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();if(ctx?.state==='running')ctx.suspend().catch(()=>{});}});
 window.addEventListener('pagehide',stop);
 window.addEventListener('storage',e=>{if(e.key!==KEY&&e.key!==VOL)return;try{enabled=localStorage.getItem(KEY)!=='off';const n=localStorage.getItem(VOL);if(n!==null&&Number.isFinite(+n))volume=Math.max(0,Math.min(1,+n));}catch{}stop();settings();});
 window.AcademySFX={play,isEnabled:()=>enabled,openSettings,stop};settings();
})();
