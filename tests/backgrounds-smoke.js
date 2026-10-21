const fs = require("fs");
const vm = require("vm");

const context = {
  console,
  performance: { now: () => 1000 },
  requestAnimationFrame: () => 1,
  cancelAnimationFrame: () => {},
  window: { devicePixelRatio: 1 },
  Spicetify: {
    React: {
      createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
      useEffect: () => {},
      useMemo: (factory) => factory(),
      useRef: (value) => ({ current: value }),
    },
  },
};

vm.createContext(context);
vm.runInContext(fs.readFileSync("prototype/folia-stage/backgrounds.js", "utf8"), context);
const api = vm.runInContext("FoliaStageBackgrounds", context);

if (api.modes.map((mode) => mode.id).join(",") !== "common,monet,nomand,latent,url,sora") {
  throw new Error("background registry mismatch");
}

const settings = {
  backgroundTunings: {
    common: {}, monet: {}, nomand: {}, latent: {}, url: {}, sora: {},
  },
};
for (const mode of api.modes) {
  if (!api.has(mode.id)) throw new Error(`background ${mode.id} was not registered`);
  const element = api.render(mode.id, { settings, cover: "cover", accent: "#fff", visible: true, paused: false });
  if (!element) throw new Error(`background ${mode.id} did not render`);
}

console.log("background registry smoke test passed");
