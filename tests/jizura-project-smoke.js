const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const store=new Map();let quota=false;
const canvas=()=>{
  const cv={width:16,height:16,toBlob:callback=>callback(new Blob([new Uint8Array([137,80,78,71])],{type:'image/png'}))};
  const backing=Object.assign(Object.create({drawImage(){},fillRect(){},clearRect(){}}),{canvas:cv,getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0}),measureText:text=>({width:String(text).length*60}),getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})});
  const ctx=new Proxy(backing,{get:(o,k)=>k in o?o[k]:()=>{}});
  cv.getContext=()=>ctx;return cv;
};
const dbValues=new Map();
const indexedDB={open:()=>{
  const request={};queueMicrotask(()=>{request.result={transaction:()=>{
    const tx={};tx.objectStore=()=>Object.fromEntries(['get','put','delete'].map(method=>[method,(value,key)=>{
      const result={};queueMicrotask(()=>{if(method==='put')dbValues.set(key,value);if(method==='delete')dbValues.delete(value);result.result=method==='get'?dbValues.get(value):undefined;result.onsuccess?.();tx.oncomplete?.();});return result;
    }]));return tx;}};request.onsuccess?.();});return request;
}};
class TestAudioContext {
  async decodeAudioData(){const samples=Float32Array.from({length:16000},(_,i)=>Math.sin(i/8)*(.2+.1*Math.sin(i/128)));return {sampleRate:8000,length:samples.length,numberOfChannels:1,duration:2,getChannelData:()=>samples};}
  close(){}
}
const context=vm.createContext({console:{...console,warn:()=>{}},Intl,Blob,File,TextEncoder,AbortController,setTimeout,clearTimeout,indexedDB,AudioContext:TestAudioContext,
  document:{createElement:canvas},localStorage:{getItem:key=>store.get(key)||null,setItem:(key,value)=>{if(quota)throw new Error('quota');store.set(key,value);}},
  Spicetify:{React:{createElement:(type,props,...children)=>({type,props,children}),useEffect:()=>{},useMemo:f=>f(),useRef:value=>({current:value}),useState:value=>[value,()=>{}]}}});
for(const file of ['core.js','jizura-engine.js','folia-jizura-native.js','folia-jizura-media.js'])vm.runInContext(fs.readFileSync('prototype/folia-stage/'+file,'utf8'),context);
const [core,J,api,media]=vm.runInContext('[FoliaStageCore,FoliaJizuraEngine,FoliaJizuraStage,FoliaJizuraMedia]',context);
const clean=value=>JSON.parse(JSON.stringify(value));
const lines=[{text:'We are satellites chasing the light',startMs:1000,endMs:9000,words:[{text:'We',startMs:1000},{text:'are',startMs:2000},{text:'satellites',startMs:3000},{text:'chasing',startMs:5000},{text:'the',startMs:6000},{text:'light',startMs:7000}]},{text:'Across the sky',startMs:10000,endMs:15000}];
const playback={uri:'spotify:track:test',title:'Test',durationMs:15000};
const font=Object.keys(J.FONTS)[0];
const tuning={nativeTheme:'pop',nativeStyle:J.STYLE_ORDER[0],nativeSeed:9876,nativeFx:{motion:.91,density:.88,koma:8},colors:{enabled:true,accentOn:true,bg:'#123456',fg:'#eeeeee',accent:'#abcdef'},fontRoles:{display:font,mono:font},centerFree:true,centerDir:'lr',keyBg:'black',
  overrides:{0:{cuts:2,cutTime:{1:4.2},cutTech:{1:{decor:'none',trans:'none'}},layout:'center'}},sourceMarkup:{0:{manual:['We are satellites','chasing the light'],emph:['satellites'],impact:true}},locks:{tech:{layout:true},params:{motion:true}},techniques:{layout:'type'}};
const project=api.nativeProjectFor(lines,playback,tuning);
assert.equal(project.seed,9876);assert.equal(project.colors.bg,'#123456');assert.equal(project.colors.enabled,true);assert.equal(project.fonts.mono,font);
assert.equal(project.overrides[0].layout,'center','line selection must win over global forced technique');
assert.equal(project.overrides[0].cutTech[1].decor,'none');
const imported=api.tuningFromNativeProject(project,lines);
assert.equal(imported.importReport.matched,2);assert.equal(imported.nativeSeed,9876);assert.equal(imported.nativeFx.motion,.91);
assert.deepEqual(clean(imported.sourceMarkup[0]),tuning.sourceMarkup[0]);
assert.equal(imported.fontRoles.mono,font);
assert.equal(api.tuningFromNativeProject(project,[lines[1],{...lines[0],text:'Different song'}]).importReport.matched,1);
assert.equal(Object.keys(api.tuningFromNativeProject(project,[{text:'No match',startMs:0}]).overrides).length,0);
const plan=api.buildPlan(lines,playback,tuning,800,450);
const first=plan.cuts.filter(cut=>cut.line===0&&cut.utext!=null);
assert.equal(first[1].start,5.2,'manual cut time must not be overwritten by word timing');
assert.equal(first[1].decor.length,0);
assert.equal(plan.lines[0].impact,true);
const retimed={...tuning,lineTimes:{0:2,1:11}};
const shifted=api.timedSourceLines(lines,retimed);
assert.equal(shifted[0].startMs,2000);assert.equal(shifted[0].words[0].startMs,2000);
assert.equal(lines[0].startMs,1000,'retiming must not mutate source lyrics');
const retimedPlan=api.buildPlan(lines,playback,retimed,800,450);
assert.equal(retimedPlan.lines[0].start,2);assert.equal(retimedPlan.lines[1].start,11);
assert.equal(retimedPlan.duration,15,'retiming must not extend the Spotify track duration');
assert.deepEqual(clean(api.tuningFromNativeProject(api.nativeProjectFor(lines,playback,retimed),lines).lineTimes),retimed.lineTimes);
assert.equal(api.tuningFromNativeProject(api.nativeProjectFor(lines,playback,retimed),[lines[1]]).lineTimes[0],11,'retiming must follow matched text');
const crossed=api.timedSourceLines(lines,{lineTimes:{0:12,1:5}});
assert(crossed[1].startMs>crossed[0].startMs,'retiming cannot reverse lyric order');
const invalidMarkup=api.buildPlan(lines,playback,{sourceMarkup:{0:{manual:['Missing all words']}}});
assert(!invalidMarkup.cuts.some(cut=>cut.utext==='Missing all words'));
const snapshot=J.lineSnapshot(plan,0);
const locked={...tuning,overrides:{0:{lock:true,lockedCuts:snapshot,lockedSeed:plan.lines[0].seed}}};
const held=api.buildPlan(lines,playback,locked,800,450);
assert.deepEqual(clean(held.cuts.find(cut=>cut.line===0).params),clean(snapshot[0].params));
assert.doesNotThrow(()=>api.buildPlan(lines,playback,{overrides:{0:{lock:true,lockedCuts:[{utext:lines[0].text,layout:'center',params:null}]}}}));
const randomized=api.randomizeTuning(tuning,lines,playback);
assert.equal(randomized.nativeFx.motion,.91);assert.equal(randomized.techniques.layout,'type');assert.equal(randomized.overrides,tuning.overrides);
for(const value of [null,[],{}, {version:2,lyrics:'x',fx:{}}])assert.throws(()=>api.tuningFromNativeProject(value,lines));
assert.throws(()=>api.tuningFromNativeProject({...project,fx:{motion:Infinity}},lines),/无效数值/);
assert.throws(()=>api.validateData(JSON.parse('{"__proto__":{"polluted":true}}')),/不安全/);
assert.equal({}.polluted,undefined);
const saved=core.setJizuraProject(playback.uri,{tuning,sourceLines:lines});
assert.equal(core.getJizuraProject(playback.uri).tuning.colors.bg,'#123456');saved.tuning.colors.bg='#000000';
assert.equal(core.getJizuraProject(playback.uri).tuning.colors.bg,'#123456','storage must not alias drafts');
const exported=core.exportJizuraProject(playback.uri);core.removeJizuraProject(playback.uri);assert.equal(core.getJizuraProject(playback.uri),null);
core.importJizuraProject(playback.uri,exported);assert.equal(core.getJizuraProject(playback.uri).tuning.nativeSeed,9876);
assert.throws(()=>core.setJizuraProject('__proto__',{tuning:{}}));
assert.throws(()=>core.importJizuraProject(playback.uri,{...exported,project:JSON.parse('{"tuning":{"constructor":{}}}')}),/不安全/);
quota=true;assert.throws(()=>core.setJizuraProject(playback.uri,{tuning:{}}),/保存失败/);assert.throws(()=>core.removeJizuraProject(playback.uri),/删除失败/);quota=false;
const projectKey=[...store.keys()].find(key=>store.get(key).includes('spotify:track:test'));
assert(projectKey);
for(const corrupt of ['null','[]','42','"broken"']){
  store.set(projectKey,corrupt);assert.equal(core.getJizuraProject(playback.uri),null);
  core.setJizuraProject(playback.uri,{tuning});assert.equal(core.getJizuraProject(playback.uri).tuning.nativeSeed,9876);
}
let changed;
const ui=api.Settings({tuning,onChange:value=>{changed=value;},lines,playback});
const elements=[];const walk=node=>{if(Array.isArray(node))return node.forEach(walk);if(node&&typeof node==='object'){elements.push(node);node.children?.forEach(walk);}};walk(ui);
assert(elements.some(el=>el.type===media.Settings),'media workflow is present');
const motionSlider=elements.find(el=>el.type==='label'&&el.children?.[0]?.startsWith?.('运动幅度'))?.children?.[1];
assert(motionSlider);motionSlider.props.onChange({target:{value:'1.3'}});assert.equal(changed.motionIntensity,1.3);assert.equal(changed.nativeFx.motion,undefined);
const reline=elements.find(el=>el.type==='button'&&el.children[0]==='重排本行');reline.props.onClick();assert.equal(changed.overrides[0].lock,false);
const toolNode=elements.find(el=>el.type?.name==='EditorTools');assert(toolNode);
const toolTree=toolNode.type({...toolNode.props,playback:{...playback,progressMs:2500}});
elements.length=0;walk(toolTree);
const timeSlider=elements.find(el=>el.props?.['aria-label']==='JIZURA 第 1 行开始时间');
timeSlider.props.onPointerUp({currentTarget:{value:'2.3'}});assert.equal(changed.lineTimes[0],2.3);
timeSlider.props.onKeyDown({key:'Home',preventDefault(){}});assert.equal(changed.lineTimes[0],0);
elements.find(el=>el.type==='button'&&el.children[0]==='记录当前进度').props.onClick();assert.equal(changed.lineTimes[0],2.5);
elements.find(el=>el.type==='button'&&el.children[0]==='恢复源时间轴').props.onClick();assert.deepEqual(clean(changed.lineTimes),{});
elements.find(el=>el.type==='button'&&el.children[0]==='应用此效果').props.onClick();assert(J.LAYOUTS[changed.techniques.layout]);
async function main(){
  const file=new File([new Uint8Array([1,2,3])],'audio.wav',{type:'audio/wav'});
  const result=await media.importAudio(playback.uri,file);assert.equal(result.persisted,true);
  assert.equal(media.timeline(playback.uri,1).energy.length,100);assert.equal(media.timeline('spotify:track:other'),null);
  assert.equal(media.timeline(playback.uri,0).energy.every(value=>value===0),true);
  assert.deepEqual(clean(media.timeline(playback.uri).beats),clean(result.audio.beats),'preserve analyzed beat phase by default');
  assert.equal(media.timeline(playback.uri,1,{localBpm:120}).beats[1],.5);
  for(const format of ['ae','lrc','wav','png','alpha','layers']){
    const output=await media.exportArtifact({format,lines,playback,tuning,options:{res:480,fps:24,from:1,to:1.1}});
    assert(output.blob.size>0,format);
    if(['png','alpha','layers'].includes(format)){const data=new DataView(await output.blob.arrayBuffer());assert.equal(data.getUint32(0,true),0x04034b50);}
    if(format==='ae')assert.equal(JSON.parse(await output.blob.text()).version,2);
  }
  const abort=new AbortController();abort.abort();
  const partialLrc=await media.exportArtifact({format:'lrc',lines,playback,tuning:{},options:{from:2,to:3}});
  const partialText=await partialLrc.blob.text();
  assert(partialText.includes(lines[0].text),'range export must include the overlapping lyric line');
  assert(!partialText.includes(lines[1].text),'range export must exclude later lines');
  await assert.rejects(()=>media.exportArtifact({format:'png',lines,playback,signal:abort.signal}),/取消/);
  await assert.rejects(()=>media.exportArtifact({format:'mp4',lines,playback}),/WebCodecs/);
  await assert.rejects(()=>media.exportArtifact({format:'png',lines,playback,options:{from:10,to:1}}),/结束时间/);
  await media.forgetAudio(playback.uri);assert.equal(media.timeline(playback.uri),null);assert.equal(await media.restoreAudio(playback.uri),null);
  console.log('JIZURA project/media smoke passed: native roundtrip, text matching, manual timing, snapshots, locks, storage safety, settings, local analysis and 6 export formats.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
