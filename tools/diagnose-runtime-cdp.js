async function main() {
  const pages = await fetch("http://127.0.0.1:9222/json").then((response) => response.json());
  const page = pages.find((entry) => entry.type === "page");
  if (!page) throw new Error("Spotify page not found");
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  let nextId = 1;
  const pending = new Map();
  const events = [];
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
      return;
    }
    if (message.method === "Runtime.exceptionThrown") {
      events.push({ type: "exception", value: message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text });
    }
    if (message.method === "Log.entryAdded") {
      const entry = message.params.entry;
      if (/folia|custom|error/i.test(entry.text)) events.push({ type: entry.level, value: entry.text, url: entry.url });
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
  await command("Runtime.enable");
  await command("Log.enable");
  await command("Page.enable");
  await command("Page.reload", { ignoreCache: true });
  await new Promise((resolve) => setTimeout(resolve, 8000));
  const snapshot = await command("Runtime.evaluate", {
    expression: `({path:Spicetify?.Platform?.History?.location?.pathname,stage:Boolean(document.querySelector('.folia-stage')),text:document.body.innerText.slice(0,500)})`,
    returnByValue: true,
  });
  console.log(JSON.stringify({ events, snapshot: snapshot.result?.result?.value }, null, 2));
  socket.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
