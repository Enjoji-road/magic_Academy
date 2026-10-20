/* Point-light geometry for the fire examination. Rendered marks are opaque polygons. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FireExam=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION=2,PUZZLE='shadow-v2-depths-20261020',KEY='magic-academy-fire-v2';
const WALL_Y=12,LAMPS={left:{x:9,y:0},right:{x:15,y:0}};
const PLATES=[{id:'A',x:10,y:4,width:1},{id:'B',x:14,y:4,width:1},{id:'C',x:7.5,y:6,width:1},{id:'D',x:13.5,y:6,width:1},{id:'E',x:16.5,y:6,width:1}];
const STAR=[[0,-24],[7,-9],[24,-7],[11,4],[16,22],[0,12],[-16,22],[-11,4],[-24,-7],[-7,-9]];
const PAINT={x:6,width:2};
function crest(x,width){return STAR.map(([u,v])=>[x+u*width/48,v*width/48]);}
function project(plate,side){const l=LAMPS[side];if(!l)throw new Error('Unknown light');const scale=(WALL_Y-l.y)/(plate.y-l.y),x=l.x+(plate.x-l.x)*scale;return{id:plate.id,x,width:plate.width*scale,scale,polygon:crest(x,plate.width*scale)};}
function shadows(side){return PLATES.map(p=>project(p,side));}
function observation(side){return[...shadows(side).map(p=>p.polygon),crest(PAINT.x,PAINT.width)];}
function slotX(slot){return(slot-1)*3;}
function isAnswer(slot){return Number.isInteger(slot)&&slot>=1&&slot<=9&&slotX(slot)===PAINT.x;}
function initial(){return{version:VERSION,puzzle:PUZZLE,magic:'fire',view:'',lit:{left:false,right:false},seen:{left:false,right:false},selected:0,passed:false,attempts:0,firstCorrect:null};}
function restore(raw){try{const d=typeof raw==='string'?JSON.parse(raw):raw;if(!d||d.version!==VERSION||d.puzzle!==PUZZLE)return null;const s=initial();if(['fire','water','wind','earth'].includes(d.magic))s.magic=d.magic;for(const k of['left','right']){s.lit[k]=d.lit?.[k]===true;s.seen[k]=d.seen?.[k]===true;}if(['left','right'].includes(d.view)&&s.lit[d.view]&&s.seen[d.view])s.view=d.view;s.selected=Number.isInteger(d.selected)&&d.selected>=1&&d.selected<=9?d.selected:0;s.attempts=Number.isSafeInteger(d.attempts)&&d.attempts>=0?d.attempts:0;s.firstCorrect=typeof d.firstCorrect==='boolean'?d.firstCorrect:null;s.passed=d.passed===true&&s.seen.left&&s.seen.right;return s;}catch{return null;}}
function light(s,side){if(!LAMPS[side])return false;if(s.magic==='fire'){s.lit[side]=true;s.seen[side]=true;s.view=side;return true;}if(s.magic==='water'||s.magic==='wind'){s.lit[side]=false;if(s.view===side)s.view='';return false;}return false;}
function submit(s){if(!s.seen.left||!s.seen.right)return'not_observed';if(!s.selected)return'not_selected';s.attempts++;const correct=isAnswer(s.selected);if(s.firstCorrect===null)s.firstCorrect=correct;if(correct)s.passed=true;return correct?'pass':'incorrect';}
function visibleCentres(side){return[...new Set([...shadows(side).map(p=>p.x),PAINT.x])].sort((a,b)=>a-b);}
return{VERSION,PUZZLE,KEY,WALL_Y,LAMPS,PLATES,STAR,crest,project,shadows,observation,slotX,isAnswer,initial,restore,light,submit,visibleCentres};
});
