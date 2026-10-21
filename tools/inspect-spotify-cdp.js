async function main() {
  const pages = await fetch("http://127.0.0.1:9222/json").then((response) => response.json());
  const page = pages.find((entry) => entry.type === "page");
  if (!page) throw new Error("Spotify page not found");

  const socket = new WebSocket(page.webSocketDebuggerUrl);
  let nextId = 1;
  const pending = new Map();
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    pending.get(message.id)(message);
    pending.delete(message.id);
  };
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });

  const evaluate = (expression) => new Promise((resolve) => {
    const id = nextId++;
    pending.set(id, (message) => resolve(message.result?.result?.value));
    socket.send(JSON.stringify({
      id,
      method: "Runtime.evaluate",
      params: { expression, returnByValue: true, awaitPromise: true },
    }));
  });

  const links = await evaluate(`[...document.querySelectorAll("a")].filter(a => /folia/i.test(a.href + a.textContent)).map(a => ({href:a.href,text:a.textContent.trim()}))`);
  console.log("links", JSON.stringify(links));
  const navigated = await evaluate(`(() => {
    if (document.querySelector(".folia-stage")) return true;
    const a=[...document.querySelectorAll("a")].find(a => /folia-stage/.test(a.href));
    if(a){a.click();return true}
    if (globalThis.Spicetify?.Platform?.History) {
      Spicetify.Platform.History.push("/folia-stage");
      return true;
    }
    return false;
  })()`);
  console.log("navigated", navigated);
  await new Promise((resolve) => setTimeout(resolve, 2500));
  const result = await evaluate(`(() => ({
    url: location.href,
    stage: Boolean(document.querySelector(".folia-stage")),
    stageRect: (() => { const r=document.querySelector(".folia-stage")?.getBoundingClientRect(); return r ? {x:r.x,y:r.y,width:r.width,height:r.height} : null })(),
    spotifyTopbar: (() => { const e=document.querySelector(".main-topBar-container"); const r=e?.getBoundingClientRect(); return r ? {x:r.x,y:r.y,width:r.width,height:r.height,z:getComputedStyle(e).zIndex} : null })(),
    buttons: [...document.querySelectorAll(".folia-toolbar button")].map(button => {
      const rect = button.getBoundingClientRect();
      const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      const style = getComputedStyle(button);
      return {
        label: button.getAttribute("aria-label"),
        rect: {x:rect.x,y:rect.y,width:rect.width,height:rect.height},
        pointerEvents: style.pointerEvents,
        zIndex: style.zIndex,
        topTag: top?.tagName,
        topClass: top?.className,
        isTop: top === button || button.contains(top),
      };
    }),
  }))()`);
  console.log(JSON.stringify(result, null, 2));
  const clicked = await evaluate(`(() => {
    const button = [...document.querySelectorAll(".folia-toolbar button")]
      .find(item => item.getAttribute("aria-label") === "设置");
    button?.click();
    return Boolean(button);
  })()`);
  await new Promise((resolve) => setTimeout(resolve, 250));
  const settingsOpen = await evaluate(`Boolean(document.querySelector(".folia-settings"))`);
  console.log("click", JSON.stringify({ clicked, settingsOpen }));
  socket.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
