const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

async function main() {
  const dependencyRoot = process.argv[2];
  if (!dependencyRoot) throw new Error("Usage: node tools/preview-jizura.cjs <path-to-node_modules> [port]");
  const root = path.resolve(__dirname, "..");
  const esbuild = require(path.join(path.resolve(dependencyRoot), "esbuild"));
  const stage = fs.readFileSync(path.join(root, "prototype/folia-stage/jizura-engine.js"), "utf8") + '\n' + fs.readFileSync(path.join(root, "prototype/folia-stage/folia-jizura-native.js"), "utf8");
  const updates = fs.readFileSync(path.join(root, 'prototype/folia-stage/upstream-updates.js'), 'utf8');
  const media = fs.readFileSync(path.join(root, 'prototype/folia-stage/folia-jizura-media.js'), 'utf8');
  const entry = `
    import React from 'react';
    import {createRoot} from 'react-dom/client';
    const Spicetify = {React};
    ${stage}
    ${media}
    ${updates}
    const J=FoliaJizuraEngine;
    function Preview() {
      const [time, setTime] = React.useState(1000);
      const [paused, setPaused] = React.useState(false);
      const [size, setSize] = React.useState('desktop');
      const [long, setLong] = React.useState(false);
      const [chinese, setChinese] = React.useState(false);
      const [options, setOptions] = React.useState(false);
      const [tuning, setTuning] = React.useState({});
      const scene=tuning.nativeTheme||'lyricpv';
      Spicetify.Player={getProgress:()=>time,seek:setTime};
      const playback={uri:'spotify:track:preview',title:'Preview',durationMs:20000,progressMs:time,paused};
      const [benchmark, setBenchmark] = React.useState('');
      const measure = () => {
        const plan=FoliaJizuraStage.buildPlan(lines,{}, {...tuning,nativeTheme:scene,techniques:{...tuning.techniques,trans:tuning.techniques?.trans||J.order('trans').find(k=>k!=='none')}},800,450);
        const cut=plan.cuts.find(c=>c.trans && c.index>0 && Math.abs(plan.cuts[c.index-1].end-c.start)<.06);
        if(!cut){setBenchmark('No transition fixture');return;}
        const samples=Array.from({length:24},(_,i)=>cut.start+(cut.transDur||.35)*(i+1)/26);
        const run=(Renderer,reference)=>{
          const cv=document.createElement('canvas');cv.width=800;cv.height=450;
          const ctx=cv.getContext('2d'),renderer=new Renderer();
          if(reference){renderer.grain=reference.grain;renderer.paperCache=reference.paperCache;}
          renderer.frame(ctx,plan,Math.max(0,cut.start-.1),{scale:800/plan.W});
          const times=[];
          for(const t of samples){const start=performance.now();renderer.frame(ctx,plan,t,{scale:800/plan.W});times.push(performance.now()-start);}
          const pixels=ctx.getImageData(0,0,800,450).data;
          const hits=renderer.cacheHits||0;
          return {mean:times.reduce((a,b)=>a+b)/times.length,hits,pixels,renderer};
        };
        const native=run(J.Renderer),cached=run(FoliaJizuraStage.TransitionRenderer,native.renderer);
        let differingChannels=0,coverage=false;
        for(let i=0;i<cached.pixels.length;i++){
          if(native.pixels[i]!==cached.pixels[i])differingChannels++;
          if(i%4===3&&cached.pixels[i]>0)coverage=true;
        }
        cached.renderer.dispose();native.renderer.paperCache.clear();
        setBenchmark(JSON.stringify({nativeMs:native.mean,cachedMs:cached.mean,hits:cached.hits,nonblank:coverage,differingChannels}));
      };
      React.useEffect(() => {
        if (paused) return;
        let previous = performance.now();
        const id = setInterval(() => { const now = performance.now(); setTime(t => 1000 + (t - 1000 + now - previous) % 19000); previous = now; }, 32);
        return () => clearInterval(id);
      }, [paused]);
      const text = chinese ? '穿过人海去拥抱每一道还没有熄灭的光' : long ? 'Every moment we remember is a constellation moving through the silence and we keep on running toward the light together until the morning finds us again' : 'We are satellites chasing the light';
      const lines = React.useMemo(() => [{text, startMs: 1000, endMs: 15000, translation: 'A new constellation'}, {text: chinese ? '让所有未完成的梦在黎明重新发亮' : 'Across the sky', startMs: 15000, endMs: 20000}], [text,chinese]);
      const signals = React.useMemo(() => ({nativeTimeline: response => ({duration:20,energyRate:12,energy:Array.from({length:241},(_,i)=>Math.min(1,(.35+.3*Math.sin(i/7)+.35*(i%12===0))*response)),beats:Array.from({length:40},(_,i)=>i/2)})}), []);
      const sizes = {desktop: {width: 'min(1200px, 100%)', height: 'min(720px, 100%)'}, mobile: {width: 390, height: 'min(680px, 100%)'}, short: {width: 'min(800px, 100%)', height: 360}, fullscreen: {width: '100%', height: '100%'}};
      return React.createElement(React.Fragment, null,
        React.createElement('nav', null,
          React.createElement('button', {onClick: () => setPaused(p => !p)}, paused ? 'Resume' : 'Pause'),
          React.createElement('select', {'aria-label': 'Size', value: size, onChange: e => setSize(e.target.value)}, Object.keys(sizes).map(s => React.createElement('option', {key: s}, s))),
          React.createElement('select', {'aria-label': 'Theme', value: scene, onChange: e => setTuning(t=>({...t,nativeTheme:e.target.value}))}, ['lyricpv', 'kinetic', 'wa', 'horror', 'pop', 'ballad'].map(s => React.createElement('option', {key: s}, s))),
          React.createElement('button', {onClick: () => setLong(p => !p)}, long ? 'Short lyrics' : 'Long lyrics'),
          React.createElement('button', {onClick: () => setChinese(p => !p)}, chinese ? 'English' : 'Chinese'),
          React.createElement('button', {onClick: () => setTime(8500)}, 'First line'),
          React.createElement('button', {onClick: () => setTime(16500)}, 'Last line'),
          React.createElement('button', {onClick: () => setOptions(v=>!v)}, 'Settings'),
          React.createElement('button', {onClick: measure}, 'Benchmark transitions'),
          React.createElement('input', {type:'range','aria-label':'Seek',min:1000,max:20000,value:time,onChange:e=>setTime(Number(e.target.value))}),
          React.createElement('output', null, (time/1000).toFixed(1)+'s'),
          React.createElement('output', {'aria-label':'Benchmark result'}, benchmark)),
        React.createElement('main', {style: {...sizes[size], maxWidth: '100%', position: 'relative'}},
          React.createElement(FoliaJizuraStage.JizuraStage, {playback, lyrics: {lines}, activeIndex: 0, timeMs: time, visible: true, showTranslation: true, audioSignals: signals, settings: {jizuraTuning: tuning}})),
          options && React.createElement('aside',{style:{position:'absolute',right:0,top:100,bottom:0,width:320,maxWidth:'100%',overflow:'auto',background:'#181818',padding:16}},React.createElement(FoliaJizuraStage.Settings,{tuning,onChange:setTuning,lines,playback,audioSignals:signals}),React.createElement(FoliaUpstreamUpdates.Settings)));
    }
    createRoot(document.getElementById('root')).render(React.createElement(Preview));
  `;
  const bundle = await esbuild.build({stdin: {contents: entry, resolveDir: path.resolve(dependencyRoot)}, bundle: true, write: false, format: "iife", platform: "browser", define: {"process.env.NODE_ENV": '"development"'}});
  const server = http.createServer((req, res) => {
    if (req.url === "/preview.js") { res.setHeader("Content-Type", "text/javascript"); res.end(bundle.outputFiles[0].text); }
    else if (req.url === "/style.css") { res.setHeader("Content-Type", "text/css"); res.end(fs.readFileSync(path.join(root, "prototype/folia-stage/style.css"))); }
    else { res.setHeader("Content-Type", "text/html"); res.end('<!doctype html><meta charset="utf-8"><title>JIZURA Preview</title><link rel="stylesheet" href="/style.css"><style>*{box-sizing:border-box}html,body,#root{width:100%;height:100%;margin:0;overflow:hidden;background:#111;color:white;font-family:Arial}#root{display:grid;grid-template-rows:auto minmax(0,1fr)}nav{min-width:0;min-height:52px;display:flex;gap:8px;align-items:center;padding:8px 12px;flex-wrap:wrap}button,select,input{height:30px}main{margin:auto;min-height:0;max-height:100%;overflow:hidden}</style><div id="root"></div><script src="/preview.js"></script>'); }
  });
  server.listen(Number(process.argv[3]) || 4179, "127.0.0.1", () => console.log("JIZURA preview: http://127.0.0.1:" + server.address().port));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
