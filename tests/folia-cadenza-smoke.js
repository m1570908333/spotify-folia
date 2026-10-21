const fs = require("fs");
const vm = require("vm");

const context = vm.createContext({
  console,
  Intl,
  Math,
  Spicetify: {
    React: {
      createElement: () => null,
      useEffect: () => {},
      useMemo: (factory) => factory(),
      useRef: (value) => ({ current: value }),
      useState: (value) => [value, () => {}],
    },
  },
});

vm.runInContext(fs.readFileSync("prototype/folia-stage/folia-classic.js", "utf8"), context);
vm.runInContext(fs.readFileSync("prototype/folia-stage/folia-cadenza.js", "utf8"), context);
const api = vm.runInContext("FoliaFaithfulCadenza", context);

const text = "想见你只剩下一个方向";
const chars = Array.from(text);
const line = {
  startMs: 1000,
  endMs: 5200,
  text,
  words: chars.map((char, index) => ({
    text: char,
    startMs: 1000 + index * 360,
    endMs: 1360 + index * 360,
  })),
};
const settings = { cadenzaTuning: { fontScale: 1.12, widthRatio: 0.72, motionAmount: 1, glowIntensity: 1, beamIntensity: 0, animationIntensity: "normal" } };
const first = api.buildLayout(line, { width: 728, height: 638 }, settings);
const second = api.buildLayout(line, { width: 728, height: 638 }, settings);

if (!first || first.placements.length !== chars.length) throw new Error("Cadenza lost lyric words");
if (JSON.stringify(first) !== JSON.stringify(second)) throw new Error("Cadenza layout is not deterministic");
if (first.heroIndex < 0 || !first.placements.some((placement) => placement.hero && placement.scale > 1.4)) throw new Error("Cadenza hero placement missing");
if (!(first.maxWidth < 728 && first.maxWidth > 200)) throw new Error("Cadenza wrap width mismatch");
if (!first.placements.some((placement) => Math.abs(placement.rotate) > 0.05)) throw new Error("Cadenza fragments are not spatially varied");

const profile = vm.runInContext("FoliaFaithfulClassic.buildRenderProfile", context)(line);
const frame = api.wordFrame(first.placements[2], 1900, profile, api.resolveTuning(settings), 0.4, 2);
if (!["waiting", "active", "passed"].includes(frame.status)) throw new Error("Cadenza frame status mismatch");
if (![frame.x, frame.y, frame.rotation, frame.scale, frame.alpha].every(Number.isFinite)) throw new Error("Cadenza frame contains invalid geometry");

console.log("faithful Cadenza smoke test passed");
