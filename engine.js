/* Geometry and rules shared by the page and the verification suite. No solution table. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.EarthExam=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SIZE=6;
const BASE={
 A:[[0,0],[1,0]],B:[[0,0],[1,0],[2,0]],C:[[0,0],[1,0],[0,1],[1,1]],
 D:[[0,0],[0,1],[0,2],[1,2]],E:[[0,0],[1,0],[2,0],[1,1]],F:[[1,0],[2,0],[0,1],[1,1]],
 G:[[0,0],[1,0],[0,1],[1,1],[0,2]],H:[[0,0],[2,0],[0,1],[1,1],[2,1]],I:[[0,0],[0,1],[0,2],[1,2],[2,2]]
};
const META={
 A:{name:'二連石',color:'#778e90'},B:{name:'三連石',color:'#ad9770'},C:{name:'校章の石',color:'#4e6b73'},
 D:{name:'鉤の四連石',color:'#829177'},E:{name:'丁の四連石',color:'#8e7c90'},F:{name:'斜の四連石',color:'#8e9da0'},
 G:{name:'◆の五連石',color:'#a57a65',glyph:'◆',mark:[1,0]},H:{name:'◇の五連石',color:'#698f98',glyph:'◇',mark:[1,1]},I:{name:'角の五連石',color:'#9c986d'}
};
const TARGETS=[{id:'G',glyph:'◆',at:[4,4]},{id:'H',glyph:'◇',at:[2,1]}];
function shapeFor(id,rot=0,flip=false){
 let pts=BASE[id].map(([x,y])=>[flip?-x:x,y]);let mark=META[id].mark?.map((v,i)=>i===0&&flip?-v:v)||null;
 for(let r=0;r<(rot%4+4)%4;r++){pts=pts.map(([x,y])=>[-y,x]);if(mark)mark=[-mark[1],mark[0]];}
 const mx=Math.min(...pts.map(p=>p[0])),my=Math.min(...pts.map(p=>p[1]));
 return {cells:pts.map(([x,y])=>[x-mx,y-my]),mark:mark?[mark[0]-mx,mark[1]-my]:null};
}
function initial(){return{pieces:Object.fromEntries(Object.keys(BASE).map(id=>[id,{rot:0,flip:false,at:id==='C'?[2,2]:null}])),passed:false,discovered:false,moves:0};}
function clone(state){return JSON.parse(JSON.stringify(state));}
function occupied(state,except=null){const map=new Map();for(const[id,p]of Object.entries(state.pieces)){if(!p.at||id===except)continue;for(const[dx,dy]of shapeFor(id,p.rot,p.flip).cells)map.set(`${p.at[0]+dx},${p.at[1]+dy}`,id);}return map;}
function fits(state,id,x,y,rot=state.pieces[id].rot,flip=state.pieces[id].flip){const o=occupied(state,id);return shapeFor(id,rot,flip).cells.every(([dx,dy])=>x+dx>=0&&x+dx<SIZE&&y+dy>=0&&y+dy<SIZE&&!o.has(`${x+dx},${y+dy}`));}
function evaluate(state){
 const o=new Map();for(const[id,p]of Object.entries(state.pieces)){if(!p.at)continue;for(const[dx,dy]of shapeFor(id,p.rot,p.flip).cells){const x=p.at[0]+dx,y=p.at[1]+dy,key=`${x},${y}`;if(x<0||x>=SIZE||y<0||y>=SIZE||o.has(key))return{ok:false,code:'geometry'};o.set(key,id);}}
 if(o.size!==36)return{ok:false,code:'gaps',filled:o.size};
 for(const t of TARGETS){const p=state.pieces[t.id];if(!p.at)return{ok:false,code:'marks'};const m=shapeFor(t.id,p.rot,p.flip).mark;if(p.at[0]+m[0]!==t.at[0]||p.at[1]+m[1]!==t.at[1])return{ok:false,code:'marks'};}
 const tri=state.pieces.B;const seen=new Set();for(const[dx,dy]of shapeFor('B',tri.rot,tri.flip).cells){const x=tri.at[0]+dx,y=tri.at[1]+dy;for(const[ax,ay]of[[1,0],[-1,0],[0,1],[0,-1]]){const id=o.get(`${x+ax},${y+ay}`);if(id&&id!=='B')seen.add(id);}}
 if([...seen].some(id=>BASE[id].length!==4))return{ok:false,code:'neighbors'};
 return{ok:true,code:'pass',filled:36};
}
function restore(raw){
 try{const d=typeof raw==='string'?JSON.parse(raw):raw;if(!d||!d.pieces)return null;const state=initial(),o=new Set();for(const id of Object.keys(BASE)){const p=d.pieces[id];if(!p||!Number.isInteger(p.rot)||p.rot<0||p.rot>3||typeof p.flip!=='boolean')return null;if(p.at!==null&&(!Array.isArray(p.at)||p.at.length!==2||!p.at.every(Number.isInteger)))return null;state.pieces[id]={rot:p.rot,flip:p.flip,at:p.at?.slice()||null};if(p.at)for(const[dx,dy]of shapeFor(id,p.rot,p.flip).cells){const x=p.at[0]+dx,y=p.at[1]+dy,key=`${x},${y}`;if(x<0||x>=SIZE||y<0||y>=SIZE||o.has(key))return null;o.add(key);}}
 state.passed=Boolean(d.passed)||evaluate(state).ok;state.discovered=Boolean(d.discovered)||JSON.stringify(state.pieces.C.at)!=='[2,2]';state.moves=Number.isSafeInteger(d.moves)&&d.moves>=0?d.moves:0;return state;}catch{return null;}
}
function waterReach(state,x,y){const o=occupied(state);if(x<0||x>=SIZE||y<0||y>=SIZE||o.has(`${x},${y}`))return[];const queue=[[x,y]],seen=new Set([`${x},${y}`]);for(let i=0;i<queue.length;i++){const[cx,cy]=queue[i];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,ny=cy+dy,key=`${nx},${ny}`;if(nx<0||nx>=SIZE||ny<0||ny>=SIZE||o.has(key)||seen.has(key))continue;seen.add(key);queue.push([nx,ny]);}}return queue;}
return{SIZE,BASE,META,TARGETS,shapeFor,initial,clone,occupied,fits,evaluate,restore,waterReach};
});
