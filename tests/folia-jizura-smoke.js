const fs = require("fs");
const vm = require("vm");

const context = {
  console,
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
vm.runInContext(fs.readFileSync("prototype/folia-stage/folia-jizura.js", "utf8"), context);
const api = vm.runInContext("FoliaJizuraStage", context);
const line = { text: "A cinematic lyric PV test", startMs: 1000, endMs: 6000 };
const words = api.wordsFor(line);
if (words.length !== 5) throw new Error("JIZURA word segmentation failed");
if (words[0].startMs !== 1000 || words.at(-1).endMs !== 6000) throw new Error("JIZURA timing fallback failed");
if (api.shotAt(line, 1100, 1, "wide", 0).layout !== "wide") throw new Error("JIZURA wide layout failed");
if (api.shotAt(line, 1100, 1, "vertical", 0).layout !== "vertical") throw new Error("JIZURA vertical layout failed");
if (typeof api.JizuraStage !== "function") throw new Error("JIZURA stage was not exported");
const chinese = api.wordsFor({ text: "\u60f3\u89c1\u4f60 tonight", startMs: 0, endMs: 4000 });
if (chinese.length !== 4 || chinese.map(word => word.text).join("") !== "\u60f3\u89c1\u4f60 tonight") throw new Error("Mixed-language segmentation failed");
if (words.map(word => word.text).join("") !== line.text) throw new Error("Word spaces were lost");
const timed = [{ text: "Hi", startMs: 15, endMs: 300 }];
if (api.wordsFor({ words: timed }) !== timed) throw new Error("Source word timing must be preserved");
const first = api.shotAt(line, 1200, 1, "auto", 0);
if (api.sceneFor("Rain and tears").id !== "storm") throw new Error("English scene matching failed");
if (api.sceneFor("\u57ce\u5e02\u7684\u8857\u5934").id !== "neon") throw new Error("Chinese scene matching failed");
if (api.sceneFor("Rain and tears", "ember").id !== "ember") throw new Error("Manual scene override failed");
if (api.sceneFor("training restraint").id !== "sky") throw new Error("Scene matcher must use whole English words");
api.shotAt(line, 9000, 1, "auto", 0);
if (JSON.stringify(first) !== JSON.stringify(api.shotAt(line, 1200, 1, "auto", 0))) throw new Error("Seek changed deterministic shot selection");
if (api.shotAt(line, 7000, 2, "auto", 0).cycle <= api.shotAt(line, 7000, .5, "auto", 0).cycle) throw new Error("Cut-speed control has no effect");
const tree = api.JizuraStage({ playback: { paused: true }, lyrics: { lines: [line] }, activeIndex: 0, timeMs: 1200, visible: true, settings: { jizuraTuning: { motionIntensity: 0, showHud: false, showUpcoming: false } } });
if (tree.props.style["--jizura-motion"] !== 0) throw new Error("Motion setting did not reach stage");
if (tree.children[0].props.paused !== true) throw new Error("Paused state did not reach canvas");
const frame = tree.children.find(child => child?.props?.className === "folia-jizura__frame");
if (frame.props.style.animationPlayState !== "paused") throw new Error("Shot animation did not pause");
console.log("JIZURA stage smoke test passed");
