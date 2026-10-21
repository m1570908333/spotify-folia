const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const slots=[],effects=[],storage=new Map(),events=new Map(),notices=[];
let cursor=0,dirty=true,tree;
const same=(a,b)=>a&&b&&a.length===b.length&&a.every((value,index)=>Object.is(value,b[index]));
const React={
  createElement:(type,props,...children)=>({type,props:props||{},children}),
  useState:initial=>{
    const index=cursor++;
    if(!slots[index])slots[index]={value:typeof initial==='function'?initial():initial};
    return [slots[index].value,value=>{const next=typeof value==='function'?value(slots[index].value):value;if(!Object.is(next,slots[index].value)){slots[index].value=next;dirty=true;}}];
  },
  useRef:value=>{const index=cursor++;if(!slots[index])slots[index]={current:value};return slots[index];},
  useMemo:(factory,deps)=>{const index=cursor++;if(!slots[index]||!same(slots[index].deps,deps))slots[index]={deps,value:factory()};return slots[index].value;},
  useEffect:(effect,deps)=>{const index=cursor++;if(!slots[index]||!same(slots[index].deps,deps)){const previous=slots[index];slots[index]={deps};effects.push(()=>{previous?.cleanup?.();slots[index].cleanup=effect();});}},
};
const player={data:{item:{uri:'spotify:track:first',name:'First'},isPaused:true},getDuration:()=>15000,getProgress:()=>1000,
  addEventListener:(key,callback)=>events.set(key,callback),removeEventListener:key=>events.delete(key)};
const lyrics={lines:[{text:'Across the sky',startMs:1000,endMs:15000}],provider:'fixture'};
const context=vm.createContext({console,Intl,React,performance:{now:()=>0},setTimeout,clearTimeout,
  requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{},window:{confirm:()=>true},
  document:{hidden:false,addEventListener:()=>{},removeEventListener:()=>{}},
  localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},
  Spicetify:{React,Player:player,CosmosAsync:{get:async()=>({})},showNotification:(...args)=>notices.push(args)},
  FoliaStageProviders:{load:async()=>({document:lyrics,errors:[]})},FoliaAudioSignals:{create:()=>({})},
  FoliaStageVisualizers:{has:()=>true,render:()=>({type:'stage'}),modes:[{id:'jizura',kind:'canvas'}]},
  FoliaUpstreamUpdates:{watch:()=>()=>{}},
});
vm.runInContext(fs.readFileSync('prototype/folia-stage/core.js','utf8'),context);
const core=vm.runInContext('FoliaStageCore',context);
core.saveSettings({...core.DEFAULT_SETTINGS,mode:'jizura'});
core.setJizuraProject('spotify:track:first',{tuning:{nativeTheme:'pop',overrides:{0:{single:true}},lineTimes:{0:2}}});
vm.runInContext(fs.readFileSync('prototype/folia-stage/index.js','utf8'),context);
const render=vm.runInContext('FoliaStage',context);
function all(){const out=[];function visit(node){if(Array.isArray(node))return node.forEach(visit);if(node&&typeof node==='object'&&'type'in node){out.push(node);node.children?.forEach(visit);}}visit(tree);return out;}
async function flush(){for(let i=0;i<30;i++){if(dirty){dirty=false;cursor=0;tree=render();while(effects.length)effects.shift()();}await Promise.resolve();if(!dirty&&effects.length===0){await Promise.resolve();if(!dirty)return;}}throw new Error('Render loop did not settle');}
const panel=()=>all().find(node=>node.type?.name==='SettingsPanel')?.props;
async function main(){
  await flush();
  all().find(node=>node.props?.label==='设置').props.onClick();await flush();
  assert.equal(panel().settings.jizuraTuning.nativeTheme,'pop');
  assert.equal(panel().jizuraProject.saved,true);assert.equal(panel().jizuraProject.dirty,false);
  const savedTheme=panel().settings.jizuraTuning.nativeTheme;
  panel().updateJizuraTuning({...panel().settings.jizuraTuning,nativeTheme:'wa'});await flush();
  assert.equal(panel().jizuraProject.canUndo,true);assert.equal(panel().jizuraProject.dirty,true);
  panel().onUndoJizura();await flush();assert.equal(panel().settings.jizuraTuning.nativeTheme,savedTheme);
  panel().onRedoJizura();await flush();assert.equal(panel().settings.jizuraTuning.nativeTheme,'wa');
  panel().onSaveJizuraProject();await flush();assert.equal(panel().jizuraProject.dirty,false);
  assert.equal(core.getJizuraProject(player.data.item.uri).tuning.nativeTheme,'wa');
  player.data.item={uri:'spotify:track:second',name:'Second'};events.get('songchange')();await flush();
  assert.equal(panel().jizuraProject.saved,false);assert.equal(Object.keys(panel().settings.jizuraTuning.overrides).length,0);
  assert.equal(panel().jizuraProject.canUndo,false);
  assert.equal(Object.keys(panel().settings.jizuraTuning.lineTimes).length,0,'line times must not leak across songs');
  player.data.item={uri:'spotify:track:first',name:'First'};events.get('songchange')();await flush();
  assert.equal(panel().settings.jizuraTuning.nativeTheme,'wa');assert.equal(panel().settings.jizuraTuning.overrides[0].single,true);
  assert.equal(panel().settings.jizuraTuning.lineTimes[0],2);
  panel().onRemoveJizuraProject();await flush();assert.equal(panel().jizuraProject.saved,false);
  assert.equal(Object.keys(panel().settings.jizuraTuning.overrides).length,0);
  panel().onUndoJizura();await flush();assert.equal(panel().settings.jizuraTuning.overrides[0].single,true);
  const projectInput=all().filter(node=>node.type==='input'&&node.props?.accept==='.json,application/json').at(-1);
  await projectInput.props.onChange({target:{files:[{size:10,text:async()=>'{broken json'}],value:'x'}});await flush();
  assert(notices.at(-1)[0].includes('导入失败'));
  assert.equal(panel().settings.jizuraTuning.nativeTheme,'wa');
  for(let i=0;i<45;i++)panel().updateJizuraTuning(previous=>({...previous,seed:i+1}));await flush();
  let count=0;while(panel().jizuraProject.canUndo){panel().onUndoJizura();await flush();count++;}
  assert.equal(count,40,'undo history is bounded and handles consecutive updates');
  console.log('JIZURA app smoke passed: saved/dirty state, undo/redo, rapid edits, song isolation, restoration, clear and failed import.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
