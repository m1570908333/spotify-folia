const fs = require("fs");
const mode = process.argv[2] || "classic";
const modeLabel = { classic: "聚焦", still: "静止", cadenza: "心景", partita: "云阶" }[mode] || "聚焦";
const settingsSelector = mode === "partita"
  ? ".folia-settings__partita input"
  : mode === "cadenza" ? ".folia-settings__cadenza input" : ".folia-settings__classic input";
const progressLead = mode === "partita" ? 1500 : 2500;
const timing = mode === "partita"
  ? { firstEnd: 1000, secondEnd: 3500, thirdEnd: 7000, lineEnd: 9000 }
  : { firstEnd: 3000, secondEnd: 6500, thirdEnd: 10000, lineEnd: 12000 };

async function connect() {
  const pages = await fetch("http://127.0.0.1:9222/json").then((response) => response.json());
  const page = pages.find((entry) => entry.type === "page");
  if (!page) throw new Error("Spotify page not found");
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  let nextId = 1;
  const pending = new Map();
  const exceptions = [];
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown") {
      exceptions.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    }
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  };
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  const command = (method, params = {}) => new Promise((resolve) => {
    const id = nextId++;
    pending.set(id, resolve);
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await command("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.result?.exceptionDetails) throw new Error(result.result.exceptionDetails.exception?.description || result.result.exceptionDetails.text);
    return result.result?.result?.value;
  };
  await command("Runtime.enable");
  return { socket, command, evaluate, exceptions };
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  let client = await connect();
  await client.evaluate(`(() => {
    const local = JSON.parse(localStorage.getItem("folia-stage:local-lyrics:v1") || "{}");
    delete local["spotify:track:folia-cadenza-runtime-test"];
    delete local["spotify:track:folia-fume-runtime-test"];
    localStorage.setItem("folia-stage:local-lyrics:v1", JSON.stringify(local));
  })()`);
  const backup = await client.evaluate(`(() => ({
    local: localStorage.getItem("folia-stage:local-lyrics:v1"),
    settings: localStorage.getItem("folia-stage:settings:v1")
  }))()`);
  const hasTrack = await client.evaluate(`Boolean(Spicetify.Player.data?.item?.uri)`);
  if (!hasTrack) {
    const mocked = await client.evaluate(`(() => {
      const snapshot = {
        item: {
          uri: "spotify:track:folia-cadenza-runtime-test",
          name: "Cadenza Runtime Test",
          artists: [{name:"Folia Stage"}],
          album: {name:"Mindscape Verification"},
          images: []
        },
        duration: 60000,
        progress: 4200,
        isPaused: true
      };
      try {
        Object.defineProperty(Spicetify.Player, "data", { configurable:true, get:() => snapshot });
        Spicetify.Player.getProgress = () => snapshot.progress;
        Spicetify.Player.getDuration = () => snapshot.duration;
        return true;
      } catch { return false; }
    })()`);
    if (!mocked) throw new Error("Unable to create a temporary playback snapshot");
  }
  await client.evaluate(`(() => {
    const item = Spicetify.Player.data?.item;
    if (!item?.uri) throw new Error("No active Spotify track");
    const progress = Number(Spicetify.Player.getProgress?.() || 0);
    const start = Math.max(0, progress - ${progressLead});
    const local = JSON.parse(localStorage.getItem("folia-stage:local-lyrics:v1") || "{}");
    local[item.uri] = {
      provider: "local",
      sourceKind: "word",
      loadedAt: Date.now(),
      lines: [{
        startMs: start,
        endMs: start + ${timing.lineEnd},
        text: "想见你 想见你 想见你",
        translation: "Miss you, miss you, miss you",
        words: [
          {text:"想见你",startMs:start,endMs:start+${timing.firstEnd}},
          {text:"想见你",startMs:start+${timing.firstEnd},endMs:start+${timing.secondEnd}},
          {text:"想见你",startMs:start+${timing.secondEnd},endMs:start+${timing.thirdEnd}}
        ]
      }, {
        startMs: start + ${timing.lineEnd},
        endMs: start + ${timing.lineEnd + 6000},
        text: "穿越了千个万个时间线",
        words: []
      }]
    };
    localStorage.setItem("folia-stage:local-lyrics:v1", JSON.stringify(local));
    const settings = JSON.parse(localStorage.getItem("folia-stage:settings:v1") || "{}");
    settings.mode = ${JSON.stringify(mode)};
    settings.showTranslation = true;
    localStorage.setItem("folia-stage:settings:v1", JSON.stringify(settings));
    const settingsButton = [...document.querySelectorAll(".folia-toolbar button")]
      .find((button) => button.getAttribute("aria-label") === "设置");
    if (!document.querySelector(".folia-settings")) settingsButton?.click();
    return true;
  })()`);
  await delay(300);
  await client.evaluate(`(() => {
    const selectedMode = [...document.querySelectorAll(".folia-segmented button")]
      .find((button) => button.textContent.trim() === ${JSON.stringify(modeLabel)});
    selectedMode?.click();
    const refresh = [...document.querySelectorAll(".folia-toolbar button")]
      .find((button) => button.getAttribute("aria-label") === "重新匹配歌词");
    refresh?.click();
  })()`);
  await delay(2500);
  await client.evaluate(`(() => {
    window.__foliaModeSettingsControls = document.querySelectorAll(${JSON.stringify(settingsSelector)}).length;
    const settings = [...document.querySelectorAll(".folia-toolbar button")]
      .find((button) => button.getAttribute("aria-label") === "设置");
    if (document.querySelector(".folia-settings")) settings?.click();
  })()`);
  await delay(300);
  const result = await client.evaluate(`(() => ({
    mode: ${JSON.stringify(mode)},
    faithfulStage: Boolean(document.querySelector(".folia-faithful-classic")),
    stillStage: Boolean(document.querySelector(".folia-lyrics--still")),
    partitaStage: Boolean(document.querySelector(".folia-partita-faithful")),
    cadenzaStage: Boolean(document.querySelector(".folia-cadenza-faithful")),
    cadenzaStageRect: (() => { const r=document.querySelector(".folia-cadenza-faithful")?.getBoundingClientRect(); return r ? {x:r.x,y:r.y,width:r.width,height:r.height} : null; })(),
    cadenzaLoading: document.querySelector(".folia-cadenza-faithful__loading")?.textContent || "",
    cadenzaCanvas: (() => { const canvas=document.querySelector(".folia-cadenza-faithful__canvas"); return canvas ? {width:canvas.width,height:canvas.height,cssWidth:canvas.clientWidth,cssHeight:canvas.clientHeight} : null; })(),
    cadenzaPixels: (() => { const canvas=document.querySelector(".folia-cadenza-faithful__canvas"); if(!canvas)return 0; const data=canvas.getContext("2d").getImageData(0,0,canvas.width,canvas.height).data; let count=0; const stride=Math.max(4,Math.floor(data.length/5000/4)*4); for(let i=3;i<data.length;i+=stride)if(data[i]>8)count+=1; return count; })(),
    oldClassic: Boolean(document.querySelector(".folia-lyrics--classic")),
    words: document.querySelectorAll(".folia-faithful-word").length,
    glows: document.querySelectorAll(".folia-faithful-word__glow").length,
    statuses: [...document.querySelectorAll(".folia-faithful-word")].map((element) => element.className),
    translation: document.querySelector(".folia-faithful-classic__translation")?.textContent || "",
    settingsControls: window.__foliaModeSettingsControls || 0,
    stillLines: document.querySelectorAll(".folia-still__line").length,
    stillActiveText: document.querySelector(".folia-still__line.is-active .folia-still__text")?.textContent || "",
    vignette: Boolean(document.querySelector(".folia-still__vignette")),
    partitaChunks: document.querySelectorAll(".folia-partita-faithful__chunk").length,
    partitaGuides: document.querySelectorAll(".folia-partita-faithful__guide-horizontal").length,
    partitaStatuses: [...document.querySelectorAll(".folia-partita-faithful__chunk")].map((element) => element.className),
    rect: (() => { const r=document.querySelector(".folia-faithful-classic__line, .folia-still__stack, .folia-partita-faithful__line, .folia-cadenza-faithful__canvas")?.getBoundingClientRect(); return r ? {x:r.x,y:r.y,width:r.width,height:r.height} : null; })()
  }))()`);
  const screenshot = await client.command("Page.captureScreenshot", { format: "png" });
  console.log(JSON.stringify({ ...result, exceptions: client.exceptions }, null, 2));
  try {
    fs.writeFileSync(`${mode}-runtime.png`, Buffer.from(screenshot.result.data, "base64"));
  } catch (error) {
    console.warn(`Screenshot write skipped: ${error.message}`);
  }

  await client.evaluate(`(() => {
    const backup = ${JSON.stringify(backup)};
    if (backup.local === null) localStorage.removeItem("folia-stage:local-lyrics:v1");
    else localStorage.setItem("folia-stage:local-lyrics:v1", backup.local);
    if (backup.settings === null) localStorage.removeItem("folia-stage:settings:v1");
    else localStorage.setItem("folia-stage:settings:v1", backup.settings);
    const refresh = [...document.querySelectorAll(".folia-toolbar button")]
      .find((button) => button.getAttribute("aria-label") === "重新匹配歌词");
    refresh?.click();
  })()`);
  await delay(1000);
  client.socket.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
