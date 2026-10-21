const fs = require("fs");

async function main() {
  const pages = await fetch("http://127.0.0.1:9222/json").then((response) => response.json());
  const page = pages.find((entry) => entry.type === "page");
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
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
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${method} timed out`)), 10000)),
  ]);
  const evaluate = async (expression) => {
    const result = await command("Runtime.evaluate", { expression, returnByValue: true });
    return result.result?.result?.value;
  };
  await command("Page.enable");
  const state = await evaluate(`(() => ({
    stage: Boolean(document.querySelector(".folia-partita-faithful")),
    chunks: [...document.querySelectorAll(".folia-partita-faithful__chunk")].map((element) => ({
      className: element.className,
      text: element.textContent,
      rect: (() => { const r=element.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height}; })()
    })),
    guides: document.querySelectorAll(".folia-partita-faithful__guide-horizontal").length,
    settingsControls: document.querySelectorAll(".folia-settings__partita input").length,
    provider: document.querySelector(".folia-source")?.textContent || ""
  }))()`);
  const screenshot = await command("Page.captureScreenshot", { format: "png", fromSurface: true });
  fs.writeFileSync("partita-runtime.png", Buffer.from(screenshot.result.data, "base64"));
  console.log(JSON.stringify(state, null, 2));
  await evaluate(`(() => {
    const uri = Spicetify.Player.data?.item?.uri;
    const key = "folia-stage:local-lyrics:v1";
    const local = JSON.parse(localStorage.getItem(key) || "{}");
    if (uri && local[uri]?.lines?.[0]?.text === "想见你 想见你 想见你") {
      delete local[uri];
      localStorage.setItem(key, JSON.stringify(local));
    }
    const refresh = [...document.querySelectorAll(".folia-toolbar button")]
      .find((button) => button.getAttribute("aria-label") === "重新匹配歌词");
    refresh?.click();
    return true;
  })()`);
  socket.close();
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
