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
  notification: FoliaStageLocale.en("已导入 3 行分词"),
  jizuraNotification: FoliaStageLocale.en("JIZURA 已导入：歌词匹配 2/3 行，未匹配的逐行设置已跳过"),
  fontWeight: FoliaStageLocale.en("字重 700"),
  missingImage: FoliaStageLocale.en("未导入图片"),
  diagnostics: FoliaStageLocale.en("歌词 0 行 / 0 词"),
  compare: [
    FoliaStageRelease.compareVersions("0.2.0", "0.1.9"),
    FoliaStageRelease.compareVersions("0.1.0", "0.1.0"),
    FoliaStageRelease.compareVersions("0.1.0", "0.2.0"),
  ],
})`, context);

if (result.repo !== "m1570908333/spotify-folia" || result.version !== "1.0.1") throw new Error("Release defaults are incorrect");
if (!result.command.includes("scripts/install.ps1") || result.command.includes("TOKEN")) throw new Error("Install command is invalid or includes a credential");
if (result.mode !== "Cappella" || result.tooltip !== "Edit lyric segmentation") throw new Error("English UI translation failed");
if (result.notification !== "Imported 3 lines of segmentation" || !result.jizuraNotification.startsWith("JIZURA imported: matched 2/3")) throw new Error("English notification translation failed");
if (result.fontWeight !== "Font weight 700" || result.missingImage !== "No image imported" || result.diagnostics !== "Lyrics 0 lines / 0 words") throw new Error("Settings labels or dynamic diagnostics are not localized");
if (result.compare.join(",") !== "1,0,-1") throw new Error("Semantic version comparison failed");

const manifest = JSON.parse(fs.readFileSync("prototype/folia-stage/manifest.json", "utf8"));
if (!manifest.subfiles.includes("release-config.js") || manifest.subfiles.includes("upstream-updates.js")) {
  throw new Error("Release config or upstream update removal is incorrect");
}
for (const file of manifest.subfiles) {
  if (!fs.existsSync(`prototype/folia-stage/${file}`)) throw new Error(`Missing custom app subfile: ${file}`);
}
const app = fs.readFileSync("prototype/folia-stage/index.js", "utf8");
if (app.includes("FoliaUpstreamUpdates") || !app.includes("Version information") || !app.includes("Support this project")) {
  throw new Error("Release information toolbar integration is incomplete");
}
if (!app.includes("spotify-folia-sponsor-prompt-v1") || !app.includes("14 * 24 * 60 * 60 * 1000") || !app.includes("/custom_apps/folia-stage/assets/paypal-sponsor-card.png") || !app.includes("https://www.paypal.me/syj8065")) {
  throw new Error("Packaged PayPal sponsor card or 14-day prompt behavior is incomplete");
}
if (!fs.existsSync("prototype/folia-stage/assets/paypal-sponsor-card.png")) throw new Error("Generated PayPal sponsor card is missing from the release app");
if (app.includes("spotify-folia-sponsor-qr-v1") || app.includes("Import QR image")) throw new Error("Sponsor QR should be packaged, not imported at runtime");
if (app.includes("Folia/JIZURA") || app.includes("upstreamVersion")) throw new Error("Upstream version information must not be shown in the release UI");

const uiFiles = ["index.js", "folia-jizura-native.js", "folia-jizura-media.js", "folia-jizura.js", "backgrounds.js", "folia-classic.js", "folia-cappella.js", "folia-partita.js", "folia-english.js", "folia-english-cinematic.js", "folia-cadenza.js"].filter((file) => fs.existsSync(`prototype/folia-stage/${file}`));
const literalPattern = /"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|`((?:\\.|[^`\\])*)`/g;
const untranslated = new Set();
for (const file of uiFiles) {
  const source = fs.readFileSync(`prototype/folia-stage/${file}`, "utf8");
  for (const match of source.matchAll(literalPattern)) {
    const rawLiteral = match[1] ?? match[2] ?? match[3];
    if (!/[\u4e00-\u9fff]/.test(rawLiteral)) continue;
    const literal = rawLiteral.replace(/\$\{[^}]*\}/g, "3");
    const translated = vm.runInContext(`FoliaStageLocale.en(${JSON.stringify(literal)})`, context);
    if (/[\u4e00-\u9fff]/.test(translated)) untranslated.add(`${file}: ${rawLiteral}`);
  }
}
if (untranslated.size) throw new Error(`Untranslated Spotify Folia UI strings remain:\n${[...untranslated].join("\n")}`);
console.log("release packaging, version checks, localization, and manifest smoke test passed");
