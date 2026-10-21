async function connect() {
  const pages = await fetch("http://127.0.0.1:9222/json").then((response) => response.json());
  const page = pages.find((entry) => entry.type === "page");
  if (!page) throw new Error("Spotify page not found");
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  let nextId = 0;
  const pending = new Map();
  const exceptions = [];
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown") exceptions.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    if (message.id && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); }
  };
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  const command = (method, params = {}) => new Promise((resolve) => {
    const id = ++nextId;
    pending.set(id, resolve);
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const response = await command("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (response.result?.exceptionDetails) throw new Error(response.result.exceptionDetails.exception?.description || response.result.exceptionDetails.text);
    return response.result?.result?.value;
  };
  await command("Runtime.enable");
  return { socket, evaluate, exceptions };
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const client = await connect();
  await client.evaluate(`(() => {
    const item = Spicetify.Player.data?.item;
    if (!item?.uri) throw new Error("Play a track before testing");
    const progress = Number(Spicetify.Player.getProgress?.() || 0);
    const local = JSON.parse(localStorage.getItem("folia-stage:local-lyrics:v1") || "{}");
    local[item.uri] = { provider:"local", sourceKind:"word", loadedAt:Date.now(), lines:[
      {startMs:Math.max(0,progress-1500),endMs:progress+5000,text:"想见你想见你想见你",words:Array.from("想见你想见你想见你",(text,index)=>({text,startMs:Math.max(0,progress-1500)+index*500,endMs:Math.max(0,progress-1000)+index*500}))},
      {startMs:progress+5000,endMs:progress+11000,text:"穿越了千个万个时间线",words:Array.from("穿越了千个万个时间线",(text,index)=>({text,startMs:progress+5000+index*450,endMs:progress+5450+index*450}))}
    ]};
    localStorage.setItem("folia-stage:local-lyrics:v1", JSON.stringify(local));
    Spicetify.Platform.History.push("/folia-stage");
  })()`);
  await delay(5000);
  const results = [];
  for (const mode of ["tempera", "sonnet", "lumiere"]) {
    await client.evaluate(`(() => {
      const settings=JSON.parse(localStorage.getItem("folia-stage:settings:v1")||"{}");settings.mode=${JSON.stringify(mode)};localStorage.setItem("folia-stage:settings:v1",JSON.stringify(settings));
      const setting=[...document.querySelectorAll('.folia-toolbar button')].find(button=>button.getAttribute('aria-label')==='设置');if(!document.querySelector('.folia-settings'))setting?.click();
      const label={tempera:'凝彩',sonnet:'诗笺',lumiere:'绘光'}[${JSON.stringify(mode)}];[...document.querySelectorAll('.folia-settings .folia-segmented button')].find(button=>button.textContent.trim()===label)?.click();
      [...document.querySelectorAll('.folia-toolbar button')].find(button=>button.getAttribute('aria-label')==='重新匹配歌词')?.click();
    })()`);
    await delay(3500);
    results.push(await client.evaluate(`(() => {
      const mode=${JSON.stringify(mode)};const host=document.querySelector('.folia-original-${mode}__host');const canvas=host?.querySelector('canvas');let pixels=0;
      if(canvas){try{const temp=document.createElement('canvas');temp.width=32;temp.height=32;const c=temp.getContext('2d');c.drawImage(canvas,0,0,32,32);const data=c.getImageData(0,0,32,32).data;for(let i=3;i<data.length;i+=4)if(data[i]>0)pixels++;}catch(error){pixels=-1}}
      return {mode,stage:Boolean(document.querySelector('.folia-original-${mode}')),canvas:Boolean(canvas),width:canvas?.width||0,height:canvas?.height||0,pixels,error:document.querySelector('.folia-original-runtime__error,.folia-original-tempera__error')?.textContent||''};
    })()`));
  }
  console.log(JSON.stringify({ results, exceptions: client.exceptions }, null, 2));
  client.socket.close();
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
