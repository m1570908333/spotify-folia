async function main() {
  const pages = await fetch("http://127.0.0.1:9222/json").then((response) => response.json());
  const page = pages.find((entry) => entry.type === "page");
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const events = [];
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown" || message.method === "Runtime.consoleAPICalled" || message.method === "Log.entryAdded") events.push(message);
    if (message.id && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); }
  };
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  const command = (method, params = {}) => new Promise((resolve) => { const next=++id;pending.set(next,resolve);socket.send(JSON.stringify({id:next,method,params})); });
  await command("Runtime.enable");
  await command("Log.enable");
  await command("Page.enable");
  await command("Runtime.evaluate", { expression: `Spicetify.Platform.History.push("/");setTimeout(()=>Spicetify.Platform.History.push("/folia-stage"),150)`, returnByValue: true });
  await new Promise((resolve) => setTimeout(resolve, 4000));
  console.log(JSON.stringify(events.map((event) => ({
    method:event.method,
    text:event.params?.entry?.text || event.params?.exceptionDetails?.exception?.description || event.params?.exceptionDetails?.text || event.params?.args?.map((arg)=>arg.value||arg.description).join(" "),
    url:event.params?.entry?.url || event.params?.exceptionDetails?.url,
    line:event.params?.entry?.lineNumber || event.params?.exceptionDetails?.lineNumber,
  })), null, 2));
  socket.close();
}
main().catch((error)=>{console.error(error);process.exitCode=1;});
