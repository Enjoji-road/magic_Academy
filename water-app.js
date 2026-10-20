/* Presentation and persistence only; all measured states come from WaterExam. */
(()=>{
'use strict';
const M=window.WaterExam,$=id=>document.getElementById(id),SVG='http://www.w3.org/2000/svg';
let state=M.initial(),spell='water',canSave=true,invalidSave=false,lastFocus=null,fxTimer,diagramSerial=0;
try{const raw=localStorage.getItem(M.KEY);if(raw){const restored=M.restore(raw);if(restored)state=restored;else invalidSave=true;}}catch{canSave=false;}
const cm=x=>Math.abs(x*100-Math.round(x*100))<1e-6?String(Math.round(x*100)):(x*100).toFixed(1);
const depthLabel=d=>d===null?'栓':cm(d)+' cm';
const reduced=()=>Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
function say(s){$('status').textContent=s;}
function save(){try{localStorage.setItem(M.KEY,JSON.stringify(state));canSave=true;invalidSave=false;}catch{canSave=false;}saveLabel();}
function saveLabel(){$('saveStatus').textContent=!canSave?'このブラウザでは保存できません。ページを閉じる前に記録を控えてください。':invalidSave?'保存形式を読み取れず、初期状態で開きました。他の試験の記録はそのままです。':'途中の状態・観測・台帳・メモは、この端末に自動保存されます。';}
function s(tag,attrs={},text){const el=document.createElementNS(SVG,tag);for(const[k,v]of Object.entries(attrs))el.setAttribute(k,String(v));if(text!==undefined)el.textContent=text;return el;}
function add(parent,tag,attrs,text){const el=s(tag,attrs,text);parent.append(el);return el;}
function text(parent,x,y,content,attrs={}){return add(parent,'text',{x,y,fill:'#e0edf0','font-size':20,...attrs},content);}
function buildScene(depths,measured=false,animate=false,magic='water'){
 const o=measured?M.observe(depths):null,svg=s('svg',{viewBox:'0 0 960 690',class:'scene-svg',role:'img','aria-label':measured?'中央の六房水槽と四皿。読み取り値は図の下の記録にもあります。':'測定前の空の六房水槽と四皿。'});
 add(svg,'title',{},'水盤室・六房水槽の正面模式図');
 const defs=add(svg,'defs');let g=add(defs,'linearGradient',{id:'waterGlass',x1:0,x2:1,y1:0,y2:0});for(const[a,b]of[['0','#5a9daf22'],['.3','#b4e4e533'],['1','#30546833']])add(g,'stop',{offset:a,'stop-color':b});
 g=add(defs,'linearGradient',{id:'waterFill',x1:0,x2:1,y1:0,y2:1});add(g,'stop',{offset:0,'stop-color':'#7ac5d4','stop-opacity':.8});add(g,'stop',{offset:1,'stop-color':'#3f8faf','stop-opacity':.55});
 g=add(defs,'linearGradient',{id:'waterStone',x1:0,x2:0,y1:0,y2:1});add(g,'stop',{offset:0,'stop-color':'#53636b'});add(g,'stop',{offset:1,'stop-color':'#303e49'});
 add(svg,'rect',{x:12,y:12,width:936,height:666,rx:8,fill:'none',stroke:'#7295a1','stroke-opacity':.5});
 text(svg,34,48,'WATER LABORATORY',{'font-size':14,'letter-spacing':3,fill:'#9cbac5'});text(svg,923,48,'正面模式図',{'text-anchor':'end','font-size':15,fill:'#9cbac5'});
 add(svg,'path',{d:'M30 96H930M30 657H930',stroke:'#6f939f','stroke-opacity':.4});
 // Supply reservoir: its free surface shares the same vertical scale as the central water.
 text(svg,80,135,'供水瓶',{'text-anchor':'middle'});
 add(svg,'rect',{x:42,y:176,width:76,height:258,rx:14,fill:'url(#waterGlass)',stroke:'#a5d2da','stroke-width':2});
 add(svg,'rect',{x:44,y:236,width:72,height:195,rx:10,fill:'url(#waterFill)'});
 add(svg,'path',{d:'M43 236H118M42 176h76',stroke:'#c4e6e9','stroke-width':2});
 add(svg,'path',{d:'M118 236h18v28',fill:'none',stroke:'#96c3cf','stroke-width':5});
 text(svg,80,285,'90',{'text-anchor':'middle','font-size':30});text(svg,80,310,'cm',{'text-anchor':'middle','font-size':15});
 add(svg,'path',{d:'M80 433v28H860',stroke:'#6097ad','stroke-width':9,fill:'none','stroke-linejoin':'round'});
 // The opaque service casing conceals all takeoffs. Never draw the answer's routes here.
 add(svg,'rect',{x:174,y:115,width:748,height:344,rx:12,fill:'url(#waterStone)',stroke:'#9abec7','stroke-width':2});
 add(svg,'rect',{x:184,y:125,width:728,height:25,rx:4,fill:'#779099','fill-opacity':.24});
 text(svg,550,144,'六 房 水 槽',{'text-anchor':'middle','font-size':16,fill:'#c8d8d9'});
 for(let i=0;i<6;i++){
  const x=198+i*117,h=measured?o.heights[i]*220:0,base=434;
  text(svg,x+36,180,M.ROOMS[i],{'text-anchor':'middle','font-size':22});
  add(svg,'rect',{x,y:194,width:72,height:240,rx:8,fill:'url(#waterGlass)',stroke:'#abc9d1','stroke-width':1.7});
  add(svg,'rect',{x:x+2,y:base-h,width:68,height:h,rx:3,fill:'url(#waterFill)',class:'tank-water'});
  if(h>0)add(svg,'path',{d:`M${x+3} ${base-h}h66`,stroke:'#d5f5f4','stroke-width':1.6});
  add(svg,'path',{d:`M${x+36} 461v-27`,stroke:'#6097ad','stroke-width':6});
  for(const n of[0,40,80]){const y=base-n*2.2;add(svg,'path',{d:`M${x+2} ${y}h8`,stroke:'#c3dce0','stroke-width':1});}
  text(svg,x+36,base+54,measured?cm(o.heights[i])+' cm':'—',{'text-anchor':'middle','font-size':20,fill:'#dcf3f1'});
 }
 // Numeric scale is not hidden behind decoration or derived from pixel height.
 for(const n of[0,40,80])text(svg,166,440-n*2.2,n,{'text-anchor':'end','font-size':14,fill:'#b6cdd4'});
 text(svg,166,180,'cm',{'text-anchor':'end','font-size':14,fill:'#b6cdd4'});
 add(svg,'rect',{x:167,y:496,width:762,height:15,rx:3,fill:'#6d8790',stroke:'#98b5bd'});
 text(svg,82,480,'既知の給水管',{'text-anchor':'middle','font-size':14,fill:'#b5d0d8'});
 for(let i=0;i<4;i++){
  const x=275+i*172,d=depths[i],h=d===null?0:d*140,base=616;
  // Individual outlets are behind a protective sleeve: the player sees a bowl, not source IDs.
  add(svg,'path',{d:`M${x-7} 511v103M${x+7} 511v103`,stroke:'#7e9aa5','stroke-width':2,fill:'none'});
  add(svg,'rect',{x:x-53,y:528,width:106,height:88,rx:9,fill:'url(#waterGlass)',stroke:'#abcbd4','stroke-width':2});
  if(d!==null){add(svg,'rect',{x:x-51,y:base-h,width:102,height:h,rx:5,fill:'#b1e2e3','fill-opacity':.28});add(svg,'path',{d:`M${x-50} ${base-h}h100`,stroke:'#d8efea','stroke-width':1.6});}
  else add(svg,'rect',{x:x-20,y:600,width:40,height:15,rx:3,fill:'#b6c3c5',stroke:'#d5dfdc'});
  text(svg,x,650,M.OUTLETS[i]+' · '+depthLabel(d),{'text-anchor':'middle','font-size':18});
  if(animate&&magic==='water'&&o?.bubbles.includes(i)&&d>0)for(let k=0;k<6;k++)add(svg,'circle',{cx:x-16+(k%3)*15,cy:606-Math.floor(k/3)*10,r:3+(k%2),fill:'none',stroke:'#e6ffff','stroke-width':1.5,class:'bubble'});
 }
 // A cloth vane and stone spill-tray support other basic spells without changing the sealed rig.
 add(svg,'path',{d:animate&&magic==='wind'?'M48 541v78m0-76q37-15 47-5-26 12-47 23':'M48 541v78m0-76q27-9 39 2-23 5-39 16',fill:'#d1e2dc66',stroke:'#b2cbd0','stroke-width':2});
 add(svg,'rect',{x:animate&&magic==='earth'?45:33,y:625,width:97,height:13,rx:3,fill:animate&&magic==='fire'?'#b38b6c':'#6b8285',stroke:'#a0b5ae'});
 if(animate){const color={water:'#b6f4ff',fire:'#efb474',wind:'#d2e5e8',earth:'#c5d1ad'}[magic];add(svg,'ellipse',{cx:magic==='water'?80:78,cy:magic==='water'?190:600,rx:44,ry:27,fill:'none',stroke:color,'stroke-width':2,class:'spark'});}
 if(animate&&magic==='water')add(svg,'path',{d:'M80 154q-5 7 0 14m0-7v14',fill:'none',stroke:'#baf5ff','stroke-width':3,class:'spark'});
 // Distinct IDs also when a record and the live apparatus are open together.
 const suffix='-'+(++diagramSerial);for(const el of svg.querySelectorAll('[id]'))el.id+=suffix;
 for(const el of svg.querySelectorAll('[fill]')){const f=el.getAttribute('fill');if(f.startsWith('url(#'))el.setAttribute('fill',f.slice(0,-1)+suffix+')');}
 return svg;
}
function renderScene(animate=false,magic='water'){
 clearTimeout(fxTimer);
 $('scene').replaceChildren(buildScene(state.depths,Boolean(state.current),animate,magic));
 $('measurementState').textContent=state.current?'測定後の水位を表示中 · 給水瓶 90 cm':'準備完了 · 中央水槽は空です';
 if(animate)fxTimer=setTimeout(()=>{document.querySelectorAll('#scene .bubble,#scene .spark').forEach(el=>el.remove());},1100);
}
function syncControls(){for(const el of $('depthControls').querySelectorAll('select'))el.value=String(state.depths[+el.dataset.outlet]);}
function prepare(depths){state.depths=depths.slice();state.current=null;syncControls();renderScene();save();say('復帰機構が中央水槽を空に戻しました。四皿の条件を用意しました。供水瓶へ水を注いで測定できます。');}
for(let i=0;i<4;i++){
 const label=document.createElement('label');label.className='depth-control';
 const name=document.createElement('span');name.textContent='皿 '+M.OUTLETS[i];label.append(name);
 const select=document.createElement('select');select.dataset.outlet=i;select.setAttribute('aria-label','皿 '+M.OUTLETS[i]+' の水深');
 for(const d of M.DEPTHS){const option=document.createElement('option');option.value=String(d);option.textContent=d===0?'0 cm · 水なし':d===null?'栓で閉じる':depthLabel(d);select.append(option);}
 select.addEventListener('change',()=>{const ds=state.depths.slice();ds[i]=select.value==='null'?null:Number(select.value);prepare(ds);});label.append(select);$('depthControls').append(label);
}
M.PROFILES.forEach(p=>{const b=document.createElement('button');b.type='button';b.textContent=p.name;const sub=document.createElement('small');sub.textContent=p.depths.map(cm).join(' / ')+' cm';b.append(sub);b.addEventListener('click',()=>prepare(p.depths));$('profiles').append(b);});
function readings(o){const grid=document.createElement('div');grid.className='readings';o.heights.forEach((h,i)=>{const r=document.createElement('div');r.className='reading';const label=document.createElement('span');label.textContent=M.ROOMS[i];const strong=document.createElement('strong');strong.textContent=cm(h);const unit=document.createElement('small');unit.textContent='cm';strong.append(unit);r.append(label,strong);grid.append(r);});return grid;}
function openZoom(depths=state.depths,measured=Boolean(state.current),title='中央水槽・拡大図',origin=$('enlarge')){
 lastFocus=origin;$('zoomTitle').textContent=title;$('zoomContent').replaceChildren(buildScene(depths,measured));openDialog($('zoomDialog'));window.AcademySFX?.play('paper');
}
function renderRecords(showLatest=false){
 const list=$('recordList'),previousScroll=list.scrollLeft;
 $('recordCount').textContent=state.records.length+'件';
 $('recordsSwipeHint').hidden=state.records.length<2;
 list.replaceChildren();
 if(!state.records.length){const p=document.createElement('p');p.className='small';p.textContent='供水瓶に水を注ぐと、ここに観測が記録されます。';$('recordList').append(p);return;}
 state.records.forEach((ds,index)=>{const o=M.observe(ds),card=document.createElement('article');card.className='journal';const head=document.createElement('div');head.className='journal-head';const heading=document.createElement('h3');heading.textContent='観測 '+String(index+1).padStart(2,'0');const zoom=document.createElement('button');zoom.type='button';zoom.textContent='図を見る';zoom.setAttribute('aria-label',heading.textContent+'の図を見る');zoom.addEventListener('click',()=>openZoom(ds,true,heading.textContent,zoom));head.append(heading,zoom);card.append(head);
  const cap=document.createElement('p');cap.className='depth-caption';cap.textContent='皿 I / II / III / IV：'+ds.map(depthLabel).join(' / ');card.append(cap,readings(o));
  const event=document.createElement('div');event.className='journal-observation';for(const message of[o.bubbles.length?'給水中、皿 '+o.bubbles.map(i=>M.OUTLETS[i]).join('・')+' の水中に気泡。水の噴き出しは見られない。':'給水中、四皿から気泡は出なかった。','四皿に青い水は現れなかった。用意した水の色も変わらなかった。','水面が落ち着くと、中央への流れも止まった。']){const p=document.createElement('p');p.textContent=message;event.append(p);}card.append(event);$('recordList').append(card);
 });
 // Re-rendering a record must not unexpectedly jump back to the first card.
 list.scrollLeft=showLatest?list.scrollWidth:previousScroll;
}
function renderDraft(){
 $('draftRows').replaceChildren();M.ROOMS.forEach((name,i)=>{const row=document.createElement('fieldset');row.className='draft-row';const legend=document.createElement('legend');legend.textContent='房 '+name;row.append(legend);const choices=document.createElement('div');choices.className='draft-choices';
  M.OUTLETS.forEach((out,j)=>{const b=document.createElement('button');b.type='button';b.textContent=out;b.dataset.room=i;b.dataset.destination=j;b.setAttribute('aria-label','房 '+name+' と皿 '+out+' の管');b.setAttribute('aria-pressed',String(state.draft[i].includes(j)));b.addEventListener('click',()=>{
   if(state.draft[i].includes(j))state.draft[i]=state.draft[i].filter(x=>x!==j);else if(state.draft[i].length<2)state.draft[i].push(j);else{$('answerStatus').textContent='各房は二本です。消したい記入をもう一度押してから、選び直せます。';return;}
   // Keep focus on the same physical control, rather than losing keyboard position on rerender.
   b.setAttribute('aria-pressed',String(state.draft[i].includes(j)));$('draftCount').textContent='記入 '+state.draft.reduce((n,p)=>n+p.length,0)+' / 12 本';$('answerStatus').textContent='装置図を記録しました。';save();
  });choices.append(b);});row.append(choices);$('draftRows').append(row);
 });$('draftCount').textContent='記入 '+state.draft.reduce((n,p)=>n+p.length,0)+' / 12 本';
}
function renderPass(fresh=false){$('pass').hidden=!state.passed;$('pass').classList.toggle('just-passed',fresh);}
function openDialog(dialog){if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');}
function closeDialog(dialog){if(dialog.close)dialog.close();else dialog.removeAttribute('open');}
function pour(){
 if(spell!=='water'){
  const messages={fire:'外周の受け皿の銀縁が、ほのかに温まりました。',wind:'水盤の脇の小さな布が、風を受けて揺れました。',earth:'足元の石製の受け皿がずれ、台座の下の排水溝が少し見えました。'};
  renderScene(true,spell);say(messages[spell]);window.AcademySFX?.play({fire:'ignite',wind:'wind',earth:'scrape'}[spell]);return;
 }
 const earlierCount=state.records.length;
 M.record(state,state.depths);save();renderScene(true);
 renderRecords(state.records.length>earlierCount);
 const o=M.observe(state.depths);say(o.bubbles.length?'青い検水が中央へ入りました。四皿の水中に気泡が見え、やがて流れが止まりました。観測を記録しました。':'青い検水が中央へ入り、やがて流れが止まりました。観測を記録しました。');
 window.AcademySFX?.play('water');
}
$('pour').addEventListener('click',pour);
$('drain').addEventListener('click',()=>{state.current=null;save();renderScene();say('復帰レバーが排水口と基準口を開き、中央水槽が空に戻りました。観測と台帳は残っています。');});
const spells={water:['水魔法：水を出し、流します。皿の水を整えてから、供水瓶へ水を注いでください。','💧 供水瓶に水を注ぐ'],fire:['炎魔法：燃やし、温めます。外周の受け皿の銀縁を温められます。','🔥 外周の銀縁を温める'],wind:['風魔法：風を起こします。水盤の脇の布へ風を送れます。','🌪️ 水盤の脇へ風を送る'],earth:['土魔法：土や石を動かします。足元の石製の受け皿を動かせます。','🪨 石の受け皿を動かす']};
document.querySelectorAll('[data-spell]').forEach(button=>button.addEventListener('click',()=>{spell=button.dataset.spell;for(const el of document.querySelectorAll('[data-spell]'))el.setAttribute('aria-pressed',String(el===button));$('spellDescription').textContent=spells[spell][0];$('pour').textContent=spells[spell][1];}));
$('notes').value=state.notes;function noteCount(){$('notesCount').textContent=state.notes.length+' / 8000';}
$('notes').addEventListener('input',()=>{state.notes=$('notes').value.slice(0,8000);noteCount();save();});
$('clearNotes').addEventListener('click',()=>{if(!state.notes)return;if(window.confirm('研究メモだけを消しますか？')){state.notes='';$('notes').value='';noteCount();save();}});
$('enlarge').addEventListener('click',()=>openZoom());$('closeZoom').addEventListener('click',()=>closeDialog($('zoomDialog')));$('zoomDialog').addEventListener('close',()=>lastFocus?.focus());
$('answerForm').addEventListener('submit',e=>{e.preventDefault();const was=state.passed,ok=M.grade(state);save();
 if(!ok){$('answerStatus').textContent='提出された装置図は、観測と一致していません。記録を確認し、改めて提出してください。';return;}
 $('answerStatus').textContent='装置図が受理されました。';if(!was)window.AcademySFX?.play('pass');renderPass(!was);if(!was)$('pass').scrollIntoView?.({behavior:reduced()?'instant':'smooth',block:'nearest'});
});
$('reset').addEventListener('click',()=>openDialog($('resetDialog')));$('cancelReset').addEventListener('click',()=>closeDialog($('resetDialog')));
$('confirmReset').addEventListener('click',()=>{const notes=state.notes;state=M.initial();state.notes=notes;save();syncControls();renderScene();renderRecords();renderDraft();renderPass();$('answerStatus').textContent='記入途中の装置図も保存されます。';say('観測・台帳・合格記録をリセットしました。研究メモは残っています。');closeDialog($('resetDialog'));});
for(const id of['zoomDialog','resetDialog'])$(id).addEventListener('keydown',e=>e.stopPropagation());
syncControls();renderScene();renderRecords();renderDraft();renderPass();noteCount();saveLabel();
})();
