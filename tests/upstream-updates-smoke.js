const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const store={};let calls=0,fail=false,invalid=false,networkError='',notifications=0;
const visibility=new Set();
const J=JSON.parse(fs.readFileSync('prototype/folia-stage/jizura-source.json','utf8'));
const context=vm.createContext({console,AbortController,setTimeout,clearTimeout,Date,
  setInterval:()=>1,clearInterval:()=>{},
  document:{hidden:false,addEventListener:(_,fn)=>visibility.add(fn),removeEventListener:(_,fn)=>visibility.delete(fn)},
  FoliaJizuraEngine:{FOLIA_SOURCE:J},Spicetify:{showNotification:()=>{notifications++;}},
  localStorage:{getItem:key=>store[key]||null,setItem:(key,value)=>{store[key]=value;}},
  fetch:async url=>{calls++;if(networkError){const error=new Error('offline');error.name=networkError;throw error;}
    const failed=fail===true||fail==='release'&&url.endsWith('releases/latest');
    return {ok:!failed,status:failed?403:200,json:async()=>invalid?{}:
    url.endsWith('releases/latest')?{tag_name:'v0.7.21'}:
    [{sha:url.includes('852wa')?J.commit:'a'.repeat(40),commit:{committer:{date:'2026-10-20T00:00:00Z'}}}]};},
});
vm.runInContext(fs.readFileSync('prototype/folia-stage/upstream-updates.js','utf8'),context);
const api=vm.runInContext('FoliaUpstreamUpdates',context);
(async()=>{
  const first=api.check(true);assert.equal(first,api.check(true),'deduplicate concurrent checks');
  const result=await first;
  assert.equal(calls,3);assert.equal(result.rows[0].changed,true);
  assert.equal(result.rows[0].releaseChanged,true);assert.equal(result.rows[1].changed,false);
  await api.check();assert.equal(calls,3,'cached checks avoid network');
  fail=true;const failed=await api.check(true);
  assert(failed.rows.every(row=>row.error.includes('限流')));
  assert(failed.rows.every(row=>row.changed===undefined),'errors are not reported as up to date');
  fail=false;invalid=true;assert((await api.check(true)).rows.every(row=>row.error.includes('无效')));
  invalid=false;networkError='AbortError';assert((await api.check(true)).rows.every(row=>row.error==='连接超时'));
  networkError='TypeError';assert((await api.check(true)).rows.every(row=>row.error==='offline'));
  networkError='';fail='release';const partial=await api.check(true);
  assert(partial.rows[0].releaseError);assert.equal(partial.rows[0].changed,true);assert(!partial.rows[1].error);
  fail=false;
  invalid=false;assert((await api.check(true)).rows.every(row=>!row.error),'retry recovers');
  assert(store['folia-stage-upstream-check-v1']);
  assert.equal(store['folia-stage-upstream-auto-v1'],undefined,'auto checks default off');
  const before=calls,stop=api.watch();stop();assert.equal(calls,before);assert.equal(visibility.size,0);
  store['folia-stage-upstream-auto-v1']='true';
  const firstWatch=api.watch();await Promise.resolve();firstWatch();
  assert.equal(notifications,1);
  const again=api.watch();await Promise.resolve();again();
  assert.equal(notifications,1,'same upstream state is not repeatedly notified');
  assert.equal(calls,before,'daily notification can use a recent check');
  console.log('Upstream update checks passed: changes, cache, deduplication, rate limit, invalid data, retry.');
})().catch(error=>{console.error(error);process.exitCode=1;});
