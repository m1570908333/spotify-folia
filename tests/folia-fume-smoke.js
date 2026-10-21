const fs = require("fs");
const vm = require("vm");

const context2d = {
  font: "",
  measureText(text) { return { width: Array.from(text).length * (Number.parseFloat(this.font) || 20) * 0.58 }; },
};
const context = {
  console,
  Intl,
  performance: { now: () => 0 },
  document: { createElement: () => ({ getContext: () => context2d }) },
  Spicetify: {
    React: {
      createElement: () => null,
      useEffect: () => {},
      useMemo: (factory) => factory(),
      useRef: (value) => ({ current: value }),
      useState: (value) => [typeof value === "function" ? value() : value, () => {}],
    },
  },
};
vm.createContext(context);
vm.runInContext(fs.readFileSync("prototype/folia-stage/folia-classic.js", "utf8"), context);
vm.runInContext(fs.readFileSync("prototype/folia-stage/folia-fume.js", "utf8"), context);
const api = vm.runInContext("FoliaFaithfulFume", context);

const lines = Array.from({ length: 18 }, (_, index) => {
  const startMs = index * 4000;
  const text = index === 8 ? "穿越了千个万个时间线" : `第${index + 1}行歌词在纸面上继续书写`;
  return {
    text,
    startMs,
    endMs: startMs + 3600,
    words: Array.from(text, (char, wordIndex) => ({
      text: char,
      startMs: startMs + wordIndex * 180,
      endMs: startMs + (wordIndex + 1) * 180,
    })),
  };
});
const viewport = { width: 728, height: 638 };
const tuning = api.resolveTuning({ cameraTrackingMode: "smooth", heroScale: 1 });
const article = api.buildArticleLayout(lines, viewport, 1, tuning);
if (!article || article.blocks.length !== lines.length) throw new Error("Fume article did not include every line");
if (article.columns !== 4) throw new Error(`unexpected Fume column count: ${article.columns}`);
if (!article.blocks.some((block) => block.variant === "hero")) throw new Error("Fume article has no hero block");
if (!(article.height > viewport.height * 1.5)) throw new Error("Fume article is not taller than the viewport");

const block = article.blockBySourceLineIndex.get(8);
const before = api.printedProgress(block, block.line.startMs - 1);
const middle = api.printedProgress(block, block.line.startMs + 900);
const after = api.printedProgress(block, block.line.endMs + 1);
if (before !== 0 || !(middle > 0 && middle < block.graphemes.length) || after !== block.graphemes.length) throw new Error("Fume print progress mismatch");

const target = api.cameraTarget(article, 8, block.line.startMs + 900, viewport, tuning);
if (![target.x, target.y, target.scale].every(Number.isFinite) || target.scale < 0.88 || target.scale > 2.2) throw new Error("Fume camera target mismatch");

console.log("faithful Fume smoke test passed");
