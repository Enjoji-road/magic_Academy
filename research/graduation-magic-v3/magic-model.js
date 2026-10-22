/* Research only. New fictional rules; never reads or writes an official exam. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GraduationMagic=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION=3,KEY='magic-academy-graduation-magic-v3-research-1';
const IDS=['fire','water','wind','earth'];
// A recipient can take over support from this one kind of RESULT, not material.
const TAKES={fire:'earth',water:'fire',wind:'water',earth:'wind'};
const META={
 fire:{name:'炎',result:'灯',color:'#efb37b',mark:'焔'},
 water:{name:'水',result:'映',color:'#9ddae5',mark:'滴'},
 wind:{name:'風',result:'巡',color:'#d6e9e6',mark:'羽'},
 earth:{name:'土',result:'形',color:'#c3d5a8',mark:'石'}
};
const ROOMS={
 fire:{name:'灯火観測室',title:'灯樹の原像',native:'fire',revisit:'water',object:'灯具と金属札',result:'投影光の余韻',lead:'灯具へ触れると、いつもの作用。光のまわりにも、ごく細い術の尾が見える。',question:'光を映しているのは、水そのものだろうか。'},
 water:{name:'水盤室',title:'水の届かない部屋',native:'water',revisit:'wind',object:'封印瓶と外水盤',result:'水盤に残る映り',lead:'瓶は封印されたまま。外の水盤だけが、注いだ水の形を映している。',question:'風が運ぶものは、水滴だけだろうか。'},
 wind:{name:'高塔観測室',title:'風に綴じられた言葉',native:'wind',revisit:'earth',object:'一枚の織布と窓台',result:'銀縁を巡る風の尾',lead:'ひねられた布と、平らな課題の部分。風の尾が銀糸に沿って巡っている。',question:'石に留められるのは、布の形だけだろうか。'},
 earth:{name:'封印石盤室',title:'第一の石盤',native:'earth',revisit:'fire',object:'九石と空いた輪郭',result:'動かした石の術の輪郭',lead:'九石の配置は変えない。校章の石を持ち上げると、動かす術の輪郭が見える。',question:'炎が灯せるのは、燃える物だけだろうか。'}
};
const clone=v=>JSON.parse(JSON.stringify(v));
function initialCircuit(){return{nodes:Object.fromEntries(IDS.map(id=>[id,{exists:false,manual:false,from:null}])),charge:0};}
function initial(){return{version:VERSION,room:'hall',spell:'fire',circuits:Object.fromEntries(['hall',...IDS].map(id=>[id,initialCircuit()])),physical:{fire:{lit:false,view:0},water:{water:2730,open:false},wind:{blown:false,view:'front',phase:0},earth:{lifted:false}},notes:'',records:[],sfx:false,reduced:false,graduated:false};}
function circuit(s){return s.circuits[s.room];}
// Greatest fixed point: already excited loops keep a finite deposited charge.
// Starting from all existing nodes also permits a held spell to establish a loop.
// No visit history, action order, timer, random roll or secret success flag.
function settle(c){
 let live=Object.fromEntries(IDS.map(id=>[id,c.nodes[id].exists]));
 for(let n=0;n<=IDS.length;n++){
  const next=Object.fromEntries(IDS.map(id=>{const p=c.nodes[id];return[id,Boolean(p.exists&&(p.manual||(p.from===TAKES[id]&&live[p.from])))];}));
  if(IDS.every(id=>next[id]===live[id]))return next;
  live=next;
 }
 throw Error('Support propagation did not converge');
}
function isClosed(c){const live=settle(c);return c.charge>0&&IDS.every(id=>c.nodes[id].exists&&!c.nodes[id].manual&&live[id]);}
function cast(c,spell,target){
 if(!IDS.includes(spell))return false;
 const node=c.nodes[spell];node.exists=true;node.manual=true;
 node.from=IDS.includes(target)&&c.nodes[target].exists?target:null;
 if(spell==='fire')c.charge=8;
 return true;
}
function support(c,spell){const p=c.nodes[spell];if(!p?.exists)return false;p.manual=!p.manual;return true;}
function release(c){for(const id of IDS)c.nodes[id].manual=false;return settle(c);}
function hold(c){for(const id of IDS)if(c.nodes[id].exists)c.nodes[id].manual=true;return settle(c);}
function night(c){if(c.charge>0&&settle(c).fire)c.charge--;return c.charge;}
function restore(raw){
 let d;try{d=typeof raw==='string'?JSON.parse(raw):raw;}catch{return initial();}
 if(!d||d.version!==VERSION)return initial();const s=initial();
 if(['hall',...IDS].includes(d.room))s.room=d.room;if(IDS.includes(d.spell))s.spell=d.spell;
 for(const room of ['hall',...IDS]){const src=d.circuits?.[room],dst=s.circuits[room];if(!src)continue;
  dst.charge=Number.isInteger(src.charge)?Math.max(0,Math.min(8,src.charge)):0;
  for(const id of IDS){const p=src.nodes?.[id];if(!p)continue;dst.nodes[id]={exists:p.exists===true,manual:p.exists===true&&p.manual===true,from:IDS.includes(p.from)?p.from:null};}
  for(const id of IDS)if(!dst.nodes[dst.nodes[id].from]?.exists)dst.nodes[id].from=null;
 }
 if(d.physical?.fire){s.physical.fire.lit=d.physical.fire.lit===true;s.physical.fire.view=d.physical.fire.view===1?1:0;}
 if(d.physical?.water){s.physical.water.water=d.physical.water.water>=5000?5000:2730;s.physical.water.open=d.physical.water.open===true;}
 if(d.physical?.wind){s.physical.wind.blown=d.physical.wind.blown===true;s.physical.wind.view=['front','left','right','low'].includes(d.physical.wind.view)?d.physical.wind.view:'front';s.physical.wind.phase=[0,1,2].includes(d.physical.wind.phase)?d.physical.wind.phase:0;}
 if(d.physical?.earth)s.physical.earth.lifted=d.physical.earth.lifted===true;
 s.notes=typeof d.notes==='string'?d.notes.slice(0,8000):'';
 s.records=Array.isArray(d.records)?d.records.filter(x=>typeof x==='string').slice(-60).map(x=>x.slice(0,500)):[];
 s.sfx=d.sfx===true;s.reduced=d.reduced===true;s.graduated=d.graduated===true;
 return s;
}
return{VERSION,KEY,IDS,TAKES,META,ROOMS,clone,initial,initialCircuit,circuit,settle,isClosed,cast,support,release,hold,night,restore};
});
