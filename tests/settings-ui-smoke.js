const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const context = {
  Spicetify: { React: {
    createElement: (type, props, ...children) => ({ type, props: props || {}, children: children.flat(Infinity).filter((child) => child != null && child !== false) }),
    useState: (value) => [value, () => {}],
    useRef: () => ({ current: null }),
  } },
  FoliaStageVisualizers: { modes: [] },
  FoliaJizuraStage: { Settings: () => null },
};
vm.createContext(context);
for (const file of ["core.js", "release-config.js", "index.js"]) {
  vm.runInContext(fs.readFileSync(`prototype/folia-stage/${file}`, "utf8"), context);
}
const flatten = (node) => typeof node === "object" && node ? [node, ...node.children.flatMap(flatten)] : [];
const text = (node) => typeof node === "object" && node ? node.children.map(text).join("") : String(node ?? "");
let settings = vm.runInContext("FoliaStageCore.loadSettings()", context);
settings.theme.accentColor = "#123456";
context.props = {
  settings, offset: 0, diagnostics: { renderer: "test", lines: 0, words: 0, memory: "test" },
  setSettings: (updater) => { settings = updater(settings); }, onResetSettings: () => {},
};
const nodes = flatten(vm.runInContext("SettingsPanel(props)", context));
const match = nodes.find((node) => node.type === "button" && text(node) === "Match album art");
assert(match, "English album art action must remain available");
assert(match.props.className.includes("folia-theme-settings__match"), "Album art action needs its own full-width grid row");
match.props.onClick();
assert.equal(settings.theme.accentColor, "");
assert.equal(settings.theme.primaryColor, context.props.settings.theme.primaryColor);
assert(nodes.some((node) => node.type === "button" && node.props.onClick === context.props.onResetSettings && text(node) === "Restore defaults"), "Reset remains available");

let imagePatch;
context.poolProps = {
  tuning: { layerImages: [{ id: "one", name: "A long image name.png" }] },
  update: (patch) => { imagePatch = patch; },
};
const poolNodes = flatten(vm.runInContext("TemperaImagePoolSettings(poolProps)", context));
const row = poolNodes.find((node) => node.props.className === "folia-tempera-image-row");
assert.deepEqual(row.children.map((node) => node.type), ["span", "select", "select", "input", "input", "button"]);
row.children[1].props.onChange({ target: { value: "right" } });
assert.equal(imagePatch.temperaTuning.layerImages[0].align, "right");
assert(poolNodes.some((node) => node.type === "option" && text(node) === "Append to current pool"));

const css = fs.readFileSync("prototype/folia-stage/style.css", "utf8");
assert(css.includes(".folia-theme-settings__match { grid-column: 1 / -1; }"));
assert(css.includes("grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 24px;"));
assert(!css.includes("grid-template-columns: minmax(90px, 1fr)"), "Six-column image rows must not return");
assert(!css.includes("min-width: 112px"), "Select intrinsic width must not force overflow");
assert(css.includes("minmax(min(100%, 125px), 1fr)"));
console.log("Settings UI structure, English labels, album-art behavior, image controls and responsive layout rules passed");
