/* Exhaustive browser-core fingerprint, consumed by the independent Python checker. */
'use strict';
const M=require('./magic-model.js'),crypto=require('node:crypto');
const hash=crypto.createHash('sha256'),ids=M.IDS,choices=[null,...ids];let states=0,recovered=0,restored=0;
const options=[{exists:false,manual:false,from:null},...choices.flatMap(from=>[false,true].map(manual=>({exists:true,manual,from})))];
for(const a of options)for(const b of options)for(const c of options)for(const d of options){
 const s={nodes:Object.fromEntries(ids.map((id,i)=>[id,[a,b,c,d][i]])),charge:8};
 const live=M.settle(s),bits=ids.map(id=>Number(live[id])).join('');hash.update(bits+Number(M.isClosed(s))+'\n');states++;
 const repair=M.clone(s);for(const id of ids)M.cast(repair,id,null);for(const id of ids)M.cast(repair,id,M.TAKES[id]);M.release(repair);if(!M.isClosed(repair))throw Error('Cannot recover');recovered++;
 const roundtrip=M.restore(JSON.stringify({version:M.VERSION,circuits:{hall:s}})).circuits.hall;
 if(ids.map(id=>Number(M.settle(roundtrip)[id])).join('')!==bits)throw Error('Restore changes an observable result');restored++;
}
const pairs={};for(const recipient of ids)for(const source of ids){const c=M.initialCircuit();M.cast(c,source,null);M.cast(c,recipient,source);M.support(c,recipient);pairs[recipient+'<-'+source]=M.settle(c)[recipient];}
process.stdout.write(JSON.stringify({states,sha256:hash.digest('hex'),pairs,recovered,restored}));
