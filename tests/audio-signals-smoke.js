const fs = require("fs");
const vm = require("vm");

const context = { console };
vm.createContext(context);
vm.runInContext(fs.readFileSync("prototype/folia-stage/audio-signals.js", "utf8"), context);
const api = vm.runInContext("FoliaAudioSignals", context);

const analysis = {
  beats: [{ start: 1, duration: 0.4, confidence: 1 }],
  bars: [{ start: 1, duration: 1.6, confidence: 1 }],
  tatums: [{ start: 1, duration: 0.2, confidence: 1 }],
  sections: [{ start: 0, duration: 10, loudness: -8 }],
  segments: [{
    start: 0,
    duration: 10,
    loudness_max: -6,
    pitches: [1, .8, .6, .4, .2, .1, .3, .7, .9, .8, .5, .2],
  }],
};
const signals = api.create(analysis, []);
if (!signals.available) throw new Error("audio analysis should be available");
const frame = signals.sample(1.03);
for (const key of ["power", "bass", "lowMid", "mid", "vocal", "treble", "beat", "bar", "tatum"]) {
  if (!Number.isFinite(frame[key]) || frame[key] < 0 || frame[key] > 1) {
    throw new Error(`invalid ${key}: ${frame[key]}`);
  }
}
if (frame.beat <= 0) throw new Error("beat pulse was not generated");
const native = signals.nativeTimeline(1.5);
if (!native || native.energyRate !== 12 || native.energy.length < 100 || native.beats[0] !== 1) {
  throw new Error("native JIZURA timeline was not generated");
}
if (native.energy.some(value => !Number.isFinite(value) || value < 0 || value > 1)) {
  throw new Error("native JIZURA energy timeline is invalid");
}
if (signals.nativeTimeline(0) !== null) throw new Error("disabled response should not create a timeline");

const fallback = api.create(null, [{ startMs: 1000, endMs: 2400 }]).sample(1.02);
if (fallback.power <= 0 || fallback.beat <= 0) throw new Error("lyric fallback was not generated");
if (api.create(null, []).nativeTimeline() !== null) throw new Error("missing Spotify analysis must not invent a native timeline");

console.log("audio signals smoke test passed");
