/* Reproducible excerpt/level preparation. Official downloads must be supplied locally. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const sources=process.argv[2],out=process.argv[3];
if(!sources||!out)throw Error('Usage: node prepare_sfx.cjs SOURCE_DIRECTORY OUTPUT_DIRECTORY');
const specs=[
 ['ignite','マッチで火をつける.mp3','生活3',.55,.66],
 ['cover','アタッシュケースの留め具を外す.mp3','生活3',.77,.31],
 ['paper','ページをめくる1.mp3','生活2',.08,.80],
 ['friction','重いものを引きずる.mp3','生活3',.24,.76],
 ['stone','ブロックを置く.mp3','生活3',0,.496],
 ['water','水ちょろちょろ.mp3','生活1',.4,1.0],
 ['wind','突風が吹く.mp3','自然',.3,1.1],
 ['pass','鈴が鳴る.mp3','生活3',.05,1.1]
];
const run=(bin,args,binary=false)=>{const r=cp.spawnSync(bin,args,{encoding:binary?undefined:'utf8',maxBuffer:10e6});if(r.status!==0)throw Error(String(r.stderr));return r;};
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
fs.mkdirSync(out,{recursive:true});
const result=[];
for(const[id,name,page,start,length]of specs){
 const source=path.join(sources,name),dest=path.join(out,id+'.mp3');
 const info=JSON.parse(run('ffprobe',['-v','error','-show_entries','format=duration,size','-of','json',source]).stdout).format;
 const pcm=run('ffmpeg',['-v','error','-ss',String(start),'-i',source,'-t',String(length),'-ac','1','-ar','44100','-f','f32le','-'],true).stdout;
 let max=0,sum=0;for(let i=0;i<pcm.length;i+=4){const x=pcm.readFloatLE(i);max=Math.max(max,Math.abs(x));sum+=x*x;}
 const peak=20*Math.log10(max||1e-10),mean=10*Math.log10(sum/(pcm.length/4)||1e-10),gain=+(-12-peak).toFixed(2),fade=Math.min(.12,length*.2);
 run('ffmpeg',['-v','error','-y','-ss',String(start),'-i',source,'-t',String(length),'-af',`volume=${gain}dB,afade=t=in:d=0.008,afade=t=out:st=${length-fade}:d=${fade}`,'-ac','1','-ar','44100','-codec:a','libmp3lame','-b:a','96k',dest]);
 const processed=JSON.parse(run('ffprobe',['-v','error','-show_entries','format=duration,size','-of','json',dest]).stdout).format;
 result.push({id,material:name,category:page,source_seconds:+info.duration,source_bytes:+info.size,excerpt_start:start,excerpt_seconds:length,excerpt_peak_before_dbfs:+peak.toFixed(2),excerpt_rms_before_dbfs:+mean.toFixed(2),gain_db:gain,fade_in_seconds:.008,fade_out_seconds:fade,asset_seconds:+processed.duration,asset_bytes:+processed.size,source_sha256:sha(source),asset_sha256:sha(dest),auditory_review:'not_performed',official_preview_click:'performed_not_auditory_confirmation'});
}
fs.writeFileSync(path.join(out,'measurements.json'),JSON.stringify({version:1,provider:'効果音ラボ',agreement:'https://soundeffect-lab.info/agreement/',faq:'https://soundeffect-lab.info/faq/',recorded_at:'2026-10-21',method:'Official page download links; ffmpeg excerpts, mono 44.1kHz MP3 96kbps, pre-encode peak target -12dBFS; not LUFS or a listening assessment.',assets:result},null,2)+'\n');
console.log(JSON.stringify(result.map(({id,source_seconds,asset_seconds,asset_bytes,gain_db})=>({id,source_seconds,asset_seconds,asset_bytes,gain_db}))));
