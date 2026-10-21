const fs = require("fs");
const vm = require("vm");

const store = {};
const context = {
  console,
  localStorage: {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value; },
  },
};

vm.createContext(context);
vm.runInContext(fs.readFileSync("prototype/folia-stage/core.js", "utf8"), context);
for (const mode of ["cadenza", "fume", "tilt", "classic", "partita", "still"]) {
  vm.runInContext(`FoliaStageCore.saveSettings({mode:"${mode}"})`,context);
  if(vm.runInContext('FoliaStageCore.loadSettings().mode',context)!=="flow")throw new Error(`Removed mode did not migrate: ${mode}`);
}
vm.runInContext('FoliaStageCore.saveSettings({})',context);
if (vm.runInContext('FoliaStageCore.loadSettings().mode', context) !== "flow") {
  throw new Error("Default mode is not flow");
}
for (const mode of ["english", "jizura", "flow", "poster", "cappella", "claddagh", "monet", "pendolo", "diorama", "sonnet", "tempera", "lumiere"]) {
  vm.runInContext(`FoliaStageCore.saveSettings({mode:"${mode}"})`, context);
  if (vm.runInContext('FoliaStageCore.loadSettings().mode', context) !== mode) {
    throw new Error(`Retained mode changed: ${mode}`);
  }
}
vm.runInContext('FoliaStageCore.saveSettings({})', context);

const parsed = vm.runInContext(
  `FoliaStageCore.parseLrc("[00:01.00]first\\n[00:03.50]second", 5000)`,
  context,
);

if (parsed.lines.length !== 2 || parsed.lines[1].startMs !== 3500) {
  throw new Error("LRC parsing smoke test failed");
}

const segmented = vm.runInContext(`(() => {
  const uri = "spotify:track:segmentation-test";
  const document = FoliaStageCore.makeDocument({
    provider: "test",
    lines: [{
      startMs: 1000,
      endMs: 3000,
      text: "想见你想见你",
      words: Array.from("想见你想见你", (text, index) => ({
        text,
        startMs: 1000 + index * 300,
        endMs: 1300 + index * 300,
      })),
    }],
  });
  const line = document.lines[0];
  FoliaStageCore.saveWordSegmentation(uri, {
    [FoliaStageCore.getSegmentationLineKey(line)]: ["想见你", "想见你"],
  });
  return FoliaStageCore.applyWordSegmentation(document, uri);
})()`, context);

if (segmented.lines[0].words.length !== 2 || segmented.lines[0].words[0].text !== "想见你") {
  throw new Error("word segmentation override was not applied");
}
if (segmented.lines[0].words[0].startMs !== 1000 || segmented.lines[0].words[1].endMs !== 2800) {
  throw new Error("word segmentation timing was not inherited");
}

const invalid = vm.runInContext(
  `FoliaStageCore.isValidWordSegmentation("hello world", ["hello", "world"])`,
  context,
);
if (invalid) throw new Error("invalid segmentation unexpectedly passed validation");

const backup = vm.runInContext(`(() => {
  const uri = "spotify:track:segmentation-test";
  const document = FoliaStageCore.makeDocument({
    lines: [{ startMs: 1000, endMs: 3000, text: "想见你想见你" }],
  });
  FoliaStageCore.saveWordSegmentation(uri, {
    [FoliaStageCore.getSegmentationLineKey(document.lines[0])]: ["想见你", "想见你"],
  });
  const payload = FoliaStageCore.buildWordSegmentationPayload(uri, document);
  const imported = FoliaStageCore.parseWordSegmentationText(JSON.stringify(payload), uri, document);
  const slash = FoliaStageCore.buildWordSegmentationText({
    lines: [{ ...document.lines[0], segments: imported[FoliaStageCore.getSegmentationLineKey(document.lines[0])] }],
  });
  const slashImported = FoliaStageCore.parseWordSegmentationText(slash, uri, document);
  return { payload, slash, slashImported };
})()`, context);

if (backup.payload.lines[0].segments.join("") !== "想见你想见你") {
  throw new Error("word segmentation export failed");
}
const segmentedKey = vm.runInContext(`FoliaStageCore.getSegmentationLineKey(${JSON.stringify({ startMs: 1000, text: "想见你想见你" })})`, context);
if (backup.slashImported[segmentedKey].length !== 2) {
  throw new Error("slash-text segmentation import failed");
}

const englishDefaults = vm.runInContext(`(() => {
  const defaults = FoliaStageCore.loadSettings().englishTuning;
  FoliaStageCore.saveSettings({ ...FoliaStageCore.loadSettings(), englishTuning: { ...defaults, audioResponse: 1.65 } });
  return { defaults, reloaded: FoliaStageCore.loadSettings().englishTuning };
})()`, context);
if (englishDefaults.defaults.audioResponse !== 1 || englishDefaults.defaults.showHud !== true) {
  throw new Error("English stage defaults were not loaded");
}
if (englishDefaults.reloaded.audioResponse !== 1.65 || englishDefaults.reloaded.beamIntensity !== 1) {
  throw new Error("English stage settings did not persist with defaults merged");
}

console.log("core smoke test passed");
