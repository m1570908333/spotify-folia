async function main(){
 const pages=await fetch("http://127.0.0.1:9222/json").then(r=>r.json());const page=pages.find(x=>x.type==="page");const ws=new WebSocket(page.webSocketDebuggerUrl);let id=0;const pending=new Map();
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id);}};
 await new Promise((ok,no)=>{ws.onopen=ok;ws.onerror=no});
 const evalx=expr=>new Promise(resolve=>{const n=++id;pending.set(n,m=>resolve(m.result?.result?.value));ws.send(JSON.stringify({id:n,method:"Runtime.evaluate",params:{expression:expr,returnByValue:true,awaitPromise:true}}));});
 console.log(JSON.stringify(await evalx(`(async () => ({
   images:[...document.querySelectorAll(".folia-cappella img")].map(i=>({src:i.src,complete:i.complete,width:i.naturalWidth})),
   avatars:[...document.querySelectorAll(".folia-cappella__avatar")].map(e=>getComputedStyle(e).backgroundImage),
   probes:await Promise.all([
    "/custom_apps/folia-stage/cappella/emo/happy1.png",
    "/spicetify-routes-folia-stage/cappella/emo/happy1.png",
    "/cappella/emo/happy1.png",
    "https://xpui.app.spotify.com/custom_apps/folia-stage/cappella/emo/happy1.png"
   ].map(async url=>{try{const response=await fetch(url);return {url,status:response.status,type:response.headers.get("content-type")}}catch(error){return {url,error:String(error)}}}))
 }))()`),null,2));ws.close();
}
main().catch(e=>{console.error(e);process.exitCode=1});
