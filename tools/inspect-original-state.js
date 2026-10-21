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
  const result = await new Promise((resolve) => {
    const next = ++id;
    pending.set(next, (message) => resolve(message.result.result.value));
    socket.send(JSON.stringify({ id: next, method: "Runtime.evaluate", params: {
      expression: `({
        settings: JSON.parse(localStorage.getItem("folia-stage:settings:v1") || "{}"),
        buttons: [...document.querySelectorAll(".folia-settings .folia-segmented button")].map(button => ({ text: button.textContent.trim(), active: button.classList.contains("is-active") })),
        classes: [...document.querySelectorAll("[class*=folia-original]")].map(element => element.className),
        globals: { visualizers: typeof FoliaOriginalVisualizers, temperaStage: typeof FoliaOriginalTemperaStage },
      })`,
      returnByValue: true,
    }}));
  });
  console.log(JSON.stringify(result, null, 2));
  socket.close();
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
