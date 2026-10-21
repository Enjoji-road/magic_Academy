(function(root){
'use strict';
const D=typeof module==='object'&&module.exports?require('./wind-ribbon-data.js'):root.WindRibbonData;
const N=D.stations, G=D.geometry, LENGTH=2*G.straight+2*Math.PI*G.radius;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
function next(node, direction=1, twisted=true){
 let station=node.station+direction,edge=node.edge;
 if(station>=N){station=0;if(twisted)edge=-edge;}
 if(station<0){station=N-1;if(twisted)edge=-edge;}
 return {station,edge};
}
function trace({twisted=true,direction=D.start.direction,omitTask=false}={}){
 let node={station:D.start.station,edge:D.start.edge};const letters=[],nodes=[];
 for(let k=0;k<=2*N;k++){
  if(k&&node.station===D.stop.station&&node.edge===D.stop.edge)return {letters,text:letters.map(g=>g.text).join(''),nodes,closed:false};
  if(k&&node.station===D.start.station&&node.edge===D.start.edge)return {letters,text:letters.map(g=>g.text).join(''),nodes,closed:true};
  nodes.push({...node});
  for(const g of D.glyphs)if(g.station===node.station&&g.edge===node.edge)letters.push({...g,text:omitTask&&g.station>=D.task.from&&g.station<=D.task.to?'?':g.text});
  node=next(node,direction,twisted);
 }
 throw Error('Nonterminating boundary');
}
function normalize(text){return String(text).normalize('NFKC').replace(/[\s　]/gu,'').replace(/[ァ-ヶ]/g,ch=>String.fromCharCode(ch.charCodeAt(0)-0x60));}
function grade(text){const value=normalize(text);return value===trace().text||D.answerAliases.some(x=>normalize(x)===value);}
// A tube of radius halfWidth < radius around a simple planar stadium.
// Twist changes only the director within that tube, not material adjacency.
function base(s,v){
 const l=s*LENGTH, d=G.straight, r=G.radius;let x,z,nx,nz;
 if(l<=d){x=-d/2+l;z=0;nx=0;nz=1;}
 else if(l<=d+Math.PI*r){const t=(l-d)/r;x=d/2+r*Math.sin(t);z=-r+r*Math.cos(t);nx=Math.sin(t);nz=Math.cos(t);}
 else if(l<=2*d+Math.PI*r){x=d/2-(l-d-Math.PI*r);z=-2*r;nx=0;nz=-1;}
 else{const t=(l-2*d-Math.PI*r)/r;x=-d/2-r*Math.sin(t);z=-r-r*Math.cos(t);nx=-Math.sin(t);nz=-Math.cos(t);}
 const angle=Math.PI*smooth((s-G.twistStart)/(G.twistEnd-G.twistStart));
 const w=v*G.halfWidth, dx=w*Math.sin(angle)*nx, dz=w*Math.sin(angle)*nz;
 return [x+dx,G.taskY+w*Math.cos(angle)+G.shear*(z+dz),z+dz];
}
// Composition of ambient diffeomorphisms: z shear, radius-dependent rotation
// about the line through the pins, and x shear. Each is invertible.
// The printed central patch and its two pins are fixed in every state.
function deform(p,wind='still',flutter=0){
 const w=Array.isArray(wind)?wind:D.winds[wind]||D.winds.still;
 let [x,y,z]=p;
 const margin=smooth((Math.abs(y-G.taskY)-40)/25)*(1-smooth((Math.abs(x)-240)/40));
 z+=(w[2]+flutter)*margin;
 let yy=y-G.taskY, radius=Math.hypot(yy,z);
 const a=w[1]*smooth((radius-85)/200), c=Math.cos(a),s=Math.sin(a);
 const yy2=c*yy-s*z;z=s*yy+c*z;y=G.taskY+yy2;
 x+=w[0]*z;
 return [x,y,z];
}
function point(s,v,wind='still',flutter=0){return deform(base(s,v),wind,flutter);}
function project(p,view='front'){
 const [yaw,pitch]=Array.isArray(view)?view:D.views[view]||D.views.front;
 const c=Math.cos(yaw),s=Math.sin(yaw),x=c*p[0]+s*p[2],z=-s*p[0]+c*p[2];
 const cp=Math.cos(pitch),sp=Math.sin(pitch);return [x,cp*p[1]-sp*z,sp*p[1]+cp*z];
}
function initial(){return {version:1,wind:'still',view:'front',spell:'wind',notes:'',answer:'',passed:false,reduced:false,sfx:true,records:[]};}
function restore(raw){const s=initial();if(!raw||raw.version!==1)return s;
 for(const key of ['wind','view'])if(Object.hasOwn(D[key==='wind'?'winds':'views'],raw[key]))s[key]=raw[key];
 if(['fire','water','wind','earth'].includes(raw.spell))s.spell=raw.spell;
 s.notes=String(raw.notes||'').slice(0,8000);s.answer=String(raw.answer||'').slice(0,40);
 s.passed=raw.passed===true;s.reduced=raw.reduced===true;s.sfx=raw.sfx!==false;
 if(Array.isArray(raw.records))s.records=raw.records.filter(r=>r&&Object.hasOwn(D.winds,r.wind)&&Object.hasOwn(D.views,r.view)).slice(-24).map(r=>({wind:r.wind,view:r.view}));
 return s;
}
const api={D,N,LENGTH,next,trace,grade,normalize,base,deform,point,project,initial,restore};
if(typeof module==='object'&&module.exports)module.exports=api;else root.WindRibbonModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
