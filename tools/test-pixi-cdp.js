async function main() {
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
      const details = message.params.exceptionDetails;
      exceptions.push({
        text: details.text,
        description: details.exception?.description || null,
        url: details.url || null,
        line: details.lineNumber,
        column: details.columnNumber,
      });
    }
    if (!message.id || !pending.has(message.id)) return;
    pending.get(message.id)(message);
    pending.delete(message.id);
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
    const message = await command("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (message.result?.exceptionDetails) {
      throw new Error(message.result.exceptionDetails.text);
    }
    return message.result?.result?.value;
  };
  await command("Runtime.enable");

  const hasTrack = await evaluate(`Boolean(Spicetify.Player.data?.item?.uri)`);
  if (!hasTrack) {
    const mocked = await evaluate(`(() => {
      const snapshot = {
        item: {
          uri: "spotify:track:folia-runtime-test",
          name: "Folia Runtime Test",
          artists: [{name: "Folia Stage"}],
          album: {name: "Runtime Verification"},
          images: []
        },
        duration: 60000,
        progress: 12000,
        isPaused: false
      };
      try {
        Object.defineProperty(Spicetify.Player, "data", {
          configurable: true,
          get: () => snapshot
        });
        Spicetify.Player.getProgress = () => snapshot.progress;
        Spicetify.Player.getDuration = () => snapshot.duration;
        return Spicetify.Player.data?.item?.uri === snapshot.item.uri;
      } catch {
        return false;
      }
    })()`);
    if (!mocked) throw new Error("Unable to create a temporary playback snapshot");
  }

  const prepared = await evaluate(`(() => {
    const item = Spicetify.Player.data?.item;
    if (!item?.uri) return false;
    const localKey = "folia-stage:local-lyrics:v1";
    const settingsKey = "folia-stage:settings:v1";
    const local = JSON.parse(localStorage.getItem(localKey) || "{}");
    local[item.uri] = {
      provider: "local",
      sourceKind: "word",
      loadedAt: Date.now(),
      lines: [
        {startMs:0,endMs:60000,text:"Folia visual runtime",translation:"高级视觉运行时",words:[
          {text:"Folia ",startMs:0,endMs:15000},
          {text:"visual ",startMs:15000,endMs:30000},
          {text:"runtime",startMs:30000,endMs:60000}
        ]}
      ]
    };
    localStorage.setItem(localKey, JSON.stringify(local));
    const settings = JSON.parse(localStorage.getItem(settingsKey) || "{}");
    settings.mode = "sonnet";
    localStorage.setItem(settingsKey, JSON.stringify(settings));
    Spicetify.Platform.History.push("/");
    setTimeout(() => Spicetify.Platform.History.push("/folia-stage"), 100);
    return true;
  })()`);
  if (!prepared) throw new Error("Play a Spotify track before running the Pixi test");
  await new Promise((resolve) => setTimeout(resolve, 2800));

  const inspect = () => evaluate(`(() => {
    const canvas = document.querySelector(".folia-pixi__canvas");
    const host = document.querySelector(".folia-pixi");
    return {
      pixiVersion: host?.dataset.pixiVersion || null,
      pixiRenderer: host?.dataset.pixiRenderer || null,
      stageClass: document.querySelector(".folia-stage")?.className || null,
      canvasCount: document.querySelectorAll(".folia-pixi__canvas").length,
      canvasSize: canvas ? [canvas.width, canvas.height] : null,
      runtimeError: host?.dataset.pixiError || null,
      historyPath: Spicetify.Platform?.History?.location?.pathname || null,
      bodyText: document.body.innerText.slice(0, 180),
    };
  })()`);

  const results = { sonnet: await inspect() };
  for (const [mode, label] of [["tempera", "凝彩"], ["lumiere", "绘光"]]) {
    await evaluate(`(() => {
      const settingsButton = [...document.querySelectorAll(".folia-toolbar button")]
        .find(item => item.getAttribute("aria-label") === "设置");
      if (!document.querySelector(".folia-settings")) settingsButton?.click();
      return true;
    })()`);
    await new Promise((resolve) => setTimeout(resolve, 250));
    const clicked = await evaluate(`(() => {
      const modeButton = [...document.querySelectorAll(".folia-segmented button")]
        .find(item => item.textContent.trim() === "${label}");
      modeButton?.click();
      return Boolean(modeButton);
    })()`);
    if (!clicked) throw new Error(`Mode button not found: ${mode}`);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    results[mode] = await inspect();
  }

  await evaluate(`(() => {
    const settingsButton = [...document.querySelectorAll(".folia-toolbar button")]
      .find(item => item.getAttribute("aria-label") === "设置");
    if (!document.querySelector(".folia-settings")) settingsButton?.click();
  })()`);
  await new Promise((resolve) => setTimeout(resolve, 250));
  await evaluate(`(() => {
    const modeButton = [...document.querySelectorAll(".folia-segmented button")]
      .find(item => item.textContent.trim() === "聚焦");
    modeButton?.click();
  })()`);
  await new Promise((resolve) => setTimeout(resolve, 800));
  results.cleanup = await inspect();
  results.exceptions = exceptions;
  await evaluate(`(() => {
    const key = "folia-stage:local-lyrics:v1";
    const local = JSON.parse(localStorage.getItem(key) || "{}");
    for (const [uri, value] of Object.entries(local)) {
      if (value?.lines?.[0]?.text === "Folia visual runtime") {
        delete local[uri];
      }
    }
    localStorage.setItem(key, JSON.stringify(local));
  })()`);
  console.log(JSON.stringify(results, null, 2));
  socket.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
