const fs = require("fs");
const vm = require("vm");

const context = {
  console,
  Intl,
  document: {
    createElement: () => ({
      getContext: () => ({ font: "", measureText: (text) => ({ width: text.length * 20 }) }),
    }),
  },
  Spicetify: {
    React: {
      createElement: () => null,
      useMemo: (factory) => factory(),
    },
  },
};

vm.createContext(context);
vm.runInContext(fs.readFileSync("prototype/folia-stage/folia-classic.js", "utf8"), context);
const api = vm.runInContext("FoliaFaithfulClassic", context);

const normal = api.buildRenderProfile({ startMs: 1000, endMs: 2000, words: [{ endMs: 1900 }] });
if (normal.wordRevealMode !== "normal" || normal.wordLookaheadMs !== 150) throw new Error("normal render profile mismatch");

const micro = api.buildRenderProfile({ startMs: 1000, endMs: 1050, words: [] });
if (micro.wordRevealMode !== "instant" || micro.renderEndMs !== 1067) throw new Error("micro render profile mismatch");

const word = { text: "想见", startMs: 1000, endMs: 1400 };
if (api.getWordStatus(word, 800, normal) !== "waiting") throw new Error("waiting boundary mismatch");
if (api.getWordStatus(word, 900, normal) !== "active") throw new Error("lookahead boundary mismatch");
if (api.getWordStatus(word, 1500, normal) !== "passed") throw new Error("passed boundary mismatch");

const timings = api.buildGraphemeTimings(word);
if (timings.length !== 2 || timings[0].endMs !== 1200 || timings[1].startMs !== 1200) throw new Error("grapheme timing mismatch");

const line = { text: "hello world", startMs: 1234, endMs: 3000 };
const words = [{ text: "hello", startMs: 1234, endMs: 2000 }, { text: "world", startMs: 2000, endMs: 3000 }];
const tuning = { animationIntensity: "normal", enableWordRotation: true, useLegacyLayout: false, wordSpacing: 0.7 };
const first = api.buildLayout(line, words, tuning, 1200, 1);
const second = api.buildLayout(line, words, tuning, 1200, 1);
if (JSON.stringify(first) !== JSON.stringify(second)) throw new Error("layout is not deterministic");

console.log("faithful classic smoke test passed");
