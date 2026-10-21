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
  const evaluate = (expression) => new Promise((resolve) => {
    const next = ++id;
    pending.set(next, (message) => resolve({
      value: message.result?.result?.value,
      exception: message.result?.exceptionDetails?.exception?.description || message.result?.exceptionDetails?.text,
    }));
    socket.send(JSON.stringify({ id: next, method: "Runtime.evaluate", params: { expression, returnByValue: true, awaitPromise: true } }));
  });
  const before = await evaluate(`(() => ({
    classic: typeof FoliaFaithfulClassic,
    cadenza: typeof FoliaFaithfulCadenza,
    partita: typeof FoliaFaithfulPartita,
    visualizers: typeof FoliaStageVisualizers,
    core: typeof FoliaStageCore,
    history: Spicetify.Platform.History.location,
    links: [...document.querySelectorAll("a")].filter(a => /folia/i.test(a.href + a.textContent)).map(a => ({href:a.href,text:a.textContent.trim()})),
    rootText: document.querySelector("#main")?.textContent?.slice(0, 300) || "",
  }))()`);
  const pushed = await evaluate(`(() => { Spicetify.Platform.History.push("/folia-stage"); return Spicetify.Platform.History.location; })()`);
  await new Promise((resolve) => setTimeout(resolve, 3000));
  const after = await evaluate(`(() => ({
    history: Spicetify.Platform.History.location,
    stage: Boolean(document.querySelector(".folia-stage")),
    provider: document.querySelector(".folia-source")?.textContent || "",
    currentLocalTest: (() => {
      const uri = Spicetify.Player.data?.item?.uri;
      const local = JSON.parse(localStorage.getItem("folia-stage:local-lyrics:v1") || "{}");
      return Boolean(uri && local[uri]?.lines?.[0]?.text === "想见你 想见你 想见你");
    })(),
    runtimeTestKeys: Object.keys(JSON.parse(localStorage.getItem("folia-stage:local-lyrics:v1") || "{}"))
      .filter(key => key.includes("folia-cadenza-runtime-test") || key.includes("folia-cappella-runtime-test") || key.includes("folia-fume-runtime-test")),
    bodyText: document.body.innerText.slice(0, 500),
  }))()`);
  console.log(JSON.stringify({ before, pushed, after }, null, 2));
  socket.close();
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
