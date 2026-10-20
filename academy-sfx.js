/* 魔法学校：短い操作効果音。BGM・外部音声ファイルは一切使用しない。 */
(()=>{
'use strict';
if(window.AcademySFX)return;
const KEY='magic-academy-sfx-v1';
let enabled=true,ctx=null,master=null;
try{const saved=localStorage.getItem(KEY);if(saved!==null)enabled=saved!=='off';}catch{}
const bar=document.createElement('div');
bar.className='academy-sfx-toolbar';
const button=document.createElement('button');
button.type='button';
button.setAttribute('aria-label','効果音のオン・オフ');
bar.appendChild(button);
document.body.insertBefore(bar,document.body.firstChild);
function render(){
  button.textContent=enabled?'🔊 効果音 ON':'🔇 効果音 OFF';
  button.setAttribute('aria-pressed',String(enabled));
}
button.addEventListener('click',()=>{
  enabled=!enabled;
  try{localStorage.setItem(KEY,enabled?'on':'off');}catch{}
  render();
});
render();
function context(){
  if(!enabled)return null;
  try{
    if(!ctx){
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)return null;
      ctx=new AC();
      master=ctx.createGain();
      master.gain.value=0.15;
      master.connect(ctx.destination);
    }
    if(ctx.state==='suspended')ctx.resume().catch(()=>{});
    return ctx;
  }catch{return null;}
}
function tone(frequency,time,duration=0.17,level=0.22,type='sine',toFrequency=0){
  const osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type=type;
  osc.frequency.setValueAtTime(frequency,time);
  if(toFrequency>0)osc.frequency.exponentialRampToValueAtTime(toFrequency,time+duration);
  gain.gain.setValueAtTime(0.001,time);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.002,level),time+0.015);
  gain.gain.exponentialRampToValueAtTime(0.001,time+duration);
  osc.connect(gain);gain.connect(master);osc.start(time);osc.stop(time+duration+0.02);
}
function whisper(time,duration=0.2,frequency=1000,level=0.12){
  const rate=ctx.sampleRate,length=Math.max(1,Math.ceil(rate*duration));
  const buffer=ctx.createBuffer(1,length,rate),ch=buffer.getChannelData(0);
  for(let i=0;i<length;i++)ch[i]=Math.random()*2-1;
  const node=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
  node.buffer=buffer;filter.type='lowpass';filter.frequency.value=frequency;
  gain.gain.setValueAtTime(0.001,time);
  gain.gain.exponentialRampToValueAtTime(Math.max(level,0.002),time+0.023);
  gain.gain.exponentialRampToValueAtTime(0.001,time+duration);
  node.connect(filter);filter.connect(gain);gain.connect(master);
  node.start(time);node.stop(time+duration);
}
let lastSound=-Infinity;
function play(name){
  if(!enabled)return;
  const audioCtx=context();if(!audioCtx)return;
  const t=audioCtx.currentTime+0.005;
  // 誤操作で連続鳴動し続けないよう、ごく短いクールダウン。
  if(t-lastSound<0.05)return;
  lastSound=t;
  try{
    switch(name){
      case 'ignite':
        whisper(t,0.31,1600,0.25);
        tone(270,t,0.28,0.08,'triangle',440);
        break;
      case 'cover':
        tone(650,t,0.12,0.11,'triangle',380);
        tone(1260,t+0.012,0.08,0.04,'sine',940);
        break;
      case 'stone':
        whisper(t,0.13,340,0.16);
        tone(154,t,0.21,0.23,'triangle',82);
        break;
      case 'scrape':
        whisper(t,0.14,650,0.08);
        tone(310,t,0.12,0.065,'triangle',240);
        break;
      case 'water':
        whisper(t,0.36,2300,0.17);
        tone(620,t,0.24,0.025,'sine',380);
        break;
      case 'wind':
        whisper(t,0.42,2800,0.17);
        break;
      case 'magic':
        tone(420,t,0.19,0.09,'sine',680);
        break;
      case 'pass':
        [523,659,784,1046].forEach((hz,i)=>tone(hz,t+i*0.115,0.40,0.20,'sine'));
        break;
      case 'fail':
        tone(260,t,0.18,0.09,'triangle',205);
        break;
      default:
        tone(560,t,0.065,0.07,'sine');
    }
  }catch(e){console.warn('Short sound effect could not play',e);}
}
window.AcademySFX={play,isEnabled:()=>enabled};
})();