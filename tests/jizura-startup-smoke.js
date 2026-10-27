const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
let elements = 0;
let hooks;
const canvas = () => {
  const cv = {width: 1280, height: 720, getBoundingClientRect: () => ({width:1280,height:720})};
  const ctx = new Proxy({canvas:cv,measureText:text=>({width:String(text).length*60})}, {get:(object,key)=>key in object?object[key]:()=>{}});
  cv.getContext = () => ctx;
  return cv;
};
const context = vm.createContext({console,Intl,setTimeout,clearTimeout,devicePixelRatio:1,
ResizeObserver:class {observe(){} disconnect(){}},
document:{createElement:canvas,querySelector:canvas},Spicetify:{React:{
  createElement:(type,props,...children)=>{elements++;return {type,props:props||{},children};},
  useEffect:(callback,deps)=>hooks?.effect(callback,deps),
  useMemo:(callback,deps)=>hooks?hooks.memo(callback,deps):callback(),
  useRef:value=>hooks?hooks.ref(value):{current:value},
  useState:value=>hooks?hooks.state(value):[typeof value==='function'?value():value,()=>{}],
}},FoliaJizuraMedia:{useRevision:()=>0,timeline:()=>null,Settings:()=>null}});
for(const file of ['jizura-engine.js','release-config.js','core.js','folia-jizura-native.js']) {
  vm.runInContext(fs.readFileSync(`prototype/folia-stage/${file}`,'utf8'),context);
}
const api = vm.runInContext('FoliaJizuraStage',context);
const engine = vm.runInContext('FoliaJizuraEngine',context);
const defaults = vm.runInContext('FoliaStageCore.DEFAULT_SETTINGS.jizuraTuning',context);
const lines = Array.from({length:48},(_,index)=>({text:`We are running through the city tonight ${index}`,startMs:index*4000,endMs:index*4000+3500}));
let plannerCalls=0;
const originalPlan=engine.plan;
engine.plan=(...args)=>{plannerCalls++;return originalPlan(...args);};
const started=performance.now();
const tree=api.Settings({tuning:defaults,onChange:()=>{},lines,playback:{uri:'test:song',title:'Startup regression',durationMs:200000}});
console.log(JSON.stringify({settingsMs:Math.round(performance.now()-started),elements,plannerCalls,lines:lines.length}));
assert(tree);
assert.equal(plannerCalls,0,'Closed settings must not build a lyric plan');
assert(elements<500,'Closed settings must not construct hidden effect options');

function harness() {
  const slots=[];
  let cursor=0;
  const effects=[];
  const same=(a,b)=>a&&b&&a.length===b.length&&a.every((value,index)=>Object.is(value,b[index]));
  return {
    run(callback){cursor=0;hooks=this;try{return callback();}finally{hooks=null;}},
    state(initial){const i=cursor++;if(!slots[i])slots[i]={value:typeof initial==='function'?initial():initial};return [slots[i].value,value=>{slots[i].value=typeof value==='function'?value(slots[i].value):value;}];},
    ref(initial){const i=cursor++;return slots[i]??(slots[i]={current:initial});},
    memo(callback,deps){const i=cursor++;if(!slots[i]||!same(slots[i].deps,deps))slots[i]={deps,value:callback()};return slots[i].value;},
    effect(callback,deps){const i=cursor++;if(!slots[i]||!same(slots[i].deps,deps)){slots[i]={deps};effects.push(callback);}},
    flush(){return effects.splice(0).map(callback=>callback()).filter(value=>typeof value==='function');},
  };
}
function nodes(root,predicate) {
  const found=[];
  function visit(node){if(Array.isArray(node)){node.forEach(visit);return;}if(!node||typeof node!=='object')return;if(predicate(node))found.push(node);visit(node.children);}
  visit(root);return found;
}
const sections=nodes(tree,node=>typeof node.props?.renderContent==='function');
assert(sections.length>=6,'Advanced settings must remain available');
const section=sections[0];
const lazy=harness();
let calls=0;
const lazyProps={...section.props,children:section.children,renderContent:()=>{calls++;return section.props.renderContent();}};
let details=lazy.run(()=>section.type(lazyProps));
assert.equal(calls,0);
details.props.onToggle({currentTarget:{open:true}});
details=lazy.run(()=>section.type(lazyProps));
assert.equal(calls,1,'Opening a section must construct its controls');
assert(nodes(details,node=>node.type==='input').length>0);

// Editing is still available, but per-line and per-cut controls stay deferred.
const settingsHooks=harness();
const settingsProps={tuning:defaults,onChange:()=>{},lines:lines.slice(0,2),playback:{uri:'test:editor',durationMs:10000}};
let editorTree=settingsHooks.run(()=>api.Settings(settingsProps));
let lineSection=nodes(editorTree,node=>typeof node.props?.renderContent==='function').find(node=>{
  const content=node.props.renderContent;
  return content.toString().includes('lines.map(lineEditor)');
});
assert(lineSection);
lineSection.props.onToggle({currentTarget:{open:true}});
editorTree=settingsHooks.run(()=>api.Settings(settingsProps));
lineSection=nodes(editorTree,node=>typeof node.props?.renderContent==='function').find(node=>node.props.renderContent.toString().includes('lines.map(lineEditor)'));
const lineNodes=lineSection.props.renderContent();
assert.equal(lineNodes.length,2);
assert.equal(nodes(lineNodes,node=>node.type==='option').length,0,'Closed lines must not allocate effect choices');
const lineContent=lineNodes[0].props.renderContent();
assert(nodes(lineContent,node=>node.type==='option').length>100,'All native choices must remain available when a line opens');
const cuts=nodes(lineContent,node=>typeof node.props?.renderContent==='function');
assert(cuts.length>0);
assert(nodes(cuts[0].props.renderContent(),node=>node.type==='option').length>100);

plannerCalls=0;
const stageHooks=harness();
const stageProps={lyrics:{lines:lines.slice(0,2)},settings:{jizuraTuning:defaults},playback:{uri:'test:stage',durationMs:10000}};
let stage=stageHooks.run(()=>api.JizuraStage(stageProps));
assert.equal(plannerCalls,0,'Mount must wait for real canvas dimensions');
const cv=nodes(stage,node=>node.type==='canvas')[0];
cv.props.ref.current=canvas();
const cleanups=stageHooks.flush();
stage=stageHooks.run(()=>api.JizuraStage(stageProps));
assert.equal(plannerCalls,1,'Measured mount must build only one plan');
stageHooks.run(()=>api.JizuraStage({...stageProps,timeMs:1000}));
assert.equal(plannerCalls,1,'Playback ticks must not replan');
cleanups.forEach(cleanup=>cleanup());
console.log('JIZURA startup, lazy editors and measured initialization passed');
