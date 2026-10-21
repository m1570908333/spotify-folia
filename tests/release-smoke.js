const fs = require("fs");
const vm = require("vm");

const context = { Object, String, Number };
vm.createContext(context);
vm.runInContext(fs.readFileSync("prototype/folia-stage/release-config.js", "utf8"), context);

const result = vm.runInContext(`({
  repo: FoliaStageRelease.repository,
  version: FoliaStageRelease.version,
  command: FoliaStageRelease.installCommand,
  mode: FoliaStageLocale.en("群唱"),
  tooltip: FoliaStageLocale.en("调整歌词分词"),
  compare: [
    FoliaStageRelease.compareVersions("0.2.0", "0.1.9"),
    FoliaStageRelease.compareVersions("0.1.0", "0.1.0"),
    FoliaStageRelease.compareVersions("0.1.0", "0.2.0"),
  ],
})`, context);

if (result.repo !== "m1570908333/spotify-folia" || result.version !== "0.1.0") throw new Error("Release defaults are incorrect");
if (!result.command.includes("scripts/install.ps1") || result.command.includes("TOKEN")) throw new Error("Install command is invalid or includes a credential");
if (result.mode !== "Cappella" || result.tooltip !== "Edit lyric segmentation") throw new Error("English UI translation failed");
if (result.compare.join(",") !== "1,0,-1") throw new Error("Semantic version comparison failed");

const manifest = JSON.parse(fs.readFileSync("prototype/folia-stage/manifest.json", "utf8"));
if (!manifest.subfiles.includes("release-config.js") || manifest.subfiles.includes("upstream-updates.js")) {
  throw new Error("Release config or upstream update removal is incorrect");
}
for (const file of manifest.subfiles) {
  if (!fs.existsSync(`prototype/folia-stage/${file}`)) throw new Error(`Missing custom app subfile: ${file}`);
}
const app = fs.readFileSync("prototype/folia-stage/index.js", "utf8");
if (app.includes("FoliaUpstreamUpdates") || !app.includes("Version information") || !app.includes("Sponsor this project")) {
  throw new Error("Release information toolbar integration is incomplete");
}
console.log("release packaging, version checks, localization, and manifest smoke test passed");
