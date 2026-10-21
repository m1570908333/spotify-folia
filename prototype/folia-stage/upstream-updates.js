const FoliaUpstreamUpdates = (() => {
  const KEY='folia-stage-upstream-check-v1';
  const PREF='folia-stage-upstream-auto-v1';
  const NOTICE='folia-stage-upstream-notified-v1';
  const jizuraCommit=FoliaJizuraEngine.FOLIA_SOURCE.commit;
  const projects=[
    {id:'folia',name:'Folia',repo:'chthollyphile/folia-major',version:'0.7.19',commit:'607771d593e5b50e39defcb964928672b48310cb'},
    {id:'jizura',name:'JIZURA',repo:'852wa/JIZURA',version:FoliaJizuraEngine.FOLIA_SOURCE.version,commit:jizuraCommit},
  ];
  const signature=projects.map(p=>p.commit).join(':');
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{ /* Optional cache may be unavailable. */ }};
  const listeners=new Set();
  const publish=()=>listeners.forEach(fn=>fn());
  let state=read(KEY,null),pending=null;
  if(state?.signature!==signature || !Array.isArray(state?.rows))state=null;
  async function request(repo,path) {
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),12000);
    try {
      const response=await fetch(`https://api.github.com/repos/${repo}/${path}`,{signal:controller.signal,credentials:'omit',cache:'no-store',headers:{Accept:'application/vnd.github+json'}});
      if(!response.ok)throw new Error(response.status===403||response.status===429?'GitHub 请求限流，请稍后重试':`GitHub HTTP ${response.status}`);
      return await response.json();
    }catch(error){throw new Error(error.name==='AbortError'?'连接超时':error.message||'网络连接失败');}
    finally{clearTimeout(timeout);}
  }
  async function inspect(project) {
    try {
      const commits=await request(project.repo,'commits?per_page=1');
      const latest=commits?.[0];
      if(!/^[a-f0-9]{40}$/i.test(latest?.sha||''))throw new Error('GitHub 提交响应无效');
      const row={...project,latestCommit:latest.sha,date:latest.commit?.committer?.date||'',changed:latest.sha!==project.commit};
      if(project.id==='folia'){
        try{
          const release=await request(project.repo,'releases/latest');
          if(typeof release.tag_name!=='string')throw new Error('GitHub 发布响应无效');
          row.latestVersion=release.tag_name;row.releaseChanged=release.tag_name.replace(/^v/,'')!==project.version;
        }catch(error){row.releaseError=error.message;}
      }
      return row;
    }catch(error){return {...project,error:error.message};}
  }
  function check(force=false) {
    if(pending)return pending;
    const ttl=state?.rows.some(row=>row.error||row.releaseError)?300000:86400000;
    if(!force&&state&&Date.now()-state.checkedAt<ttl)return Promise.resolve(state);
    pending=(async()=>{
      const rows=[];
      for(const project of projects)rows.push(await inspect(project));
      state={signature,checkedAt:Date.now(),rows};write(KEY,state);return state;
    })().finally(()=>{pending=null;publish();});
    publish();return pending;
  }
  function notify(result) {
    const changed=result.rows.filter(row=>!row.error&&(row.changed||row.releaseChanged));
    const token=signature+':'+changed.map(row=>row.latestCommit+':'+(row.latestVersion||'')).join(':');
    if(changed.length&&read(NOTICE,'')!==token){
      Spicetify.showNotification?.(`上游有变更：${changed.map(row=>row.name).join('、')}；请在设置中检查`,false);
      write(NOTICE,token);
    }
  }
  function watch() {
    const run=()=>{if(read(PREF,false)&&!document.hidden)check().then(notify).catch(()=>{});};
    run();const timer=setInterval(run,3600000);
    document.addEventListener('visibilitychange',run);
    return ()=>{clearInterval(timer);document.removeEventListener('visibilitychange',run);};
  }
  function Settings() {
    const React=Spicetify.React,h=React.createElement;
    const [,refresh]=React.useState(0);
    const [auto,setAuto]=React.useState(()=>read(PREF,false));
    React.useEffect(()=>{const fn=()=>refresh(n=>n+1);listeners.add(fn);return()=>listeners.delete(fn);},[]);
    return h('div',{className:'folia-settings__section folia-upstream'},
      h('label',null,'上游更新'),
      h('button',{className:'folia-button',disabled:!!pending,onClick:()=>check(true)},pending?'检查中…':'检查上游更新'),
      h('label',null,h('input',{type:'checkbox',checked:auto,onChange:e=>{
        const enabled=e.target.checked;setAuto(enabled);write(PREF,enabled);if(enabled)check().then(notify);
      }}),'每天检查并提醒'),
      state&&h('span',null,`检查时间 ${new Date(state.checkedAt).toLocaleString()}`),
      h('div',{'aria-live':'polite'},(state?.rows||projects).map(row=>h('div',{key:row.id},
        h('strong',null,`${row.name} · 迁移基线 ${row.version}`),
        h('div',null,row.error?`检查失败：${row.error}`:row.latestCommit?(row.changed?'上游源码有变更':'源码与迁移基线一致'):'尚未检查'),
        row.latestVersion&&h('div',null,`最新发布 ${row.latestVersion}${row.releaseChanged?' · 待审查适配':''}`),
        row.releaseError&&h('div',null,`发布检查失败：${row.releaseError}`),
        row.latestCommit&&h('code',null,row.latestCommit.slice(0,12)),
        row.date&&h('div',null,new Date(row.date).toLocaleString()),
        h('a',{href:`https://github.com/${row.repo}`,target:'_blank',rel:'noopener noreferrer'},'上游仓库'),
      ))));
  }
  return {Settings,check,watch,projects,getState:()=>state};
})();
