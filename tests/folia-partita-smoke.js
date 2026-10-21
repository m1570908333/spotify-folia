const fs = require("fs");
const vm = require("vm");

const context = {
  console,
  Intl,
  document: {
    createElement: () => ({ getContext: () => ({ font: "", measureText: (text) => ({ width: text.length * 20 }) }) }),
  },
  Spicetify: {
    React: {
      createElement: () => null,
      useEffect: () => {},
      useMemo: (factory) => factory(),
      useState: (value) => [typeof value === "function" ? value() : value, () => {}],
    },
  },
};

vm.createContext(context);
vm.runInContext(fs.readFileSync("prototype/folia-stage/folia-classic.js", "utf8"), context);
vm.runInContext(fs.readFileSync("prototype/folia-stage/folia-partita.js", "utf8"), context);
const api = vm.runInContext("FoliaFaithfulPartita", context);
const classic = vm.runInContext("FoliaFaithfulClassic", context);

const tuning = api.resolveTuning({ showGuideLines: true, useSemanticLayout: true, staggerMin: 100, staggerMax: 20 });
if (tuning.staggerMin !== 20 || tuning.staggerMax !== 100) throw new Error("stagger range was not normalized");

const line = {
  text: "穿越了千个万个时间线",
  startMs: 1000,
  endMs: 9000,
  words: Array.from("穿越了千个万个时间线", (text, index) => ({ text, startMs: 1000 + index * 600, endMs: 1600 + index * 600 })),
};
const first = api.buildLayout(line, 900, tuning, "normal");
const second = api.buildLayout(line, 900, tuning, "normal");
if (!first.chunks.length || first.chunks.length > 5) throw new Error("unexpected Partita row count");
if (JSON.stringify(first) !== JSON.stringify(second)) throw new Error("Partita layout is not deterministic");
if (!(first.chunks[0].config.x < 0) || (first.chunks[1] && !(first.chunks[1].config.x > 0))) throw new Error("Partita stagger direction mismatch");

const sticky = api.applySticky([
  { text: "It", words: [{ text: "It" }], startMs: 0, endMs: 100, isSemantic: false },
  { text: "’", words: [{ text: "’" }], startMs: 100, endMs: 120, isSemantic: false },
  { text: "s", words: [{ text: "s" }], startMs: 120, endMs: 180, isSemantic: false },
]);
if (sticky.length !== 1 || sticky[0].text !== "It’s") throw new Error("sticky contraction mismatch");

const overriddenLine = {
  ...line,
  wordSegments: ["穿越了", "千个万个", "时间线"],
  words: [
    { text: "穿越了", startMs: 1000, endMs: 2800 },
    { text: "千个万个", startMs: 2800, endMs: 5800 },
    { text: "时间线", startMs: 5800, endMs: 7600 },
  ],
};
const overridden = api.buildLayout(overriddenLine, 900, tuning, "normal");
const overriddenText = overridden.chunks.flatMap((chunk) => chunk.displayWords.map((word) => word.text));
if (overriddenText.join("") !== overriddenLine.text || overriddenText.length !== 3) {
  throw new Error("Partita did not preserve the saved word segmentation");
}

const profile = classic.buildRenderProfile(line);
const chunk = first.chunks[0];
if (api.getChunkStatus(chunk, chunk.rawWords[0].startMs - 200, profile) !== "waiting") throw new Error("chunk waiting boundary mismatch");
if (api.getChunkStatus(chunk, chunk.rawWords[0].startMs, profile) !== "active") throw new Error("chunk active boundary mismatch");

console.log("faithful Partita smoke test passed");
