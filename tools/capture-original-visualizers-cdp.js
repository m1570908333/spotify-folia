const fs = require("fs");

async function main() {
  const pages = await fetch("http://127.0.0.1:9222/json").then((response) => response.json());
  const page = pages.find((entry) => entry.type === "page");
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); }
  };
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  const command = (method, params = {}) => new Promise((resolve) => {
    const next = ++id;
    pending.set(next, resolve);
    socket.send(JSON.stringify({ id: next, method, params }));
  });
  const evaluate = async (expression) => (await command("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;
  for (const [mode, label] of [["tempera", "凝彩"], ["sonnet", "诗笺"], ["lumiere", "绘光"]]) {
    await evaluate(`(() => {
      const settingsButton=[...document.querySelectorAll('.folia-toolbar button')].find(button=>button.getAttribute('aria-label')==='设置');
      if(!document.querySelector('.folia-settings')) settingsButton?.click();
      [...document.querySelectorAll('.folia-settings .folia-segmented button')].find(button=>button.textContent.trim()===${JSON.stringify(label)})?.click();
    })()`);
    await new Promise((resolve) => setTimeout(resolve, 3200));
    const screenshot = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, fromSurface: true });
    fs.writeFileSync(`${mode}-original-runtime.png`, Buffer.from(screenshot.result.data, "base64"));
  }
  socket.close();
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
