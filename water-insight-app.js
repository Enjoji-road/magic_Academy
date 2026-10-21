/* Research II UI. Measurements and grading are delegated to WaterInsight. */
(()=>{
'use strict';
const M=window.WaterInsight,$=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
let state=M.initial(),spell='water',canSave=true,invalid=false,diagramId=0,effectTimer,lastFocus;
try{const raw=localStorage.getItem(M.KEY);if(raw){const saved=M.restore(raw);if(saved)state=saved;else invalid=true;}}catch{canSave=false;}
const format=n=>Math.round(n).toLocaleString('ja-JP'),reduced=()=>Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
const names={before:'実験前',restart:'再実験前',small:'少し注水',fill:'止まるまで給水',open:'つまみを開く',close:'つまみを閉じる',bath:'外の水盤へ注水'};
function say(s){$('status').textContent=s;}
function saveLabel(){$('saveStatus').textContent=!canSave?'このブラウザでは保存できません。ページを閉じる前に記録を控えてください。':invalid?'保存形式を読み取れず、初期状態で開きました。既存の試験の記録はそのままです。':'第2試作の観測・台帳・メモを、この端末へ自動保存します。';}
function save(){try{localStorage.setItem(M.KEY,JSON.stringify(state));canSave=true;invalid=false;}catch{canSave=false;}saveLabel();}
function node(tag,attrs={},value){const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,String(v));if(value!==undefined)e.textContent=value;return e;}
function add(parent,tag,attrs,value){const e=node(tag,attrs,value);parent.append(e);return e;}
function text(parent,x,y,value,attrs={}){return add(parent,'text',{x,y,fill:'#dcecf0','font-size':20,...attrs},value);}
function diagram(p,{bubbles=false,magic=null,target='source',waterFlow=false}={}){
 const m=M.measure(p),id='wi'+(++diagramId),svg=node('svg',{viewBox:'0 0 960 650',class:'insight-diagram',role:'img','aria-label':'封印瓶の上限札：'+(m.full?'到達':'未到達')+'。計量鐘内の水 '+format(m.displayWater)+' mL。連絡管は'+(m.open?'開':'閉')+'。'});
 add(svg,'title',{},'封印瓶と、釣り合い機構で上下する計量鐘');
 const defs=add(svg,'defs');for(const[name,a,b]of[['glass','#95cbd42b','#38637955'],['stone','#667982','#334650'],['water','#88d2e1','#3d91ad']]){const g=add(defs,'linearGradient',{id:id+name,x1:0,y1:0,x2:1,y2:1});add(g,'stop',{offset:0,'stop-color':a});add(g,'stop',{offset:1,'stop-color':b});}
 const fill=name=>'url(#'+id+name+')';
 add(svg,'rect',{x:12,y:12,width:936,height:626,rx:9,fill:'none',stroke:'#678a99'});
 text(svg,34,46,'AQUA · VOLUME LABORATORY',{'font-size':14,'letter-spacing':2,fill:'#aac9d3'});
 text(svg,926,46,'正面模式図',{'font-size':17,'text-anchor':'end',fill:'#aac9d3'});
 add(svg,'path',{d:'M32 76h896M32 608h896',stroke:'#7595a255'});
 // Constant-head feed. The supply is not a calibrated volume measure.
 text(svg,96,155,'供水瓶',{'text-anchor':'middle'});
 add(svg,'rect',{x:57,y:176,width:78,height:170,rx:11,fill:fill('glass'),stroke:'#a5ccd8','stroke-width':2});
 add(svg,'rect',{x:60,y:211,width:72,height:131,rx:7,fill:fill('water'),'fill-opacity':.8});
 add(svg,'path',{d:'M57 211h79m-40 135v174h165',fill:'none',stroke:'#70afc9','stroke-width':7});
 text(svg,96,278,'検水',{'text-anchor':'middle','font-size':18});
 // Sealed opaque bottle. Its initial/remaining water quantity is never drawn.
 add(svg,'path',{d:'M228 304v-33h82v33q62 8 62 58v160q0 29-29 29H194q-29 0-29-29V362q0-50 63-58Z',fill:fill('stone'),stroke:'#a2c5cd','stroke-width':2});
 add(svg,'rect',{x:194,y:368,width:150,height:125,rx:6,fill:'#223943',stroke:'#9ab4b7'});
 text(svg,269,408,'封 印 瓶',{'text-anchor':'middle','font-size':24});
 text(svg,269,449,'5,000 mL',{'text-anchor':'middle','font-size':24,fill:'#e1d8b8'});
 text(svg,269,475,'中は見えない',{'text-anchor':'middle','font-size':17,fill:'#b0c5ca'});
 add(svg,'rect',{x:225,y:251,width:88,height:21,rx:3,fill:'#9cafb5',stroke:'#d0dfda'});
 add(svg,'path',{d:'M270 251v-43',stroke:'#bed2d4','stroke-width':2});
 text(svg,270,189,m.full?'上限到達':'上限未達',{'text-anchor':'middle','font-size':20,fill:m.full?'#d1e8e9':'#b5cbd1'});
 // Only one connecting pipe. The pickup is concealed by the opaque bottle cap.
 add(svg,'path',{d:'M310 279h120V180h91v355h147v-23',fill:'none',stroke:'#95aeb7','stroke-width':7,'stroke-linejoin':'round'});
 add(svg,'path',{d:'M310 277h118V178h95',fill:'none',stroke:'#d0e1e466','stroke-width':1});
 text(svg,439,147,'連絡管',{'text-anchor':'middle','font-size':18});
 add(svg,'circle',{cx:430,cy:263,r:19,fill:'#365766',stroke:'#a8c5ca','stroke-width':2});
 add(svg,'path',{d:p.open?'M430 251v24':'M418 263h24',stroke:'#d8e7e7','stroke-width':4,'stroke-linecap':'round'});
 text(svg,430,308,p.open?'開':'閉',{'text-anchor':'middle','font-size':22});
 // Bath keeps its surface at one height. The closed-top bell moves; its scale moves with it.
 const surface=363,bellHeight=210,waterHeight=(Cvalue(m.bellWater)/5000)*bellHeight,bottom=surface+waterHeight,top=bottom-bellHeight;
 add(svg,'rect',{x:556,y:339,width:286,height:222,rx:10,fill:fill('glass'),stroke:'#97c1ca','stroke-width':2});
 add(svg,'rect',{x:559,y:surface,width:280,height:195,rx:5,fill:'#8fcbd530','stroke':'none'});
 add(svg,'path',{d:`M556 ${surface}h286m0 0h35v143h-25`,fill:'none',stroke:'#91bec9','stroke-width':3});
 add(svg,'path',{d:'M592 124v442M812 124v442',stroke:'#607c89','stroke-width':2});
 // Counterbalanced, levelled measuring bell. No hidden pressure changes at readout.
 add(svg,'path',{d:`M673 ${top}V114h233v${285+(287-top)}`,fill:'none',stroke:'#b6c9cb','stroke-width':2});
 add(svg,'circle',{cx:768,cy:114,r:16,fill:'#2b4553',stroke:'#9ab3b8','stroke-width':2});
 add(svg,'rect',{x:890,y:285+(287-top),width:32,height:52,rx:4,fill:'#728b8e',stroke:'#a5bfc3'});
 const bell=add(svg,'g',{class:'bell'});
 add(bell,'path',{d:`M612 ${bottom}V${top+13}q0-13 13-13h103q13 0 13 13v${bellHeight-13}`,fill:fill('glass'),stroke:'#cee6e7','stroke-width':2.3});
 add(bell,'rect',{x:615,y:surface,width:123,height:Math.max(0,waterHeight-1),fill:'#c1e5df55'});
 add(bell,'path',{d:`M614 ${surface}h125`,stroke:'#f0ffff','stroke-width':2});
 for(let v=0;v<=5000;v+=1000){const y=bottom-v/5000*bellHeight;add(bell,'path',{d:`M729 ${y}h13`,stroke:'#cadde0','stroke-width':1.2});text(bell,749,y+6,String(v),{'font-size':20,fill:'#c7dce1'});}
 text(svg,676,top-18,'計量鐘',{'text-anchor':'middle','font-size':22});
 text(svg,700,597,'水盤 · 水面一定',{'text-anchor':'middle','font-size':18,fill:'#bfd9df'});
 text(svg,676,317,'',{'text-anchor':'middle'});
 if(bubbles)for(let i=0;i<7;i++)add(svg,'circle',{cx:664+(i%3-1)*9,cy:510-i*22,r:3+(i%2),fill:'none',stroke:'#e4ffff','stroke-width':1.6,class:'bubble'});
 // Three external spell targets remain outside the sealed measurement system.
 add(svg,'path',{d:magic==='wind'?'M53 538v55m0-50q42-9 53 1-31 7-53 16':'M53 538v55m0-50q29-3 40 8-26-2-40 9',stroke:'#b9cbd2',fill:'#b9cbd24d','stroke-width':2});
 add(svg,'rect',{x:magic==='earth'?142:129,y:578,width:264,height:12,rx:3,fill:magic==='fire'?'#ab8e73':'#687f84',stroke:'#b3c2ba'});
 if(magic){const color={water:'#b9eff7',fire:'#efbd83',wind:'#d2e6e5',earth:'#c4d5ad'}[magic];add(svg,'ellipse',{cx:magic==='water'?(target==='bath'?872:96):220,cy:magic==='water'?(target==='bath'?351:183):584,rx:magic==='water'?40:80,ry:18,stroke:color,fill:'none','stroke-width':2,class:'magic-trace'});}
 if(waterFlow)add(svg,'path',{d:'M96 346v174h150',stroke:'#d2f6fb',fill:'none','stroke-width':2,class:'magic-trace'});
 return svg;
}
function Cvalue(x){return Math.max(0,Math.min(5000,x));}
function showScene(options={}){
 clearTimeout(effectTimer);$('scene').replaceChildren(diagram(state.physical,options));const m=M.measure(state.physical);
 $('liveReading').replaceChildren(document.createTextNode(format(m.displayWater)+' '));const unit=document.createElement('small');unit.textContent='mL';$('liveReading').append(unit);
 $('fullFlag').textContent=m.full?'上限到達':'未到達';$('valve').textContent=m.open?'開 · 閉じる':'閉 · 開く';$('valve').setAttribute('aria-pressed',String(m.open));
 if(options.bubbles||options.magic)effectTimer=setTimeout(()=>document.querySelectorAll('#scene .bubble,#scene .magic-trace').forEach(e=>e.remove()),1100);
}
function openDialog(d){if(d.showModal)d.showModal();else d.setAttribute('open','');}
function closeDialog(d){if(d.close)d.close();else d.removeAttribute('open');}
function zoom(physical=state.physical,label='実験装置・拡大図',origin=$('enlarge')){lastFocus=origin;$('zoomTitle').textContent=label;$('zoomContent').replaceChildren(diagram(physical));openDialog($('zoomDialog'));window.AcademySFX?.play('paper');}
function observations(r,previous){
 const m=M.measure(r.physical),moved=r.physical.bell-(previous?.physical.bell??r.physical.bell)>1e-6,admitted=r.physical.water-(previous?.physical.water??r.physical.water)>1e-6;
 if(r.action==='before'||r.action==='restart')return['注水前の読み取り。封印瓶の上限札は未到達。','計量鐘の内外の水面は同じ高さ。'];
 const messages=[];
 if(r.action==='bath')messages.push('水盤に注いだ水は、溢れ口から流れた。瓶と鐘の指示は変わらない。');
 else if(r.action==='open')messages.push(moved?'注水せずにつまみを開くと、鐘の中に気泡が上がった。':'つまみを開いた。鐘の指示は変わらない。');
 else if(r.action==='close')messages.push('つまみを閉じた。鐘の指示は変わらない。');
 else if(m.full)messages.push(admitted?'封印瓶の上限札が上がり、給水が止まった。':'上限札は到達したまま。給水は止まっている。');
 else messages.push(admitted?'検水が瓶に入り、その後、給水が止まった。':'給水はすでに止まっていた。');
 if(moved&&r.action!=='open')messages.push('鐘の中に気泡が見えた。');
 if(moved)messages.push('鐘内の水は無色のまま。釣り合い機構が鐘を持ち上げた。');
 else if(['fill','small'].includes(r.action))messages.push('鐘の水の指示は変わらなかった。');
 return messages;
}
function renderRecords(latest=false){const list=$('recordList'),left=list.scrollLeft;list.replaceChildren();$('recordCount').textContent=state.records.length+'件';
 state.records.forEach((r,i)=>{const m=M.measure(r.physical),card=document.createElement('article');card.className='journal';const head=document.createElement('div');head.className='journal-head';const h=document.createElement('h3');h.textContent=i===0?'実験前':String(i).padStart(2,'0')+' · '+names[r.action];const b=document.createElement('button');b.type='button';b.textContent='図を見る';b.setAttribute('aria-label',h.textContent+'の図を見る');b.addEventListener('click',()=>zoom(r.physical,h.textContent,b));head.append(h,b);card.append(head);
 const label=document.createElement('div');label.className='journal-label';label.textContent='計量鐘に残る水';const value=document.createElement('div');value.className='journal-reading';const number=document.createElement('strong');number.textContent=format(m.displayWater);const unit=document.createElement('span');unit.textContent='mL';value.append(number,unit);card.append(label,value);
 const facts=document.createElement('div');facts.className='observation-facts';for(const message of['連絡管：'+(m.open?'開':'閉')+' / 上限札：'+(m.full?'到達':'未到達'),...observations(r,state.records[i-1])]){const p=document.createElement('p');p.textContent=message;facts.append(p);}card.append(facts);list.append(card);
 });list.scrollLeft=latest?list.scrollWidth:left;
}
function act(action){
 const before=M.clone(state.physical),result=M.act(state,action);save();showScene({bubbles:result.collected>1e-6,magic:['small','fill','bath'].includes(action)?'water':null,target:action==='bath'?'bath':'source',waterFlow:result.admitted>1e-6});renderRecords(result.newRecord);
 const r={action,physical:state.physical};const message=observations(r,{physical:before})[0];say(message+' 観測記録で読み取りを確認できます。');
 if(result.admitted>1e-6||action==='bath')window.AcademySFX?.play('water');else if(action==='open'||action==='close')window.AcademySFX?.play('cover');
}
$('smallPour').addEventListener('click',()=>act('small'));$('fullPour').addEventListener('click',()=>act('fill'));$('bathPour').addEventListener('click',()=>act('bath'));$('valve').addEventListener('click',()=>act(state.physical.open?'close':'open'));
const spellCopy={water:'水魔法：水を出し、流します。供水瓶や外の水盤へ水を注げます。',fire:'炎魔法：燃やし、温めます。外周の銀縁を温められます。',wind:'風魔法：風を起こします。水盤の脇の布へ風を送れます。',earth:'土魔法：土や石を動かします。足元の石製受け皿を動かせます。'};
for(const b of document.querySelectorAll('[data-spell]'))b.addEventListener('click',()=>{spell=b.dataset.spell;document.querySelectorAll('[data-spell]').forEach(e=>e.setAttribute('aria-pressed',String(e===b)));$('spellDescription').textContent=spellCopy[spell];$('waterActions').hidden=spell!=='water';$('otherMagic').hidden=spell==='water';$('otherMagic').textContent={fire:'🔥 外周の銀縁を温める',wind:'🌪️ 布へ風を送る',earth:'🪨 石の受け皿を動かす'}[spell]||'';});
$('otherMagic').addEventListener('click',()=>{if(spell==='water')return;showScene({magic:spell});say({fire:'外周の受け皿の銀縁が、ほのかに温まりました。',wind:'水盤の脇の布が、風を受けて揺れました。',earth:'石製の受け皿がずれ、下の排水溝が少し見えました。'}[spell]);window.AcademySFX?.play({fire:'ignite',wind:'wind',earth:'scrape'}[spell]);});
$('enlarge').addEventListener('click',()=>zoom());$('closeZoom').addEventListener('click',()=>closeDialog($('zoomDialog')));$('zoomDialog').addEventListener('close',()=>lastFocus?.focus());
for(const id of['zoomDialog','resetDialog'])$(id).addEventListener('keydown',e=>e.stopPropagation());
function moveRecord(direction){const list=$('recordList'),distance=Math.max(250,list.clientWidth*.85);if(list.scrollBy)list.scrollBy({left:direction*distance,behavior:reduced()?'instant':'smooth'});else list.scrollLeft+=direction*distance;}
$('previousRecord').addEventListener('click',()=>moveRecord(-1));$('nextRecord').addEventListener('click',()=>moveRecord(1));
$('firstRecord').addEventListener('click',()=>{$('recordList').scrollLeft=0;});$('lastRecord').addEventListener('click',()=>{$('recordList').scrollLeft=$('recordList').scrollWidth;});
function noteCount(){$('notesCount').textContent=state.notes.length+' / 8000';}
$('notes').value=state.notes;$('notes').addEventListener('input',()=>{state.notes=$('notes').value.slice(0,8000);noteCount();save();});$('clearNotes').addEventListener('click',()=>{if(state.notes&&window.confirm('研究メモだけを消しますか？')){state.notes='';$('notes').value='';noteCount();save();}});
$('answer').value=state.answer;$('answer').addEventListener('input',()=>{state.answer=$('answer').value.slice(0,40);save();});
function renderPass(fresh=false){$('pass').hidden=!state.passed;$('pass').classList.toggle('just-passed',fresh);}
$('answerForm').addEventListener('submit',e=>{e.preventDefault();const was=state.passed,ok=M.grade(state,$('answer').value);save();if(!ok){$('answerStatus').textContent='提出された検量結果は、記録と一致していません。観測を確認して改めて提出してください。';return;}$('answerStatus').textContent='検量結果が受理されました。';if(!was)window.AcademySFX?.play('pass');renderPass(!was);if(!was)$('pass').scrollIntoView?.({behavior:reduced()?'instant':'smooth',block:'nearest'});});
$('restart').addEventListener('click',()=>{state.physical=M.physicalInitial();state.records.push({action:'restart',physical:M.clone(state.physical)});save();showScene();renderRecords(true);say('実験を初期状態に戻しました。これまでの記録・台帳・合格とメモは残っています。');});
$('reset').addEventListener('click',()=>openDialog($('resetDialog')));$('cancelReset').addEventListener('click',()=>closeDialog($('resetDialog')));$('confirmReset').addEventListener('click',()=>{const notes=state.notes;state=M.initial();state.notes=notes;$('answer').value='';$('answerStatus').textContent='記入途中の台帳も保存します。';save();showScene();renderRecords();renderPass();say('第2試作の試験をリセットしました。研究メモと他の試験の記録は残っています。');closeDialog($('resetDialog'));});
showScene();renderRecords();renderPass();noteCount();saveLabel();
})();
