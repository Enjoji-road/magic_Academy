(()=>{
'use strict';
const M=window.GraduationMagic,V=window.WindRibbonModel,$=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
const Store=window.AcademyGraduationStore,params=new URLSearchParams(location.search);
const room=['hall',...M.IDS].includes(params.get('room'))?params.get('room'):'hall';
const bridge=window.parent!==window?window.parent.AcademyRevisit:null;
const pages={fire:'fire-studio.html',water:'water-insight-experiment.html',wind:'wind-ribbon-experiment.html',earth:'earth-studio.html'};
if(room!=='hall'&&bridge?.room!==room){location.replace(pages[room]+'#afterglow');return;}
document.body.classList.toggle('embedded',params.get('embedded')==='1'&&Boolean(bridge));
let state=Store.read();state.room=room;
function requireAdmission(){
 if(room!=='hall'||Store.admitted(state))return true;
 $('graduationContent').hidden=true;
 const hall=new URL('index.html#graduation-exam',location.href).href;
 // A stale embedded entry must return the whole page to the corridor.
 if(bridge?.room==='hall')window.parent.location.replace(hall);
 else location.replace(hall);
 return false;
}
if(!requireAdmission())return;
let sourceSnapshot=null;
function pullPhysical(){
 sourceSnapshot=bridge?.snapshot();
 if(room==='fire'&&sourceSnapshot?.fire)Object.assign(state.physical.fire,sourceSnapshot.fire);
 if(room==='wind'&&sourceSnapshot?.wind)Object.assign(state.physical.wind,sourceSnapshot.wind);
 if(room==='earth'&&sourceSnapshot?.earth)state.physical.earth.lifted=sourceSnapshot.earth.lifted;
}
pullPhysical();
let audio,lastFocus=null;
const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');
const live=()=>M.settle(M.circuit(state));
function save(options={}){
 const result=Store.saveRoom(state,options);state=result.state;state.room=room;
 $('saveStatus').textContent=result.ok?'卒業試験の観測・自由メモを自動保存しました。':'保存できません。ページを閉じる前に必要なメモを控えてください。';
}
function say(s){$('status').textContent=s;}
function sound(kind){window.AcademySFX?.play(({fire:'ignite',earth:'stone'})[kind]||kind);}
function node(tag,attrs={},text){const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;}
function svgBase(){const s=node('svg',{viewBox:'0 0 900 490',role:'img','aria-label':'装置と魔法の観測図'});s.append(node('rect',{width:900,height:490,fill:'#102632'}));for(let y=65;y<490;y+=75){s.append(node('path',{d:`M0 ${y}H900`,stroke:'#78909b20'}));for(let x=(y%2)*90;x<900;x+=180)s.append(node('path',{d:`M${x} ${y}v75`,stroke:'#78909b20'}));}return s;}
function text(s,x,y,t,size=16,fill='#c2d1d0'){s.append(node('text',{x,y,'font-size':size,fill,'text-anchor':'middle','font-family':'system-ui,sans-serif'},t));}
function path(s,d,color,width=2,extra={}){s.append(node('path',{d,stroke:color,'stroke-width':width,fill:'none',...extra}));}
function lamp(s,x,y,lit=true,scale=1,mine=false){const g=node('g',{transform:`translate(${x} ${y}) scale(${scale})`});g.append(node('path',{d:'M-42 40V-60Q-42-113 0-138Q42-113 42-60V40Z',fill:'#26414b',stroke:'#b5a777','stroke-width':2}));g.append(node('path',{d:'M-25 29V-51Q-25-90 0-109Q25-90 25-51V29',fill:'#112b37',stroke:'#758a8b'}));if(lit){const gl=node('g',{class:'glow'});gl.append(node('ellipse',{cx:0,cy:-42,rx:12,ry:25,fill:mine?'#fff1bd':'#e6d6ac'}));for(let i=0;i<4;i++){const color=M.META[M.IDS[i]].color;gl.append(node('path',{d:`M${-20+i*7} 20 Q${-40+i*6} ${-55-i*10} ${12-i*5} ${-72+i*4} Q${46-i*6} ${-28+i*6} ${20-i*7} 20`,stroke:color,fill:'none','stroke-width':1.4}));}g.append(gl);}g.append(node('rect',{x:-34,y:34,width:68,height:13,rx:3,fill:'#8b9b91',stroke:'#c7d3c2'}));s.append(g);}
function hallScene(){const s=svgBase();path(s,'M86 430V110Q86 35 166 15Q246 35 246 110V430M654 430V110Q654 35 734 15Q814 35 814 110V430','#4c6a754d',6);path(s,'M300 399V92Q300 3 450-55Q600 3 600 92V399','#72929a40',9);path(s,'M0 433H900M290 490L365 433M610 490L535 433','#80908b50');for(const[x,label]of[[148,'第百七十四期'],[450,'第百七十五期'],[752,'第百七十六期']]){lamp(s,x,258,true,.88);text(s,x,324,label,15);text(s,x,348,'封緘済 · 次の七夜へ',11,'#8fa6ac');}const a=live(),on=a.fire&&M.circuit(state).charge>0;lamp(s,450,421,on,.6,true);text(s,450,474,M.isClosed(M.circuit(state))?'あなたが残した光':on?'あなたが支えている光':M.circuit(state).nodes.fire.exists?'あなたの灯座 · 補給待ち':'空の灯座',14,on?'#ead7a5':'#a7bcbe');if(M.isClosed(M.circuit(state)))text(s,450,96,'手の支えは、もうありません。',16,'#ead7a5');return s;}
function actualImage(s,x=280,y=22,w=590,h=330){
 if(sourceSnapshot?.art)s.append(node('image',{href:sourceSnapshot.art,x,y,width:w,height:h,preserveAspectRatio:'xMidYMid meet'}));
}
function fireScene(){
 const s=svgBase(),a=live();actualImage(s);
 lamp(s,150,350,state.physical.fire.lit,.65);text(s,150,411,'灯具のそば · 近接',14);
 if(a.fire){path(s,'M147 256Q191 178 250 243T365 300','#efb37b',3,{class:'spell-flow'});text(s,228,174,'灯の余韻',15,'#efb37b');}
 if(a.water&&M.circuit(state).nodes.water.from==='fire'){
  s.append(node('ellipse',{cx:553,cy:396,rx:167,ry:43,fill:'#78c1cf24',stroke:'#9ddae5','stroke-width':2}));
  if(sourceSnapshot?.projection)s.append(node('image',{href:sourceSnapshot.projection,x:435,y:353,width:236,height:83}));
  text(s,551,464,'灯を受けた映り · 水は灯具にかけていない',14,'#b5e5e6');
 }return s;
}
function waterScene(){
 const s=svgBase(),a=live();actualImage(s,275,5,610,405);
 s.append(node('ellipse',{cx:143,cy:342,rx:83,ry:24,fill:'#536f7e',stroke:'#c5d2c2'}));
 s.append(node('ellipse',{cx:143,cy:336,rx:71,ry:17,fill:'#6d9ca8',stroke:'#b5d0ce'}));text(s,143,395,'外の水盤 · 近接',14);
 if(a.water){path(s,'M85 336Q143 307 201 336M100 344Q143 322 188 344','#bfebed',2);text(s,143,303,'映り',15,'#b8e4e7');}
 if(a.wind&&M.circuit(state).nodes.wind.from==='water'){
  path(s,'M133 312C60 214 210 220 167 140C135 101 94 144 128 169C200 220 267 173 238 131','#d6e9e6',3,{class:'spell-flow'});
  text(s,190,88,'巡る像',17,'#d3e5df');text(s,450,462,'像が巡っても、実際の水は水盤に残っている',15,'#d3e5df');
 }else text(s,450,462,'封印瓶と計量鐘は、同じ実験状態のまま',15);return s;
}
function windScene(){const s=svgBase(),p=state.physical.wind,a=live();const P=(u,v)=>{const q=V.project(V.point(u,v,p.blown?(p.wind||'right'):'still',0),p.view);return[450+q[0]*.67,340+q[1]*.67,q[2]];};const tiles=[];for(let i=0;i<160;i++){const ps=[P(i/160,-1),P((i+1)/160,-1),P((i+1)/160,1),P(i/160,1)];tiles.push({depth:ps.reduce((n,q)=>n+q[2],0)/4,i,ps});}tiles.sort((x,y)=>x.depth-y.depth);for(const t of tiles){const d=t.ps.map(q=>q.slice(0,2).join(',')).join(' ');s.append(node('polygon',{points:d,fill:t.i<80?'#bbc9c4':'#7f9aa2',stroke:'#859da1','stroke-width':.6}));}
for(const edge of[-1,1]){let d='';for(let k=0;k<=200;k++){const q=P(k/200,edge);d+=(k?'L':'M')+q[0]+' '+q[1];}path(s,d,'#e8edd7',2);if(a.wind)path(s,d,a.earth&&M.circuit(state).nodes.earth.from==='wind'?'#c3d5a8':'#b4e5e6',a.earth&&M.circuit(state).nodes.earth.from==='wind'?4:2.3,{class:'spell-flow','stroke-dasharray':'7 8'});}
const task=V.D.task;const x=P((task.from+task.to)/2/V.N,0);text(s,x[0],x[1]+5,'課題の布',16,'#263e46');text(s,450,44,'同じ一枚の布 · 切断・貼り足しなし',15);path(s,'M105 440H795','#9caaa2',9);for(const x of[299,601])path(s,`M${x} 197v-33`,'#c5cfbf',5);if(a.wind){const edge=p.phase===1?-1:1,q=P(V.D.start.station/V.N,edge);s.append(node('circle',{cx:q[0],cy:q[1],r:7,fill:'#f7ebbd',stroke:'#fff'}));text(s,450,390,['始点：星側の縁','中央を一周：反対側の縁','中央を二周：同じ始点'][p.phase],15,'#ecdfac');}if(a.earth&&M.circuit(state).nodes.earth.from==='wind')text(s,450,464,'石が受け取った形は、同じ一本の縁全体',15,'#d4ddb9');return s;}
function earthScene(){
 const s=svgBase(),p=state.physical.earth,a=live(),view=sourceSnapshot?.earth;
 const colors={A:'#889a91',B:'#ad9770',C:'#4e6b73',D:'#829177',E:'#8e7c90',F:'#8e9da0',G:'#a57a65',H:'#698f98',I:'#9c986d'};
 const grid=view?.grid||Array.from({length:6},()=>Array(6).fill('')),x0=291,y0=69,sz=54;
 for(let y=0;y<6;y++)for(let x=0;x<6;x++){
  const id=grid[y][x];s.append(node('rect',{x:x0+x*sz,y:y0+y*sz,width:52,height:52,rx:3,fill:id?colors[id]:'#122b37',stroke:'#c1c6ad66'}));
  if(id)text(s,x0+x*sz+26,y0+y*sz+33,id,16,'#162b33');
 }for(const mark of view?.marks||[])text(s,x0+(mark.at[0]+.5)*sz,y0+(mark.at[1]+.5)*sz+7,mark.glyph,20,'#e5e0c7');
 if(p.lifted){s.append(node('rect',{x:96,y:154,width:103,height:103,rx:5,fill:colors.C,stroke:'#c6d7bd','stroke-width':3}));text(s,148,215,'C',30);text(s,147,299,'土が持ち上げた石',14);}
 if(a.earth){path(s,'M100 355h100v100H100Z','#c3d5a8',2,{'stroke-dasharray':'5 6'});text(s,150,479,'動かす術の輪郭',14,'#c3d5a8');}
 if(a.fire&&M.circuit(state).nodes.fire.from==='earth'){
  s.append(node('rect',{x:105,y:360,width:90,height:90,fill:'#f5dca729',stroke:'#f1c881','stroke-width':3,class:'glow'}));text(s,512,435,'石は燃えず、術の輪郭が灯る',15,'#f1c881');
 }else text(s,514,435,'現在の九石 · 別の配置問題ではない',15);return s;
}
const drawers={hall:hallScene,fire:fireScene,water:waterScene,wind:windScene,earth:earthScene};
function controls(){
 const box=$('deviceControls');box.replaceChildren();
 const add=(label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',()=>{fn();renderDevice();save();});box.append(b);};
 if(room==='wind')add('風の尾を中央一周ぶん追う',()=>{state.physical.wind.phase=(state.physical.wind.phase+1)%3;say(['同じ始点から見直せます。','尾は反対側の縁へ続きました。','二度、中央を回ると同じ場所へ戻りました。'][state.physical.wind.phase]);});
 if(room!=='hall')add('通常の装置を見直す',()=>bridge.close());
}
function renderDevice(){const s=drawers[state.room]();$('apparatus').replaceChildren(s);}
function renderTraces(){const c=M.circuit(state),a=live(),traces=$('traces');traces.replaceChildren();for(const id of M.IDS){const n=c.nodes[id],b=document.createElement('button');b.type='button';b.className='trace'+(!n.exists?' empty':a[id]?'':' dormant');b.dataset.target=id;b.style.setProperty('--trace',M.META[id].color);b.disabled=!n.exists;b.setAttribute('aria-label',`${M.META[id].name}の働き「${M.META[id].result}」を対象にする${n.exists?'':'・まだない'}`);const title=document.createElement('strong');title.textContent=M.META[id].result;const label=document.createElement('small');label.textContent=!n.exists?'まだ、この術はない':(a[id]?'現れている':'薄れている')+' · '+(n.from?M.META[n.from].result+'へ触れている':'手から');b.append(title,label);if(n.manual){const h=document.createElement('span');h.className='hand';h.textContent='手';b.append(h);}b.addEventListener('click',()=>castTrace(id));traces.append(b);}
 const lines=$('threads');lines.replaceChildren();const coords={fire:[160,74],water:[500,74],wind:[160,235],earth:[500,235]};for(const id of M.IDS){const n=c.nodes[id];if(!n.exists||!n.from)continue;const p=coords[n.from],q=coords[id];if(id===n.from){path(lines,`M${q[0]-45} ${q[1]}C${q[0]-110} ${q[1]-85} ${q[0]+110} ${q[1]-85} ${q[0]+45} ${q[1]}`,M.META[id].color,2,{class:'thread'});}else{const mid=[(p[0]+q[0])/2,(p[1]+q[1])/2+(p[1]===q[1]?p[1]<150?43:-43:0)];path(lines,`M${p[0]} ${p[1]}Q${mid[0]} ${mid[1]} ${q[0]} ${q[1]}`,M.META[id].color,2,{class:'thread'});}}
 const n=c.nodes[state.spell];$('selectedSupport').disabled=!n.exists;$('selectedSupport').textContent='選んだ術の支えを'+(n.manual?'離す':'戻す');const hands=M.IDS.filter(x=>c.nodes[x].manual).length;$('handState').textContent=hands?'手で支えている：'+hands:'手の支え：なし';
}
function render(){if(!requireAdmission())return;pullPhysical();window.GraduationPresentation.setAvailable(state.graduated);const room=M.ROOMS[state.room];document.querySelectorAll('[data-room]').forEach(b=>{if(b.dataset.room===state.room)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});document.querySelectorAll('[data-spell]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.spell===state.spell)));document.body.classList.toggle('reduced',state.reduced||media?.matches);$('sound').textContent='効果音・設定';$('reduced').checked=state.reduced;
 $('pageKicker').textContent=room?'ARCANE ACADEMY · AFTERGLOW':'ARCANE ACADEMY · GRADUATION';$('pageTitle').textContent=room?room.name+' · 術の余韻':'手を離した、その先に';document.title='魔法学校｜'+(room?room.name+'・術の余韻':'卒業試験・手を離した、その先に');
 $('roomKicker').textContent=room?'再考察 · '+M.META[room.native].name+'魔法学':'最終卒業試験';$('taskTitle').textContent=room?room.question:'次に来る誰かのために';$('taskText').textContent=room?room.lead:'この回廊に、あなたが手を離しても灯る光を一つ残しなさい。';$('taskAside').textContent=room?'装置へ使うときと、目に見える術の働きへ触れるときを、比べてください。':'既にある灯りを消す必要はありません。灯座の魔力は院務員が七夜ごとに補給します。';$('sceneKicker').textContent=room?'REVISIT / '+M.META[state.room].name.toUpperCase():'ENTRANCE HALL';$('sceneTitle').textContent=room?room.title:'あなたを迎えた光';$('deviceCaption').textContent=room?room.result+'も、観測できます。':'先輩たちの灯りの下に、一つだけ空いた灯座がある。灯座の魔力：'+M.circuit(state).charge+' / 8 夜分。';$('castObject').textContent=(room?room.object:'空の灯座')+'へ使う';$('inspect').textContent=room?'装置の状態を確かめる':'灯りをよく見る';$('castInstruction').textContent=M.META[state.spell].name+'の魔法を選択中。装置、または現れている働きに触れられます。';controls();renderDevice();renderTraces();$('graduation').hidden=!state.graduated||state.room!=='hall';$('chargeReadout').textContent='回廊の灯座：'+state.circuits.hall.charge+' / 8 夜分。補給は炎の魔法で行い、同じ結び方を保ちます。';renderRecords();
 const allowed=state.room!=='hall'||Store.admitted(state);
 $('admissionNotice').hidden=allowed;
 if(!allowed)$('admissionNotice').textContent='四科目を修了すると、あなたの灯座を使えます。今は、回廊の灯りを近くから眺められます。合格 '+Store.progress().passed+' / 4 科目。';
 for(const id of ['castObject','selectedSupport','release','hold'])if(!allowed)$(id).disabled=true;else if(id!=='selectedSupport')$(id).disabled=false;
 if(!allowed)document.querySelectorAll('[data-target]').forEach(b=>b.disabled=true);
 $('sourceNote').textContent=state.room==='hall'?'上の扉は、実際の四つの教室へ通じています。どの順番でも、観測を見直せます。':'装置への操作は、同じ教室の通常の装置に届きます。余韻へ触れても、試験の観測値と合格記録は変わりません。';
 if(!allowed)$('taskText').textContent='四つの教室で学び、修了したら最後の課題へ。';
 $('graduationContent').hidden=false;
}
function snapshot(){const c=M.circuit(state),a=live();return(state.room==='hall'?'回廊':M.META[state.room].name+'室')+'：'+M.IDS.filter(id=>c.nodes[id].exists).map(id=>M.META[id].result+'['+(a[id]?'残る':'薄れる')+' / '+(c.nodes[id].manual?'手':c.nodes[id].from?M.META[c.nodes[id].from].result:'支えなし')+']').join('、');}
function record(auto=false){const text=snapshot();if(state.records.at(-1)!==text)state.records.push(text);state.records=state.records.slice(-60);renderRecords();save();if(!auto)say('いま見えている状態を観測記録へ残しました。');}
function renderRecords(){$('recordCount').textContent=String(state.records.length);const box=$('records');box.replaceChildren();for(const str of [...state.records].reverse()){const li=document.createElement('li');li.textContent=str;box.append(li);}}
function checkGraduation(){
 if(state.room==='hall'&&Store.admitted(state)&&M.isClosed(M.circuit(state))&&!state.graduated){
  state.graduated=true;
  sound('pass');
  $('graduation').hidden=false;
  say('手を離しても、四つの働きが残っています。空だった灯座に、あなたの光が灯りました。');
  window.GraduationPresentation.setAvailable(true);
  window.GraduationPresentation.celebrate($('apparatus').firstElementChild);
  return true;
 }
 return false;
}
function castTrace(target){if(room==='hall'&&!Store.admitted(state))return;const c=M.circuit(state);if(!c.nodes[target].exists)return;M.cast(c,state.spell,target);sound(state.spell);render();say(M.META[state.spell].name+'の術を「'+M.META[target].result+'」へ触れさせました。今は、自分の手でも支えています。');save();}
function castObject(){if(room==='hall'&&!Store.admitted(state))return;const spell=state.spell;if(bridge&&room!=='hall')bridge.cast(spell);pullPhysical();const c=M.circuit(state);M.cast(c,spell,null);if(state.room==='fire'){if(spell==='water'||spell==='wind'){if(c.nodes.fire.from===null){c.nodes.fire.exists=false;c.nodes.fire.manual=false;}}}if(room==='hall')sound(spell);render();const lines={hall:{fire:'手の炎で灯座が明るくなりました。手を離したら、どうなるでしょう。',water:'灯座に、水の映りが生まれました。今は自分の手が支えています。',wind:'灯座の上を、風の尾が巡ります。今は自分の手が支えています。',earth:'灯座に、土の術の輪郭が現れました。今は自分の手が支えています。'},fire:{fire:'灯具が灯り、元の投影条件で壁の像が現れました。',water:'灯具へ水を使うと、炎が消えました。触れた先は光ではなく、灯具です。',wind:'灯具へ吹く風が炎を消しました。札は動いていません。',earth:'足元の石が少し動きました。札や光源の座標は変わりません。'},water:{water:'外水盤に水を注ぎました。封印瓶と計量鐘には流れ込みません。水盤に淡い映りが残ります。',wind:'外側の布が揺れました。水滴は水盤にあり、瓶内の圧力は変わりません。',earth:'石の受け皿が動きました。封印瓶の高さや配管は変わりません。',fire:'外周だけが温まりました。密閉気体は加熱していません。'},wind:{wind:'布がなびき、銀縁をたどる尾が見えます。課題の布も同じ縁に含まれます。',earth:'窓台の石が動きました。布は切れず、つながりも変わりません。',water:'窓辺の水鉢に水を注ぎました。記念帯へ水はかけていません。',fire:'留め具のそばが明るくなりました。布を焼いてはいません。'},earth:{earth:state.physical.earth.lifted?'C石を持ち上げました。石を動かす術の輪郭が見えます。':'C石を元の同じ場所へ戻しました。九石の解答は変わりません。',water:'石の表面が濡れました。石の配置を変える作用はありません。',wind:'石の上の埃が舞いました。石の配置は変わりません。',fire:'石が温まりました。石自体が燃えるわけではありません。'}};say(lines[state.room][spell]);save();}
function openDialog(id){lastFocus=document.activeElement;const d=$(id);if(d.showModal)d.showModal();else d.setAttribute('open','');}
document.querySelectorAll('[data-spell]').forEach(b=>b.addEventListener('click',()=>{state.spell=b.dataset.spell;render();save();}));
$('castObject').addEventListener('click',castObject);$('selectedSupport').addEventListener('click',()=>{M.support(M.circuit(state),state.spell);render();const a=live(),n=M.circuit(state).nodes[state.spell];say(M.META[state.spell].name+'の術の手の支えを'+(n.manual?'戻しました。':a[state.spell]?'離しました。働きは残っています。':'離しました。その働きは薄れました。'));checkGraduation();record(true);save();});
$('release').addEventListener('click',()=>{M.release(M.circuit(state));render();const remaining=M.IDS.filter(id=>live()[id]).map(id=>M.META[id].result);say(remaining.length?'手を離しました。残っている働き：'+remaining.join('、')+'。':'手を離すと、働きはすべて薄れました。もう一度支えて、触れる先を変えて比べられます。');checkGraduation();record(true);save();});$('hold').addEventListener('click',()=>{M.hold(M.circuit(state));render();say('同じ結び方のまま、現れていた術をもう一度自分の手で支えました。');save();});
$('record').addEventListener('click',()=>record());$('notes').value=state.notes;$('notes').addEventListener('input',()=>{state.notes=$('notes').value.slice(0,8000);save({notes:true});});$('reduced').addEventListener('change',()=>{state.reduced=$('reduced').checked;render();save({settings:true});});media?.addEventListener?.('change',render);$('settings').addEventListener('click',()=>openDialog('settingsDialog'));
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>{const d=$(b.dataset.close);if(d.close)d.close();else d.removeAttribute('open');lastFocus?.focus();}));
$('resetRoom').addEventListener('click',()=>{
 if(!confirm('この場所の術の余韻だけを最初に戻します。通常試験・自由メモ・卒業記録は残ります。'))return;
 state.circuits[room]=M.initialCircuit();$('nextArrival').hidden=true;render();say('術の余韻を最初に戻しました。通常の装置は、そのままです。');save();
});
$('resetAll').addEventListener('click',()=>{
 if(!confirm('卒業試験の観測・自由メモ・卒業記録をすべて消しますか？ 四科目の合格・メモは残ります。'))return;
 state=M.initial();state.room=room;Store.write(state);$('notes').value='';$('nextArrival').hidden=true;$('settingsDialog').close();render();say('卒業試験の記録を最初に戻しました。');
});
$('zoom').addEventListener('click',()=>{$('zoomTitle').textContent=(state.room==='hall'?'回廊':M.ROOMS[state.room].title)+'・拡大';$('zoomContent').replaceChildren(drawers[state.room]());openDialog('zoomDialog');});
$('inspect').addEventListener('click',()=>{$('inspectTitle').textContent=state.room==='hall'?'先輩の灯りを、近くから':'装置と術の状態';const box=$('inspectContent');box.replaceChildren();if(state.room==='hall'){const s=svgBase();lamp(s,450,377,true,2);box.append(s);const p=document.createElement('p');p.textContent='薄い透明の封緘の内側に、灯・映・巡・形と同じ四つの色。術者の手へ伸びる尾はありません。灯座には、かつて学んだ生徒の期印が刻まれています。';box.append(p);const q=document.createElement('p');q.textContent='院務記録：灯座は七夜ごとに炎の魔力を補給。卒業生の術をほどかず、同じ形のまま光を保ちます。無限の燃料ではありません。';box.append(q);}else{box.append(drawers[state.room]());const p=document.createElement('p');p.textContent=snapshot();box.append(p);const q=document.createElement('p');q.textContent=state.room==='wind'?'術の尾は、同じ一枚の織布の銀縁を巡っています。課題の部分も、同じ縁に含まれます。':state.room==='water'?'再考察は外水盤の魔法の像が対象です。封印瓶の圧力・気体量・初期水量を変更する機能はありません。':'目の前の物と、それを動かす術の尾を見比べられます。通常試験の条件は変わりません。';box.append(q);}openDialog('inspectDialog');});
const hints=['装置へ使ったときと、目に見える魔法の働きへ触れたときを比べてみよう。','一つだけ手の支えを離すと、何がその術を支えられるのか、比べやすい。教室ごとの得意な術から試してみよう。','四つを順番に使っても、最後まで自分の手が支えていたら残せない。ある術の働きを、別の術の支えにできないだろうか。'];document.querySelectorAll('[data-hint]').forEach(b=>b.addEventListener('click',()=>{$('hintText').textContent=hints[Number(b.dataset.hint)-1];}));$('arrival').addEventListener('click',()=>{$('nextArrival').hidden=false;sound('water');});
$('focusBench').addEventListener('click',()=>{const on=document.body.classList.toggle('focus-bench');$('focusBench').textContent=on?'通常表示へ':'観測に集中';$('focusBench').setAttribute('aria-pressed',String(on));if(on)$('focusBench').focus();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]')){document.body.classList.remove('focus-bench');$('focusBench').textContent='観測に集中';$('focusBench').setAttribute('aria-pressed','false');}});
$('night').addEventListener('click',()=>{M.night(state.circuits.hall);render();say('回廊の灯座の魔力：'+state.circuits.hall.charge+' / 8 夜分。形と結び方は残ります。');save();});
window.addEventListener('storage',event=>{
 if(event.key===M.KEY){state=Store.read();state.room=room;$('notes').value=state.notes;}
 render();
});
window.addEventListener('academy-observation-open',()=>{
 state=Store.read();state.room=room;$('notes').value=state.notes;render();
});
render();
})();
