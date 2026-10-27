const FoliaJizuraStage = (() => {
  const React = Spicetify.React;
  const {useEffect, useMemo, useRef, useState} = React;
  const h = (...args) => typeof FoliaStageLocale === "undefined" ? React.createElement(...args) : FoliaStageLocale.element(React, ...args);
  const J = FoliaJizuraEngine;
  const number = (v, fallback, min, max) => Number.isFinite(Number(v)) ? Math.min(max, Math.max(min, Number(v))) : fallback;
  const hash = value => Array.from(String(value)).reduce((n, c) => Math.imul(n ^ c.codePointAt(0), 16777619), 2166136261) >>> 0;
  const GROUP_LABELS = {layout:'Layout', enter:'Entrance', hold:'Hold', exit:'Exit', decor:'Decorations', treat:'Typography', bg:'Background', cam:'Camera', fx:'Visual effects', trans:'Transitions'};
  const THEMES = {lyricpv:'Lyric PV', kinetic:'Kinetic', wa:'Japanese', horror:'Horror', pop:'Pop', ballad:'Ballad'};
  const FX_KEYS={cutSpeed:'density',motionIntensity:'motion',particleDensity:'decor',glitch:'glitch',chroma:'chroma',texture:'texture',bgSwitch:'bgSwitch',flash:'flash',showHud:'hud',hideNo:'hideNo',hideTime:'hideTime',stepped:'koma'};
  let fontDatabase;
  function openFontDatabase() {
    if(!fontDatabase)fontDatabase=new Promise((resolve,reject)=>{
      const request=indexedDB.open('folia-stage-jizura-fonts',1);
      request.onupgradeneeded=()=>request.result.createObjectStore('fonts');
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error);
    }).catch(error=>{fontDatabase=null;throw error;});
    return fontDatabase;
  }
  J.saveFontData=async(key,data)=>{
    const db=await openFontDatabase();
    await new Promise((resolve,reject)=>{
      const transaction=db.transaction('fonts','readwrite');
      transaction.objectStore('fonts').put(data,key);
      transaction.oncomplete=()=>resolve();
      transaction.onerror=()=>reject(transaction.error);
      transaction.onabort=()=>reject(transaction.error||new Error('字体保存取消'));
    });
    return true;
  };
  J.loadFontData=async key=>{
    const db=await openFontDatabase();
    return new Promise((resolve,reject)=>{
      const request=db.transaction('fonts','readonly').objectStore('fonts').get(key);
      request.onsuccess=()=>resolve(request.result||null);
      request.onerror=()=>reject(request.error);
    });
  };

  class TransitionRenderer extends J.Renderer {
    constructor() {super();this.restFrames=new Map();this.depth=0;this.cacheHits=0;}
    frame(ctx,plan,t,opt={}) {
      if(this.cachedPlan!==plan){this.restFrames.clear();this.cachedPlan=plan;}
      // Only recursive resting frames are immutable; live shots and morph glyph logs must keep rendering.
      const cacheable=this.depth>0 && opt.noTrans && opt.noPost && opt.noHud && !opt.glyphLog && !opt.transparent && !opt.fast;
      const key=cacheable ? `${t}:${ctx.canvas.width}x${ctx.canvas.height}:${opt.scale||1}` : null;
      const cached=key && this.restFrames.get(key);
      if(cached){
        ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.filter='none';
        ctx.globalCompositeOperation='copy';ctx.drawImage(cached,0,0);ctx.restore();this.cacheHits++;return;
      }
      this.depth++;
      try {super.frame(ctx,plan,t,opt);} finally {this.depth--;}
      if(key){
        const image=document.createElement('canvas');image.width=ctx.canvas.width;image.height=ctx.canvas.height;
        image.getContext('2d').drawImage(ctx.canvas,0,0);this.restFrames.set(key,image);
        if(this.restFrames.size>2)this.restFrames.delete(this.restFrames.keys().next().value);
      }
    }
    dispose(){this.restFrames.clear();this.paperCache.clear();this.morphCache?.map?.clear();}
  }

  function sourceLines(lines) {
    return (lines || []).filter(l => l && String(l.text || '').trim()).map(l => ({...l, text:String(l.text),
      startMs:number(l.startMs,0,0,86400000),
      endMs:Math.max(number(l.startMs,0,0,86400000)+350,number(l.endMs,number(l.startMs,0,0,86400000)+4000,0,86400000)),
    })).sort((a,b) => a.startMs - b.startMs);
  }

  function timedSourceLines(lines,tuning={},durationMs=0) {
    if(!Object.keys(tuning.lineTimes||{}).length)return lines;
    const limit=Math.max(lines.length*50,Number(durationMs)||Math.max(1,...lines.map(line=>line.endMs)));
    let previous=-50;
    return lines.map((line,index)=>{
      const value=tuning.lineTimes?.[index];
      const requested=typeof value==='number'&&Number.isFinite(value)?Math.max(0,Math.min(86400,value))*1000:line.startMs;
      const startMs=Math.min(limit-(lines.length-index)*50,Math.max(previous+50,requested)),shift=startMs-line.startMs;
      previous=startMs;
      return {...line,startMs,endMs:Math.max(startMs+50,Math.min(limit,line.endMs+shift)),words:line.words?.map(word=>({...word,startMs:Number.isFinite(word.startMs)?word.startMs+shift:word.startMs,endMs:Number.isFinite(word.endMs)?word.endMs+shift:word.endMs}))};
    });
  }

  function projectFor(lines, playback, tuning = {}) {
    lines=timedSourceLines(lines,tuning,playback.durationMs);
    const project = J.defaultProject();
    registerUserFonts(tuning.userFonts);
    const seed = Number.isFinite(tuning.nativeSeed) ? tuning.nativeSeed : hash(`${playback.uri || playback.title || ''}:${lines.map(l => l.text).join('\n')}:${tuning.seed || 0}`);
    const theme = J.THEMES[tuning.nativeTheme] ? tuning.nativeTheme : 'lyricpv';
    Object.assign(project, {extra:true, wa:tuning.wa !== false,
      horror:theme === 'horror' || tuning.horror === true});
    Object.assign(project, J.omakase(project, J.rng(seed), theme));
    Object.assign(project, {seed, title:playback.title || '', artist:playback.artist || '',
      lyrics:lines.map(l => l.text).join('\n'), fps:60, lang:tuning.lang || 'auto', themeId:theme, userFonts:registerUserFonts(tuning.userFonts), typeset:tuning.typeset === true, extra:tuning.extra !== false,
      typo:tuning.typo !== false, kinetic:tuning.kinetic !== false, wa:tuning.wa !== false,
      horror:theme === 'horror' || tuning.horror === true, unify:tuning.unify !== false,
      centerFree:tuning.centerFree === true, centerDir:tuning.centerDir === 'lr' ? 'lr' : 'tb',
      keyBg:['off','green','black'].includes(tuning.keyBg) ? tuning.keyBg : 'off',
      colors:normalizeColors(tuning.colors), fonts:normalizeFonts(tuning.fontRoles),
      overrides:normalizeOverrides(tuning.overrides), locks:normalizeLocks(tuning.locks)});
    if(J.MOODS[tuning.mood])project.mood=tuning.mood;
    if (J.STYLES[tuning.nativeStyle]) {
      project.style = tuning.nativeStyle;
    }
    if (tuning.font && J.FONTS[tuning.font]) project.fonts = {display:tuning.font, serif:tuning.font, body:tuning.font,...project.fonts};
    Object.assign(project.fx, {koma:tuning.stepped ? 12 : 0, onTwos:!!tuning.stepped,
      motion:number(tuning.motionIntensity,1,0,2) * .7, density:number(tuning.cutSpeed,1,.5,2) * .5,
      decor:number(tuning.particleDensity,1,0,2) * .5, glitch:number(tuning.glitch,.55,0,1),
      chroma:number(tuning.chroma,.7,0,1), texture:number(tuning.texture,.6,0,1),
      bgSwitch:number(tuning.bgSwitch,.35,0,1), flash:tuning.flash === true,
      hud:tuning.showHud !== false ? 'on' : 'off',hideNo:!!tuning.hideNo,hideTime:!!tuning.hideTime});
    Object.assign(project.fx,normalizeFx(tuning.nativeFx));
    project.timing = {...project.timing, snap:false, offset:0, tail:0, lineTimes:Object.fromEntries(lines.map((l,i) => [i,l.startMs/1000]))};
    for (const group of J.GROUP_KEYS) {
      const selected = tuning.techniques?.[group];
      if (selected && J.registry(group)[selected]) {
        project.enabled[group] = Object.fromEntries(J.order(group).map(k => [k,k === selected]));
        if (group !== 'fx') lines.forEach((l,i) => {project.overrides[i] = {[group]:group === 'decor' ? [selected] : selected,...project.overrides[i]};});
      }
      const candidates = tuning.enabledTechniques?.[group];
      if (Array.isArray(candidates)) {
        const allowed = new Set(candidates.filter(key => J.registry(group)[key]));
        project.enabled[group] = Object.fromEntries(J.order(group).map(key => [key,allowed.has(key)]));
      }
    }
    return project;
  }

  function normalizeColors(colors) {
    const output={enabled:!!colors?.enabled,accentOn:!!colors?.accentOn};
    for(const key of ['bg','fg','sub','accent','ghostA','ghostB']) if(/^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(colors?.[key]||'')) output[key]=colors[key];
    return output;
  }

  function normalizeFx(fx) {
    const defaults=J.defaultProject().fx,output={};
    for(const key of Object.keys(defaults)) {
      const value=fx?.[key];
      if(typeof defaults[key]==='number'&&Number.isFinite(value))output[key]=Math.max(0,Math.min(key==='koma'?60:2,value));
      if(typeof defaults[key]==='boolean'&&typeof value==='boolean')output[key]=value;
      if(key==='hud'&&['on','off','auto'].includes(value))output[key]=value;
    }
    return output;
  }

  function normalizeFonts(fonts) {
    const output={};
    for(const role of ['display','serif','body','mono']) if(typeof fonts?.[role]==='string'&&J.FONTS[fonts[role]]) output[role]=fonts[role];
    return output;
  }

  function normalizeLocks(locks) {
    const output={tech:{},params:{}};
    for(const kind of ['tech','params']) for(const [key,on] of Object.entries(locks?.[kind]||{})) if(on===true&&/^[\w-]+$/.test(key)) output[kind][key]=true;
    return output;
  }

  function normalizeOverrides(overrides) {
    const output={};
    for(const [index,value] of Object.entries(overrides||{})) {
      if(!/^\d+$/.test(index)||!value||typeof value!=='object') continue;
      const next={};
      for(const key of ['layout','enter','hold','exit','treat','bg','cam','trans']) if(typeof value[key]==='string'&&J.registry(key)[value[key]]) next[key]=value[key];
      for(const key of ['single','lock']) if(value[key]===true) next[key]=true;
      if(Number.isFinite(Number(value.cuts))) next.cuts=Math.max(0,Math.min(12,Math.round(Number(value.cuts))));
      if(Number.isFinite(Number(value.seed))) next.seed=Math.round(Number(value.seed));
      if(typeof value.lockedSeed==='number') next.lockedSeed=value.lockedSeed;
      if(Array.isArray(value.decor)) next.decor=value.decor.filter(key=>J.DECOR[key]);
      if(value.cutTime&&typeof value.cutTime==='object') next.cutTime=Object.fromEntries(Object.entries(value.cutTime).filter(([key,time])=>/^\d+$/.test(key)&&Number.isFinite(Number(time))).map(([key,time])=>[key,Number(time)]));
      if(value.cutTech&&typeof value.cutTech==='object') next.cutTech=Object.fromEntries(Object.entries(value.cutTech).filter(([key,tech])=>/^\d+$/.test(key)&&tech&&typeof tech==='object').map(([key,tech])=>[key,Object.fromEntries(Object.entries(tech).filter(([group,id])=>J.GROUP_KEYS.includes(group)&&typeof id==='string'&&(J.registry(group)[id]||(['decor','trans'].includes(group)&&id==='none'))))]));
      if(value.cutLayouts&&typeof value.cutLayouts==='object') next.cutLayouts=Object.fromEntries(Object.entries(value.cutLayouts).filter(([key,id])=>/^\d+$/.test(key)&&J.LAYOUTS[id]));
      if(value.cutQuiet&&typeof value.cutQuiet==='object') next.cutQuiet=JSON.parse(JSON.stringify(value.cutQuiet));
      if(Array.isArray(value.lockedCuts)) next.lockedCuts=value.lockedCuts.filter(cut=>cut&&typeof cut.utext==='string'&&J.LAYOUTS[cut.layout]&&cut.params&&typeof cut.params==='object'&&!Array.isArray(cut.params)&&Array.isArray(cut.decor)&&cut.decor.every(item=>item&&J.DECOR[item.id])&&Number.isFinite(cut.inDur)&&Number.isFinite(cut.outDur)&&Number.isFinite(cut.seed)).slice(0,12);
      if(Object.keys(next).length) output[index]=next;
    }
    return output;
  }

  function nativeProjectFor(input, playback = {}, tuning = {}, audio = null) {
    const lines = timedSourceLines(sourceLines(input),tuning,playback.durationMs);
    const project = projectFor(lines, playback, tuning);
    project.lyrics = lines.map((line,index)=>{
      const markup=tuning.sourceMarkup?.[index]||{};
      let text=markup.manual?.length?markup.manual.join('/'):line.text;
      for(const word of markup.emph||[]) if(word&&text.includes(word)) text=text.replace(word,`*${word}*`);
      const seconds=line.startMs/1000;
      return `[${String(Math.floor(seconds/60)).padStart(2,'0')}:${(seconds%60).toFixed(3).padStart(6,'0')}]${text}${markup.impact?'!':''}${line.translation?` | ${line.translation}`:''}`;
    }).join('\n');
    project.foliaSourceLines=lines;
    project.foliaLineTimes=tuning.lineTimes||{};
    project.foliaSourceMarkup=tuning.sourceMarkup||{};
    return project;
  }

  function tuningFromNativeProject(nativeProject, inputLines = []) {
    if(!nativeProject||typeof nativeProject!=='object'||Array.isArray(nativeProject)||typeof nativeProject.lyrics!=='string'||!nativeProject.fx||typeof nativeProject.fx!=='object'||nativeProject.version!==1) throw new Error('不是有效的 JIZURA v1 工程');
    validateData(nativeProject);
    const source = JSON.parse(JSON.stringify(nativeProject));
    if(source.timingOrder!==2){
      const map=J.parseOrderV1(source.lyrics);
      if(map)source.overrides=Object.fromEntries(Object.entries(source.overrides||{}).map(([key,value])=>[map[Number(key)]??key,value]));
    }
    registerUserFonts(source.userFonts);
    const tuning = {
      nativeTheme: J.THEMES[source.themeId] ? source.themeId : '',
      nativeStyle: J.STYLES[source.style] ? source.style : '',
      mood: J.MOODS[source.mood] ? source.mood : '',
      centerFree: source.centerFree === true,
      centerDir: source.centerDir === 'lr' ? 'lr' : 'tb',
      keyBg: ['off', 'green', 'black'].includes(source.keyBg) ? source.keyBg : 'off',
      typeset: source.typeset === true,
      extra: source.extra !== false,
      typo: source.typo !== false,
      kinetic: source.kinetic !== false,
      wa: source.wa !== false,
      horror: source.horror === true,
      unify: source.unify === true,
      seed: Number.isFinite(Number(source.seed)) ? Number(source.seed) : 0,
      nativeSeed: Number.isFinite(Number(source.seed)) ? Number(source.seed) : undefined,
      nativeFx: normalizeFx(source.fx),
      userFonts: registerUserFonts(source.userFonts),
      lang: ['auto','ja','zh-Hant','zh-Hans','ko'].includes(source.lang)?source.lang:'auto',
      showHud: source.fx?.hud !== 'off',
      hideNo: source.fx?.hideNo === true,
      hideTime: source.fx?.hideTime === true,
      stepped: source.fx?.onTwos === true || Number(source.fx?.koma) > 0,
      flash: source.fx?.flash === true,
      cutSpeed: Number(source.fx?.density) > 0 ? Math.min(2, Math.max(.5, Number(source.fx.density) * 2)) : 1,
      motionIntensity: Number(source.fx?.motion) >= 0 ? Math.min(2, Number(source.fx.motion) / .7) : 1,
      particleDensity: Number(source.fx?.decor) >= 0 ? Math.min(2, Number(source.fx.decor) * 2) : 1,
      glitch: Number(source.fx?.glitch) >= 0 ? Number(source.fx.glitch) : .55,
      chroma: Number(source.fx?.chroma) >= 0 ? Number(source.fx.chroma) : .7,
      texture: Number(source.fx?.texture) >= 0 ? Number(source.fx.texture) : .6,
      bgSwitch: Number(source.fx?.bgSwitch) >= 0 ? Number(source.fx.bgSwitch) : .35,
      overrides: normalizeOverrides(source.overrides),
      locks: normalizeLocks(source.locks),
      colors: normalizeColors(source.colors),
      fontRoles: normalizeFonts(source.fonts),
      enabledTechniques: {},
      sourceMarkup: {},
      lineTimes: {},
    };
    for (const group of J.GROUP_KEYS) {
      const enabled = source.enabled?.[group];
      if (!enabled || typeof enabled !== 'object') continue;
      const all = J.order(group).filter(id => J.registry(group)[id] && !J.registry(group)[id].special);
      const chosen = all.filter(id => enabled[id] !== false);
      if (chosen.length < all.length) tuning.enabledTechniques[group] = chosen;
    }
    const parsed=Array.isArray(source.foliaSourceLines)?source.foliaSourceLines:J.parseLyrics(source.lyrics).lines;
    const normalize=text=>String(text||'').normalize('NFKC').replace(/\s+/g,'').toLowerCase();
    const remaining=new Set(parsed.map((line,index)=>index));
    const overrides={};
    let matched=0;
    sourceLines(inputLines).forEach((line,index)=>{
      const sourceIndex=parsed.findIndex((candidate,i)=>remaining.has(i)&&normalize(candidate.text)===normalize(line.text));
      if(sourceIndex<0)return;
      remaining.delete(sourceIndex);matched++;
      if(tuning.overrides[sourceIndex])overrides[index]=tuning.overrides[sourceIndex];
      const time=(source.foliaLineTimes||source.timing?.lineTimes)?.[sourceIndex];
      if(typeof time==='number'&&Number.isFinite(time)&&time>=0)tuning.lineTimes[index]=time;
      const entry=source.foliaSourceMarkup?.[sourceIndex]||parsed[sourceIndex];
      tuning.sourceMarkup[index]={manual:entry.manual||[],emph:entry.emph||[],impact:entry.impact===true};
    });
    tuning.overrides=overrides;
    tuning.importReport={matched,total:sourceLines(inputLines).length,unmatchedSource:remaining.size};
    return tuning;
  }

  function registerUserFonts(fonts) {
    const safe=[];
    for(const font of (Array.isArray(fonts)?fonts:[]).slice(0,32)) {
      if(!font||!J.SAFE_FONT_KEY.test(font.key))continue;
      const entry={key:font.key,label:String(font.label||font.key).slice(0,80),family:J.safeFamily(font.family||font.key),weight:number(font.weight,400,100,900)};
      if(!J.FONTS[entry.key])J.addUserFont(entry.key,entry.label,entry.family,entry.weight);
      safe.push(entry);
    }
    return safe;
  }

  function buildPlan(input, playback = {}, tuning = {}, width = 1920, height = 1080, audio = null, showTranslation = true) {
    const lines = timedSourceLines(sourceLines(input),tuning,playback.durationMs);
    const project = projectFor(lines, playback, tuning);
    const originals = {parseLyrics:J.parseLyrics, computeTiming:J.computeTiming, designSize:J.designSize};
    // Synchronous scoped hooks preserve literal lyrics and source timing without editing vendor code.
    J.parseLyrics = () => ({meta:{}, lines:lines.map((l,i) => {
      const markup=tuning.sourceMarkup?.[i]||{};
      const segments=Array.isArray(markup.manual)?markup.manual.map(String).map(v=>v.trim()).filter(Boolean):null;
      const manual=segments?.length&&segments.join('').replace(/\s/g,'')===l.text.replace(/\s/g,'')?segments:null;
      const emph=Array.isArray(markup.emph)?markup.emph.map(String).filter(word=>l.text.includes(word)):[];
      return {text:l.text, note:showTranslation ? l.translation || null : null,impact:markup.impact===true,
        emph,manual,src:i,lrc:l.startMs/1000,gapBefore:i>0&&l.startMs-lines[i-1].endMs>1200};
    })});
    J.computeTiming = () => ({starts:lines.map(l=>l.startMs/1000), ends:lines.map((l,i)=>Math.max(l.startMs/1000+.05,Math.min(l.endMs/1000,(lines[i+1]?.startMs ?? Infinity)/1000))),
      duration:Math.max(Number(playback.durationMs)/1000 || 0,...lines.map(l=>l.endMs/1000),1)});
    const ratio = number(width/height,16/9,.2,6);
    J.designSize = () => ratio >= 1 ? [1080*ratio,1080] : [1080,1080/ratio];
    try {
      let plan = J.plan(project,audio);
      let changed = false;
      // Native phrase boundaries follow actual word timing, subject to its 220 ms minimum spacing.
      lines.forEach((line,i) => {
        const words = line.words?.filter(w=>Number.isFinite(w.startMs));
        if (!words?.length) return;
        const cuts = plan.cuts.filter(c=>c.line === i && c.layout !== 'interlude');
        let cursor = 0;
        const cutTime = {...project.overrides[i]?.cutTime};
        cuts.forEach((cut,k) => {
          const token = cut.utext?.trim();
          const found = token ? line.text.indexOf(token,cursor) : -1;
          if (found < 0 || cut.recap) return;
          cursor = found+token.length;
          let offset = 0;
          const word = words.find(w => {
            const text = String(w.text || '').trim();
            if (!text) return false;
            const at = line.text.indexOf(text,offset);
            if (at < 0) return false;
            offset = at+text.length;
            return offset > found;
          });
          if (k > 0 && word && cutTime[k]==null) {cutTime[k] = Math.max(0,(word.startMs-line.startMs)/1000); changed = true;}
        });
        project.overrides[i] = {...project.overrides[i],cutTime};
      });
      if (changed) plan = J.plan(project,audio);
      plan.folia = {commit:J.FOLIA_SOURCE.commit,audioAvailable:!!audio?.energy?.length};
      return plan;
    } finally {Object.assign(J,originals);}
  }

  function JizuraStage({lyrics, playback = {}, settings = {}, timeMs = 0, visible = true, audioSignals, showTranslation = true}) {
    const tuning = settings.jizuraTuning || {};
    const mediaRevision=FoliaJizuraMedia.useRevision();
    const canvasRef = useRef(null);
    const latest = useRef({});
    latest.current = {timeMs,visible,paused:playback.paused};
    const [size,setSize] = useState(null);
    const [error,setError] = useState('');
    const [fontRevision,setFontRevision] = useState(0);
    const tuningKey = JSON.stringify(tuning);
    const audio = useMemo(()=>FoliaJizuraMedia.timeline(playback.uri,number(tuning.beatResponse,1,0,2),tuning)||audioSignals?.nativeTimeline?.(number(tuning.beatResponse,1,0,2))||null,[audioSignals,tuning.beatResponse,tuning.localBpm,tuning.localBeatOffset,playback.uri,mediaRevision]);
    const result = useMemo(()=>{
      if (!size) return {};
      try {return {plan:buildPlan(lyrics?.lines,playback,tuning,size.width,size.height,audio,showTranslation)};}
      catch (cause) {console.error('JIZURA planner',cause);return {error:String(cause.message || cause)};}
    },[lyrics?.lines,playback.uri,playback.title,playback.artist,playback.durationMs,tuningKey,size?.width,size?.height,audio,showTranslation,fontRevision]);
    useEffect(()=>{
      const canvas = canvasRef.current;
      if (!canvas) return undefined;
      let timer;
      const measure = ()=>{
          const rect = canvas.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            const next={width:Math.round(rect.width),height:Math.round(rect.height),pixels:Math.min(devicePixelRatio || 1,1.5)};
            setSize(old=>old?.width===next.width&&old?.height===next.height&&old?.pixels===next.pixels?old:next);
          }
      };
      measure();
      const observer = new ResizeObserver(()=>{
        clearTimeout(timer);
        timer = setTimeout(measure,80);
      });
      observer.observe(canvas);
      return ()=>{clearTimeout(timer);observer.disconnect();};
    },[]);
    useEffect(()=>{
      let active=true;
      const fonts=registerUserFonts(tuning.userFonts);
      if(!fonts.length)return undefined;
      J.restoreUserFonts(fonts).then(missing=>{
        if(active){
          if(missing.length)Spicetify.showNotification?.(typeof FoliaStageLocale === 'undefined' ? `JIZURA fonts are not imported: ${missing.join(', ')}` : FoliaStageLocale.en(`JIZURA 字体尚未导入：${missing.join('、')}`),true);
          J.metrics.clear();J.glyphs.clear();setFontRevision(n=>n+1);
        }
      }).catch(error=>console.warn('JIZURA local fonts',error));
      return()=>{active=false;};
    },[JSON.stringify(tuning.userFonts||[])]);
    const planFonts=JSON.stringify(J.fontsOfPlan(result.plan));
    useEffect(()=>{
      if (!tuning.onlineFonts || !lyrics?.lines?.length || !result.plan) return undefined;
      let active = true;
      J.ensureFonts(lyrics.lines.map(l=>l.text).join(''),J.fontsOfPlan(result.plan))
        .then(()=>{if(active){J.metrics.clear?.();J.glyphs.clear();setFontRevision(n=>n+1);}})
        .catch(cause=>console.warn('JIZURA font fallback',cause));
      return ()=>{active=false;};
    },[lyrics?.lines,tuning.onlineFonts,planFonts,!!result.plan]);
    useEffect(()=>{
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const plan = result.plan;
      if (!ctx || !plan) return undefined;
      canvas.width = Math.max(1,Math.round(size.width*size.pixels));
      canvas.height = Math.max(1,Math.round(size.height*size.pixels));
      const renderer = new TransitionRenderer();
      let id=0,stopped=false,lastTime=-1;
      setError('');
      const draw = ()=>{
        if (stopped) return;
        const state=latest.current;
        const seconds=Math.max(0,Number(state.timeMs)||0)/1000;
        if(state.visible && !document.hidden && seconds!==lastTime){
          try {renderer.frame(ctx,plan,seconds,{scale:canvas.width/plan.W});lastTime=seconds;}
          catch(cause){console.error('JIZURA renderer',cause);setError(String(cause.message||cause));stopped=true;return;}
        }
        id=requestAnimationFrame(draw);
      };
      id=requestAnimationFrame(draw);
      return ()=>{stopped=true;cancelAnimationFrame(id);renderer.dispose();};
    },[result,size]);
    const message=error||result.error||(!lyrics?.lines?.length?'等待同步歌词':'');
    return h('div',{className:'folia-jizura folia-jizura--native','data-engine':'JIZURA','data-commit':J.FOLIA_SOURCE.commit,
      style:{position:'absolute',inset:0,width:'100%',height:'100%',overflow:'hidden',isolation:'isolate'}},
      h('canvas',{ref:canvasRef,className:'folia-jizura__canvas','aria-label':'JIZURA lyric PV',style:{position:'absolute',inset:0,width:'100%',height:'100%',display:'block'}}),
      message&&h('div',{role:'status',style:{position:'absolute',inset:0,display:'grid',placeItems:'center',color:'#fff',background:'#111'}},message));
  }

  function LazyDetails({children,renderContent,onToggle,...props}) {
    const [opened,setOpened]=useState(false);
    const items=React.Children?React.Children.toArray(children):children;
    return h('details',{...props,onToggle:event=>{
      if(event.currentTarget.open)setOpened(true);
      onToggle?.(event);
    }},items[0],opened?(renderContent?renderContent():items.slice(1)):null);
  }

  function EditorTools({tuning,onChange,lines,playback,plan}) {
    const [selected,setSelected]=useState(0),[drafts,setDrafts]=useState({}),[message,setMessage]=useState('');
    const [group,setGroup]=useState('layout'),[effect,setEffect]=useState(''),[query,setQuery]=useState('');
    const [head,setHead]=useState(0),[previewOpen,setPreviewOpen]=useState(false);
    const canvas=useRef(null),timeline=useRef(null),renderer=useRef(null);
    const duration=Math.max(1,Number(playback.durationMs)/1000||plan?.duration||1);
    const effective=timedSourceLines(sourceLines(lines),tuning,playback.durationMs);
    useEffect(()=>{setDrafts({});},[JSON.stringify(tuning.lineTimes||{})]);
    useEffect(()=>{setSelected(0);setMessage('');},[playback.uri]);
    const progress=()=>Number(Spicetify.Player?.getProgress?.()??playback.progressMs??0)/1000;
    useEffect(()=>{
      const timer=setInterval(()=>{if(timeline.current?.getBoundingClientRect().height)setHead(progress());},200);
      return()=>clearInterval(timer);
    },[playback.uri,playback.progressMs]);
    const putTime=(index,value)=>{
      const low=index>0?effective[index-1].startMs/1000+.05:0;
      const high=Math.max(low,index+1<effective.length?effective[index+1].startMs/1000-.05:duration-.05);
      const seconds=Math.max(low,Math.min(high,Number(value)||0));
      if(tuning.lineTimes?.[index]!==seconds)onChange({lineTimes:{...(tuning.lineTimes||{}),[index]:seconds}});
      return seconds;
    };
    const stamp=advance=>{
      const now=progress();
      if(!Number.isFinite(now)||now<0||now>duration){setMessage('Current playback time is unavailable');return;}
      const index=Math.min(selected,effective.length-1);
      if(index<0)return;
      const low=index>0?effective[index-1].startMs/1000+.05:0;
      const high=index+1<effective.length?effective[index+1].startMs/1000-.05:duration-.05;
      if(now<low||now>high){setMessage('Timestamp must fall between adjacent lyric lines');return;}
      putTime(index,now);setMessage(`Line ${index+1} · ${now.toFixed(2)}s`);
      if(advance)setSelected(Math.min(index+1,effective.length-1));
    };
    const items=J.order(group).filter(id=>J.registry(group)[id]&&!J.registry(group)[id].special);
    const shown=items.filter(id=>(id+' '+(J.registry(group)[id].name||'')).toLowerCase().includes(query.toLowerCase()));
    const choice=items.includes(effect)?effect:items[0];
    const previewPlan=useMemo(()=>{
      if(!choice)return null;
      try{return buildPlan([{text:effective[selected]?.text||'JIZURA',startMs:0,endMs:6000}],{uri:playback.uri+':preview',durationMs:6000},{...tuning,lineTimes:{},sourceMarkup:{},overrides:{0:{single:true}},enabledTechniques:{},techniques:{[group]:choice},showHud:false},640,360);}catch{return null;}
    },[group,choice,selected,JSON.stringify(tuning),lines,playback.uri]);
    useEffect(()=>{
      const cv=canvas.current;if(!cv||!previewPlan||!previewOpen)return;
      const ctx=cv.getContext('2d'),render=new TransitionRenderer();renderer.current=render;
      let id,begin=null,last=0;
      const frame=now=>{
        id=requestAnimationFrame(frame);
        if(document.visibilityState==='hidden'||!cv.getBoundingClientRect().height||now-last<32)return;
        if(begin==null)begin=now;last=now;
        try{render.frame(ctx,previewPlan,((now-begin)/1000)%Math.max(1,previewPlan.duration),{scale:cv.width/previewPlan.W});}
        catch(error){cancelAnimationFrame(id);setMessage(`Effect preview failed: ${error.message}`);}
      };
      id=requestAnimationFrame(frame);
      return()=>{cancelAnimationFrame(id);render.dispose();renderer.current=null;};
    },[previewPlan,previewOpen]);
    return h('div',null,
      h('div',{ref:timeline},
        h('output',null,`${head.toFixed(2)}s / ${duration.toFixed(2)}s`),
        h('label',null,'当前歌词',h('select',{'aria-label':'JIZURA 时间轴当前歌词',value:Math.min(selected,Math.max(0,effective.length-1)),onChange:event=>setSelected(Number(event.target.value))},effective.map((line,index)=>h('option',{key:index,value:index},`${index+1} · ${line.text.slice(0,40)}`)))),
        h('button',{type:'button',disabled:!effective.length,onClick:()=>stamp(false)},'记录当前进度'),
        h('button',{type:'button',disabled:!effective.length,onClick:()=>stamp(true)},'记录并下一行'),
        h('button',{type:'button',disabled:!effective.length||!Spicetify.Player?.seek,onClick:()=>Spicetify.Player.seek(effective[selected]?.startMs||0)},'跳转本行'),
        h('button',{type:'button',onClick:()=>onChange({lineTimes:{}})},'恢复源时间轴'),
        h('div',{style:{maxHeight:240,overflow:'auto'}},effective.map((line,index)=>h('label',{key:index,style:{display:'grid',gridTemplateColumns:'minmax(0,1fr)',gap:4}},
          `${String(index+1).padStart(2,'0')} · ${line.text.slice(0,32)} · ${Number(drafts[index]??line.startMs/1000).toFixed(2)}s`,
          h('input',{type:'range','aria-label':`JIZURA 第 ${index+1} 行开始时间`,min:0,max:duration,step:.01,value:drafts[index]??line.startMs/1000,style:{width:'100%'},
            onChange:event=>setDrafts(current=>({...current,[index]:Number(event.target.value)})),
            onPointerUp:event=>putTime(index,event.currentTarget.value),
            onKeyDown:event=>{
              const steps={ArrowLeft:-.01,ArrowRight:.01,ArrowUp:.01,ArrowDown:-.01,PageUp:1,PageDown:-1};
              if(Object.hasOwn(steps,event.key)||['Home','End'].includes(event.key)){
                event.preventDefault();putTime(index,event.key==='Home'?0:event.key==='End'?duration:Number(drafts[index]??line.startMs/1000)+steps[event.key]);
              }
            },
            onBlur:event=>{if(drafts[index]!=null)putTime(index,event.currentTarget.value);},
          })
        )))
      ),
      h(LazyDetails,{onToggle:event=>setPreviewOpen(event.currentTarget.open)},h('summary',null,'效果动画预览'),
        h('label',null,'效果类别',h('select',{'aria-label':'JIZURA 预览效果类别',value:group,onChange:event=>{setGroup(event.target.value);setEffect('');setQuery('');}},J.GROUP_KEYS.map(key=>h('option',{key,value:key},GROUP_LABELS[key])))),
        h('label',null,'搜索效果',h('input',{type:'search',value:query,onChange:event=>setQuery(event.target.value)})),
        h('label',null,'效果',h('select',{'aria-label':'JIZURA 预览效果',value:choice,onChange:event=>setEffect(event.target.value)},[...new Set([choice,...shown])].filter(Boolean).map(id=>h('option',{key:id,value:id},J.registry(group)[id].name||id)))),
        h('canvas',{ref:canvas,width:640,height:360,'aria-label':'JIZURA 效果动画预览',style:{width:'100%',aspectRatio:'16 / 9',display:'block',background:'#111'}}),
        h('button',{type:'button',disabled:!choice,onClick:()=>onChange({techniques:{...(tuning.techniques||{}),[group]:choice}})},'应用此效果'),
        h('button',{type:'button',onClick:()=>{const next={...tuning.techniques};delete next[group];onChange({techniques:next});}},'恢复此类自动选择')
      ),
      message&&h('output',{role:'status'},message)
    );
  }

  function ParameterEditor({cut,onApply}) {
    const input=useRef(null);
    const [error,setError]=useState('');
    const [advanced,setAdvanced]=useState(false);
    const fields=['params','treatP','bgP','camP','transP','decor','inDur','outDur','transDur','scheme','weightGrow','morph'];
    const value=Object.fromEntries(fields.filter(key=>cut[key]!=null).map(key=>[key,cut[key]]));
    const [draft,setDraft]=useState(()=>JSON.parse(JSON.stringify(value)));
    const update=(path,next)=>setDraft(previous=>{
      const copy=JSON.parse(JSON.stringify(previous));
      let target=copy;
      for(const key of path.slice(0,-1))target=target[key];
      target[path[path.length-1]]=next;return copy;
    });
    const controls=(object,path=[],depth=0)=>Object.entries(object).map(([key,item])=>{
      const next=[...path,key],name=next.join('.');
      if(item&&typeof item==='object')return depth<8?h(LazyDetails,{key:name,renderContent:()=>controls(item,next,depth+1)},h('summary',null,key)):null;
      if(item==null)return null;
      const type=typeof item;
      if(!['boolean','number','string'].includes(type))return null;
      return h('label',{key:name},key,h('input',{
        'aria-label':`JIZURA ${name}`,type:type==='boolean'?'checkbox':type==='number'?'number':/^#[0-9a-f]{6}$/i.test(item)?'color':'text',
        ...(type==='boolean'?{checked:item}:{value:item}),
        ...(type==='number'?{step:'any'}:{}),
        onChange:event=>update(next,type==='boolean'?event.target.checked:type==='number'?Number(event.target.value):event.target.value),
      }));
    });
    const apply=()=>{
      try {
        const patch=advanced?JSON.parse(input.current.value):draft;
        validateData(patch);
        if(!patch||typeof patch!=='object'||Array.isArray(patch)||Object.keys(patch).some(key=>!fields.includes(key)))throw new Error('只支持镜头参数字段');
        for(const key of ['inDur','outDur','transDur'])if(patch[key]!=null&&(!Number.isFinite(patch[key])||patch[key]<0||patch[key]>cut.dur))throw new Error('动画时长必须在本镜头时长以内');
        for(const key of ['params','treatP','bgP','camP','transP'])if(patch[key]!=null&&(typeof patch[key]!=='object'||Array.isArray(patch[key])))throw new Error(`${key} 必须是参数对象`);
        if(patch.decor!=null&&(!Array.isArray(patch.decor)||patch.decor.some(item=>!item||!J.DECOR[item.id])))throw new Error('装饰参数无效');
        if(patch.scheme!=null&&(!Number.isInteger(patch.scheme)||patch.scheme<0||patch.scheme>255))throw new Error('scheme 必须是 0 到 255 的整数');
        if(patch.morph!=null&&(typeof patch.morph!=='object'||Array.isArray(patch.morph)||!Number.isFinite(patch.morph.dur)||patch.morph.dur<0||patch.morph.dur>cut.dur))throw new Error('morph 必须包含有效 dur 时长');
        onApply(patch);setError('');
      }catch(cause){setError(cause.message);}
    };
    return h('div',null,
      h('label',null,h('input',{type:'checkbox',checked:advanced,onChange:event=>{
        if(!event.target.checked){try{const parsed=JSON.parse(input.current.value);validateData(parsed);if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error('参数必须是对象');setDraft(parsed);setError('');}catch(cause){setError(cause.message);return;}}
        setAdvanced(event.target.checked);
      }}),'高级 JSON'),
      advanced?h('textarea',{ref:input,defaultValue:JSON.stringify(draft,null,2),rows:12,'aria-label':'JIZURA 镜头参数 JSON',style:{width:'100%',maxWidth:'100%',fontFamily:'monospace',fontSize:12,resize:'vertical'}}):controls(draft),
      error&&h('span',{role:'alert'},error),h('button',{type:'button',onClick:apply},'应用参数并锁定')
    );
  }

  function validateData(value,depth=0) {
    if(depth>32)throw new Error('工程嵌套过深');
    if(typeof value==='number'&&!Number.isFinite(value))throw new Error('工程含无效数值');
    if(value&&typeof value==='object')for(const key of Object.keys(value)) {
      if(['__proto__','prototype','constructor'].includes(key))throw new Error('工程含不安全字段');
      validateData(value[key],depth+1);
    }
  }

  function randomizeTuning(tuning,lines=[],playback={}) {
    const seed=(Number(tuning.seed)||0)+1;
    const generated=projectFor(sourceLines(lines),playback,{nativeTheme:tuning.nativeTheme,seed});
    const result={...tuning,seed,nativeSeed:undefined,nativeFx:normalizeFx(generated.fx),nativeStyle:generated.style,mood:generated.mood,enabledTechniques:{...tuning.enabledTechniques},techniques:{...tuning.techniques}};
    for(const group of J.GROUP_KEYS)if(!tuning.locks?.tech?.[group]) {
      result.enabledTechniques[group]=J.order(group).filter(id=>generated.enabled[group][id]!==false);
      delete result.techniques[group];
    }
    const current=projectFor(sourceLines(lines),playback,tuning);
    for(const key of Object.keys(tuning.locks?.params||{}))if(tuning.locks.params[key]&&current.fx[key]!=null)result.nativeFx[key]=current.fx[key];
    return result;
  }

  function Settings({tuning={},onChange,lines=[],playback={},audioSignals}) {
    const mediaRevision=FoliaJizuraMedia.useRevision();
    const [message,setMessage]=useState('');
    const [parametersOpen,setParametersOpen]=useState({});
    const [editorOpened,setEditorOpened]=useState(false);
    const change=patch=>{
      const next={...tuning,...patch};
      if(!Object.hasOwn(patch,'nativeFx')){
        next.nativeFx={...tuning.nativeFx};
        for(const key of Object.keys(patch))if(FX_KEYS[key])delete next.nativeFx[FX_KEYS[key]];
        if(Object.hasOwn(patch,'stepped'))delete next.nativeFx.onTwos;
      }
      onChange(next);
    };
    const select=(label,key,choices)=>h('label',{key},label,h('select',{'aria-label':`JIZURA ${label}`,value:tuning[key]||'',onChange:e=>change({[key]:e.target.value})},choices.map(([value,text])=>h('option',{key:value,value},text))));
    const sliders=[['cutSpeed','镜头密度',.5,2,1],['beatResponse','音乐响应',0,2,1],['motionIntensity','运动幅度',0,2,1],['particleDensity','装饰密度',0,2,1],['glitch','故障强度',0,1,.55],['chroma','色差',0,1,.7],['texture','材质',0,1,.6],['bgSwitch','背景切换',0,1,.35]];
    const updateOverride=(index,patch)=>change({overrides:{...(tuning.overrides||{}),[index]:{...(tuning.overrides?.[index]||{}),...patch}}});
    const removeOverrideKey=(index,key)=>{const row={...(tuning.overrides?.[index]||{})};delete row[key];change({overrides:{...(tuning.overrides||{}),[index]:row}});};
    const plan=useMemo(()=>{try{
      if(!editorOpened)return null;
      const rect=document.querySelector?.('.folia-jizura__canvas')?.getBoundingClientRect();
      return buildPlan(lines,playback,tuning,rect?.width||1280,rect?.height||720,FoliaJizuraMedia.timeline(playback.uri,number(tuning.beatResponse,1,0,2),tuning)||audioSignals?.nativeTimeline?.(number(tuning.beatResponse,1,0,2))||null);
    }catch{return null;}},[editorOpened,JSON.stringify(tuning),lines,playback.uri,playback.title,playback.artist,playback.durationMs,audioSignals,mediaRevision]);
    const importFont=async event=>{
      const file=event.target.files?.[0];event.target.value='';if(!file)return;
      try {
        if(!/\.(woff2?|ttf|otf)$/i.test(file.name)||file.size>20*1024*1024)throw new Error('请选择 20 MB 以内的字体文件');
        const data=await file.arrayBuffer();
        const family='FoliaJizura_'+hash(file.name+file.size+file.lastModified);
        const face=new FontFace(family,data);await face.load();
        const key='user_'+family;
        await J.saveFontData(key,data);document.fonts.add(face);
        J.addUserFont(key,file.name,family,400);J.FONTS[key].loaded=true;
        change({userFonts:[...(tuning.userFonts||[]).filter(font=>font.key!==key),{key,label:file.name,family,weight:400}],font:key});
        setMessage('Font saved on this device');
      }catch(error){setMessage(`Font import failed: ${error.message}`);}
    };
    const choose=(index,key,group,empty='')=>h('label',{key},GROUP_LABELS[group],h('select',{value:tuning.overrides?.[index]?.[key]||'',onChange:e=>e.target.value?updateOverride(index,{[key]:e.target.value}):removeOverrideKey(index,key)},[[empty,'自动'],...J.order(group).filter(id=>J.registry(group)[id]&&!J.registry(group)[id].special).map(id=>[id,J.registry(group)[id].name||id])].map(([value,label])=>h('option',{key:value,value},label))));
    const colorInput=(key,fallback)=>h('label',{key},key,h('input',{type:'color',value:/^#[0-9a-f]{6}$/i.test(tuning.colors?.[key])?tuning.colors[key]:fallback,onChange:e=>change({colors:{...(tuning.colors||{}),[key]:e.target.value}})}));
    const techniqueOptions=group=>[['','自动'],...J.order(group).filter(id=>J.registry(group)[id]&&!J.registry(group)[id].special).map(id=>[id,J.registry(group)[id].name||id])];
    const lineEditor=(line,index)=>{
      const override=tuning.overrides?.[index]||{};
      const cuts=plan?.cuts?.filter(c=>c.line===index&&c.utext!=null)||[];
      return h(LazyDetails,{key:index,renderContent:()=>[
        h('label',null,'镜头数',h('input',{type:'number',min:0,max:12,value:override.cuts||0,onChange:e=>updateOverride(index,{cuts:Math.max(0,Math.min(12,Number(e.target.value)||0))})})),
        h('label',null,h('input',{type:'checkbox',checked:!!override.single,onChange:e=>updateOverride(index,{single:e.target.checked})}),'整行单镜头'),
        h('button',{type:'button',onClick:()=>updateOverride(index,{seed:(override.seed||0)+1,lock:false,lockedCuts:undefined,lockedSeed:undefined})},'重排本行'),
        h('button',{type:'button',onClick:()=>{const next={...tuning.overrides},markup={...tuning.sourceMarkup};delete next[index];delete markup[index];change({overrides:next,sourceMarkup:markup});}},'重置本行'),
        h('label',null,h('input',{type:'checkbox',checked:!!override.lock,onChange:e=>{
          if(e.target.checked){const snapshot=plan?J.lineSnapshot(plan,index):null;updateOverride(index,{lock:true,lockedSeed:plan?.lines?.[index]?.seed,lockedCuts:snapshot||undefined});}
          else {const next={...override,lock:false};delete next.lockedCuts;delete next.lockedSeed;change({overrides:{...(tuning.overrides||{}),[index]:next}});}
        }}),'锁定本行画面'),
        ...['layout','enter','hold','exit','treat','bg','cam','trans'].map(group=>choose(index,group,group)),
        h('label',null,'装饰',h('select',{multiple:true,value:override.decor||[],onChange:e=>updateOverride(index,{decor:Array.from(e.target.selectedOptions,option=>option.value)})},techniqueOptions('decor').filter(([value])=>value).map(([value,label])=>h('option',{key:value,value},label)))),
        Object.hasOwn(override,'decor')&&h('button',{type:'button',onClick:()=>removeOverrideKey(index,'decor')},'恢复自动装饰'),
        h('label',null,'手动分词（用 / 分隔）',h('input',{value:(tuning.sourceMarkup?.[index]?.manual||[]).join('/'),onChange:e=>change({sourceMarkup:{...(tuning.sourceMarkup||{}),[index]:{...(tuning.sourceMarkup?.[index]||{}),manual:e.target.value.split('/').map(v=>v.trim()).filter(Boolean)}}})})),
        h('label',null,'重音词（用 , 分隔）',h('input',{value:(tuning.sourceMarkup?.[index]?.emph||[]).join(','),onChange:e=>change({sourceMarkup:{...(tuning.sourceMarkup||{}),[index]:{...(tuning.sourceMarkup?.[index]||{}),emph:e.target.value.split(',').map(v=>v.trim()).filter(Boolean)}}})})),
        h('label',null,h('input',{type:'checkbox',checked:!!tuning.sourceMarkup?.[index]?.impact,onChange:e=>change({sourceMarkup:{...(tuning.sourceMarkup||{}),[index]:{...(tuning.sourceMarkup?.[index]||{}),impact:e.target.checked}}})}),'强调句'),
        ...cuts.map((cut,k)=>h(LazyDetails,{key:k,renderContent:()=>[
          ...['layout','enter','hold','exit','decor','treat','bg','cam','trans'].map(group=>h('label',{key:group},GROUP_LABELS[group],h('select',{value:override.cutTech?.[k]?.[group]||'',onChange:e=>updateOverride(index,{cutTech:{...(override.cutTech||{}),[k]:{...(override.cutTech?.[k]||{}),[group]:e.target.value}}})},[...techniqueOptions(group),...(['decor','trans'].includes(group)&&!J.registry(group).none?[['none','无']]:[])].map(([value,label])=>h('option',{key:value,value},label))))),
          k>0&&h('label',null,'切点（秒）',h('input',{type:'number',step:.01,min:0,value:override.cutTime?.[k]??Math.max(0,cut.start-(plan?.lines?.[index]?.start||0)).toFixed(2),onChange:e=>updateOverride(index,{cutTime:{...(override.cutTime||{}),[k]:Number(e.target.value)||0}})})),
          k>0&&h('button',{type:'button',onClick:()=>{const times={...override.cutTime};delete times[k];updateOverride(index,{cutTime:times});}},'恢复自动切点'),
          h(LazyDetails,{onToggle:e=>{if(e.currentTarget.open)setParametersOpen(current=>({...current,[`${index}:${k}`]:true}));}},h('summary',null,'镜头参数快照'),
            parametersOpen[`${index}:${k}`]&&h(ParameterEditor,{key:JSON.stringify(override.lockedCuts?.[k]||cut.params),cut,onApply:patch=>{
              const snapshot=J.lineSnapshot(plan,index);if(!snapshot)return;
              Object.assign(snapshot[k],patch);
              updateOverride(index,{lock:true,lockedSeed:plan?.lines?.[index]?.seed,lockedCuts:snapshot});
            }})
          )
        ]},h('summary',null,`镜头 ${k+1} · ${cut.utext}`)))
      ]},h('summary',null,`${String(index+1).padStart(2,'0')} · ${line.text.slice(0,28)}`));
    };
    return h('div',{className:'folia-settings__section folia-settings__jizura'},
      h('label',null,'JIZURA'),
      select('主题','nativeTheme',[['','文字 PV'],...Object.keys(J.THEMES).map(k=>[k,THEMES[k]||k])]),
      select('配色','nativeStyle',[['','跟随主题'],...J.STYLE_ORDER.map(k=>[k,J.STYLES[k].name||k])]),
      select('情绪','mood',[['','跟随主题'],...Object.entries(J.MOODS).map(([k,m])=>[k,m.name||k])]),
      select('字体','font',[['','跟随主题'],...Object.entries(J.FONTS).map(([k,f])=>[k,f.label])]),
      select('歌词语言','lang',[['auto','自动'],['ja','日语'],['zh-Hans','简体中文'],['zh-Hant','繁体中文'],['ko','韩语']]),
      ...sliders.map(([key,label,min,max,fallback])=>h('label',{key},`${label} ${number(tuning[key],fallback,min,max).toFixed(2)}`,h('input',{type:'range',min,max,step:.05,value:number(tuning[key],fallback,min,max),onChange:e=>change({[key]:Number(e.target.value)})}))),
      ...[['unify','连贯编排',true],['typeset','原版文字整列',false],['extra','扩展效果',true],['typo','文字 PV 效果',true],['kinetic','动感效果',true],['wa','和风效果',true],['horror','惊悚效果',false],['stepped','原版抽帧',false],['flash','闪光效果',false],['showHud','显示舞台信息',true],['hideNo','隐藏镜头编号',false],['hideTime','隐藏舞台时间',false],['onlineFonts','在线字体',false]].map(([key,label,fallback])=>h('label',{key},h('input',{type:'checkbox',checked:tuning[key]==null?fallback:!!tuning[key],onChange:e=>change({[key]:e.target.checked})}),label)),
      h(LazyDetails,{renderContent:()=>[
        h('label',null,'导入字体',h('input',{type:'file',accept:'.ttf,.otf,.woff,.woff2',onChange:importFont})),
        message&&h('span',{role:'status'},message),
        h('label',null,'合成背景',h('select',{value:tuning.keyBg||'off',onChange:e=>change({keyBg:e.target.value})},[['off','关闭'],['black','黑底合成'],['green','绿幕合成']].map(([value,label])=>h('option',{key:value,value},label)))),
        h('label',null,h('input',{type:'checkbox',checked:!!tuning.centerFree,onChange:e=>change({centerFree:e.target.checked})}),'中央留白'),
        tuning.centerFree&&h('label',null,'留白方向',h('select',{value:tuning.centerDir||'tb',onChange:e=>change({centerDir:e.target.value})},[['tb','上下分区'],['lr','左右分区']].map(([value,label])=>h('option',{key:value,value},label)))),
        h('label',null,h('input',{type:'checkbox',checked:!!tuning.colors?.enabled,onChange:e=>change({colors:{...(tuning.colors||{}),enabled:e.target.checked}})}),'自定义底色与文字'),
        tuning.colors?.enabled&&['bg','fg','sub'].map(key=>colorInput(key,'#000000')),
        h('label',null,h('input',{type:'checkbox',checked:!!tuning.colors?.accentOn,onChange:e=>change({colors:{...(tuning.colors||{}),accentOn:e.target.checked}})}),'自定义强调色'),
        tuning.colors?.accentOn&&['accent','ghostA','ghostB'].map(key=>colorInput(key,'#ffffff')),
        ...['display','serif','body','mono'].map(role=>h('label',{key:role},`${role} 字体`,h('select',{value:tuning.fontRoles?.[role]||'',onChange:e=>change({fontRoles:{...(tuning.fontRoles||{}),[role]:e.target.value}})},[['','跟随主题'],...Object.entries(J.FONTS).map(([key,font])=>[key,font.label])].map(([value,label])=>h('option',{key:value,value},label)))))
      ]},h('summary',null,'画面、配色与字体')),
      h(LazyDetails,{renderContent:()=>J.GROUP_KEYS.map(group=>h('label',{key:group},GROUP_LABELS[group],h('select',{'aria-label':`JIZURA ${GROUP_LABELS[group]}`,value:tuning.techniques?.[group]||'',onChange:e=>change({techniques:{...tuning.techniques,[group]:e.target.value}})},techniqueOptions(group).map(([value,label])=>h('option',{key:value,value},label)))))},h('summary',null,'原版效果选择')),
      h(LazyDetails,{renderContent:()=>J.GROUP_KEYS.map(group=>h(LazyDetails,{key:group,renderContent:()=>[
        h('label',null,h('input',{type:'checkbox',checked:!!tuning.locks?.tech?.[group],onChange:e=>change({locks:{...tuning.locks,tech:{...tuning.locks?.tech,[group]:e.target.checked}}})}),'随机编排时锁定此类别'),
        h('button',{type:'button',onClick:()=>{const next={...(tuning.enabledTechniques||{})};delete next[group];change({enabledTechniques:next});}},'使用全部'),
        ...J.order(group).filter(id=>J.registry(group)[id]&&!J.registry(group)[id].special).map(id=>h('label',{key:id},h('input',{type:'checkbox',checked:!Array.isArray(tuning.enabledTechniques?.[group])||tuning.enabledTechniques[group].includes(id),onChange:e=>{const all=J.order(group).filter(key=>J.registry(group)[key]&&!J.registry(group)[key].special);const selected=new Set(Array.isArray(tuning.enabledTechniques?.[group])?tuning.enabledTechniques[group]:all);if(e.target.checked)selected.add(id);else selected.delete(id);change({enabledTechniques:{...(tuning.enabledTechniques||{}),[group]:[...selected]}});}}),J.registry(group)[id].name||id))
      ]},h('summary',null,`${GROUP_LABELS[group]} 候选池${Array.isArray(tuning.enabledTechniques?.[group])?` · ${tuning.enabledTechniques[group].length}`:' · 全部'}`)))},h('summary',null,'候选效果池与随机锁')),
      h(LazyDetails,{renderContent:()=>Object.keys(J.defaultProject().fx).map(key=>h('label',{key},h('input',{type:'checkbox',checked:!!tuning.locks?.params?.[key],onChange:e=>change({locks:{...tuning.locks,params:{...tuning.locks?.params,[key]:e.target.checked}}})}),key))},h('summary',null,'参数随机锁')),
      h(LazyDetails,{onToggle:e=>{if(e.currentTarget.open)setEditorOpened(true);},renderContent:()=>lines.map(lineEditor)},h('summary',null,'逐行与逐镜头编排')),
      h(LazyDetails,{onToggle:e=>{if(e.currentTarget.open)setEditorOpened(true);},renderContent:()=>h(EditorTools,{tuning,onChange:change,lines,playback,plan})},h('summary',null,'时间轴与效果预览')),
      h(FoliaJizuraMedia.Settings,{tuning,onChange,lines,playback,audioSignals}),
      h('button',{type:'button',onClick:()=>change({seed:(Number(tuning.seed)||0)+1,nativeSeed:undefined})},'重新编排'),
      h('button',{type:'button',onClick:()=>onChange(randomizeTuning(tuning,lines,playback))},'随机主题配置')
    );
  }
  const SettingsView=React.memo?React.memo(Settings,(a,b)=>a.tuning===b.tuning&&a.onChange===b.onChange&&a.lines===b.lines&&a.audioSignals===b.audioSignals&&['uri','title','artist','durationMs'].every(key=>a.playback?.[key]===b.playback?.[key])):Settings;
  return {JizuraStage,Settings:SettingsView,buildPlan,projectFor,nativeProjectFor,tuningFromNativeProject,sourceLines,TransitionRenderer,validateData,randomizeTuning,timedSourceLines};
})();
