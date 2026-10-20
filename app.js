/* Interaction extends prototype 01's tap selection, shape rotation and status flow. */
(()=>{
'use strict';
const E=window.EarthExam,$=id=>document.getElementById(id),KEY='magic-academy-earth-v2';
let state=E.initial(),active=null,ghost=null,spell='earth',history=[],wet=new Set(),effect=null,effectTimer,waterTimer,canSave=true;
try{const saved=E.restore(localStorage.getItem(KEY));if(saved)state=saved;}catch{canSave=false;}
const board=$('board'),rack=$('rack'),cells=[],cards={};
function message(text){$('status').textContent=text;}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{canSave=false;}$('saveStatus').textContent=canSave?'途中の状態は自動保存されます':'このブラウザでは途中保存を利用できません';}
function checkpoint(){history.push(E.clone(state));if(history.length>100)history.shift();}
function miniature(id){const p=state.pieces[id],s=E.shapeFor(id,p.rot,p.flip),w=Math.max(...s.cells.map(v=>v[0]))+1,h=Math.max(...s.cells.map(v=>v[1]))+1;const g=document.createElement('div');g.className='mini';g.style.setProperty('--cols',w);g.style.setProperty('--stone',E.META[id].color);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const c=document.createElement('span');c.className='mini-cell';if(!s.cells.some(v=>v[0]===x&&v[1]===y))c.classList.add('blank');else if(s.mark&&s.mark[0]===x&&s.mark[1]===y)c.textContent=E.META[id].glyph;g.append(c);}return g;}
function clearEffect(){effect=null;renderBoard();}
function animate(type,coords){clearTimeout(effectTimer);effect={type,keys:new Set(coords.map(p=>p.join(',')))};renderBoard();effectTimer=setTimeout(clearEffect,1000);}
function pick(id){
 if(spell!=='earth'){castMagicOnStone(id);return;}
 const p=state.pieces[id];if(active===id&&!p.at){active=null;ghost=null;render();message('選択を閉じました。');return;}
 let origin=null;if(p.at){checkpoint();origin=p.at.slice();p.at=null;state.moves++;if(id==='C')state.discovered=true;save();}
 active=id;ghost=origin;render();
 message(`${E.META[id].name}が土の光に包まれ、浮かび上がりました。石盤に触れて位置を確認してください。`);
 if(origin)animate('lift',E.shapeFor(id,p.rot,p.flip).cells.map(([dx,dy])=>[origin[0]+dx,origin[1]+dy]));
}
function previewAt(x,y){
 const p=state.pieces[active],s=E.shapeFor(active,p.rot,p.flip).cells,w=Math.max(...s.map(v=>v[0]))+1,h=Math.max(...s.map(v=>v[1]))+1;
 const opts=s.map(([dx,dy])=>[x-dx,y-dy]);
 function score(at){const inside=at[0]>=0&&at[1]>=0&&at[0]+w<=6&&at[1]+h<=6;return(E.fits(state,active,...at)?0:1000)+(inside?0:10000)+Math.pow(at[0]+w/2-(x+.5),2)+Math.pow(at[1]+h/2-(y+.5),2);}
 opts.sort((a,b)=>score(a)-score(b)||a[1]-b[1]||a[0]-b[0]);ghost=opts[0];render();message(E.fits(state,active,...ghost)?'光っている位置を確認し、「ここに置く」で土魔法を使います。':'その位置には収まりません。矢印・回転で調整できます。');
}
function onCell(x,y){const hit=E.occupied(state).get(`${x},${y}`);if(spell!=='earth'){castMagic(x,y,hit);return;}if(active){previewAt(x,y);return;}if(hit){pick(hit);return;}message('土魔法で動かす石に触れてください。');}
function turn(flip){if(!active)return;const p=state.pieces[active],old=E.shapeFor(active,p.rot,p.flip).cells;const ow=Math.max(...old.map(v=>v[0]))+1,oh=Math.max(...old.map(v=>v[1]))+1;if(flip)p.flip=!p.flip;else p.rot=(p.rot+1)%4;if(ghost){const now=E.shapeFor(active,p.rot,p.flip).cells,w=Math.max(...now.map(v=>v[0]))+1,h=Math.max(...now.map(v=>v[1]))+1;ghost=[Math.max(0,Math.min(6-w,Math.round(ghost[0]+(ow-w)/2))),Math.max(0,Math.min(6-h,Math.round(ghost[1]+(oh-h)/2)))];}save();render();message(flip?'石を裏返しました。刻印も一緒に動きます。':'石を回転させました。光の位置を確認してください。');}
function nudge(dx,dy){if(!active)return;if(!ghost){message('先に石盤に触れて、配置位置を確認してください。');return;}ghost=[ghost[0]+dx,ghost[1]+dy];render();}
function place(){if(!active||!ghost||!E.fits(state,active,...ghost))return;checkpoint();const id=active,at=ghost.slice();state.pieces[id].at=at;state.moves++;if(id==='C')state.discovered=true;active=null;ghost=null;const o=E.occupied(state);wet=new Set([...wet].filter(k=>!o.has(k)));save();render();animate('lift',E.shapeFor(id,state.pieces[id].rot,state.pieces[id].flip).cells.map(([x,y])=>[at[0]+x,at[1]+y]));message(`${E.META[id].name}を、土魔法で静かに下ろしました。`);if(o.size===36)judge();}
function judge(){const result=E.evaluate(state);if(result.ok){const first=!state.passed;state.passed=true;save();render();message(first?'石盤の奥で、澄んだ音が響いた。土魔法学、合格。':'石盤は、すべての条件を満たしています。');if(first)$('success').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});return;}const messages={gaps:'まだ、くぼみに隙間が残っています。',marks:'石は収まりました。二つの刻印と、床の印を確かめてください。',neighbors:'石は収まりました。三連石に辺で接している石を確かめてください。',geometry:'石の重なりと、盤面の外を確かめてください。'};message(messages[result.code]);}
function setSpell(next){spell=next;active=null;ghost=null;render();const messages={earth:'土魔法：土や石を動かします。動かすものに触れてください。',water:'水魔法：水を出し、流します。水を注ぐ場所に触れてください。',fire:'炎魔法：燃やし、温めます。対象に触れてください。',wind:'風魔法：風を起こします。対象に触れてください。'};message(messages[next]);}
function castMagicOnStone(id){const p=state.pieces[id];if(p.at){castMagic(...p.at,id);return;}message({water:'石の表面を水が流れ、受け皿に落ちました。',fire:'石が、ほのかに温まりました。',wind:'石材棚のまわりに、そよ風が吹きました。'}[spell]);const card=cards[id];if(card){card.classList.remove('heat','gust','rinsed');void card.offsetWidth;card.classList.add(spell==='fire'?'heat':spell==='wind'?'gust':'rinsed');}}
function castMagic(x,y,hit){if(spell==='water'){clearTimeout(waterTimer);const flow=E.waterReach(state,x,y);wet=new Set(flow.map(p=>p.join(',')));if(hit){animate('rinsed',[[x,y]]);message('水は石の表面を伝い、台の受け皿へ流れ落ちました。');}else{renderBoard();message('水が、石の間を伝って広がりました。');}waterTimer=setTimeout(()=>{wet.clear();renderBoard();},6500);}else if(spell==='fire'){wet.delete(`${x},${y}`);animate('heat',[[x,y]]);message(hit?'石がほのかに温まりました。':'石盤の表面が、ほのかに温まりました。');}else if(spell==='wind'){animate('gust',[[x,y]]);message('風が、石盤の上を吹き抜けました。');}}
function renderBoard(){const o=E.occupied(state);let preview=new Set(),pm=null,valid=false;if(active&&ghost){const p=state.pieces[active],s=E.shapeFor(active,p.rot,p.flip);preview=new Set(s.cells.map(([x,y])=>`${ghost[0]+x},${ghost[1]+y}`));if(s.mark)pm=[ghost[0]+s.mark[0],ghost[1]+s.mark[1]];valid=E.fits(state,active,...ghost);}
 for(let y=0;y<6;y++)for(let x=0;x<6;x++){const b=cells[y*6+x],key=`${x},${y}`,id=o.get(key);b.className='cell';b.replaceChildren();for(const v of['--stone','--bt','--br','--bb','--bl'])b.style.removeProperty(v);const target=E.TARGETS.find(t=>t.at[0]===x&&t.at[1]===y);if(target){const m=document.createElement('span');m.className='floor-mark';m.textContent=target.glyph;m.setAttribute('aria-hidden','true');b.append(m);}
 if(id){const p=state.pieces[id],s=E.shapeFor(id,p.rot,p.flip);b.classList.add('occupied');if(id==='C')b.classList.add('base-stone');b.style.setProperty('--stone',E.META[id].color);for(const[name,dx,dy]of[['--bt',0,-1],['--br',1,0],['--bb',0,1],['--bl',-1,0]])b.style.setProperty(name,o.get(`${x+dx},${y+dy}`)===id?'0px':'3px');if(s.mark&&p.at[0]+s.mark[0]===x&&p.at[1]+s.mark[1]===y){const m=document.createElement('span');m.className='stone-mark';m.textContent=E.META[id].glyph;b.append(m);}if(id==='C'&&p.at[0]===x&&p.at[1]===y){const m=document.createElement('span');m.className='crest';m.textContent='✦';m.setAttribute('aria-hidden','true');b.append(m);}}
 if(preview.has(key)){b.classList.add('ghost');if(!valid)b.classList.add('invalid');if(pm&&pm[0]===x&&pm[1]===y){const m=document.createElement('span');m.className='ghost-mark';m.textContent=E.META[active].glyph;b.append(m);}}
 if(wet.has(key)&&!id)b.classList.add('wet');if(effect?.keys.has(key))b.classList.add(effect.type);
 b.setAttribute('aria-label',`${y+1}行${x+1}列、${id?E.META[id].name:'空所'}${target?'、床の印'+target.glyph:''}${preview.has(key)?'、配置プレビュー':''}`);
 }
 $('filledCount').textContent=`${o.size} / 36`;
}
function render(){renderBoard();for(const[id,card]of Object.entries(cards)){card.hidden=id==='C'&&!state.discovered;card.classList.toggle('selected',active===id);card.classList.toggle('on-board',Boolean(state.pieces[id].at));card.setAttribute('aria-pressed',String(active===id));card.setAttribute('aria-label',E.META[id].name+(state.pieces[id].at?'、石盤上':''));card.replaceChildren();const name=document.createElement('span');name.className='piece-name';name.textContent=E.META[id].name;card.append(miniature(id),name);}
 document.querySelectorAll('[data-spell]').forEach(b=>{const yes=b.dataset.spell===spell;b.classList.toggle('chosen',yes);b.setAttribute('aria-pressed',String(yes));});
 $('placementTools').hidden=!active;document.body.classList.toggle('holding',Boolean(active));if(active){$('selectedLabel').textContent=E.META[active].name;$('heldMini').replaceChildren(miniature(active));const valid=ghost&&E.fits(state,active,...ghost);$('cast').disabled=!valid;$('placementTools').classList.toggle('invalid',Boolean(ghost&&!valid));$('previewNote').textContent=!ghost?'石盤に触れて位置を確認':valid?'この位置に置けます':'重なり・はみ出しがあります';document.querySelectorAll('[data-nudge]').forEach(b=>b.disabled=!ghost);}
 $('undo').disabled=history.length===0;$('success').hidden=!state.passed;
}
for(let y=0;y<6;y++)for(let x=0;x<6;x++){const b=document.createElement('button');b.type='button';b.className='cell';b.dataset.x=x;b.dataset.y=y;b.addEventListener('click',()=>onCell(x,y));board.append(b);cells.push(b);}
for(const id of Object.keys(E.BASE)){const b=document.createElement('button');b.type='button';b.className='piece';b.dataset.piece=id;b.addEventListener('click',()=>pick(id));rack.append(b);cards[id]=b;}
document.querySelectorAll('[data-spell]').forEach(b=>b.addEventListener('click',()=>setSpell(b.dataset.spell)));
document.querySelectorAll('[data-nudge]').forEach(b=>b.addEventListener('click',()=>nudge(...b.dataset.nudge.split(',').map(Number))));
$('rotate').addEventListener('click',()=>turn(false));$('flip').addEventListener('click',()=>turn(true));$('cast').addEventListener('click',place);$('judge').addEventListener('click',judge);$('cancel').addEventListener('click',()=>{active=null;ghost=null;render();message('選択を閉じました。持ち上げた石は棚から選べます。');});
$('undo').addEventListener('click',()=>{if(!history.length)return;const passed=state.passed;state=history.pop();state.passed=passed||state.passed;active=null;ghost=null;wet.clear();clearTimeout(waterTimer);save();render();message('一手前の状態に戻しました。');});
$('reset').addEventListener('click',()=>$('resetDialog').showModal());$('keepPlaying').addEventListener('click',()=>$('resetDialog').close());$('confirmReset').addEventListener('click',()=>{state=E.initial();active=null;ghost=null;history=[];wet.clear();effect=null;clearTimeout(waterTimer);clearTimeout(effectTimer);spell='earth';save();render();$('resetDialog').close();message('最初の状態に戻しました。');});
document.addEventListener('keydown',e=>{if($('resetDialog').open||!active||e.ctrlKey||e.metaKey||e.altKey||e.target.matches('input,textarea,select'))return;const keys={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(keys[e.key]){e.preventDefault();nudge(...keys[e.key]);}else if(e.key.toLowerCase()==='r'){e.preventDefault();turn(false);}else if(e.key.toLowerCase()==='f'){e.preventDefault();turn(true);}else if(e.key==='Enter'&&e.target===document.body){e.preventDefault();place();}else if(e.key==='Escape'){e.preventDefault();$('cancel').click();}});
render();save();if(state.passed)message('合格の記録と、前回の石盤を読み込みました。');else if(state.moves)message('前回の石盤を読み込みました。続きから試験を受けられます。');
})();
