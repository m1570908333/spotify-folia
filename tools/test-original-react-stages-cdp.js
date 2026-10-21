const fs = require("fs");
const os = require("os");
const path = require("path");

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
    if (message.method === "Runtime.exceptionThrown") {
      exceptions.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    }
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
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
  await command("Page.enable");
  return { socket, command, evaluate, exceptions };
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(client, expression, timeoutMs = 20000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await client.evaluate(expression)) return true;
    await delay(500);
  }
  return false;
}

async function main() {
  const client = await connect();
  const screenshotDir = fs.mkdtempSync(path.join(os.tmpdir(), "folia-stage-cdp-"));
  await client.evaluate(`(async () => {
    let item = Spicetify.Player.data?.item;
    if (!item?.uri && typeof Spicetify.Player.playUri === "function") {
      await Spicetify.Player.playUri("spotify:track:4uLU6hMCjMI75M1A2tKUQC");
      await new Promise((resolve) => setTimeout(resolve, 2500));
      item = Spicetify.Player.data?.item;
    }
    if (!item?.uri) throw new Error("Play a track before testing");
    const progress = Number(Spicetify.Player.getProgress?.() || 0);
    const start = Math.max(0, progress - 2500);
    const texts = ["想见你想见你想见你", "穿越了千个万个时间线", "人海里相依", "像钟摆追逐光影"];
    const lines = texts.map((text, lineIndex) => {
      const lineStart = start + lineIndex * 6500;
      const chars = Array.from(text);
      return {
        startMs: lineStart,
        endMs: lineStart + 6000,
        text,
        translation: ["Miss you again", "Across every timeline", "Together in the crowd", "A pendulum follows light"][lineIndex],
        words: chars.map((char, index) => ({ text: char, startMs: lineStart + index * 420, endMs: lineStart + (index + 1) * 420 })),
      };
    });
    const local = JSON.parse(localStorage.getItem("folia-stage:local-lyrics:v1") || "{}");
    local[item.uri] = { provider: "local", sourceKind: "word", loadedAt: Date.now(), lines };
    localStorage.setItem("folia-stage:local-lyrics:v1", JSON.stringify(local));
    Spicetify.Platform.History.push("/folia-stage");
  })()`);
  const mounted = await waitFor(client, `Boolean(document.querySelector('.folia-toolbar'))`);
  if (!mounted) {
    const diagnostic = await client.evaluate(`(() => ({
      path: location.pathname,
      title: document.title,
      bodyText: document.body?.innerText?.slice(0, 800) || '',
      globals: {
        core: typeof FoliaStageCore,
        reactStages: typeof FoliaOriginalReactStages,
        diorama: typeof FoliaOriginalDiorama,
      },
    }))()`);
    throw new Error(`Folia route did not mount: ${JSON.stringify({ diagnostic, exceptions: client.exceptions })}`);
  }
  await client.evaluate(`(async () => {
    const pixel = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="), (value) => value.charCodeAt(0));
    const previous = JSON.parse(localStorage.getItem("folia-stage:settings:v1") || "{}");
    const stale = (previous.temperaTuning?.layerImages || []).filter((image) => image.name === "cdp-test.png");
    await Promise.all(stale.map((image) => globalThis.FoliaTemperaAssets.remove(image.id)));
    previous.temperaTuning = { ...(previous.temperaTuning || {}), layerImages: (previous.temperaTuning?.layerImages || []).filter((image) => image.name !== "cdp-test.png") };
    localStorage.setItem("folia-stage:settings:v1", JSON.stringify(previous));
    const asset = await globalThis.FoliaTemperaAssets.addFiles([new File([pixel], "cdp-test.png", { type: "image/png" })], 1);
    const settings = JSON.parse(localStorage.getItem("folia-stage:settings:v1") || "{}");
    settings.temperaTuning = { ...(settings.temperaTuning || {}), layerImages: [...(settings.temperaTuning?.layerImages || []), ...asset] };
    localStorage.setItem("folia-stage:settings:v1", JSON.stringify(settings));
    Spicetify.Platform.History.push("/folia-stage");
  })()`);
  await delay(2500);
  const results = [];
  const labels = { claddagh: "环歌", monet: "莫奈", pendolo: "钟摆", tilt: "倾字", tempera: "凝彩", diorama: "立景" };
  for (const mode of Object.keys(labels)) {
    await client.evaluate(`(() => {
      const settingsButton = [...document.querySelectorAll('.folia-toolbar button')].find((button) => button.getAttribute('aria-label') === '设置');
      const panel = document.querySelector('.folia-settings');
      if (!panel || panel.getBoundingClientRect().width < 10) settingsButton?.click();
    })()`);
    await delay(500);
    await client.evaluate(`(() => {
      const button = [...document.querySelectorAll('.folia-settings .folia-segmented button')].find((item) => item.textContent.trim() === ${JSON.stringify(labels[mode])});
      if (!button) throw new Error('Missing mode button: ${mode}');
      button.click();
    })()`);
    await delay(500);
    await client.evaluate(`(() => {
      const settingsButton = [...document.querySelectorAll('.folia-toolbar button')].find((button) => button.getAttribute('aria-label') === '设置');
      const panel = document.querySelector('.folia-settings');
      if (panel && panel.getBoundingClientRect().width >= 10) settingsButton?.click();
    })()`);
    await delay(3500);
    results.push(await client.evaluate(`(() => {
      const stage = document.querySelector(${JSON.stringify(mode === "diorama" ? ".folia-original-diorama" : mode === "tempera" ? ".folia-original-tempera" : `.folia-original-react-stage--${mode}`)});
      const rect = stage?.getBoundingClientRect();
      const canvas = stage?.querySelector('canvas');
      let canvasPixels = 0;
      if (canvas) {
        try {
          const sample = document.createElement('canvas'); sample.width = 32; sample.height = 32;
          const context = sample.getContext('2d'); context.drawImage(canvas, 0, 0, 32, 32);
          const data = context.getImageData(0, 0, 32, 32).data;
          for (let index = 3; index < data.length; index += 4) if (data[index] > 0) canvasPixels += 1;
        } catch (error) { canvasPixels = -1; }
      }
      const visible = [...(stage?.querySelectorAll('*') || [])].filter((element) => {
        const box = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return box.width > 4 && box.height > 4 && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0.01;
      });
      return {
        mode: '${mode}',
        stage: Boolean(stage),
        rect: rect ? { width: Math.round(rect.width), height: Math.round(rect.height) } : null,
        visibleElements: visible.length,
        text: stage?.textContent?.trim().slice(0, 160) || '',
        cssInjected: Boolean(document.getElementById('folia-original-react-stages-css')),
        canvas: Boolean(canvas),
        canvasPixels,
      };
    })()`));
    const shot = await client.command("Page.captureScreenshot", { format: "png", fromSurface: true });
    fs.writeFileSync(path.join(screenshotDir, `${mode}-original-runtime.png`), Buffer.from(shot.result.data, "base64"));
  }
  const backgroundResults = [];
  for (const background of ["common", "monet", "nomand", "latent", "sora", "url"]) {
    await client.evaluate(`(() => {
      const settingsButton = [...document.querySelectorAll('.folia-toolbar button')].find((button) => button.getAttribute('aria-label') === '设置');
      const panel = document.querySelector('.folia-settings');
      if (!panel || panel.getBoundingClientRect().width < 10) settingsButton?.click();
    })()`);
    await delay(300);
    await client.evaluate(`(() => {
      const buttons = [...document.querySelectorAll('.folia-background-grid button')];
      const button = buttons.find((item) => item.dataset.backgroundMode === ${JSON.stringify(background)} || item.textContent.trim() === ({common:'通用',monet:'莫奈',nomand:'纸感',latent:'潜像',sora:'星空',url:'网页'})[${JSON.stringify(background)}]);
      if (!button) throw new Error('Missing background button: ${background}');
      button.click();
      const close = [...document.querySelectorAll('.folia-toolbar button')].find((item) => item.getAttribute('aria-label') === '设置');
      close?.click();
    })()`);
    await delay(2200);
    backgroundResults.push(await client.evaluate(`(() => {
      const host = document.querySelector('.folia-stage__background-host');
      const canvas = host?.querySelector('canvas');
      return { background: '${background}', host: Boolean(host), canvas: Boolean(canvas), canvasSize: canvas ? [canvas.width, canvas.height] : null, children: host?.querySelectorAll('*').length || 0 };
    })()`));
  }
  await client.evaluate(`(async () => {
    const settings = JSON.parse(localStorage.getItem("folia-stage:settings:v1") || "{}");
    const testImages = (settings.temperaTuning?.layerImages || []).filter((image) => image.name === "cdp-test.png");
    await Promise.all(testImages.map((image) => globalThis.FoliaTemperaAssets.remove(image.id)));
    settings.temperaTuning = { ...(settings.temperaTuning || {}), layerImages: (settings.temperaTuning?.layerImages || []).filter((image) => image.name !== "cdp-test.png") };
    localStorage.setItem("folia-stage:settings:v1", JSON.stringify(settings));
  })()`);
  console.log(JSON.stringify({ results, backgroundResults, exceptions: client.exceptions }, null, 2));
  client.socket.close();
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
