/* Shared soundtrack for the Academy. Playback is strictly user-initiated. */
(()=>{
  'use strict';
  if(window.__academyAudioInit)return;
  window.__academyAudioInit=true;
  const SETTINGS_KEY='magic-academy-audio-v1';
  const AUDIO_PARTS=9;
  const PART_FOLDER='assets/bgm/';
  const TRACK_NAME='想い出の魔法';
  const $=(root,s)=>root.querySelector(s);
  const initial={volume:25,muted:false,position:0,wasPlaying:false};
  let data={...initial};
  try{
    const raw=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'null');
    if(raw&&typeof raw==='object'){
      data.volume=Number.isFinite(Number(raw.volume))?Math.max(0,Math.min(100,Math.round(Number(raw.volume)))):25;
      data.muted=Boolean(raw.muted);
      data.position=Number.isFinite(Number(raw.position))?Math.max(0,Number(raw.position)):0;
      data.wasPlaying=Boolean(raw.wasPlaying);
    }
  }catch{}
  const bar=document.createElement('div');bar.className='academy-audio-toolbar';bar.setAttribute('aria-label','サウンド設定');
  bar.innerHTML='<button type="button" data-audio-open aria-haspopup="dialog">⚙ 設定・BGM <span data-audio-indicator aria-hidden="true">♪</span></button>';
  const dialog=document.createElement('dialog');dialog.className='academy-audio-dialog';dialog.setAttribute('aria-label','設定とBGM');
  dialog.innerHTML='<div class="academy-audio-content">'+
    '<div class="academy-audio-head"><h2>⚙ 設定</h2><button type="button" class="academy-audio-close" data-audio-close aria-label="設定を閉じる">×</button></div>'+
    '<div class="academy-audio-track"><strong>♫ '+TRACK_NAME+'</strong><span>学院共通BGM ／ BGMer · LONG版</span></div>'+
    '<label class="academy-audio-volume-label" for="academy-audio-volume"><span>音量</span><output data-audio-percent>25%</output></label>'+
    '<input class="academy-audio-slider" id="academy-audio-volume" type="range" min="0" max="100" step="1" value="25" aria-label="BGM音量">'+
    '<div class="academy-audio-controls"><button type="button" class="academy-audio-play" data-audio-play>▶ 音楽を再生</button><button type="button" class="academy-audio-mute" data-audio-mute>🔇 ミュート</button></div>'+
    '<p class="academy-audio-message" data-audio-status role="status" aria-live="polite">BGMは初期状態では再生されません。</p>'+
    '<p class="academy-audio-hint">iPhoneなどでは再生にタップが必要です。教室を移ると音がいったん切れる場合がありますが、音量と再生位置は引き継ぎます。</p>'+
    '<p class="academy-audio-credit">音楽：<a href="https://bgmer.net/" target="_blank" rel="noopener noreferrer">BGMer</a>「'+TRACK_NAME+'」</p>'+
    '</div>';
  document.body.insertBefore(bar,document.body.firstChild);
  document.body.append(dialog);
  const openBtn=$(bar,'[data-audio-open]'), indicator=$(bar,'[data-audio-indicator]');
  const playBtn=$(dialog,'[data-audio-play]'),closeBtn=$(dialog,'[data-audio-close]'),muteBtn=$(dialog,'[data-audio-mute]');
  const slider=$(dialog,'[data-audio-volume]'),pct=$(dialog,'[data-audio-percent]'),status=$(dialog,'[data-audio-status]');
  const audio=new Audio();audio.preload='none';audio.loop=true;audio.playsInline=true;
  let objectURL=null,loadPromise=null,playing=false,ctx=null,gain=null,source=null,lastSavedPosition=0;
  const notify=msg=>{status.textContent=msg;};
  function persist(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(data));}catch{}}
  function adjustVolume(){
    const target=data.muted?0:data.volume/100;
    if(gain){gain.gain.value=target;audio.volume=1;audio.muted=false;}
    else {audio.volume=target;audio.muted=data.muted;}
    pct.textContent=String(data.volume)+'%';slider.value=String(data.volume);
    muteBtn.textContent=data.muted?'🔊 ミュート解除':'🔇 ミュート';
    muteBtn.setAttribute('aria-pressed',String(data.muted));
  }
  function display(){
    playBtn.textContent=playing?'⏸ 一時停止':loadPromise&&!objectURL?'⏳ 音源読み込み中…':'▶ 音楽を再生';
    playBtn.disabled=Boolean(loadPromise&&!objectURL);
    indicator.textContent=playing&&!data.muted&&data.volume>0?'♫':'♪';
    openBtn.setAttribute('aria-label',playing?'設定・BGM再生中':'設定・BGM停止中');
  }
  async function prepare(){
    if(objectURL)return;
    if(loadPromise)return loadPromise;
    notify('楽曲を読み込んでいます…');display();
    loadPromise=(async()=>{
      const parts=[];
      for(let i=0;i<AUDIO_PARTS;i++){
        const name=PART_FOLDER+'omoide-'+String(i).padStart(2,'0')+'.part';
        const response=await fetch(new URL(name,document.baseURI));
        if(!response.ok)throw new Error('ファイル '+(i+1)+'／'+AUDIO_PARTS+' を読み込めませんでした');
        parts.push(await response.arrayBuffer());
        notify('楽曲を読み込んでいます… '+(i+1)+'／'+AUDIO_PARTS);
      }
      objectURL=URL.createObjectURL(new Blob(parts,{type:'audio/mpeg'}));
      audio.src=objectURL;
      audio.preload='auto';
      audio.load();
      audio.addEventListener('loadedmetadata',()=>{
        if(Number.isFinite(audio.duration)&&audio.duration>0&&data.position>0){
          try{audio.currentTime=data.position%audio.duration;}catch{}
        }
      },{once:true});
      notify('準備できました。「音楽を再生」を押してください。');
    })();
    try{await loadPromise;}catch(e){loadPromise=null;notify('音源を読み込めませんでした。接続を確認して再試行してください。');throw e;}finally{display();}
  }
  async function audioNode(){
    if(ctx){if(ctx.state==='suspended')await ctx.resume();return;}
    const AudioContextClass=window.AudioContext||window.webkitAudioContext;
    if(!AudioContextClass){adjustVolume();return;}
    try{
      ctx=new AudioContextClass();source=ctx.createMediaElementSource(audio);gain=ctx.createGain();
      source.connect(gain);gain.connect(ctx.destination);
      adjustVolume();await ctx.resume();
    }catch(e){console.warn('Web Audio unavailable:',e);adjustVolume();}
  }
  async function togglePlay(){
    if(playing){audio.pause();playing=false;data.wasPlaying=false;data.position=audio.currentTime||data.position;persist();display();notify('BGMを一時停止しました。');return;}
    if(!objectURL){
      try{await prepare();}catch{return;}
      /* Async downloads expire mobile user activation. Require a second tap to play. */
      display();return;
    }
    try{
      await audioNode();
      const request=audio.play();if(request&&typeof request.then==='function')await request;
      playing=true;data.wasPlaying=true;persist();display();notify('♪ BGMを再生しています。');
    }catch(e){playing=false;data.wasPlaying=false;persist();display();notify('ブラウザが自動再生を制限しました。もう一度「音楽を再生」を押してください。');}
  }
  openBtn.addEventListener('click',()=>{if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open',''); if(!objectURL&&!loadPromise)prepare().catch(()=>{});});
  closeBtn.addEventListener('click',()=>{if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');});
  dialog.addEventListener('click',e=>{if(e.target===dialog&&typeof dialog.close==='function')dialog.close();});
  slider.addEventListener('input',()=>{data.volume=Math.max(0,Math.min(100,Number(slider.value)||0));if(data.volume>0&&data.muted)data.muted=false;adjustVolume();persist();});
  muteBtn.addEventListener('click',()=>{data.muted=!data.muted;adjustVolume();persist();});
  playBtn.addEventListener('click',togglePlay);
  audio.addEventListener('error',()=>{playing=false;display();notify('再生中に問題が発生しました。設定を開き直してください。');});
  audio.addEventListener('timeupdate',()=>{if(Math.abs((audio.currentTime||0)-lastSavedPosition)>6){data.position=audio.currentTime;lastSavedPosition=data.position;persist();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&Number.isFinite(audio.currentTime)){data.position=audio.currentTime;persist();}});
  window.addEventListener('pagehide',()=>{if(Number.isFinite(audio.currentTime)){data.position=audio.currentTime;persist();}audio.pause();});
  slider.value=String(data.volume);adjustVolume();display();
  if(data.wasPlaying)notify('前の教室の再生位置を記録しています。続きを聴くには再生してください。');
  window.addEventListener('unload',()=>{if(objectURL)URL.revokeObjectURL(objectURL);});
})();