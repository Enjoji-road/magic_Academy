(()=>{
'use strict';
const M=window.WindRibbonModel,D=M.D,$=id=>document.getElementById(id),KEY='magic-academy-wind-ribbon-v1';
const windNames={still:'無風',left:'左からの風',right:'右からの風',up:'下からの風'},viewNames={front:'正面の窓',left:'左の窓',right:'右の窓',low:'下の窓'};
let state;try{state=M.restore(JSON.parse(localStorage.getItem(KEY)));}catch{state=M.initial();}
const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');
let currentWind=[...D.winds[state.wind]],frame=0,zoom=1,pan=[0,0],drag=null,canvas=$('scene'),context=canvas.getContext('2d'),audio=null,zoomFocus=null;
const workbench=$('workbench'),home=workbench.parentNode,homeNext=workbench.nextSibling;
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));$('saveStatus').textContent='観測・メモ・台帳を自動保存しました。';}catch{$('saveStatus').textContent='このブラウザでは保存できません。ページを閉じる前にメモを控えてください。';}}
function reduced(){return state.reduced||media?.matches;}
function say(message){$('status').textContent=message;}
function sound(kind){if(!state.sfx||window.AcademySFX?.isEnabled()===false)return;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audio??=new AC();if(audio.state==='suspended')audio.resume().catch(()=>{});const t=audio.currentTime;
 if(kind==='wind'){const b=audio.createBuffer(1,audio.sampleRate*.45,audio.sampleRate),v=b.getChannelData(0);for(let i=0;i<v.length;i++)v[i]=(Math.random()*2-1)*(1-i/v.length);const n=audio.createBufferSource(),g=audio.createGain(),f=audio.createBiquadFilter();n.buffer=b;f.type='lowpass';f.frequency.value=1600;g.gain.value=.045;n.connect(f);f.connect(g);g.connect(audio.destination);n.start();return;}
 const notes=kind==='pass'?[523.25,659.25,783.99]:[kind==='fail'?247:620];notes.forEach((hz,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=hz;g.gain.setValueAtTime(.0001,t+i*.12);g.gain.exponentialRampToValueAtTime(.055,t+i*.12+.015);g.gain.exponentialRampToValueAtTime(.0001,t+i*.12+.38);o.connect(g);g.connect(audio.destination);o.start(t+i*.12);o.stop(t+i*.12+.4);});
 }catch{/* Audio availability never gates observation. */}}
function project(s,v,wind,view,flutter=0){return M.project(M.point(s,v,wind,flutter),view);}
function polygon(ctx,points,fill,stroke=null,width=1){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
function background(ctx,w,h){
 const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#0e1c29');bg.addColorStop(1,'#243c49');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 ctx.strokeStyle='#78929b25';ctx.lineWidth=1;for(let y=76;y<h;y+=76){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();for(let x=(y/76%2)*110;x<w;x+=220){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+76);ctx.stroke();}}
 ctx.save();ctx.translate(w/2,h*.37);ctx.fillStyle='#78939b13';ctx.beginPath();ctx.moveTo(-250,270);ctx.lineTo(-250,-25);ctx.bezierCurveTo(-250,-200,0,-300,0,-300);ctx.bezierCurveTo(0,-300,250,-200,250,-25);ctx.lineTo(250,270);ctx.fill();ctx.strokeStyle='#96adb339';ctx.lineWidth=4;ctx.stroke();ctx.beginPath();ctx.moveTo(0,-290);ctx.lineTo(0,260);ctx.moveTo(-246,-25);ctx.lineTo(246,-25);ctx.stroke();ctx.restore();
 ctx.strokeStyle='#94a9af4d';ctx.lineWidth=1;ctx.strokeRect(17,17,w-34,h-34);
 ctx.fillStyle='#acbdc5';ctx.font='12px system-ui';ctx.textAlign='left';ctx.fillText('VENTUS  /  OBSERVATORY  III',38,48);ctx.textAlign='right';ctx.fillStyle='#8ba2ac';ctx.fillText('創立記念の織布',w-38,48);
}
// A material atlas is projected with the cloth mesh, so lettering shares
// its depth and occlusion. No label is painted over unrelated foreground cloth.
function makeAtlas(reverse=false){
 const tex=document.createElement('canvas');tex.width=8192;tex.height=512;
 const t=tex.getContext('2d');if(!t)return tex;
 const sx=tex.width/M.LENGTH,sy=tex.height/(2*D.geometry.halfWidth);
 t.scale(sx,sy);t.fillStyle=reverse?'#a2b8bd':'#c9d3d0';t.fillRect(0,0,M.LENGTH,140);
 t.strokeStyle='#f1eee32c';t.lineWidth=.42;
 for(let y=0;y<140;y+=2.1){t.beginPath();t.moveTo(0,y);t.lineTo(M.LENGTH,y);t.stroke();}
 for(let x=0;x<M.LENGTH;x+=3.3){t.beginPath();t.moveTo(x,0);t.lineTo(x,140);t.stroke();}
 for(const y of[2,138]){t.beginPath();t.moveTo(0,y);t.lineTo(M.LENGTH,y);t.strokeStyle='#506971';t.lineWidth=5;t.stroke();t.strokeStyle='#f4f0de';t.lineWidth=2.7;t.stroke();}
 for(const y of[8,132]){t.setLineDash([2,3]);t.strokeStyle='#e2e8db';t.lineWidth=.9;t.beginPath();t.moveTo(0,y);t.lineTo(M.LENGTH,y);t.stroke();}t.setLineDash([]);
 function inscription(g,text=g.text,size=28,marker=false){
  t.save();t.translate(g.station/M.N*M.LENGTH,70+g.edge*.78*70);
  const rot=g.station>300&&g.station<770?-1:1;t.scale(rot*(reverse?-1:1),rot);
  if(!marker){t.fillStyle='#e9e6d7';t.strokeStyle='#819b9e';t.lineWidth=.8;t.beginPath();t.roundRect(-16,-16,32,32,3);t.fill();t.stroke();}
  t.font=`${marker?'':'600 '}${size}px "Hiragino Kaku Gothic ProN",sans-serif`;t.fillStyle=marker?'#705c32':'#243e48';t.textAlign='center';t.textBaseline='middle';t.fillText(text,0,0);t.restore();
 }
 for(const g of D.glyphs)inscription(g);
 inscription(D.start,'✦',35,true);inscription(D.stop,'❖',30,true);
 // The feather points toward increasing material s on BOTH local faces.
 const fx=(D.start.station+24)/M.N*M.LENGTH,fy=70+D.start.edge*.73*70;
 t.fillStyle='#536c70';t.strokeStyle='#f6edce';t.lineWidth=1;
 t.beginPath();t.moveTo(fx-20,fy);t.quadraticCurveTo(fx+1,fy-12,fx+24,fy);t.quadraticCurveTo(fx+1,fy+12,fx-20,fy);t.fill();t.stroke();t.beginPath();t.moveTo(fx-28,fy);t.lineTo(fx+24,fy);t.stroke();
 if(!reverse){t.textAlign='center';t.textBaseline='middle';t.fillStyle='#2b4048';t.font='22px "Hiragino Kaku Gothic ProN",sans-serif';const x=(D.task.from+D.task.to)/2/M.N*M.LENGTH;D.task.lines.forEach((line,i)=>t.fillText(line,x,70+(i-1)*27));}
 // Same short seam on both local faces; the joining reverses v.
 t.strokeStyle='#71888a';t.lineWidth=.8;t.setLineDash([2,3]);t.beginPath();t.moveTo(1,0);t.lineTo(1,140);t.stroke();
 return tex;
}
const atlases=[makeAtlas(false),makeAtlas(true)];
function render(ctx,{wind=currentWind,view=state.view,scale=zoom,offset=pan,flutter=0,width=1100,height=730,thumbnail=false}={}){
 if(!ctx)return;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,width,height);background(ctx,width,height);
 const center=[width*.5+offset[0],height*.48+offset[1]],unit=.92*scale*width/1100;
 const P=(s,v)=>{const p=project(s,v,wind,view,flutter);return [center[0]+p[0]*unit,center[1]+p[1]*unit,p[2]];};
 const items=[],steps=thumbnail?72:184,across=thumbnail?4:10;
 function tile(ps,s0,s1,v0,v1){
  const a=ps[1],b=ps[0],c=ps[3],normal=(a[0]-b[0])*(c[1]-b[1])-(a[1]-b[1])*(c[0]-b[0]);
  const atlas=atlases[normal>=0?0:1],tx=s0*atlas.width,ty=(v0+1)/2*atlas.height,tw=(s1-s0)*atlas.width,th=(v1-v0)/2*atlas.height;
  // Two affine triangles share the same source tile. This also makes the task
  // lettering subject to exactly the same occlusion as its surrounding weave.
  for(const tri of[0,1]){
   const points=tri?[ps[0],ps[2],ps[3]]:[ps[0],ps[1],ps[2]];
   const ax=tri?ps[2][0]-ps[3][0]:ps[1][0]-ps[0][0],ay=tri?ps[2][1]-ps[3][1]:ps[1][1]-ps[0][1];
   const bx=tri?ps[3][0]-ps[0][0]:ps[2][0]-ps[1][0],by=tri?ps[3][1]-ps[0][1]:ps[2][1]-ps[1][1];
   items.push({z:points.reduce((n,p)=>n+p[2],0)/3,draw:()=>{ctx.save();polygon(ctx,points,normal>=0?'#c6d2ce':'#a4b8bd');ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.clip();ctx.setTransform(ax,ay,bx,by,ps[0][0],ps[0][1]);ctx.drawImage(atlas,tx,ty,tw,th,0,0,1,1);ctx.restore();}});
  }
 }
 for(let i=0;i<steps;i++)for(let j=0;j<across;j++){const s0=i/steps,s1=(i+1)/steps,v0=-1+2*j/across,v1=-1+2*(j+1)/across;tile([P(s0,v0),P(s1,v0),P(s1,v1),P(s0,v1)],s0,s1,v0,v1);}
 // The tower mullions are actual fixed boxes in the same world coordinates.
 // At rest the return folds pass behind them. Wind exposes the existing weave.
 for(const support of D.supports){
  const lo=support.min,hi=support.max,vertices=[];
  for(let k=0;k<8;k++){const p=M.project([k&1?hi[0]:lo[0],k&2?hi[1]:lo[1],k&4?hi[2]:lo[2]],view);vertices.push([center[0]+p[0]*unit,center[1]+p[1]*unit,p[2]]);}
  const faces=[[0,1,3,2],[4,6,7,5],[0,4,5,1],[2,3,7,6],[0,2,6,4],[1,5,7,3]];
  faces.forEach((indices,i)=>{const ps=indices.map(k=>vertices[k]);items.push({z:ps.reduce((n,p)=>n+p[2],0)/4,draw:()=>polygon(ctx,ps,['#243c49','#344f5c','#47606a','#233a47','#304955','#3b5662'][i],'#78919b',1.2*unit)});});
  const a=M.project([lo[0]+10,lo[1]+12,hi[2]+.3],view),b=M.project([hi[0]-10,hi[1]-12,hi[2]+.3],view);
  items.push({z:(a[2]+b[2])/2+.5,draw:()=>{ctx.strokeStyle='#a6b4ac55';ctx.lineWidth=1;ctx.strokeRect(center[0]+a[0]*unit,center[1]+a[1]*unit,(b[0]-a[0])*unit,(b[1]-a[1])*unit);}});
 }
 items.sort((a,b)=>a.z-b.z);for(const item of items)item.draw();
 for(const sx of[-225,225]){const pin=M.project([sx,D.geometry.taskY,0],view),x=center[0]+pin[0]*unit,y=center[1]+pin[1]*unit;ctx.strokeStyle='#a6b7ba';ctx.lineWidth=2.5*unit;ctx.beginPath();ctx.moveTo(x,y-6*unit);ctx.lineTo(x,y-45*unit);ctx.stroke();ctx.fillStyle='#b3b7a7';ctx.strokeStyle='#536a72';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(x-7*unit,y-11*unit,14*unit,23*unit,2);ctx.fill();ctx.stroke();}
 if(!thumbnail){ctx.font='12px system-ui';ctx.fillStyle='#a5bac1';ctx.textAlign='right';ctx.fillText('留め結び  ❖',width-40,height-35);}
}
function draw(flutter=0){render(context,{flutter});}
function changeWind(name){
 if(!Object.hasOwn(D.winds,name))return;state.wind=name;save();setActive();sound(name==='still'?'tap':'wind');
 cancelAnimationFrame(frame);const from=[...currentWind],to=D.winds[name],t0=performance.now();
 if(reduced()){currentWind=[...to];draw();}else{const tick=now=>{const t=Math.min(1,(now-t0)/1100),e=t*t*(3-2*t);currentWind=from.map((v,i)=>v+(to[i]-v)*e);draw(Math.sin(t*6*Math.PI)*5*(1-t));if(t<1)frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);}
 say(name==='still'?'風をおさめました。重なりが戻った姿も、窓を変えて見直せます。':'風を送りました。布が落ち着いた姿は、このまま観測できます。');
}
function setActive(){
 for(const b of document.querySelectorAll('[data-spell]'))b.setAttribute('aria-pressed',String(b.dataset.spell===state.spell));
 for(const b of document.querySelectorAll('[data-wind]'))b.setAttribute('aria-pressed',String(b.dataset.wind===state.wind));
 for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view===state.view));
 $('windControls').hidden=state.spell!=='wind';$('otherControls').hidden=state.spell==='wind';
 $('otherMagic').textContent={fire:'留め具に炎を灯す',water:'窓辺の水鉢に注ぐ',earth:'窓台の石を動かす'}[state.spell]||'';
 $('viewCaption').textContent=viewNames[state.view]+' · '+windNames[state.wind];
 $('sound').textContent=state.sfx?'効果音 ON':'効果音 OFF';$('sound').setAttribute('aria-pressed',String(state.sfx));$('reduced').checked=state.reduced;
}
for(const b of document.querySelectorAll('[data-spell]'))b.addEventListener('click',()=>{state.spell=b.dataset.spell;setActive();save();});
for(const b of document.querySelectorAll('[data-wind]'))b.addEventListener('click',()=>changeWind(b.dataset.wind));
for(const b of document.querySelectorAll('[data-view]'))b.addEventListener('click',()=>{state.view=b.dataset.view;pan=[0,0];setActive();draw();save();say(viewNames[state.view]+'から観測しています。同じ布を、別の角度から見ています。');});
$('otherMagic').addEventListener('click',()=>{sound('tap');say({fire:'留め具のそばに小さな炎が灯り、織布の細かな糸が照らされました。',water:'窓辺の水鉢に水が満ちました。風に、水面がわずかに揺れています。',earth:'窓台の石が少しずれました。観測する位置を変えられます。'}[state.spell]);});
$('sound').addEventListener('click',()=>{state.sfx=!state.sfx;setActive();save();});
$('reduced').addEventListener('change',()=>{state.reduced=$('reduced').checked;cancelAnimationFrame(frame);currentWind=[...D.winds[state.wind]];draw();save();});
media?.addEventListener?.('change',()=>{if(reduced()){cancelAnimationFrame(frame);currentWind=[...D.winds[state.wind]];draw();}});
$('zoom').addEventListener('input',()=>{zoom=Number($('zoom').value);canvas.classList.toggle('zoomed',zoom>1);if(zoom===1)pan=[0,0];draw();});
$('centerView').addEventListener('click',()=>{pan=[0,0];zoom=1;$('zoom').value='1';canvas.classList.remove('zoomed');draw();});
canvas.addEventListener('pointerdown',e=>{if(zoom<=1)return;drag=[e.clientX,e.clientY,pan[0],pan[1]];canvas.setPointerCapture?.(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!drag)return;const r=canvas.getBoundingClientRect();pan=[drag[2]+(e.clientX-drag[0])*canvas.width/r.width,drag[3]+(e.clientY-drag[1])*canvas.height/r.height];pan=pan.map(v=>Math.max(-650,Math.min(650,v)));draw();});
for(const event of['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{drag=null;});
function openDialog(d){if(d.showModal)d.showModal();else d.setAttribute('open','');}
function closeDialog(d){if(d.close)d.close();else d.removeAttribute('open');}
$('enlarge').addEventListener('click',()=>{zoomFocus=$('enlarge');if(zoom===1){zoom=window.innerWidth<600?1.75:1.25;pan=[0,window.innerWidth<600?90:20];$('zoom').value=String(zoom);canvas.classList.add('zoomed');}$('zoomHost').append(workbench);openDialog($('zoomDialog'));draw();});
$('closeZoom').addEventListener('click',()=>closeDialog($('zoomDialog')));
$('zoomDialog').addEventListener('close',()=>{home.insertBefore(workbench,homeNext);draw();zoomFocus?.focus();});
function renderRecords(){
 $('recordCount').textContent=state.records.length+'件';$('records').replaceChildren();
 if(!state.records.length){const p=document.createElement('p');p.className='empty-record';p.textContent='見直したい姿を「この姿を記録」で残せます。';$('records').append(p);return;}
 state.records.forEach((record,i)=>{const b=document.createElement('button');b.type='button';b.className='record-card';const c=document.createElement('canvas');c.width=550;c.height=365;c.setAttribute('aria-hidden','true');const t=document.createElement('span');t.textContent=String(i+1).padStart(2,'0')+' · '+viewNames[record.view]+' / '+windNames[record.wind];b.append(c,t);b.addEventListener('click',()=>{cancelAnimationFrame(frame);state.wind=record.wind;state.view=record.view;currentWind=[...D.winds[state.wind]];pan=[0,0];setActive();draw();save();say('記録した姿を観測窓に再現しました。');$('observatory').scrollIntoView?.({behavior:reduced()?'instant':'smooth',block:'start'});});$('records').append(b);
  const cx=c.getContext('2d');if(cx)render(cx,{wind:D.winds[record.wind],view:record.view,scale:1,offset:[0,0],width:550,height:365,thumbnail:true});
 });
}
$('record').addEventListener('click',()=>{const last=state.records.at(-1);if(last?.wind===state.wind&&last?.view===state.view){say('同じ姿は、直前の記録に残っています。');return;}state.records.push({wind:state.wind,view:state.view});state.records=state.records.slice(-24);renderRecords();$('records').scrollLeft=$('records').scrollWidth;save();say('この風と窓の姿を記録しました。最大24件まで残せます。');sound('tap');});
$('firstRecord').addEventListener('click',()=>{$('records').scrollLeft=0;});$('lastRecord').addEventListener('click',()=>{$('records').scrollLeft=$('records').scrollWidth;});
$('notes').value=state.notes;function noteCount(){$('notesCount').textContent=state.notes.length+' / 8000';}
$('notes').addEventListener('input',()=>{state.notes=$('notes').value.slice(0,8000);noteCount();save();});
$('answer').value=state.answer;$('answer').addEventListener('input',()=>{state.answer=$('answer').value.slice(0,40);save();});
function renderPass(fresh=false){$('pass').hidden=!state.passed;$('pass').classList.toggle('is-new',fresh&&!reduced());}
$('answerForm').addEventListener('submit',e=>{e.preventDefault();state.answer=$('answer').value;const ok=M.grade(state.answer);if(ok){const fresh=!state.passed;state.passed=true;renderPass(fresh);$('answerStatus').textContent='古い銘が受理されました。';if(fresh){sound('pass');$('pass').scrollIntoView?.({behavior:reduced()?'instant':'smooth',block:'nearest'});}}else{$('answerStatus').textContent='記念帯の銘とは一致しません。観測を見直して、改めて提出してください。';sound('fail');}save();});
$('reset').addEventListener('click',()=>openDialog($('resetDialog')));$('cancelReset').addEventListener('click',()=>closeDialog($('resetDialog')));
$('confirmReset').addEventListener('click',()=>{cancelAnimationFrame(frame);const {notes,reduced,sfx}=state;state=M.initial();Object.assign(state,{notes,reduced,sfx});currentWind=[...D.winds.still];pan=[0,0];zoom=1;$('zoom').value='1';canvas.classList.remove('zoomed');$('answer').value='';$('answerStatus').textContent='書きかけの台帳も自動保存します。';setActive();draw();renderRecords();renderPass();save();closeDialog($('resetDialog'));say('この試験の観測・台帳・合格を初期化しました。研究メモと設定は残っています。');});
if(!context)say('この環境では観測図を表示できません。Canvas対応のブラウザで開いてください。');
setActive();draw();renderRecords();renderPass();noteCount();
})();
