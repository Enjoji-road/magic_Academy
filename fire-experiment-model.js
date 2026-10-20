/* Fire IV: one preserved six-leaf relief and point-light projection. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FireArchive=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION=4,PUZZLE='fire-archive-six-leaves-20261020',KEY='magic-academy-fire-experiment-v4';
const WALL=12,WALL_Z=6;
const LIGHTS={first:{x:0,y:0,z:0,label:'燭台 I'},second:{x:1,y:0,z:0,label:'燭台 II'}};
const DIGIT_SEGMENTS=['abcdef','bc','abdeg','abcdg','bcfg','acdfg','acdefg','abc','abcdefg','abcdfg'];
const MASKS=DIGIT_SEGMENTS.map(s=>[...s].reduce((a,c)=>a|(1<<(c.charCodeAt(0)-97)),0));
const DATA=[[-1,1,9],[0,1,8],[1,1,9],[-1,2,1],[0,2,6],[1,2,1]];
const PLATES=DATA.map(([a,b,digit],i)=>({id:String.fromCharCode(65+i),a,b,digit,x:a/(b+1),y:12/(b+1),z:6/(b+1),width:.78/(b+1),height:1.32/(b+1)}));
const OUTER=[[0,.66],[.28,.5],[.39,.22],[.39,-.25],[.23,-.55],[0,-.66],[-.23,-.55],[-.39,-.25],[-.39,.22],[-.28,.5]];
function horizontal(z){return[[-.18,0],[-.14,.04],[.14,.04],[.18,0],[.14,-.04],[-.14,-.04]].map(([x,y])=>[x,y+z]);}
function vertical(x,z){return[[0,.13],[.04,.09],[.04,-.09],[0,-.13],[-.04,-.09],[-.04,.09]].map(([a,b])=>[a+x,b+z]);}
const HOLES={a:horizontal(.35),b:vertical(.22,.175),c:vertical(.22,-.175),d:horizontal(-.35),e:vertical(-.22,-.175),f:vertical(-.22,.175),g:horizontal(0)};
function project(p,side){const l=LIGHTS[side];if(!l)throw new Error('Unknown light');const scale=WALL/p.y;return{id:p.id,x:l.x+(p.x-l.x)*scale,z:p.z*scale,scale,width:p.width*scale,height:p.height*scale};}
function projectPoint([x,y,z],side){const l=LIGHTS[side];if(!l||y<=0)throw new Error('Invalid ray');const m=WALL/y;return[l.x+(x-l.x)*m,z*m];}
function supports(side){
 const out=[];
 for(const y of[4,6]){const m=WALL/y;out.push([[-.73,y,(5.1-.0175)/m],[.73,y,(5.1-.0175)/m],[.73,y,(5.1+.0175)/m],[-.73,y,(5.1+.0175)/m]].map(p=>projectPoint(p,side)));}
 for(const x of[-.73,.73])out.push([[x,4,(5.1-.0175)/3],[x,6,(5.1-.0175)/2],[x,6,(5.1+.0175)/2],[x,4,(5.1+.0175)/3]].map(p=>projectPoint(p,side)));
 for(const p of PLATES){const m=WALL/p.y;out.push([[p.x-.0125/m,p.y,5.1/m],[p.x+.0125/m,p.y,5.1/m],[p.x+.0125/m,p.y,5.35/m],[p.x-.0125/m,p.y,5.35/m]].map(q=>projectPoint(q,side)));}
 return out;
}
function observation(side,digits=PLATES.map(p=>p.digit)){
 if(!LIGHTS[side])throw new Error('Unknown light');
 if(!Array.isArray(digits)||digits.length!==6||digits.some(d=>!Number.isInteger(d)||d<0||d>9))throw new Error('Invalid relief');
 const groups=new Map();PLATES.forEach((p,i)=>{const t=project(p,side),key=Number(t.x.toFixed(9));if(!groups.has(key))groups.set(key,{x:key,z:WALL_Z,owners:[],mask:127});const g=groups.get(key);g.owners.push(p.id);g.mask &= MASKS[digits[i]];});
 return[...groups.values()].sort((a,b)=>a.x-b.x).map(g=>({...g,digit:MASKS.indexOf(g.mask)}));
}
function initial(){return{version:VERSION,puzzle:PUZZLE,magic:'fire',view:'',lit:{first:false,second:false},seen:{first:false,second:false},answer:'',passed:false,attempts:0};}
function normalise(value){return String(value??'').normalize('NFKC').replace(/[\s-]/g,'');}
function isAnswer(value){return normalise(value)===PLATES.map(p=>p.digit).join('');}
function restore(raw){try{const d=typeof raw==='string'?JSON.parse(raw):raw;if(!d||d.version!==VERSION||d.puzzle!==PUZZLE)return null;const s=initial();if(['fire','water','wind','earth'].includes(d.magic))s.magic=d.magic;for(const k of Object.keys(LIGHTS)){s.lit[k]=d.lit?.[k]===true;s.seen[k]=d.seen?.[k]===true;}if(LIGHTS[d.view]&&s.lit[d.view]&&s.seen[d.view])s.view=d.view;s.answer=typeof d.answer==='string'?d.answer.slice(0,40):'';s.attempts=Number.isSafeInteger(d.attempts)&&d.attempts>=0?d.attempts:0;s.passed=d.passed===true;return s;}catch{return null;}}
function light(s,side){if(!LIGHTS[side])return false;if(s.magic==='fire'){s.lit[side]=true;s.seen[side]=true;s.view=side;return true;}if(s.magic==='water'||s.magic==='wind'){s.lit[side]=false;if(s.view===side)s.view='';}return false;}
function cover(s){s.view='';}
function submit(s,value){s.answer=String(value??'').slice(0,40);if(!/^\d{6}$/.test(normalise(s.answer)))return'format';s.attempts++;if(isAnswer(s.answer)){s.passed=true;return'pass';}return'incorrect';}
return{VERSION,PUZZLE,KEY,WALL,WALL_Z,LIGHTS,DIGIT_SEGMENTS,MASKS,PLATES,OUTER,HOLES,project,projectPoint,supports,observation,initial,normalise,isAnswer,restore,light,cover,submit};
});
