/* 魔法学校: 全教室共通BGM。許可される環境で自動再生し、
   制限するブラウザではページ内の最初の操作から自動再開する。 */
(()=>{
'use strict';
if(window.__academyAudioInit)return;
window.__academyAudioInit=true;

const KEY='magic-academy-audio-v1';
const PARTS=9, FOLDER='assets/bgm/';
const TRACK='想い出の魔法';
const $=(root,sel)=>root.querySelector(sel);
const state={volume:25,muted:false,position:0,enabled:true,wasPlaying:false};

try {
  const saved=JSON.parse(localStorage.getItem(KEY)||'null');
  if(saved&&typeof saved==='object'){
    const v=Number(saved.volume),p=Number(saved.position);
    state.volume=Number.isFinite(v)?Math.min(100,Math.max(0,Math.round(v))):25;
    state.muted=!!saved.muted;
    state.position=Number.isFinite(p)?Math.max(0,p):0;
    // 旧版では未再生と明示的な一時停止を区別できない。新版は初期状態で再生希望とする。
    state.enabled=typeof saved.enabled==='boolean'?saved.enabled:true;
    state.wasPlaying=!!saved.wasPlaying;
  }
}catch{}

const toolbar=document.createElement('div');
toolbar.className='academy-audio-toolbar';
toolbar.setAttribute('aria-label','設定');
toolbar.innerHTML='<button type="button" data-audio-open aria-haspopup="dialog">⚙ 設定 <span data-audio-indicator aria-hidden="true">♪</span></button>';
const dialog=document.createElement('dialog');
dialog.className='academy-audio-dialog';
dialog.setAttribute('aria-label','音声設定');
dialog.innerHTML='<div class="academy-audio-content">'+
 '<div class="academy-audio-head"><h2>⚙ 設定</h2><button type="button" class="academy-audio-close" data-audio-close aria-label="設定を閉じる">×</button></div>'+
 '<label class="academy-audio-volume-label" for="academy-audio-volume"><span>BGM音量</span><output data-audio-percent>25%</output></label>'+
 '<input class="academy-audio-slider" id="academy-audio-volume" type="range" min="0" max="100" step="1" value="25" aria-label="BGM音量">'+
 '<div class="academy-audio-controls"><button type="button" class="academy-audio-play" data-audio-play>⏸ BGMを停止</button><button type="button" class="academy-audio-mute" data-audio-mute>🔇 ミュート</button></div>'+
 '<p class="academy-audio-message" data-audio-status role="status" aria-live="polite">音源を準備しています…</p>'+
 '<p class="academy-audio-hint">可能な環境では読み込み後に自動再生します。iPhone等でブラウザに制限された場合は、画面内の最初の操作に合わせて開始します。教室間の移動では音が一度途切れます。</p>'+
 '<p class="academy-audio-credit">音楽：<a href="https://bgmer.net/" target="_blank" rel="noopener noreferrer">BGMer</a>「'+TRACK+'」</p>'+
 '</div>';
document.body.insertBefore(toolbar,document.body.firstChild);
document.body.appendChild(dialog);

const openBtn=$(toolbar,'[data-audio-open]');
const indicator=$(toolbar,'[data-audio-indicator]');
const closeBtn=$(dialog,'[data-audio-close]');
const playBtn=$(dialog,'[data-audio-play]');
const muteBtn=$(dialog,'[data-audio-mute]');
const slider=$(dialog,'#academy-audio-volume');
const pct=$(dialog,'[data-audio-percent]');
const status=$(dialog,'[data-audio-status]');

const audio=new Audio();
audio.preload='none';
audio.loop=true;
audio.playsInline=true;
let objectURL=null,loadPromise=null,playing=false,blocked=false;
let ctx=null,gain=null,mediaSource=null,lastSavedPosition=state.position;
const notify=message=>{status.textContent=message;};
const persist=()=>{
  try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}
};
function setVolume(){
  const v=state.muted?0:state.volume/100;
  if(gain){
    gain.gain.value=v;
    audio.muted=false;
    audio.volume=1;
  }else{
    audio.volume=v;
    audio.muted=state.muted;
  }
  slider.value=String(state.volume);
  pct.textContent=String(state.volume)+'%';
  muteBtn.textContent=state.muted?'🔊 ミュート解除':'🔇 ミュート';
  muteBtn.setAttribute('aria-pressed',String(state.muted));
}
function render(){
  playBtn.textContent=playing?'⏸ BGMを一時停止':state.enabled?(objectURL?'▶ BGMを再生':'⏳ 音源を読み込み中…'):'▶ BGMを再開';
  playBtn.disabled=Boolean(state.enabled&&!objectURL&&!playing);
  indicator.textContent=playing&&!state.muted&&state.volume>0?'♫':'♪';
  openBtn.setAttribute('aria-label','設定'+(playing?'・BGM再生中':'・BGM停止中'));
}
// Safari/iPhoneでは有音再生とAudioContextの許可がジェスチャー単位。
// ジェスチャー内では await を挟まずに resume / play を呼び出す。
function enableGain(){
  try{
    const Context=window.AudioContext||window.webkitAudioContext;
    if(!Context)return;
    if(!ctx){
      ctx=new Context();
      mediaSource=ctx.createMediaElementSource(audio);
      gain=ctx.createGain();
      mediaSource.connect(gain);
      gain.connect(ctx.destination);
      setVolume();
    }
    if(ctx.state==='suspended')ctx.resume().catch(()=>{});
  }catch(e){
    console.warn('BGM volume gain unavailable:',e);
    if(ctx&&ctx.state!=='running')ctx.resume().catch(()=>{});
  }
}
function applyPosition(){
  if(state.position>0&&Number.isFinite(audio.duration)&&audio.duration>0){
    try{audio.currentTime=state.position%audio.duration;}catch{}
  }
}
function start(gesture=false){
  if(!state.enabled||!objectURL)return;
  if(playing)return;
  if(gesture)enableGain();
  try{
    const result=audio.play(); // 信頼された操作の中で同期的に呼ぶ
    if(result&&typeof result.then==='function'){
      result.then(()=>{
        if(!state.enabled){audio.pause();return;}
        playing=true;blocked=false;state.wasPlaying=true;persist();
        render();notify('♪ BGM再生中');
      }).catch(()=>{
        playing=false;blocked=true;render();
        notify('ブラウザが再生を制限しています。画面のボタンや装置を操作すると自動で再生を試みます。');
      });
    }else{
      playing=true;blocked=false;state.wasPlaying=true;persist();
      render();notify('♪ BGM再生中');
    }
  }catch{
    playing=false;blocked=true;render();
    notify('画面内の操作に合わせて再生を試みます。');
  }
}
function stop(){
  audio.pause();
  playing=false;blocked=false;state.enabled=false;state.wasPlaying=false;
  if(Number.isFinite(audio.currentTime))state.position=audio.currentTime;
  persist();render();notify('BGMを一時停止しました。');
}
async function prepare(){
  if(objectURL)return;
  if(loadPromise)return loadPromise;
  notify('BGMを読み込んでいます…');
  loadPromise=(async()=>{
    // 分割音源を並列に取得。結合順は配列の順序を維持する。
    const parts=await Promise.all(Array.from({length:PARTS},async(_,i)=>{
      const name=FOLDER+'omoide-'+String(i).padStart(2,'0')+'.part';
      const response=await fetch(new URL(name,document.baseURI));
      if(!response.ok)throw new Error('BGM '+(i+1)+'／'+PARTS);
      return response.arrayBuffer();
    }));
    objectURL=URL.createObjectURL(new Blob(parts,{type:'audio/mpeg'}));
    audio.src=objectURL;
    audio.preload='auto';
    audio.addEventListener('loadedmetadata',applyPosition,{once:true});
    audio.load();
    render();
    if(state.enabled){
      notify('音源の準備ができました。再生を試みています…');
      start(false);
    }else{
      notify('音源の準備ができました。BGMは停止中です。');
    }
  })();
  try{await loadPromise;}
  catch(e){
    loadPromise=null;
    notify('音源を読み込めませんでした。設定から再試行できます。');
  }finally{render();}
}
// 受験操作そのものがユーザー操作になるため、音楽専用の再生タップは不要。
// 一度停止を選んだ場合は勝手に再開しない。
function onGesture(){
  if(!state.enabled)return;
  enableGain();
  if(objectURL&&!playing)start(true);
}
document.addEventListener('pointerdown',onGesture,{capture:true,passive:true});
document.addEventListener('keydown',e=>{
  if(!e.isTrusted||e.altKey||e.metaKey||e.ctrlKey)return;
  onGesture();
},{capture:true});

openBtn.addEventListener('click',()=>{
  if(typeof dialog.showModal==='function')dialog.showModal();
  else dialog.setAttribute('open','');
  if(!objectURL&&!loadPromise)prepare();
});
closeBtn.addEventListener('click',()=>{
  if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');
});
dialog.addEventListener('click',e=>{
  if(e.target===dialog&&typeof dialog.close==='function')dialog.close();
});
slider.addEventListener('input',()=>{
  const v=Number(slider.value);
  state.volume=Number.isFinite(v)?Math.max(0,Math.min(100,v)):25;
  if(state.volume>0&&state.muted)state.muted=false;
  setVolume();persist();
});
muteBtn.addEventListener('click',()=>{
  state.muted=!state.muted;
  setVolume();persist();
});
playBtn.addEventListener('click',()=>{
  if(playing||!state.enabled){
    if(playing){stop();return;}
    state.enabled=true;state.wasPlaying=true;persist();
    if(!objectURL)prepare();
    else start(true);
    render();return;
  }
  if(!objectURL){prepare();return;}
  start(true);
});
audio.addEventListener('error',()=>{
  playing=false;blocked=true;render();
  notify('再生エラーが発生しました。設定から再試行してください。');
});
audio.addEventListener('timeupdate',()=>{
  if(Number.isFinite(audio.currentTime)&&Math.abs(audio.currentTime-lastSavedPosition)>5){
    state.position=audio.currentTime;
    lastSavedPosition=state.position;
    persist();
  }
});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden&&Number.isFinite(audio.currentTime)){
    state.position=audio.currentTime;persist();
  }
});
window.addEventListener('pagehide',()=>{
  if(Number.isFinite(audio.currentTime)){
    state.position=audio.currentTime;persist();
  }
  audio.pause();
});
window.addEventListener('unload',()=>{
  if(objectURL)URL.revokeObjectURL(objectURL);
});
setVolume();render();
prepare();
})();