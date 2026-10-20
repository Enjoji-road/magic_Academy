/* DOM-level event smoke tests, not a browser or a layout test. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const E=require('../engine.js'),design=JSON.parse(fs.readFileSync('research/design.json','utf8'));
let checks=0;function ok(fn){fn();checks++;}
class Classes{constructor(el){this.el=el;}list(){return this.el.className.split(/\s+/).filter(Boolean);}contains(k){return this.list().includes(k);}add(...ks){this.el.className=[...new Set([...this.list(),...ks])].join(' ');}remove(...ks){this.el.className=this.list().filter(k=>!ks.includes(k)).join(' ');}toggle(k,yes){if(yes===undefined)yes=!this.contains(k);yes?this.add(k):this.remove(k);return yes;}}
class Element{constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attrs={};this.handlers={};this.className='';this.hidden=false;this.disabled=false;this.open=false;this.textContent='';this.classList=new Classes(this);this.style={setProperty:(k,v)=>this.attrs['style:'+k]=v,removeProperty:k=>delete this.attrs['style:'+k]};}
 append(...els){for(const el of els){this.children.push(el);if(el instanceof Element)el.parent=this;}}replaceChildren(...els){this.children=[];this.append(...els);}setAttribute(k,v){this.attrs[k]=String(v);if(k==='class')this.className=String(v);}getAttribute(k){return this.attrs[k]??null;}addEventListener(k,fn){(this.handlers[k]??=[]).push(fn);}click(){if(this.disabled||this.hidden)return;this.emit('click');}emit(type,extra={}){const e={target:this,preventDefault(){},...extra};for(const fn of this.handlers[type]||[])fn(e);}matches(sel){return sel.split(',').some(v=>v===this.tagName.toLowerCase());}showModal(){this.open=true;}close(){this.open=false;}scrollIntoView(){}get offsetWidth(){return 10;}}
function setup(storage={},broken=false){
 const ids={},all=[];const html=fs.readFileSync('index.html','utf8');
 for(const m of html.matchAll(/<([a-z][a-z0-9]*)\b([^>]*)>/gi)){const attr=m[2];if(!/id=|data-spell=|data-nudge=/.test(attr))continue;const el=new Element(m[1]);all.push(el);for(const a of attr.matchAll(/([\w-]+)="([^"]*)"/g)){if(a[1]==='id'){el.id=a[2];ids[el.id]=el;}else if(a[1].startsWith('data-'))el.dataset[a[1].slice(5)]=a[2];else el.setAttribute(a[1],a[2]);}el.hidden=/\bhidden\b/.test(attr);el.disabled=/\bdisabled\b/.test(attr);}
 const body=new Element('body'),handlers={};const document={body,activeElement:body,getElementById:id=>ids[id],createElement:tag=>new Element(tag),querySelectorAll:sel=>{const match=sel.match(/^\[data-(.*)\]$/);if(!match)throw Error('Unsupported selector '+sel);return all.filter(v=>v.dataset[match[1]]!==undefined);},addEventListener:(k,f)=>(handlers[k]??=[]).push(f)};
 const localStorage={getItem:k=>{if(broken)throw Error('denied');return storage[k]??null;},setItem:(k,v)=>{if(broken)throw Error('denied');storage[k]=v;}};
 const context={window:null,globalThis:null,document,localStorage,setTimeout:()=>1,clearTimeout(){},matchMedia:()=>({matches:true}),Map,Set,JSON,Math,Number,String,Boolean,Object,Array};context.window=context;context.globalThis=context;vm.createContext(context);vm.runInContext(fs.readFileSync('engine.js','utf8'),context);vm.runInContext(fs.readFileSync('app.js','utf8'),context);
 return{ids,all,storage,document,state:()=>JSON.parse(storage['magic-academy-earth-v2']),cell:(x,y)=>ids.board.children[y*6+x],piece:id=>ids.rack.children.find(v=>v.dataset.piece===id),spell:s=>all.find(v=>v.dataset.spell===s),nudge:(x,y)=>all.find(v=>v.dataset.nudge===`${x},${y}`)};
}
function orient(id,p){for(const flip of[false,true])for(let rot=0;rot<4;rot++){const s=E.shapeFor(id,rot,flip);if(s.cells.map(v=>v.join(',')).sort().join(';')!==p.orientation.map(v=>v.join(',')).sort().join(';'))continue;const t=E.TARGETS.find(v=>v.id===id);if(t&&(s.mark[0]+p.x!==t.at[0]||s.mark[1]+p.y!==t.at[1]))continue;return{rot,flip};}throw Error(id);}
let app=setup();
ok(()=>assert.equal(app.ids.board.children.length,36));ok(()=>assert.equal(app.piece('C').hidden,true));ok(()=>assert.equal(app.state().pieces.C.at[0],2));
const before=JSON.stringify(app.state());for(const spell of['water','fire','wind']){app.spell(spell).click();app.cell(2,2).click();ok(()=>assert.equal(JSON.stringify(app.state()),before));}app.spell('earth').click();
app.cell(2,2).click();ok(()=>assert.equal(app.state().pieces.C.at,null));ok(()=>assert.equal(app.piece('C').hidden,false));ok(()=>assert.equal(app.ids.placementTools.hidden,false));app.ids.undo.click();ok(()=>assert.deepEqual(app.state().pieces.C.at,[2,2]));
// Play the entire solution through click, preview, nudge, rotation and commit handlers.
for(const id of['C',...Object.keys(design.base).filter(v=>v!=='C')]){
 const p=design.solution[id],v=orient(id,p);if(id==='C')app.cell(2,2).click();else app.piece(id).click();if(v.flip)app.ids.flip.click();for(let r=0;r<v.rot;r++)app.ids.rotate.click();
 const click=p.cells[Math.floor(p.cells.length/2)];app.cell(...click).click();
 let ghosts=app.ids.board.children.filter(v=>v.classList.contains('ghost'));let gx=Math.min(...ghosts.map(v=>Number(v.dataset.x))),gy=Math.min(...ghosts.map(v=>Number(v.dataset.y)));
 for(let i=0;i<Math.abs(p.x-gx);i++)app.nudge(Math.sign(p.x-gx),0).click();for(let i=0;i<Math.abs(p.y-gy);i++)app.nudge(0,Math.sign(p.y-gy)).click();
 ok(()=>assert.equal(app.ids.cast.disabled,false,'cast enabled '+id));
 const placedBefore=app.state().pieces[id].at;ok(()=>assert.equal(placedBefore,null,'preview never places '+id));app.ids.cast.click();ok(()=>assert.deepEqual(app.state().pieces[id].at,[p.x,p.y],id));
}
ok(()=>assert.equal(app.state().passed,true));ok(()=>assert.equal(E.evaluate(app.state()).ok,true));ok(()=>assert.equal(app.ids.success.hidden,false));
const markedCells=app.ids.board.children.filter(c=>c.children.some(v=>v.className==='stone-mark'));ok(()=>assert.equal(markedCells.length,2));
// Reload and retain achievement while experimenting / undoing.
app=setup(app.storage);ok(()=>assert.equal(app.state().passed,true));app.cell(0,3).click();ok(()=>assert.equal(app.state().passed,true));ok(()=>assert.equal(app.state().pieces.C.at,null));app.ids.undo.click();ok(()=>assert.equal(E.evaluate(app.state()).ok,true));
// Failed placement remains a preview and does not overwrite other stones.
app.cell(0,3).click();app.cell(0,0).click();for(let i=0;i<8;i++)app.nudge(-1,0).click();const invalidState=JSON.stringify(app.state());ok(()=>assert.equal(app.ids.cast.disabled,true));app.ids.cast.click();ok(()=>assert.equal(JSON.stringify(app.state()),invalidState));
app.ids.reset.click();ok(()=>assert.equal(app.ids.resetDialog.open,true));app.ids.keepPlaying.click();ok(()=>assert.equal(JSON.stringify(app.state()),invalidState));app.ids.reset.click();app.ids.confirmReset.click();ok(()=>assert.equal(app.state().passed,false));ok(()=>assert.deepEqual(app.state(),E.initial()));
const bad=setup({'magic-academy-earth-v2':'{broken'});ok(()=>assert.deepEqual(bad.state(),E.initial()));const blocked=setup({},true);ok(()=>assert(blocked.ids.saveStatus.textContent.includes('利用できません')));
console.log(JSON.stringify({interaction_checks:checks,passed:true,scope:'Synthetic DOM events; not browser rendering or real device testing.'}));
