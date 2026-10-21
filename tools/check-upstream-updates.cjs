const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=JSON.parse(fs.readFileSync(path.join(root,'prototype/folia-stage/jizura-source.json'),'utf8'));
const context=vm.createContext({console,fetch,AbortController,setTimeout,clearTimeout,Date,
  localStorage:{getItem:()=>null,setItem:()=>{}},FoliaJizuraEngine:{FOLIA_SOURCE:source},Spicetify:{}});
vm.runInContext(fs.readFileSync(path.join(root,'prototype/folia-stage/upstream-updates.js'),'utf8'),context);
vm.runInContext('FoliaUpstreamUpdates.check(true)',context).then(result=>{
  console.log(JSON.stringify(result,null,2));
  if(result.rows.some(row=>row.error||row.releaseError))process.exitCode=1;
}).catch(error=>{console.error(error);process.exitCode=1;});
