const FoliaJizuraMedia = (() => {
  const J=FoliaJizuraEngine,React=Spicetify.React,h=(...args)=>typeof FoliaStageLocale==="undefined"?React.createElement(...args):FoliaStageLocale.element(React,...args);
  const {useEffect,useRef,useState}=React;
  const listeners=new Set();
  let current=null,database,revision=0;
  const notify=()=>{revision++;for(const listener of listeners)listener(revision);};
  const open=()=>database||(database=new Promise((resolve,reject)=>{
    const request=indexedDB.open('folia-stage-jizura-audio',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('songs');
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  }).catch(error=>{database=null;throw error;}));
  async function record(uri,value,remove=false){
    if(!uri)throw new Error('当前没有歌曲');
    const db=await open();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('songs',value===undefined&&!remove?'readonly':'readwrite');
      const store=tx.objectStore('songs');
      const request=remove?store.delete(uri):value===undefined?store.get(uri):store.put(value,uri);
      tx.oncomplete=()=>resolve(request.result);
      tx.onerror=()=>reject(tx.error);
      tx.onabort=()=>reject(tx.error||new Error('音频存储已取消'));
    });
  }
  async function importAudio(uri,file){
    if(!uri)throw new Error('当前没有歌曲');
    if(!file||!file.size||file.size>80*1024*1024)throw new Error('请选择 80 MB 以内的音频文件');
    const audio=await J.analyzeAudio(file);
    if(!Number.isFinite(audio.duration)||audio.duration>1800)throw new Error('音频时长须在 30 分钟以内');
    let persisted=true;
    try{await record(uri,{name:file.name,type:file.type,data:await file.arrayBuffer()});}catch{persisted=false;}
    current={uri,audio};notify();
    return {audio,persisted};
  }
  async function restoreAudio(uri){
    if(current?.uri===uri)return current.audio;
    const saved=await record(uri);
    if(!saved)return null;
    const audio=await J.analyzeAudio(new File([saved.data],saved.name,{type:saved.type}));
    current={uri,audio};notify();return audio;
  }
  async function forgetAudio(uri){
    await record(uri,null,true);
    if(current?.uri===uri){current=null;notify();}
  }
  function timeline(uri,response=1,tuning={}){
    if(current?.uri!==uri)return null;
    const audio=current.audio;
    const bpm=Number(tuning.localBpm)||audio.bpm;
    const customGrid=Number(tuning.localBpm)>0||Number(tuning.localBeatOffset)>0;
    return {...audio,buffer:undefined,peaks:undefined,energy:Array.from(audio.energy,value=>Math.min(1,value*response)),beats:customGrid?J.beatGrid(bpm,Number(tuning.localBeatOffset)||0,audio.duration):audio.beats};
  }
  function useRevision(){const [value,setValue]=useState(revision);useEffect(()=>{listeners.add(setValue);return()=>listeners.delete(setValue);},[]);return value;}
  const filename=playback=>String(playback.title||'jizura').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'_').slice(0,100);
  async function exportArtifact({format,lines,playback={},tuning={},options={},audioSignals,signal,onProgress,file}){
    if(!lines?.length)throw new Error('没有可导出的同步歌词');
    const size=[480,720,1080,1440].includes(Number(options.res))?Number(options.res):720;
    const fps=[24,30,60].includes(Number(options.fps))?Number(options.fps):30;
    const aspect=['16:9','9:16','1:1','4:3'].includes(options.aspect)?options.aspect:'16:9';
    const project=FoliaJizuraStage.nativeProjectFor(lines,playback,tuning);
    Object.assign(project,{res:size,fps,aspect,includeAudio:options.includeAudio!==false});
    const [w,h]=J.outputSize(project);
    const sourceAudio=current?.uri===playback.uri?current.audio:null;
    const audio=timeline(playback.uri,Number(tuning.beatResponse??1),tuning)||audioSignals?.nativeTimeline?.(Number(tuning.beatResponse??1))||null;
    const plan=FoliaJizuraStage.buildPlan(lines,playback,tuning,w,h,audio);plan.fps=fps;
    const start=Math.max(0,Number(options.from)||0),end=Number(options.to)>0?Math.min(plan.duration,Number(options.to)):plan.duration;
    if(end<=start)throw new Error('导出结束时间须晚于开始时间');
    const range={t0:start,t1:end};
    if(tuning.onlineFonts)await J.ensureFonts(lines.map(line=>line.text).join(''),J.fontsOfPlan(plan));
    if(signal?.aborted)throw new Error('已取消');
    const name=filename(playback);
    if(format==='ae')return {name:name+'-ae.json',blob:new Blob([JSON.stringify(J.planForAE(plan,project,range),null,2)],{type:'application/json'})};
    if(format==='lrc'){
      const selected=project.foliaSourceLines.map((line,index)=>({line,index})).filter(({line})=>line.endMs/1000>start&&line.startMs/1000<end);
      const text=selected.length?J.lrcText(project,null,{from:selected[0].index,to:selected[selected.length-1].index,t0:start}):'';
      return {name:name+'.lrc',blob:new Blob([text],{type:'text/plain;charset=utf-8'})};
    }
    if(format==='wav'){
      if(!sourceAudio)throw new Error('WAV 导出需要先导入本地音频');
      return {name:name+'.wav',blob:J.audioWav(sourceAudio.buffer,end-start,start)};
    }
    if(format==='mp4'){
      const result=await J.exportMP4({plan,project,audio:sourceAudio,range,signal,onProgress,file,quality:options.quality||'high'});
      return {name:name+'.mp4',blob:result.blob,note:result.audioWanted&&!result.audio?'当前编码器未写入音轨，可另导出 WAV':''};
    }
    if(['png','alpha','layers'].includes(format)){
      const frames=Math.ceil((end-start)*fps)*(format==='layers'?2:1);
      if(frames>3600)throw new Error('PNG 序列一次最多导出 3600 张，请缩小时间范围');
      return {name:name+'-'+format+'.zip',blob:await J.exportPNGZip({plan,project,range,signal,onProgress,transparent:format==='alpha',layers:format==='layers'})};
    }
    throw new Error('不支持的导出格式');
  }
  function Settings({tuning={},onChange,lines=[],playback={},audioSignals}){
    useRevision();
    const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[progress,setProgress]=useState(0);
    const [format,setFormat]=useState('mp4');
    const controller=useRef(null),latest=useRef(playback.uri);latest.current=playback.uri;
    const options=tuning.exportOptions||{};
    const change=patch=>onChange({...tuning,...patch});
    const setOption=patch=>change({exportOptions:{...options,...patch}});
    useEffect(()=>()=>controller.current?.abort(),[]);
    useEffect(()=>{controller.current?.abort();setMessage('');},[playback.uri]);
    const work=async task=>{
      if(controller.current)return;
      const uri=playback.uri,abort=new AbortController();controller.current=abort;setBusy(true);setProgress(0);setMessage('');
      try{await task(abort,uri);}catch(error){if(latest.current===uri)setMessage(abort.signal.aborted?'已取消':String(error.message||error));}
      finally{controller.current=null;setBusy(false);}
    };
    const imported=current?.uri===playback.uri?current.audio:null;
    const chooseAudio=event=>{const file=event.target.files?.[0];event.target.value='';if(file)work(async(abort,uri)=>{
      const result=await importAudio(uri,file);
      if(latest.current===uri)setMessage(result.persisted?'本地音频已分析并保存': '音频已分析，但本机存储失败，重启后需重新导入');
    });};
    const runExport=()=>work(async(abort,uri)=>{
      let file;
      try {
        if(format==='mp4'&&options.directFile&&typeof showSaveFilePicker==='function'){
          const handle=await showSaveFilePicker({suggestedName:filename(playback)+'.mp4',types:[{description:'MP4',accept:{'video/mp4':['.mp4']}}]});
          file=await handle.createWritable();
        }
        const result=await exportArtifact({format,lines,playback,tuning,options,audioSignals,signal:abort.signal,onProgress:value=>setProgress(value),file});
        if(abort.signal.aborted||latest.current!==uri)return;
        if(result.blob)await J.saveFile(result.name,result.blob);
        setProgress(1);setMessage(result.note||'导出完成');
      }catch(error){if(file)try{await file.abort();}catch{}if(error.name==='AbortError')setMessage('已取消');else throw error;}
    });
    return h('details',{className:'folia-jizura-media'},h('summary',null,'本地音频与离线导出'),
      h('label',null,'本地音频',h('input',{type:'file',accept:'audio/*',disabled:busy,onChange:chooseAudio})),
      imported&&h('output',null,`${imported.name} · ${imported.duration.toFixed(1)}s · ${imported.bpm} BPM`),
      h('button',{type:'button',disabled:busy||!playback.uri,onClick:()=>work(async(abort,uri)=>{const audio=await restoreAudio(uri);if(latest.current===uri)setMessage(audio?'本曲音频已恢复':'本曲没有保存的音频');})},'恢复本曲音频'),
      h('button',{type:'button',disabled:busy||!playback.uri,onClick:()=>work(async(abort,uri)=>{await forgetAudio(uri);if(latest.current===uri)setMessage('已移除本曲音频');})},'移除本曲音频'),
      h('label',null,'BPM',h('input',{type:'number',min:0,max:300,step:.1,value:tuning.localBpm||0,onChange:e=>change({localBpm:Math.max(0,Math.min(300,Number(e.target.value)||0))})})),
      h('label',null,'首拍（秒）',h('input',{type:'number',min:0,max:60,step:.01,value:tuning.localBeatOffset||0,onChange:e=>change({localBeatOffset:Math.max(0,Math.min(60,Number(e.target.value)||0))})})),
      h('label',null,'导出格式',h('select',{value:format,onChange:e=>setFormat(e.target.value)},[['mp4','MP4'],['png','PNG 序列'],['alpha','透明 PNG 序列'],['layers','分层 PNG 序列'],['ae','After Effects JSON'],['lrc','LRC'],['wav','本地音频 WAV']].map(([value,label])=>h('option',{key:value,value},label)))),
      ...[['res','分辨率',[480,720,1080,1440],720],['fps','帧率',[24,30,60],30],['aspect','画幅',['16:9','9:16','1:1','4:3'],'16:9'],['quality','画质',['normal','high','max'],'high']].map(([key,label,values,fallback])=>h('label',{key},label,h('select',{value:options[key]||fallback,onChange:e=>setOption({[key]:e.target.value})},values.map(value=>h('option',{key:value,value},String(value)))))),
      ...[['from','开始（秒）'],['to','结束（秒，0 为末尾）']].map(([key,label])=>h('label',{key},label,h('input',{type:'number',min:0,step:.1,value:options[key]||0,onChange:e=>setOption({[key]:Math.max(0,Number(e.target.value)||0)})}))),
      h('label',null,h('input',{type:'checkbox',checked:options.includeAudio!==false,onChange:e=>setOption({includeAudio:e.target.checked})}),'包含本地音轨'),
      format==='mp4'&&typeof showSaveFilePicker==='function'&&h('label',null,h('input',{type:'checkbox',checked:!!options.directFile,onChange:e=>setOption({directFile:e.target.checked})}),'直接写入 MP4 文件'),
      h('button',{type:'button',disabled:busy||!lines.length,onClick:runExport},'导出'),
      busy&&h('button',{type:'button',onClick:()=>controller.current?.abort()},'取消'),
      busy&&h('progress',{max:1,value:progress,'aria-label':'JIZURA 导出进度'}),
      message&&h('output',{role:'status'},message)
    );
  }
  return {Settings,timeline,useRevision,importAudio,restoreAudio,forgetAudio,exportArtifact};
})();
