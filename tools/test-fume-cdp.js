const fs = require("fs");

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
  const command = (method, params = {}) => Promise.race([
    new Promise((resolve) => {
      const next = ++id;
      pending.set(next, resolve);
      socket.send(JSON.stringify({ id: next, method, params }));
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${method} timed out`)), 12000)),
  ]);
  const evaluate = async (expression) => {
    const result = await command("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.result?.exceptionDetails) throw new Error(result.result.exceptionDetails.exception?.description || result.result.exceptionDetails.text);
    return result.result?.result?.value;
  };
  await command("Runtime.enable");
  await command("Page.enable");
  await evaluate(`Spicetify.Platform.History.push("/folia-stage")`);
  await new Promise((resolve) => setTimeout(resolve, 2500));
  const backup = await evaluate(`(() => ({
    local: localStorage.getItem("folia-stage:local-lyrics:v1"),
    settings: localStorage.getItem("folia-stage:settings:v1")
  }))()`);
  const hasTrack = await evaluate(`Boolean(Spicetify.Player.data?.item?.uri)`);
  if (!hasTrack) {
    const mocked = await evaluate(`(() => {
      const snapshot = {
        item: {
          uri: "spotify:track:folia-fume-runtime-test",
          name: "Fume Runtime Test",
          artists: [{name:"Folia Stage"}],
          album: {name:"Article Camera Verification"},
          images: []
        },
        duration: 60000,
        progress: 5200,
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
  await evaluate(`(() => {
    const item = Spicetify.Player.data?.item;
    if (!item?.uri) throw new Error("No active Spotify track");
    const progress = Number(Spicetify.Player.getProgress?.() || 0);
    const base = Math.max(0, progress - 2200);
    const phrases = [
      "回忆降落没有讯号的地方", "你站在时间背面的月台", "城市将未寄出的信折叠", "每一盏灯都保留你的形状",
      "风沿着旧报纸缓慢翻页", "我们曾穿过无数条时间线", "想见你只剩下一个方向", "名字在纸面发出微光",
      "这一刻相机跟随正在印刷的字", "昨日沉入安静的留白", "未来从段落之间经过", "我把答案写进夜色",
      "让已经唱过的句子继续停留", "像一篇尚未完成的文章", "远处的钟声重新排列", "所有道路都朝你展开",
      "当最后一行逐渐清晰", "整张纸回到我们的眼前"
    ];
    const lines = phrases.map((text, index) => {
      const startMs = base + index * 1000;
      const chars = Array.from(text);
      return {
        startMs,
        endMs: startMs + 900,
        text,
        translation: index === 2 ? "The city folds the letters never sent" : "",
        words: chars.map((char, charIndex) => ({
          text: char,
          startMs: startMs + charIndex * (900 / chars.length),
          endMs: startMs + (charIndex + 1) * (900 / chars.length)
        }))
      };
    });
    const local = JSON.parse(localStorage.getItem("folia-stage:local-lyrics:v1") || "{}");
    local[item.uri] = { provider:"local", sourceKind:"word", loadedAt:Date.now(), lines };
    localStorage.setItem("folia-stage:local-lyrics:v1", JSON.stringify(local));
    Spicetify.Platform.History.push("/");
    setTimeout(() => Spicetify.Platform.History.push("/folia-stage"), 120);
  })()`);
  await new Promise((resolve) => setTimeout(resolve, 2800));
  await evaluate(`(() => {
    const settingsButton = [...document.querySelectorAll(".folia-toolbar button")].find((button) => button.getAttribute("aria-label") === "设置");
    if (!document.querySelector(".folia-settings")) settingsButton?.click();
  })()`);
  await new Promise((resolve) => setTimeout(resolve, 350));
  await evaluate(`(() => {
    const mode = [...document.querySelectorAll(".folia-segmented button")].find((button) => button.textContent.trim() === "雾色");
    mode?.click();
    const refresh = [...document.querySelectorAll(".folia-toolbar button")].find((button) => button.getAttribute("aria-label") === "重新匹配歌词");
    refresh?.click();
  })()`);
  await new Promise((resolve) => setTimeout(resolve, 4500));
  await evaluate(`(() => {
    window.__fumeSettingsControls = document.querySelectorAll(".folia-settings__fume input").length;
    const settings = [...document.querySelectorAll(".folia-toolbar button")].find((button) => button.getAttribute("aria-label") === "设置");
    if (document.querySelector(".folia-settings")) settings?.click();
  })()`);
  await new Promise((resolve) => setTimeout(resolve, 500));
  const result = await evaluate(`(() => {
    const canvas = document.querySelector(".folia-fume-faithful__canvas");
    let coloredSamples = 0;
    if (canvas) {
      const context = canvas.getContext("2d");
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const stride = Math.max(4, Math.floor(data.length / 5000 / 4) * 4);
      for (let index = 3; index < data.length; index += stride) if (data[index] > 8) coloredSamples += 1;
    }
    return {
      stage: Boolean(document.querySelector(".folia-fume-faithful")),
      canvas: canvas ? {width:canvas.width,height:canvas.height,cssWidth:canvas.clientWidth,cssHeight:canvas.clientHeight} : null,
      coloredSamples,
      settingsControls: window.__fumeSettingsControls || 0,
      oldCanvas: Boolean(document.querySelector(".folia-fume__canvas")),
      provider: document.querySelector(".folia-source")?.textContent || ""
    };
  })()`);
  const screenshot = await command("Page.captureScreenshot", { format: "png", fromSurface: true });
  fs.writeFileSync("fume-runtime.png", Buffer.from(screenshot.result.data, "base64"));
  console.log(JSON.stringify({ ...result, exceptions }, null, 2));
  await evaluate(`(() => {
    const backup = ${JSON.stringify(backup)};
    if (backup.local === null) localStorage.removeItem("folia-stage:local-lyrics:v1");
    else localStorage.setItem("folia-stage:local-lyrics:v1", backup.local);
    if (backup.settings === null) localStorage.removeItem("folia-stage:settings:v1");
    else localStorage.setItem("folia-stage:settings:v1", backup.settings);
    const refresh = [...document.querySelectorAll(".folia-toolbar button")].find((button) => button.getAttribute("aria-label") === "重新匹配歌词");
    refresh?.click();
  })()`);
  await new Promise((resolve) => setTimeout(resolve, 1200));
  socket.close();
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
