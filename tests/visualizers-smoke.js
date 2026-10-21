const fs = require("fs");
const vm = require("vm");

const context = {
  console,
  Spicetify: {
    React: {
      createElement: () => null,
      useEffect: () => {},
      useMemo: (factory) => factory(),
      useRef: (value) => ({ current: value }),
    },
  },
};

vm.createContext(context);
vm.runInContext(fs.readFileSync("prototype/folia-stage/visualizers.js", "utf8"), context);

const modes = vm.runInContext("FoliaStageVisualizers.modes.map((mode) => mode.id)", context);
for (const expected of [
  "english",
  "jizura",
  "flow",
  "poster",
  "cappella",
  "claddagh",
  "monet",
  "pendolo",
  "diorama",
  "sonnet",
  "tempera",
  "lumiere",
]) {
  if (!modes.includes(expected)) throw new Error(`Missing visualizer mode: ${expected}`);
}

for (const removed of ["cadenza", "fume", "tilt", "classic", "partita", "still"]) {
  if (modes.includes(removed)) throw new Error(`Removed mode still registered: ${removed}`);
  if (vm.runInContext(`FoliaStageVisualizers.has("${removed}")`, context)) {
    throw new Error(`Removed mode still accepted: ${removed}`);
  }
}
console.log("visualizer registry smoke test passed");
