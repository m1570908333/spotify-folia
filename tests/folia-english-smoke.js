const fs = require("fs");
const vm = require("vm");

const context = {
  console,
  Spicetify: { React: { useMemo: (factory) => factory(), useEffect: () => {}, useRef: () => ({ current: null }), createElement: () => null } },
};
vm.createContext(context);
vm.runInContext(fs.readFileSync("prototype/folia-stage/folia-english.js", "utf8"), context);
vm.runInContext(fs.readFileSync("prototype/folia-stage/folia-english-cinematic.js", "utf8"), context);
const api = vm.runInContext("FoliaEnglishStage", context);
const cinematic = vm.runInContext("FoliaEnglishCinematicStage", context);

const line = {
  text: "This is a deliberately long English lyric line for layout testing",
  startMs: 1000,
  endMs: 5000,
};
const words = api.wordsFor(line);
if (words.length < 8) throw new Error("English words were not segmented");
if (!api.isEnglishLine(line)) throw new Error("English line was not detected");
if (words[0].startMs !== line.startMs || words.at(-1).endMs !== line.endMs) {
  throw new Error("English timing fallback is not aligned to the line");
}
if (api.activeWordIndexAt(words, 1100, line.endMs) !== 0) {
  throw new Error("English focus did not begin on the first timed word");
}
if (api.activeWordIndexAt(words, 3000, line.endMs) < 1) {
  throw new Error("English focus did not advance through the line");
}
if (api.activeWordIndexAt(words, 6000, line.endMs) !== -1) {
  throw new Error("English focus should finish after the final word");
}

console.log("cinematic English stage smoke test passed");
if (cinematic.activeWordIndex(words, 1100, line.endMs) !== 0) throw new Error("Cinematic focus did not begin");
if (typeof cinematic.EnglishStage !== "function") throw new Error("Cinematic English stage is not registered");
