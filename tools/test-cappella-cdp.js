const fs = require("fs");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const pages = await fetch("http://127.0.0.1:9222/json").then((response) => response.json());
  const page = pages.find((entry) => entry.type === "page");
  if (!page) throw new Error("Spotify page not found");
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const exceptions = [];
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown") exceptions.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  };
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  const command = (method, params = {}) => new Promise((resolve) => {
    const next = ++id;
    pending.set(next, resolve);
    socket.send(JSON.stringify({ id: next, method, params }));
  });
  const evaluate = async (expression) => {
    const response = await command("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (response.result?.exceptionDetails) throw new Error(response.result.exceptionDetails.exception?.description || response.result.exceptionDetails.text);
    return response.result?.result?.value;
  };
  await command("Runtime.enable");
  await command("Page.enable");
  await evaluate(`Spicetify.Platform.History.push("/folia-stage")`);
  await delay(2200);
  const backup = await evaluate(`(() => ({local:localStorage.getItem("folia-stage:local-lyrics:v1"),settings:localStorage.getItem("folia-stage:settings:v1")}))()`);
  const hasTrack = await evaluate(`Boolean(Spicetify.Player.data?.item?.uri)`);
  if (!hasTrack) {
    const mocked = await evaluate(`(() => {
      const snapshot={item:{uri:"spotify:track:folia-cappella-runtime-test",name:"Cappella Runtime Test",artists:[{name:"Folia Stage"}],album:{name:"Conversation Verification"},images:[]},duration:60000,progress:8700,isPaused:true};
      try { Object.defineProperty(Spicetify.Player,"data",{configurable:true,get:()=>snapshot}); Spicetify.Player.getProgress=()=>snapshot.progress; Spicetify.Player.getDuration=()=>snapshot.duration; return true; } catch { return false; }
    })()`);
    if (!mocked) throw new Error("Unable to create playback snapshot");
  }
  await evaluate(`(() => {
    const item=Spicetify.Player.data.item;
    const progress=Number(Spicetify.Player.getProgress?.()||8700);
    const base=Math.max(0,progress-7700);
    const phrases=["你听见了吗","城市还没有睡","我们沿着时间线交谈","想见你","......","风把回忆送回来","名字在屏幕上发光","这一次不要错过","下一站依然是你"];
    const lines=phrases.map((text,index)=>{const startMs=base+index*1200;const chars=Array.from(text);return {startMs,endMs:startMs+1050,text,translation:index===6?"Your name glows on the screen":"",words:chars.map((char,charIndex)=>({text:char,startMs:startMs+charIndex*(1050/chars.length),endMs:startMs+(charIndex+1)*(1050/chars.length)}))};});
    const local=JSON.parse(localStorage.getItem("folia-stage:local-lyrics:v1")||"{}");
    local[item.uri]={provider:"local",sourceKind:"word",loadedAt:Date.now(),lines};
    localStorage.setItem("folia-stage:local-lyrics:v1",JSON.stringify(local));
    const settings=JSON.parse(localStorage.getItem("folia-stage:settings:v1")||"{}");
    settings.mode="cappella";settings.showTranslation=true;settings.cappellaTuning={showEmoMessages:true,emojiPackSource:"builtin",avatarSource:"builtin",animationIntensity:"normal"};
    localStorage.setItem("folia-stage:settings:v1",JSON.stringify(settings));
    Spicetify.Platform.History.push("/");setTimeout(()=>Spicetify.Platform.History.push("/folia-stage"),120);
  })()`);
  await delay(3200);
  await evaluate(`(() => { const button=[...document.querySelectorAll(".folia-toolbar button")].find(item=>item.getAttribute("aria-label")==="设置"); if(!document.querySelector(".folia-settings"))button?.click(); })()`);
  await delay(250);
  await evaluate(`(() => { const mode=[...document.querySelectorAll(".folia-segmented button")].find(item=>item.textContent.trim()==="群唱");mode?.click();const refresh=[...document.querySelectorAll(".folia-toolbar button")].find(item=>item.getAttribute("aria-label")==="重新匹配歌词");refresh?.click(); })()`);
  await delay(3000);
  await evaluate(`(() => { window.__cappellaControls=document.querySelectorAll(".folia-settings__cappella input, .folia-settings__cappella button").length;const button=[...document.querySelectorAll(".folia-toolbar button")].find(item=>item.getAttribute("aria-label")==="设置");if(document.querySelector(".folia-settings"))button?.click(); })()`);
  await delay(350);
  const result = await evaluate(`(() => ({
    stage:Boolean(document.querySelector(".folia-cappella")),
    rows:document.querySelectorAll(".folia-cappella__row").length,
    left:document.querySelectorAll(".folia-cappella__row.is-left").length,
    right:document.querySelectorAll(".folia-cappella__row.is-right").length,
    active:document.querySelectorAll(".folia-cappella__row.is-active").length,
    passed:document.querySelectorAll(".folia-cappella__row.is-passed").length,
    avatars:document.querySelectorAll(".folia-cappella__avatar").length,
    emojis:document.querySelectorAll(".folia-cappella__emo").length,
    emojiLoaded:[...document.querySelectorAll(".folia-cappella__emo")].every(image=>image.complete&&image.naturalWidth>0),
    revealed:document.querySelectorAll(".folia-cappella__text .is-revealed").length,
    controls:window.__cappellaControls||0,
    provider:document.querySelector(".folia-source")?.textContent||"",
    rect:(()=>{const r=document.querySelector(".folia-cappella__conversation")?.getBoundingClientRect();return r?{x:r.x,y:r.y,width:r.width,height:r.height}:null;})()
  }))()`);
  const screenshot = await command("Page.captureScreenshot", { format: "png", fromSurface: true });
  fs.writeFileSync("cappella-runtime.png", Buffer.from(screenshot.result.data, "base64"));
  console.log(JSON.stringify({ ...result, exceptions }, null, 2));
  await evaluate(`(() => { const backup=${JSON.stringify(backup)};if(backup.local===null)localStorage.removeItem("folia-stage:local-lyrics:v1");else localStorage.setItem("folia-stage:local-lyrics:v1",backup.local);if(backup.settings===null)localStorage.removeItem("folia-stage:settings:v1");else localStorage.setItem("folia-stage:settings:v1",backup.settings);const refresh=[...document.querySelectorAll(".folia-toolbar button")].find(item=>item.getAttribute("aria-label")==="重新匹配歌词");refresh?.click(); })()`);
  await delay(900);
  socket.close();
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
