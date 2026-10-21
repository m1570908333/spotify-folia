const fs = require("fs");
const vm = require("vm");

const context = vm.createContext({
  console,
  Intl,
  Math,
  URL,
  document: { scripts: [] },
  FoliaCappellaAssets: { avatars: {}, emos: {} },
  Spicetify: {
    React: {
      createElement: () => null,
      useMemo: (factory) => factory(),
    },
  },
});

vm.runInContext(fs.readFileSync("prototype/folia-stage/folia-classic.js", "utf8"), context);
vm.runInContext(fs.readFileSync("prototype/folia-stage/folia-cappella.js", "utf8"), context);
const api = vm.runInContext("FoliaFaithfulCappella", context);

const lines = Array.from({ length: 18 }, (_, index) => {
  const text = index === 5 ? "......" : `第${index + 1}句想见你的时间线`;
  const chars = Array.from(text);
  const startMs = 1000 + index * 1400;
  return {
    startMs,
    endMs: startMs + 1200,
    text,
    words: chars.map((char, charIndex) => ({
      text: char,
      startMs: startMs + charIndex * (1200 / chars.length),
      endMs: startMs + (charIndex + 1) * (1200 / chars.length),
    })),
  };
});
const settings = { cappellaTuning: { showEmoMessages: true, emojiPackSource: "builtin", avatarSource: "cover", animationIntensity: "normal" } };
const first = api.buildMessages(lines, "Cappella Test", settings);
const second = api.buildMessages(lines, "Cappella Test", settings);

if (JSON.stringify(first) !== JSON.stringify(second)) throw new Error("Cappella message sequence is not deterministic");
if (first[0]?.kind !== "title" || first[0]?.side !== "right") throw new Error("Cappella title message mismatch");
if (!first.some((message) => message.kind === "emo")) throw new Error("Cappella interlude emoji missing");
if (!first.some((message) => message.side === "left") || !first.some((message) => message.side === "right")) throw new Error("Cappella sender sides missing");

const line = lines[0];
const before = api.revealCount(line, line.startMs - 1);
const middle = api.revealCount(line, line.startMs + 600);
const after = api.revealCount(line, line.endMs + 1);
if (before !== 0 || !(middle > 0 && middle < Array.from(line.text).length) || after !== Array.from(line.text).length) throw new Error("Cappella reveal timing mismatch");

const visible = api.getVisibleMessages(first, 10, lines[10].startMs + 200, 638);
if (!visible.length || visible.length > 12) throw new Error("Cappella visible window mismatch");
if (!visible.some((message) => message.lineIndex === 10)) throw new Error("Cappella active message is not visible");

console.log("faithful Cappella smoke test passed");
