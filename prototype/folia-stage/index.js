/// <reference path="../../../vendor/spicetify/globals.d.ts" />

const React = Spicetify.React;
const { useEffect, useMemo, useRef, useState } = React;
const h = (...args) => typeof FoliaStageLocale === "undefined" ? React.createElement(...args) : FoliaStageLocale.element(React, ...args);
const getFoliaStageRelease = () => typeof FoliaStageRelease === "undefined" ? {
  repository: "m1570908333/spotify-folia",
  version: "0.1.0",
  latestReleaseApi: "https://api.github.com/repos/m1570908333/spotify-folia/releases/latest",
  installCommand: "irm https://raw.githubusercontent.com/m1570908333/spotify-folia/main/scripts/install.ps1 | iex",
  compareVersions: () => 0,
} : FoliaStageRelease;
const foliaStageText = (value) => typeof FoliaStageLocale === "undefined" ? value : FoliaStageLocale.en(value);
const foliaStageNotify = (value, error = false) => Spicetify.showNotification?.(foliaStageText(value), error);

function readPlayback() {
  const state = Spicetify.Player.data;
  const item = state?.item || null;
  const metadata = item?.metadata || {};
  return {
    uri: item?.uri || "",
    title: item?.name || metadata.title || "Nothing playing",
    artist: item?.artists?.map((artist) => artist.name).filter(Boolean).join(", ") || metadata.artist_name || "",
    album: item?.album?.name || metadata.album_title || "",
    cover: item?.images?.[0]?.url || metadata.image_xlarge_url || metadata.image_large_url || metadata.image_url || "",
    durationMs: Number(Spicetify.Player.getDuration?.() || state?.duration || item?.duration?.milliseconds || 0),
    progressMs: Number(Spicetify.Player.getProgress?.() || state?.progress || 0),
    paused: Boolean(state?.isPaused),
  };
}

function formatTime(value) {
  const seconds = Math.floor(Math.max(0, Number(value) || 0) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function colorToCss(value) {
  if (typeof value === "string" && value.startsWith("#")) return value;
  const numeric = Number(value);
  return Number.isFinite(numeric)
    ? `#${Math.max(0, numeric).toString(16).padStart(6, "0").slice(-6)}`
    : "#f4f4f5";
}

function isHexColor(value) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

function useSpotifyPlayback() {
  const [snapshot, setSnapshot] = useState(readPlayback);
  const [displayProgress, setDisplayProgress] = useState(snapshot.progressMs);
  const anchor = useRef({ progressMs: snapshot.progressMs, at: performance.now(), paused: snapshot.paused });

  useEffect(() => {
    const sync = () => {
      const next = readPlayback();
      anchor.current = { progressMs: next.progressMs, at: performance.now(), paused: next.paused };
      setSnapshot(next);
      setDisplayProgress(next.progressMs);
    };
    const syncProgress = (event) => {
      const progressMs = Number(typeof event?.data === "number" ? event.data : Spicetify.Player.getProgress?.() || 0);
      anchor.current = { progressMs, at: performance.now(), paused: anchor.current.paused };
      setDisplayProgress(progressMs);
    };
    Spicetify.Player.addEventListener("songchange", sync);
    Spicetify.Player.addEventListener("onplaypause", sync);
    Spicetify.Player.addEventListener("onprogress", syncProgress);
    sync();
    return () => {
      Spicetify.Player.removeEventListener("songchange", sync);
      Spicetify.Player.removeEventListener("onplaypause", sync);
      Spicetify.Player.removeEventListener("onprogress", syncProgress);
    };
  }, []);

  useEffect(() => {
    anchor.current = { progressMs: snapshot.progressMs, at: performance.now(), paused: snapshot.paused };
  }, [snapshot.paused, snapshot.progressMs]);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      if (!document.hidden) {
        const current = anchor.current;
        const value = current.paused ? current.progressMs : current.progressMs + performance.now() - current.at;
        setDisplayProgress(Math.min(snapshot.durationMs || value, value));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [snapshot.durationMs, snapshot.uri]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) return;
      const progressMs = Number(Spicetify.Player.getProgress?.() || 0);
      anchor.current = { progressMs, at: performance.now(), paused: anchor.current.paused };
      setDisplayProgress(progressMs);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return { ...snapshot, displayProgress };
}

function IconButton({ label, children, className = "", ...props }) {
  return h("button", {
    className: `folia-icon-button ${className}`,
    title: label,
    "aria-label": label,
    ...props,
  }, children);
}

function ReleaseInfoDialog({ onClose }) {
  const releaseConfig = getFoliaStageRelease();
  const [state, setState] = useState({ status: "idle", release: null, error: "" });
  const check = async () => {
    setState({ status: "loading", release: null, error: "" });
    try {
      const response = await fetch(releaseConfig.latestReleaseApi, {
        headers: { Accept: "application/vnd.github+json" }, credentials: "omit",
      });
      if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status}`);
      setState({ status: "ready", release: await response.json(), error: "" });
    } catch (error) {
      setState({ status: "error", release: null, error: error.message || "Network request failed" });
    }
  };
  useEffect(() => { void check(); }, []);
  const latest = state.release?.tag_name?.replace(/^v/, "");
  const updateAvailable = latest && releaseConfig.compareVersions(latest, releaseConfig.version) > 0;
  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(releaseConfig.installCommand);
      Spicetify.showNotification?.("PowerShell update command copied");
    } catch {
      Spicetify.showNotification?.("Select and copy the PowerShell command below", true);
    }
  };
  return h("div", { className: "folia-release-backdrop", onMouseDown: (event) => event.target === event.currentTarget && onClose() },
    h("section", { className: "folia-release-dialog", role: "dialog", "aria-modal": "true", "aria-label": "Version information" },
      h("header", null, h("strong", null, "Spotify Folia"), h(IconButton, { label: "Close", onClick: onClose }, "×")),
      h("dl", null,
        h("div", null, h("dt", null, "Installed version"), h("dd", null, `v${releaseConfig.version}`)),
      ),
      h("p", { className: `folia-release-status is-${state.status}` },
        state.status === "loading" ? "Checking GitHub Releases…"
          : state.status === "error" ? `Update check unavailable: ${state.error}`
            : updateAvailable ? `Version ${state.release.tag_name} is available.`
              : state.status === "ready" ? "You are using the latest release." : "Update status has not been checked."),
      updateAvailable && h("div", { className: "folia-release-update" },
        h("p", null, "Update from Windows PowerShell:"),
        h("code", null, releaseConfig.installCommand),
        h("button", { className: "folia-button", onClick: copyCommand }, "Copy command"),
      ),
      state.release?.html_url && h("a", { href: state.release.html_url, target: "_blank", rel: "noopener noreferrer" }, "View release notes"),
      state.status !== "loading" && h("button", { className: "folia-button", onClick: () => void check() }, "Check again"),
    ),
  );
}

function SponsorDialog({ onClose }) {
  return h("div", { className: "folia-release-backdrop", onMouseDown: (event) => event.target === event.currentTarget && onClose() },
    h("section", { className: "folia-release-dialog folia-sponsor-dialog", role: "dialog", "aria-modal": "true", "aria-label": "Support Spotify Folia" },
      h("header", null, h("strong", null, "Support Spotify Folia"), h(IconButton, { label: "Close", onClick: onClose }, "×")),
      h("p", null, "Enjoying Spotify Folia? Your support helps fund new stage visuals, smoother animations, and continued open-source development."),
      h("img", { className: "folia-sponsor-card", src: new URL("/custom_apps/folia-stage/assets/paypal-sponsor-card.png", location.origin).href, alt: "Support Spotify Folia via PayPal. Scan the QR code or use the PayPal link below." }),
      h("p", { className: "folia-sponsor-link-label" }, "Scan the QR code or use this PayPal link:"),
      h("a", { className: "folia-sponsor-link", href: "https://www.paypal.me/syj8065", target: "_blank", rel: "noopener noreferrer" }, "https://www.paypal.me/syj8065"),
    ),
  );
}

function WordLine({ line, timeMs }) {
  if (!line?.words?.length) return line?.text || "";
  return line.words.map((word, index) => {
    const duration = Math.max(1, word.endMs - word.startMs);
    const amount = Math.max(0, Math.min(1, (timeMs - word.startMs) / duration));
    return h("span", {
      key: `${word.startMs}-${index}`,
      className: "folia-word",
      style: { "--word-fill": `${amount * 100}%` },
    }, word.text);
  });
}

function EmptyState({ status, errors, onImport, onRefresh }) {
  const copy = status === "loading"
    ? ["正在寻找歌词", "按本地、Spotify、LRCLIB、网易云的顺序匹配"]
    : status === "idle"
      ? ["播放一首歌曲", "歌词舞台会在音乐开始后自动出现"]
      : ["这首歌暂时没有匹配到歌词", errors?.length
        ? errors.map((error) => `${error.provider}: ${error.message}`).join(" · ")
        : "可以导入 LRC、YRC、QRC 或 TTML 文件"];
  return h("div", { className: `folia-empty folia-empty--${status}` },
    h("div", { className: "folia-empty__pulse" }),
    h("strong", null, copy[0]),
    h("span", null, copy[1]),
    status === "missing" && h("div", { className: "folia-empty__actions" },
      h("button", { className: "folia-button folia-button--primary", onClick: onImport }, "导入歌词"),
      h("button", { className: "folia-button", onClick: onRefresh }, "重新匹配"),
    ),
  );
}

function ClassicStage({ document: lyrics, activeIndex, timeMs, showTranslation }) {
  const line = lyrics.lines[Math.max(0, activeIndex)] || lyrics.lines[0];
  const previous = lyrics.lines[activeIndex - 1];
  const next = lyrics.lines[activeIndex + 1];
  return h("section", { className: "folia-lyrics folia-lyrics--classic" },
    h("div", { className: "folia-classic__context" }, previous?.text || ""),
    h("div", { className: "folia-classic__active" }, h(WordLine, { line, timeMs })),
    showTranslation && line?.translation && h("div", { className: "folia-translation" }, line.translation),
    h("div", { className: "folia-classic__context" }, next?.text || ""),
  );
}

function FlowStage({ document: lyrics, activeIndex, timeMs, showTranslation, onSeek }) {
  const activeRef = useRef(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIndex]);
  return h("section", { className: "folia-lyrics folia-lyrics--flow" },
    h("div", { className: "folia-flow__spacer" }),
    lyrics.lines.map((line, index) => h("button", {
      key: `${line.startMs}-${index}`,
      ref: index === activeIndex ? activeRef : null,
      className: `folia-flow__line${index === activeIndex ? " is-active" : ""}`,
      onClick: () => onSeek(line.startMs),
    },
    h("span", { className: "folia-flow__text" }, index === activeIndex ? h(WordLine, { line, timeMs }) : line.text),
    showTranslation && line.translation && h("span", { className: "folia-flow__translation" }, line.translation),
    )),
    h("div", { className: "folia-flow__spacer" }),
  );
}

function PosterStage({ playback, document: lyrics, activeIndex, timeMs, showTranslation }) {
  const line = lyrics.lines[Math.max(0, activeIndex)] || lyrics.lines[0];
  return h("section", { className: "folia-lyrics folia-lyrics--poster" },
    h("div", { className: "folia-poster__number" }, String(Math.max(1, activeIndex + 1)).padStart(2, "0")),
    h("div", { className: "folia-poster__lyric" }, h(WordLine, { line, timeMs })),
    showTranslation && line?.translation && h("div", { className: "folia-translation" }, line.translation),
    h("div", { className: "folia-poster__rule" }),
    h("div", { className: "folia-poster__meta" }, `${playback.title} / ${playback.artist}`),
  );
}

function SegmentationEditor({ uri, lyrics, onClose, onSaved }) {
  const initialRows = useMemo(() => {
    const record = FoliaStageCore.getWordSegmentation(uri);
    return lyrics.lines.map((line) => {
      const saved = record?.lines?.[FoliaStageCore.getSegmentationLineKey(line)];
      const segments = FoliaStageCore.isValidWordSegmentation(line.text, saved)
        ? saved
        : FoliaStageCore.defaultWordSegments(line.text);
      return segments.join("/");
    });
  }, [uri, lyrics]);
  const [rows, setRows] = useState(initialRows);
  const importRef = useRef(null);
  const parseRow = (value) => value.split("/").filter((segment) => segment.length > 0);
  const rowValid = (line, value) => FoliaStageCore.isValidWordSegmentation(line.text, parseRow(value));
  const invalidCount = rows.reduce((count, value, index) => count + (rowValid(lyrics.lines[index], value) ? 0 : 1), 0);
  const updateRow = (index, value) => setRows((current) => current.map((row, rowIndex) => rowIndex === index ? value : row));
  const save = () => {
    if (invalidCount) return;
    const lines = {};
    lyrics.lines.forEach((line, index) => {
      const segments = parseRow(rows[index]);
      const defaults = FoliaStageCore.defaultWordSegments(line.text);
      if (segments.join("\u0000") !== defaults.join("\u0000")) {
        lines[FoliaStageCore.getSegmentationLineKey(line)] = segments;
      }
    });
    if (Object.keys(lines).length) FoliaStageCore.saveWordSegmentation(uri, lines);
    else FoliaStageCore.removeWordSegmentation(uri);
    onSaved();
    onClose();
  };
  const reset = () => {
    setRows(lyrics.lines.map((line) => FoliaStageCore.defaultWordSegments(line.text).join("/")));
  };
  const download = (content, name) => {
    const url = URL.createObjectURL(new Blob([content], { type: "application/json;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const exportJson = () => download(
    JSON.stringify(FoliaStageCore.buildWordSegmentationPayload(uri, { lines: lyrics.lines.map((line, index) => ({ ...line, text: line.text, words: parseRow(rows[index]) })) }), null, 2),
    "folia-stage-word-segmentation.json",
  );
  const exportText = () => {
    const payload = { lines: lyrics.lines.map((line, index) => ({ ...line, text: line.text, words: parseRow(rows[index]) })) };
    download(FoliaStageCore.buildWordSegmentationText(payload), "folia-stage-word-segmentation.txt");
  };
  const importFile = async (file) => {
    if (!file) return;
    try {
      const lines = FoliaStageCore.parseWordSegmentationText(await file.text(), uri, lyrics);
      FoliaStageCore.saveWordSegmentation(uri, lines, "manual");
      onSaved();
      onClose();
      foliaStageNotify(`已导入 ${Object.keys(lines).length} 行分词`);
    } catch (error) {
      foliaStageNotify(`分词导入失败：${error.message}`, true);
    }
  };
  return h("div", { className: "folia-segmentation-backdrop", onMouseDown: (event) => event.target === event.currentTarget && onClose() },
    h("section", { className: "folia-segmentation", role: "dialog", "aria-modal": "true", "aria-label": "歌词分词调整" },
      h("header", { className: "folia-segmentation__header" },
        h("div", null,
          h("strong", null, "歌词分词调整"),
          h("span", null, "在需要断开的词之间输入 /，每行必须能完整拼回原歌词"),
        ),
        h(IconButton, { label: "关闭", onClick: onClose }, "×"),
      ),
      h("div", { className: "folia-segmentation__list" }, lyrics.lines.map((line, index) => {
        const valid = rowValid(line, rows[index]);
        const overridden = rows[index] !== FoliaStageCore.defaultWordSegments(line.text).join("/");
        return h("label", { className: `folia-segmentation__row${valid ? "" : " is-invalid"}`, key: `${line.startMs}-${index}` },
          h("span", { className: "folia-segmentation__number" }, index + 1),
          h("span", { className: "folia-segmentation__original" }, line.text),
          h("input", {
            value: rows[index],
            spellCheck: false,
            onChange: (event) => updateRow(index, event.target.value),
            "aria-invalid": !valid,
          }),
          h("span", { className: `folia-segmentation__state${overridden ? " is-overridden" : ""}` }, valid ? overridden ? "已调整" : "默认" : "无法还原原句"),
        );
      })),
      h("footer", { className: "folia-segmentation__footer" },
        h("span", null, invalidCount ? `${invalidCount} 行需要修正` : "保存后立即应用到当前歌曲"),
        h("div", null,
          h("button", { className: "folia-button", onClick: exportJson }, "导出 JSON"),
          h("button", { className: "folia-button", onClick: exportText }, "导出 slash-text"),
          h("button", { className: "folia-button", onClick: () => importRef.current?.click() }, "导入分词"),
          h("button", { className: "folia-button", onClick: reset }, "全部恢复默认"),
          h("button", { className: "folia-button folia-button--primary", disabled: Boolean(invalidCount), onClick: save }, "保存分词"),
        ),
      ),
      h("input", { ref: importRef, hidden: true, type: "file", accept: ".json,.txt,application/json,text/plain", onChange: (event) => { void importFile(event.target.files?.[0]); event.target.value = ""; } }),
    ),
  );
}

function StageHandover({ mode, children }) {
  const previousMode = useRef(mode);
  const previousChild = useRef(children);
  const timerRef = useRef(0);
  const [outgoing, setOutgoing] = useState(null);

  useEffect(() => {
    if (previousMode.current === mode) return undefined;
    clearTimeout(timerRef.current);
    setOutgoing({ mode: previousMode.current, child: previousChild.current });
    previousMode.current = mode;
    timerRef.current = setTimeout(() => setOutgoing(null), 850);
    return () => clearTimeout(timerRef.current);
  }, [mode]);

  useEffect(() => {
    previousChild.current = children;
  }, [children]);

  return h("div", { className: `folia-stage-handover${outgoing ? " is-transitioning" : ""}` },
    outgoing && h("div", { key: `out-${outgoing.mode}`, className: "folia-stage-handover__layer is-outgoing" }, outgoing.child),
    h("div", { key: `in-${mode}`, className: `folia-stage-handover__layer is-current${outgoing ? " is-incoming" : ""}` }, children),
  );
}

function BackgroundHandover({ mode, children }) {
  const previousMode = useRef(mode);
  const previousChild = useRef(children);
  const timerRef = useRef(0);
  const [outgoing, setOutgoing] = useState(null);

  useEffect(() => {
    if (previousMode.current === mode) return undefined;
    clearTimeout(timerRef.current);
    setOutgoing({ mode: previousMode.current, child: previousChild.current });
    previousMode.current = mode;
    timerRef.current = setTimeout(() => setOutgoing(null), 1050);
    return () => clearTimeout(timerRef.current);
  }, [mode]);

  useEffect(() => {
    previousChild.current = children;
  }, [children]);

  return h("div", { className: `folia-background-handover${outgoing ? " is-transitioning" : ""}` },
    outgoing && h("div", { key: `background-out-${outgoing.mode}`, className: "folia-background-handover__layer is-outgoing" }, outgoing.child),
    h("div", { key: `background-in-${mode}`, className: `folia-background-handover__layer is-current${outgoing ? " is-incoming" : ""}` }, children),
  );
}

function BackgroundSettings({ settings, update }) {
  const mode = settings.backgroundMode || "common";
  const tuning = settings.backgroundTunings?.[mode] || {};
  const patch = (next) => update({
    backgroundTunings: {
      ...settings.backgroundTunings,
      [mode]: { ...tuning, ...next },
    },
  });
  const customImage = settings.backgroundAssets?.customImage || null;
  const importCustomImage = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const record = { name: file.name, mime: file.type, url: String(reader.result || "") };
      let persisted = record;
      try { persisted = await globalThis.FoliaStageAssets?.put("monetBackground", record) || record; } catch (error) { console.warn("[FoliaStage] Monet background pool write failed", error); }
      update({ backgroundAssets: { ...settings.backgroundAssets, customImage: persisted } });
    };
    reader.readAsDataURL(file);
  };
  const clearCustomImage = async () => {
    const id = customImage?.id;
    if (id) await globalThis.FoliaStageAssets?.remove("monetBackground", id);
    update({ backgroundAssets: { ...settings.backgroundAssets, customImage: null } });
  };
  return h("div", { className: "folia-settings__section folia-settings__background" },
    h("label", null, "背景类型"),
    h("div", { className: "folia-background-grid" }, FoliaStageBackgrounds.modes.map((entry) => h("button", {
      key: entry.id,
      className: mode === entry.id ? "is-active" : "",
      onClick: () => update({ backgroundMode: entry.id }),
    }, entry.label))),
    h("div", { className: "folia-background-asset" },
      h("label", null, "自定义背景图片"),
      h("div", { className: "folia-background-asset__row" },
        h("input", { type: "file", accept: "image/png,image/jpeg,image/webp,image/gif,image/svg+xml", onChange: importCustomImage }),
        customImage && h("button", { type: "button", onClick: clearCustomImage }, "删除"),
      ),
      h("small", null, customImage?.name || "未导入图片"),
    ),
    mode === "common" && h(React.Fragment, null,
      h("label", null, h("input", { type: "checkbox", checked: tuning.useCoverColorBg !== false, onChange: () => patch({ useCoverColorBg: !tuning.useCoverColorBg }) }), "封面流体底色"),
      h("label", null, `封面强度 ${Math.round((tuning.opacity ?? .75) * 100)}%`),
      h("input", { type: "range", min: 0, max: 1, step: .05, value: tuning.opacity ?? .75, onChange: (event) => patch({ opacity: Number(event.target.value) }) }),
      h("label", null, h("input", { type: "checkbox", checked: !tuning.disableGeometricBackground, onChange: () => patch({ disableGeometricBackground: !tuning.disableGeometricBackground }) }), "几何图形"),
      h("label", null, h("input", { type: "checkbox", checked: !tuning.disableVignette, onChange: () => patch({ disableVignette: !tuning.disableVignette }) }), "暗角"),
    ),
    mode === "monet" && h(React.Fragment, null,
      h("label", null, "背景来源"),
      h("div", { className: "folia-segmented" }, [["cover-derived", "封面"], ["uploaded-global", "自定义"]].map(([value, label]) => h("button", { key: value, disabled: value === "uploaded-global" && !customImage, className: tuning.backgroundSource === value ? "is-active" : "", onClick: () => patch({ backgroundSource: value }) }, label))),
      h("label", null, "画面布局"),
      h("div", { className: "folia-segmented" }, [["full-overlay", "全幅"], ["half-pane-gradient", "半幅"]].map(([value, label]) => h("button", { key: value, className: tuning.backgroundLayout === value ? "is-active" : "", onClick: () => patch({ backgroundLayout: value }) }, label))),
      h("label", null, `模糊 ${Math.round(tuning.backgroundBlurPx ?? 6)}px`),
      h("input", { type: "range", min: 0, max: 30, step: 1, value: tuning.backgroundBlurPx ?? 6, onChange: (event) => patch({ backgroundBlurPx: Number(event.target.value) }) }),
      h("label", null, `遮罩 ${Math.round((tuning.backgroundOverlayOpacity ?? .74) * 100)}%`),
      h("input", { type: "range", min: 0, max: 1, step: .02, value: tuning.backgroundOverlayOpacity ?? .74, onChange: (event) => patch({ backgroundOverlayOpacity: Number(event.target.value) }) }),
      h("label", null, `饱和度 ${(tuning.backgroundSaturation ?? 1.05).toFixed(2)}x`),
      h("input", { type: "range", min: 0, max: 2.5, step: .05, value: tuning.backgroundSaturation ?? 1.05, onChange: (event) => patch({ backgroundSaturation: Number(event.target.value) }) }),
      h("label", null, `去色 ${Math.round((tuning.backgroundGrayscale ?? 0) * 100)}%`),
      h("input", { type: "range", min: 0, max: 1, step: .02, value: tuning.backgroundGrayscale ?? 0, onChange: (event) => patch({ backgroundGrayscale: Number(event.target.value) }) }),
      h("label", null, `主题洗色 ${Math.round((tuning.backgroundWash ?? .34) * 100)}%`),
      h("input", { type: "range", min: 0, max: 1, step: .02, value: tuning.backgroundWash ?? .34, onChange: (event) => patch({ backgroundWash: Number(event.target.value) }) }),
      h("label", null, "洗色来源"),
      h("div", { className: "folia-segmented" }, [["theme", "主题色"], ["custom", "自定义"]].map(([value, label]) => h("button", { key: value, className: (tuning.backgroundWashColorMode || "theme") === value ? "is-active" : "", onClick: () => patch({ backgroundWashColorMode: value }) }, label))),
      (tuning.backgroundWashColorMode || "theme") === "custom" && h("label", { className: "folia-color-control" },
        h("input", { type: "color", value: isHexColor(tuning.backgroundWashCustomColor) ? tuning.backgroundWashCustomColor : "#8fb7ff", onChange: (event) => patch({ backgroundWashCustomColor: event.target.value }) }),
        h("span", null, "洗色颜色"),
      ),
      h("label", null, `半幅偏移 ${Math.round(tuning.backgroundHalfPaneOffsetX ?? 0)}%`),
      h("input", { type: "range", min: -40, max: 40, step: 1, value: tuning.backgroundHalfPaneOffsetX ?? 0, onChange: (event) => patch({ backgroundHalfPaneOffsetX: Number(event.target.value) }) }),
      h("label", null, `漂移幅度 ${Math.round((tuning.backgroundDriftStrength ?? .5) * 100)}%`),
      h("input", { type: "range", min: 0, max: 1, step: .05, value: tuning.backgroundDriftStrength ?? .5, onChange: (event) => patch({ backgroundDriftStrength: Number(event.target.value) }) }),
      h("label", null, h("input", { type: "checkbox", checked: tuning.backgroundDriftEnabled !== false, onChange: () => patch({ backgroundDriftEnabled: !tuning.backgroundDriftEnabled }) }), "画面漂移"),
      h("label", null, h("input", { type: "checkbox", checked: tuning.backgroundStreaksEnabled !== false, onChange: () => patch({ backgroundStreaksEnabled: !tuning.backgroundStreaksEnabled }) }), "绘画光痕"),
    ),
    mode === "nomand" && h(React.Fragment, null,
      h("label", null, "纸面效果"),
      h("div", { className: "folia-segmented" }, [["dithering", "抖动"], ["halftone-dots", "网点"], ["fluted-glass", "压纹"], ["paper-texture", "纸纹"], ["lens-distortion", "镜头"]].map(([value, label]) => h("button", { key: value, className: tuning.effect === value ? "is-active" : "", onClick: () => patch({ effect: value }) }, label))),
      h("label", null, "抖动矩阵"),
      h("div", { className: "folia-segmented" }, [["2x2", "2x2"], ["4x4", "4x4"], ["8x8", "8x8"]].map(([value, label]) => h("button", { key: value, className: tuning.ditheringType === value ? "is-active" : "", onClick: () => patch({ ditheringType: value }) }, label))),
      h("label", null, `纹理尺寸 ${Number(tuning.size ?? 3).toFixed(1)}`),
      h("input", { type: "range", min: 1, max: 12, step: .5, value: tuning.size ?? 3, onChange: (event) => patch({ size: Number(event.target.value) }) }),
      h("label", null, `颜色层级 ${Math.round(tuning.colorSteps ?? 4)}`),
      h("input", { type: "range", min: 2, max: 16, step: 1, value: tuning.colorSteps ?? 4, onChange: (event) => patch({ colorSteps: Number(event.target.value) }) }),
      h("label", null, h("input", { type: "checkbox", checked: Boolean(tuning.originalColors), onChange: () => patch({ originalColors: !tuning.originalColors }) }), "保留原色"),
      h("label", null, h("input", { type: "checkbox", checked: Boolean(tuning.inverted), onChange: () => patch({ inverted: !tuning.inverted }) }), "反相"),
      h("label", null, `压纹尺寸 ${Number(tuning.flutedGlassSize ?? .5).toFixed(2)}`),
      h("input", { type: "range", min: 0, max: 2, step: .05, value: tuning.flutedGlassSize ?? .5, onChange: (event) => patch({ flutedGlassSize: Number(event.target.value) }) }),
      h("label", null, `压纹扭曲 ${Number(tuning.flutedGlassDistortion ?? .5).toFixed(2)}`),
      h("input", { type: "range", min: 0, max: 2, step: .05, value: tuning.flutedGlassDistortion ?? .5, onChange: (event) => patch({ flutedGlassDistortion: Number(event.target.value) }) }),
      h("label", null, `压纹模糊 ${Number(tuning.flutedGlassBlur ?? .08).toFixed(2)}`),
      h("input", { type: "range", min: 0, max: 1, step: .02, value: tuning.flutedGlassBlur ?? .08, onChange: (event) => patch({ flutedGlassBlur: Number(event.target.value) }) }),
      h("label", null, `纸纹对比 ${Number(tuning.paperTextureContrast ?? .32).toFixed(2)}`),
      h("input", { type: "range", min: 0, max: 1, step: .02, value: tuning.paperTextureContrast ?? .32, onChange: (event) => patch({ paperTextureContrast: Number(event.target.value) }) }),
      h("label", null, `纸纹粗糙 ${Number(tuning.paperTextureRoughness ?? .42).toFixed(2)}`),
      h("input", { type: "range", min: 0, max: 1, step: .02, value: tuning.paperTextureRoughness ?? .42, onChange: (event) => patch({ paperTextureRoughness: Number(event.target.value) }) }),
      h("label", null, `纸纹纤维 ${Number(tuning.paperTextureFiber ?? .3).toFixed(2)}`),
      h("input", { type: "range", min: 0, max: 1, step: .02, value: tuning.paperTextureFiber ?? .3, onChange: (event) => patch({ paperTextureFiber: Number(event.target.value) }) }),
      h("label", null, `网点尺寸 ${Number(tuning.halftoneDotsSize ?? .5).toFixed(2)}`),
      h("input", { type: "range", min: 0, max: 2, step: .05, value: tuning.halftoneDotsSize ?? .5, onChange: (event) => patch({ halftoneDotsSize: Number(event.target.value) }) }),
      h("label", null, `网点半径 ${Number(tuning.halftoneDotsRadius ?? 1.25).toFixed(2)}`),
      h("input", { type: "range", min: .1, max: 4, step: .05, value: tuning.halftoneDotsRadius ?? 1.25, onChange: (event) => patch({ halftoneDotsRadius: Number(event.target.value) }) }),
      h("label", null, `网点对比 ${Number(tuning.halftoneDotsContrast ?? .4).toFixed(2)}`),
      h("input", { type: "range", min: 0, max: 1, step: .02, value: tuning.halftoneDotsContrast ?? .4, onChange: (event) => patch({ halftoneDotsContrast: Number(event.target.value) }) }),
      h("label", null, h("input", { type: "checkbox", checked: Boolean(tuning.halftoneDotsOriginalColors), onChange: () => patch({ halftoneDotsOriginalColors: !tuning.halftoneDotsOriginalColors }) }), "网点保留原色"),
      h("label", null, h("input", { type: "checkbox", checked: Boolean(tuning.halftoneDotsInverted), onChange: () => patch({ halftoneDotsInverted: !tuning.halftoneDotsInverted }) }), "网点反相"),
      h("label", null, `镜头扩散 ${Number(tuning.lensDistortionSpread ?? .45).toFixed(2)}`),
      h("input", { type: "range", min: 0, max: 2, step: .05, value: tuning.lensDistortionSpread ?? .45, onChange: (event) => patch({ lensDistortionSpread: Number(event.target.value) }) }),
      h("label", null, `镜头膨胀 ${Number(tuning.lensDistortionBulge ?? .3).toFixed(2)}`),
      h("input", { type: "range", min: 0, max: 2, step: .05, value: tuning.lensDistortionBulge ?? .3, onChange: (event) => patch({ lensDistortionBulge: Number(event.target.value) }) }),
      h("label", null, `镜头色散 ${Number(tuning.lensDistortionDispersion ?? .65).toFixed(2)}`),
      h("input", { type: "range", min: 0, max: 2, step: .05, value: tuning.lensDistortionDispersion ?? .65, onChange: (event) => patch({ lensDistortionDispersion: Number(event.target.value) }) }),
      h("label", null, h("input", { type: "checkbox", checked: tuning.overlayEnabled !== false, onChange: () => patch({ overlayEnabled: !tuning.overlayEnabled }) }), "纸张遮罩"),
      h("label", null, `遮罩透明度 ${Math.round((tuning.overlayOpacity ?? .35) * 100)}%`),
      h("input", { type: "range", min: 0, max: 1, step: .02, value: tuning.overlayOpacity ?? .35, onChange: (event) => patch({ overlayOpacity: Number(event.target.value) }) }),
    ),
    mode === "latent" && h(React.Fragment, null,
      h("label", null, "显示层"),
      h("div", { className: "folia-segmented" }, [["dithering", "抖动"], ["mesh", "流体"], ["both", "混合"]].map(([value, label]) => h("button", { key: value, className: tuning.displayMode === value ? "is-active" : "", onClick: () => patch({ displayMode: value }) }, label))),
      h("label", null, "颜色来源"),
      h("div", { className: "folia-segmented" }, [["cover-theme", "封面主题"], ["theme", "舞台主题"], ["custom", "自定义"]].map(([value, label]) => h("button", { key: value, className: (tuning.colorSource || "cover-theme") === value ? "is-active" : "", onClick: () => patch({ colorSource: value }) }, label))),
      h("label", null, h("input", { type: "checkbox", checked: tuning.dynamicOnlyInPlayer !== false, onChange: () => patch({ dynamicOnlyInPlayer: !tuning.dynamicOnlyInPlayer }) }), "仅播放时动态"),
      h("label", null, h("input", { type: "checkbox", checked: tuning.enhancedBeatResponse !== false, onChange: () => patch({ enhancedBeatResponse: !tuning.enhancedBeatResponse }) }), "增强节拍响应"),
      h("label", null, `网格扭曲 ${Number(tuning.meshDistortion ?? .8).toFixed(2)}x`),
      h("input", { type: "range", min: 0, max: 2, step: .05, value: tuning.meshDistortion ?? .8, onChange: (event) => patch({ meshDistortion: Number(event.target.value) }) }),
      h("label", null, `抖动透明度 ${Math.round((tuning.ditheringOpacity ?? .55) * 100)}%`),
      h("input", { type: "range", min: 0, max: 1, step: .05, value: tuning.ditheringOpacity ?? .55, onChange: (event) => patch({ ditheringOpacity: Number(event.target.value) }) }),
      h("label", null, `流体速度 ${Number(tuning.meshSpeed ?? .3).toFixed(2)}`),
      h("input", { type: "range", min: 0, max: 2, step: .05, value: tuning.meshSpeed ?? .3, onChange: (event) => patch({ meshSpeed: Number(event.target.value) }) }),
      h("label", null, `音频响应 ${Number(tuning.meshAudioSpeed ?? 2).toFixed(2)}`),
      h("input", { type: "range", min: 0, max: 4, step: .05, value: tuning.meshAudioSpeed ?? 2, onChange: (event) => patch({ meshAudioSpeed: Number(event.target.value) }) }),
      h("label", null, `抖动速度 ${Number(tuning.ditheringSpeed ?? .1).toFixed(2)}`),
      h("input", { type: "range", min: 0, max: 2, step: .05, value: tuning.ditheringSpeed ?? .1, onChange: (event) => patch({ ditheringSpeed: Number(event.target.value) }) }),
      h("label", null, `抖动音频响应 ${Number(tuning.ditheringAudioSpeed ?? 1.2).toFixed(2)}`),
      h("input", { type: "range", min: 0, max: 4, step: .05, value: tuning.ditheringAudioSpeed ?? 1.2, onChange: (event) => patch({ ditheringAudioSpeed: Number(event.target.value) }) }),
      h("label", null, `抖动尺寸 ${Number(tuning.ditheringSize ?? 2.5).toFixed(2)}`),
      h("input", { type: "range", min: .5, max: 8, step: .1, value: tuning.ditheringSize ?? 2.5, onChange: (event) => patch({ ditheringSize: Number(event.target.value) }) }),
      h("label", null, `流体旋涡 ${Number(tuning.meshSwirl ?? .1).toFixed(2)}`),
      h("input", { type: "range", min: -1, max: 1, step: .05, value: tuning.meshSwirl ?? .1, onChange: (event) => patch({ meshSwirl: Number(event.target.value) }) }),
      h("label", null, h("input", { type: "checkbox", checked: tuning.overlayEnabled !== false, onChange: () => patch({ overlayEnabled: !tuning.overlayEnabled }) }), "流体遮罩"),
      h("label", null, `遮罩透明度 ${Math.round((tuning.overlayOpacity ?? .35) * 100)}%`),
      h("input", { type: "range", min: 0, max: 1, step: .02, value: tuning.overlayOpacity ?? .35, onChange: (event) => patch({ overlayOpacity: Number(event.target.value) }) }),
    ),
    mode === "sora" && h("label", null, h("input", { type: "checkbox", checked: Boolean(tuning.blank), onChange: () => patch({ blank: !tuning.blank }) }), "纯黑空场"),
    mode === "url" && h(React.Fragment, null,
      h("label", null, "网页 URL"),
      h("input", { className: "folia-text-input", type: "url", value: tuning.url || "", placeholder: "https://...", onChange: (event) => patch({ url: event.target.value }) }),
      h("label", null, `透明度 ${Math.round((tuning.opacity ?? 1) * 100)}%`),
      h("input", { type: "range", min: 0, max: 1, step: .05, value: tuning.opacity ?? 1, onChange: (event) => patch({ opacity: Number(event.target.value) }) }),
    ),
  );
}

function TemperaImagePoolSettings({ tuning, update }) {
  const [busy, setBusy] = useState(false);
  const [importMode, setImportMode] = useState("append");
  const inputRef = useRef(null);
  const backupRef = useRef(null);
  const images = Array.isArray(tuning.layerImages) ? tuning.layerImages : [];
  const patch = (next) => update({ temperaTuning: { ...tuning, ...next } });
  const addFiles = async (files) => {
    if (!files.length || busy) return;
    setBusy(true);
    try {
      const added = await FoliaTemperaAssets.addFiles(files, Math.max(0, 16 - images.length));
      patch({ layerImages: images.concat(added) });
    } catch (error) { console.error("[FoliaStage] Tempera image import failed", error); }
    finally { setBusy(false); }
  };
  const removeImage = async (id) => {
    await FoliaTemperaAssets.remove(id);
    patch({ layerImages: images.filter((image) => image.id !== id) });
  };
  const clearImages = async () => {
    await FoliaTemperaAssets.clear(images.map((image) => image.id));
    patch({ layerImages: [] });
  };
  const exportPool = async () => {
    setBusy(true);
    try {
      const payload = await FoliaTemperaAssets.exportPool(images);
      const url = URL.createObjectURL(new Blob([JSON.stringify(payload)], { type: "application/json" }));
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = "folia-tempera-image-pool.json"; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { console.error("[FoliaStage] Tempera image export failed", error); }
    finally { setBusy(false); }
  };
  const importPool = async (file) => {
    if (!file || busy) return;
    setBusy(true);
    try {
      const payload = JSON.parse(await file.text());
      const room = importMode === "replace" ? 16 : Math.max(0, 16 - images.length);
      const added = await FoliaTemperaAssets.importPool(payload, room);
      if (importMode === "replace") {
        await FoliaTemperaAssets.clear(images.map((image) => image.id));
        patch({ layerImages: added });
      } else {
        patch({ layerImages: images.concat(added) });
      }
      foliaStageNotify(`${importMode === "replace" ? "Replaced" : "Added"} ${added.length} Tempera images`);
    } catch (error) { console.error("[FoliaStage] Tempera image backup import failed", error); }
    finally { setBusy(false); }
  };
  return h("div", { className: "folia-tempera-image-pool" },
    h("label", null, `图片池 ${images.length}/16`),
    h("div", { className: "folia-settings__file-row" },
      h("button", { className: "folia-button folia-button--primary", disabled: busy || images.length >= 16, onClick: () => inputRef.current?.click() }, "添加图片"),
      h("button", { className: "folia-button", disabled: busy || !images.length, onClick: exportPool }, "导出图片池"),
      h("button", { className: "folia-button", disabled: busy, onClick: () => backupRef.current?.click() }, "导入图片池"),
      h("button", { className: "folia-button", disabled: busy || !images.length, onClick: clearImages }, "清空"),
    ),
    h("div", { className: "folia-settings__file-row" },
      h("label", { className: "folia-inline-control" }, "导入模式", h("select", { value: importMode, onChange: (event) => setImportMode(event.target.value) },
        h("option", { value: "append" }, "追加到当前池"),
        h("option", { value: "replace" }, "替换当前池"),
      )),
      h("label", { className: "folia-inline-control" }, "图片层级", h("select", { value: tuning.layerImageDepth || "back", onChange: (event) => patch({ layerImageDepth: event.target.value }) },
        h("option", { value: "back" }, "歌词后方"),
        h("option", { value: "front" }, "歌词前方"),
      )),
      h("label", { className: "folia-inline-control folia-inline-control--wide" }, `出现频率 ${Math.round((tuning.layerImageFrequency ?? .6) * 100)}%`,
        h("input", { type: "range", min: 0, max: 1, step: .05, value: tuning.layerImageFrequency ?? .6, onChange: (event) => patch({ layerImageFrequency: Number(event.target.value) }) }),
      ),
    ),
    h("input", { ref: inputRef, hidden: true, type: "file", accept: "image/*", multiple: true, onChange: (event) => { void addFiles(Array.from(event.target.files || [])); event.target.value = ""; } }),
    h("input", { ref: backupRef, hidden: true, type: "file", accept: ".json,application/json", onChange: (event) => { void importPool(event.target.files?.[0]); event.target.value = ""; } }),
    images.map((image) => h("div", { className: "folia-tempera-image-row", key: image.id },
      h("span", { className: "folia-tempera-image-name", title: image.name }, image.name),
      h("select", { value: image.align || "center", onChange: (event) => patch({ layerImages: images.map((item) => item.id === image.id ? { ...item, align: event.target.value } : item) }) }, ["left", "center", "right", "free"].map((value) => h("option", { key: value, value }, value))),
      h("select", { value: image.verticalAlign || "center", onChange: (event) => patch({ layerImages: images.map((item) => item.id === image.id ? { ...item, verticalAlign: event.target.value } : item) }) }, ["top", "center", "bottom", "free"].map((value) => h("option", { key: value, value }, value))),
      h("input", { type: "range", min: .05, max: 2, step: .01, value: image.scale ?? 1, title: "缩放", onChange: (event) => patch({ layerImages: images.map((item) => item.id === image.id ? { ...item, scale: Number(event.target.value) } : item) }) }),
      h("input", { type: "range", min: 0, max: 1, step: .01, value: image.opacity ?? 1, title: "透明度", onChange: (event) => patch({ layerImages: images.map((item) => item.id === image.id ? { ...item, opacity: Number(event.target.value) } : item) }) }),
      h("button", { className: "folia-icon-button", title: "删除图片", onClick: () => void removeImage(image.id) }, "×"),
    )),
  );
}

function CappellaAssetPoolSettings({ tuning, update }) {
  const [assets, setAssets] = useState({ cappellaEmoji: [], cappellaAvatar: [] });
  const [busy, setBusy] = useState(false);
  const emojiInput = useRef(null);
  const avatarInput = useRef(null);
  const refresh = () => setAssets({
    cappellaEmoji: globalThis.FoliaStageAssets?.get("cappellaEmoji") || [],
    cappellaAvatar: globalThis.FoliaStageAssets?.get("cappellaAvatar") || [],
  });
  useEffect(() => {
    let active = true;
    globalThis.FoliaStageAssets?.load().then(() => { if (active) refresh(); }).catch(() => {});
    return () => { active = false; };
  }, []);
  const add = async (type, event) => {
    const files = event.target.files;
    event.target.value = "";
    if (!files?.length || busy) return;
    setBusy(true);
    try {
      await globalThis.FoliaStageAssets?.addFiles(type, files, 32);
      refresh();
      update({ cappellaTuning: { ...tuning, assetRevision: Date.now() } });
    } catch (error) { foliaStageNotify(`Cappella 资源导入失败：${error.message}`, true); }
    finally { setBusy(false); }
  };
  const remove = async (type, id) => {
    await globalThis.FoliaStageAssets?.remove(type, id);
    refresh();
    update({ cappellaTuning: { ...tuning, assetRevision: Date.now() } });
  };
  const clear = async (type) => {
    await globalThis.FoliaStageAssets?.clear(type);
    refresh();
    update({ cappellaTuning: { ...tuning, assetRevision: Date.now() } });
  };
  const renderPool = (type, list, label, inputRef) => h("div", { className: "folia-asset-pool", key: type },
    h("label", null, `${label}（${list.length}/32）`),
    h("div", { className: "folia-settings__file-row" },
      h("button", { className: "folia-button", type: "button", onClick: () => inputRef.current?.click(), disabled: busy }, "导入"),
      h("button", { className: "folia-button", type: "button", onClick: () => clear(type), disabled: busy || !list.length }, "清空"),
      h("input", { ref: inputRef, hidden: true, type: "file", multiple: true, accept: "image/png,image/jpeg,image/webp,image/gif", onChange: (event) => add(type, event) }),
    ),
    h("div", { className: "folia-asset-pool__grid" }, list.map((asset) => h("div", { className: "folia-asset-pool__item", key: asset.id },
      h("img", { src: asset.url, alt: asset.name }),
      h("button", { type: "button", title: `删除 ${asset.name}`, onClick: () => remove(type, asset.id) }, "×"),
    ))),
  );
  return h("div", { className: "folia-settings__subsection" },
    renderPool("cappellaEmoji", assets.cappellaEmoji, "自定义 Emoji", emojiInput),
    renderPool("cappellaAvatar", assets.cappellaAvatar, "自定义头像", avatarInput),
  );
}

function MonetAssetSettings({ settings, update }) {
  const [assets, setAssets] = useState({ monetPortrait: [], monetBackground: [] });
  const [busy, setBusy] = useState(false);
  const portraitInput = useRef(null);
  const backgroundInput = useRef(null);
  const refresh = () => setAssets({
    monetPortrait: globalThis.FoliaStageAssets?.get("monetPortrait") || [],
    monetBackground: globalThis.FoliaStageAssets?.get("monetBackground") || [],
  });
  useEffect(() => {
    let active = true;
    globalThis.FoliaStageAssets?.load().then(() => { if (active) refresh(); }).catch(() => {});
    return () => { active = false; };
  }, []);
  const add = async (type, event) => {
    const files = event.target.files;
    event.target.value = "";
    if (!files?.length || busy) return;
    setBusy(true);
    try {
      const added = await globalThis.FoliaStageAssets?.addFiles(type, files, type === "monetPortrait" ? 8 : 8);
      const selected = added?.[0];
      if (selected && type === "monetPortrait") {
        update({ monetTuning: { ...settings.monetTuning, portraitSource: "custom", customPortraitImage: selected, assetRevision: Date.now() } });
      }
      if (selected && type === "monetBackground") {
        update({ backgroundAssets: { ...settings.backgroundAssets, customImage: selected }, backgroundTunings: { ...settings.backgroundTunings, monet: { ...settings.backgroundTunings.monet, backgroundSource: "uploaded-global" } } });
      }
      refresh();
    } catch (error) { foliaStageNotify(`Monet 资源导入失败：${error.message}`, true); }
    finally { setBusy(false); }
  };
  const removePortrait = async (id) => {
    await globalThis.FoliaStageAssets?.remove("monetPortrait", id);
    const current = settings.monetTuning.customPortraitImage?.id === id ? null : settings.monetTuning.customPortraitImage;
    update({ monetTuning: { ...settings.monetTuning, portraitSource: current ? "custom" : "cover", customPortraitImage: current, assetRevision: Date.now() } });
    refresh();
  };
  const removeBackground = async (id) => {
    await globalThis.FoliaStageAssets?.remove("monetBackground", id);
    const current = settings.backgroundAssets.customImage?.id === id ? null : settings.backgroundAssets.customImage;
    update({ backgroundAssets: { ...settings.backgroundAssets, customImage: current }, backgroundTunings: { ...settings.backgroundTunings, monet: { ...settings.backgroundTunings.monet, backgroundSource: current ? "uploaded-global" : "cover-derived" } } });
    refresh();
  };
  return h("div", { className: "folia-settings__subsection" },
    h("label", null, "Monet 自定义肖像"),
    h("div", { className: "folia-settings__file-row" },
      h("button", { className: "folia-button", type: "button", onClick: () => portraitInput.current?.click(), disabled: busy }, "导入肖像"),
      h("input", { ref: portraitInput, hidden: true, type: "file", accept: "image/png,image/jpeg,image/webp", onChange: (event) => add("monetPortrait", event) }),
    ),
    h("div", { className: "folia-asset-pool__grid" }, assets.monetPortrait.map((asset) => h("div", { className: `folia-asset-pool__item${settings.monetTuning.customPortraitImage?.id === asset.id ? " is-active" : ""}`, key: asset.id },
      h("img", { src: asset.url, alt: asset.name }),
      h("button", { type: "button", title: `删除 ${asset.name}`, onClick: () => removePortrait(asset.id) }, "×"),
    ))),
    h("label", null, "Monet 自定义背景"),
    h("div", { className: "folia-settings__file-row" },
      h("button", { className: "folia-button", type: "button", onClick: () => backgroundInput.current?.click(), disabled: busy }, "导入背景"),
      h("input", { ref: backgroundInput, hidden: true, type: "file", accept: "image/png,image/jpeg,image/webp", onChange: (event) => add("monetBackground", event) }),
    ),
    h("div", { className: "folia-asset-pool__grid" }, assets.monetBackground.map((asset) => h("div", { className: `folia-asset-pool__item${settings.backgroundAssets.customImage?.id === asset.id ? " is-active" : ""}`, key: asset.id },
      h("img", { src: asset.url, alt: asset.name }),
      h("button", { type: "button", title: `删除 ${asset.name}`, onClick: () => removeBackground(asset.id) }, "×"),
    ))),
  );
}

function SettingsPanel({
  settings,
  setSettings,
  offset,
  setOffset,
  lyrics,
  playback,
  updateJizuraTuning,
  audioSignals,
  diagnostics,
  onImport,
  onRemoveLocal,
  onExportSettings,
  onImportSettings,
  onEditSegmentation,
  onImportFont,
  onResetSettings,
  jizuraProject,
  onSaveJizuraProject,
  onExportJizuraProject,
  onExportNativeJizuraProject,
  onImportJizuraProject,
  onRemoveJizuraProject,
  onUndoJizura,
  onRedoJizura,
}) {
  const update = (next) => setSettings((current) => ({ ...current, ...next }));
  const toggleProvider = (provider) => setSettings((current) => ({
    ...current,
    providers: { ...current.providers, [provider]: !current.providers[provider] },
  }));
  return h("aside", { className: "folia-settings" },
    h("div", { className: "folia-settings__section" },
      h("label", null, "舞台模式"),
      h("div", { className: "folia-segmented" }, FoliaStageVisualizers.modes.map((mode) => h("button", {
        key: mode.id,
        className: settings.mode === mode.id ? "is-active" : "",
        onClick: () => update({ mode: mode.id }),
      }, mode.label))),
    ),
    h("div", { className: "folia-settings__section" },
      h("label", null, `字号 ${Math.round(settings.fontScale * 100)}%`),
      h("input", { type: "range", min: 0.75, max: 1.4, step: 0.05, value: settings.fontScale, onChange: (event) => update({ fontScale: Number(event.target.value) }) }),
    ),
    h("div", { className: "folia-settings__section" },
      h("label", null, `时间偏移 ${offset > 0 ? "+" : ""}${offset} ms`),
      h("div", { className: "folia-offset" },
        h("button", { onClick: () => setOffset(offset - 100) }, "-100"),
        h("button", { onClick: () => setOffset(0) }, "归零"),
        h("button", { onClick: () => setOffset(offset + 100) }, "+100"),
      ),
    ),
    h("div", { className: "folia-settings__section folia-settings__checks" },
      h("label", null, h("input", { type: "checkbox", checked: settings.showTranslation, onChange: () => update({ showTranslation: !settings.showTranslation, subtitleContentMode: settings.showTranslation ? "none" : "translation" }) }), "显示字幕"),
      h("label", null, h("input", { type: "checkbox", checked: settings.dimInactive, onChange: () => update({ dimInactive: !settings.dimInactive }) }), "弱化非当前行"),
    ),
    h("div", { className: "folia-settings__section folia-subtitle-settings" },
      h("label", null, "字幕内容"),
      h("div", { className: "folia-segmented" }, [["translation", "翻译"], ["romanization", "罗马音"], ["both", "翻译+罗马音"], ["none", "不显示"]].map(([value, label]) => h("button", { key: value, className: (settings.subtitleContentMode || "translation") === value ? "is-active" : "", onClick: () => update({ subtitleContentMode: value, showTranslation: value !== "none" }) }, label))),
      h("label", null, `字幕字号 ${Math.round((settings.subtitleFontScale ?? 1) * 100)}%`),
      h("input", { type: "range", min: .7, max: 1.6, step: .05, value: settings.subtitleFontScale ?? 1, onChange: (event) => update({ subtitleFontScale: Number(event.target.value) }) }),
      h("label", null, `字幕底板 ${Math.round((settings.subtitleOverlayOpacity ?? .72) * 100)}%`),
      h("input", { type: "range", min: 0, max: 1, step: .02, value: settings.subtitleOverlayOpacity ?? .72, onChange: (event) => update({ subtitleOverlayOpacity: Number(event.target.value) }) }),
      h("label", null, h("input", { type: "checkbox", checked: settings.subtitleOverlayBackground !== false, onChange: () => update({ subtitleOverlayBackground: !settings.subtitleOverlayBackground }) }), "字幕底板"),
      h("label", null, h("input", { type: "checkbox", checked: settings.subtitleUpcomingLyricsBlur !== false, onChange: () => update({ subtitleUpcomingLyricsBlur: !settings.subtitleUpcomingLyricsBlur }) }), "模糊即将出现的字幕"),
    ),
    h("div", { className: "folia-settings__section folia-theme-settings" },
      h("label", null, "主题与字体"),
      h("div", { className: "folia-theme-settings__colors" },
        [["primaryColor", "主文字"], ["secondaryColor", "副文字"], ["backgroundColor", "舞台底色"]].map(([key, label]) => h("label", { key, className: "folia-color-control" },
          h("input", { type: "color", value: isHexColor(settings.theme?.[key]) ? settings.theme[key] : FoliaStageCore.DEFAULT_SETTINGS.theme[key], onChange: (event) => update({ theme: { ...settings.theme, [key]: event.target.value } }) }),
          h("span", null, label),
        )),
        h("label", { className: "folia-color-control" },
          h("input", { type: "color", value: isHexColor(settings.theme?.accentColor) ? settings.theme.accentColor : FoliaStageCore.DEFAULT_SETTINGS.theme.primaryColor, onChange: (event) => update({ theme: { ...settings.theme, accentColor: event.target.value } }) }),
          h("span", null, "固定强调色"),
        ),
        h("button", { className: "folia-button folia-theme-settings__match", type: "button", onClick: () => update({ theme: { ...settings.theme, accentColor: "" } }) }, "自动跟随封面"),
      ),
      h("div", { className: "folia-settings__file-row" },
        h("label", { className: "folia-inline-control folia-inline-control--wide" }, "字体名称",
          h("input", { className: "folia-text-input", value: settings.theme?.fontFamily || "Spotify Mix", onChange: (event) => update({ theme: { ...settings.theme, fontFamily: event.target.value } }) }),
        ),
        h("button", { className: "folia-button", onClick: onImportFont }, settings.theme?.customFont?.name ? `更换字体（${settings.theme.customFont.name}）` : "导入字体"),
      ),
      h("label", null, "字形"),
      h("div", { className: "folia-segmented" }, [["sans", "无衬线"], ["serif", "衬线"], ["mono", "等宽"]].map(([value, label]) => h("button", { key: value, className: (settings.theme?.fontStyle || "sans") === value ? "is-active" : "", onClick: () => update({ theme: { ...settings.theme, fontStyle: value } }) }, label))),
      h("label", null, `字重 ${settings.theme?.fontWeight ?? 700}`),
      h("input", { type: "range", min: 300, max: 900, step: 100, value: settings.theme?.fontWeight ?? 700, onChange: (event) => update({ theme: { ...settings.theme, fontWeight: Number(event.target.value) } }) }),
      h("label", null, "动画强度"),
      h("div", { className: "folia-segmented" }, [["calm", "平静"], ["normal", "标准"], ["chaotic", "强烈"]].map(([value, label]) => h("button", { key: value, className: (settings.theme?.animationIntensity || "normal") === value ? "is-active" : "", onClick: () => update({ theme: { ...settings.theme, animationIntensity: value } }) }, label))),
      h("small", null, "强调色留空时跟随 Spotify 封面配色；导入字体仅保存在本机。"),
    ),
    h(BackgroundSettings, { settings, update }),
    settings.mode === "english" && h("div", { className: "folia-settings__section folia-settings__english" },
      h("label", null, "英文 PV 舞台"),
      h("label", null, `镜头运动 ${Number(settings.englishTuning.motionAmount).toFixed(2)}x`),
      h("input", { type: "range", min: .4, max: 2, step: .05, value: settings.englishTuning.motionAmount, onChange: (event) => update({ englishTuning: { ...settings.englishTuning, motionAmount: Number(event.target.value) } }) }),
      h("label", null, `音乐响应 ${Number(settings.englishTuning.audioResponse).toFixed(2)}x`),
      h("input", { type: "range", min: 0, max: 2, step: .05, value: settings.englishTuning.audioResponse, onChange: (event) => update({ englishTuning: { ...settings.englishTuning, audioResponse: Number(event.target.value) } }) }),
      h("label", null, `光束强度 ${Number(settings.englishTuning.beamIntensity).toFixed(2)}x`),
      h("input", { type: "range", min: 0, max: 2, step: .05, value: settings.englishTuning.beamIntensity, onChange: (event) => update({ englishTuning: { ...settings.englishTuning, beamIntensity: Number(event.target.value) } }) }),
      h("label", null, `粒子密度 ${Number(settings.englishTuning.particleAmount).toFixed(2)}x`),
      h("input", { type: "range", min: 0, max: 2, step: .05, value: settings.englishTuning.particleAmount, onChange: (event) => update({ englishTuning: { ...settings.englishTuning, particleAmount: Number(event.target.value) } }) }),
      h("label", null, `残影强度 ${Number(settings.englishTuning.ghostIntensity).toFixed(2)}x`),
      h("input", { type: "range", min: 0, max: 2, step: .05, value: settings.englishTuning.ghostIntensity, onChange: (event) => update({ englishTuning: { ...settings.englishTuning, ghostIntensity: Number(event.target.value) } }) }),
      h("label", null, `镜头切换 ${Number(settings.englishTuning.cameraSpeed).toFixed(2)}x`),
      h("input", { type: "range", min: .5, max: 2, step: .05, value: settings.englishTuning.cameraSpeed, onChange: (event) => update({ englishTuning: { ...settings.englishTuning, cameraSpeed: Number(event.target.value) } }) }),
      h("label", null, `歌词散开 ${Number(settings.englishTuning.wordSpread).toFixed(2)}x`),
      h("input", { type: "range", min: .5, max: 2, step: .05, value: settings.englishTuning.wordSpread, onChange: (event) => update({ englishTuning: { ...settings.englishTuning, wordSpread: Number(event.target.value) } }) }),
      h("label", null, "动画强度"),
      h("div", { className: "folia-segmented" }, [["calm", "平静"], ["normal", "标准"], ["chaotic", "强烈"]].map(([value, label]) => h("button", { key: value, className: settings.englishTuning.animationIntensity === value ? "is-active" : "", onClick: () => update({ englishTuning: { ...settings.englishTuning, animationIntensity: value } }) }, label))),
      [["showContextWords", "显示前后词"], ["showHud", "显示舞台信息"], ["showFullLine", "显示整句"]].map(([key, label]) => h("label", { key }, h("input", { type: "checkbox", checked: Boolean(settings.englishTuning[key]), onChange: () => update({ englishTuning: { ...settings.englishTuning, [key]: !settings.englishTuning[key] } }) }), label)),
    ),
    settings.mode === "jizura" && h(FoliaJizuraStage.Settings, {
      tuning: settings.jizuraTuning,
      onChange: updateJizuraTuning,
      lines: lyrics?.lines || [],
      playback,
      audioSignals,
    }),
    settings.mode === "classic" && h("div", { className: "folia-settings__section folia-settings__classic" },
      h("label", null, "原版 Classic 调节"),
      h("label", null, h("input", {
        type: "checkbox",
        checked: settings.classicTuning.enableWordRotation,
        onChange: () => update({ classicTuning: { ...settings.classicTuning, enableWordRotation: !settings.classicTuning.enableWordRotation } }),
      }), "词语旋转"),
      h("label", null, h("input", {
        type: "checkbox",
        checked: settings.classicTuning.useLegacyLayout,
        onChange: () => update({ classicTuning: { ...settings.classicTuning, useLegacyLayout: !settings.classicTuning.useLegacyLayout } }),
      }), "旧版词间布局"),
      h("label", null, `呼吸浮动 ${settings.classicTuning.breathingFloatMultiplier.toFixed(2)}x`),
      h("input", { type: "range", min: 0, max: 2, step: 0.05, value: settings.classicTuning.breathingFloatMultiplier, onChange: (event) => update({ classicTuning: { ...settings.classicTuning, breathingFloatMultiplier: Number(event.target.value) } }) }),
      !settings.classicTuning.useLegacyLayout && h("label", null, `词间距 ${settings.classicTuning.wordSpacing.toFixed(2)}x`),
      !settings.classicTuning.useLegacyLayout && h("input", { type: "range", min: 0, max: 2, step: 0.05, value: settings.classicTuning.wordSpacing, onChange: (event) => update({ classicTuning: { ...settings.classicTuning, wordSpacing: Number(event.target.value) } }) }),
      h("div", { className: "folia-segmented" }, ["calm", "normal", "chaotic"].map((value) => h("button", {
        key: value,
        className: settings.classicTuning.animationIntensity === value ? "is-active" : "",
        onClick: () => update({ classicTuning: { ...settings.classicTuning, animationIntensity: value } }),
      }, value === "calm" ? "平静" : value === "chaotic" ? "强烈" : "标准"))),
    ),
    settings.mode === "cappella" && h("div", { className: "folia-settings__section folia-settings__cappella" },
      h("label", null, "原版 Cappella 调节"),
      h("label", null, h("input", {
        type: "checkbox",
        checked: settings.cappellaTuning.showEmoMessages,
        onChange: () => update({ cappellaTuning: { ...settings.cappellaTuning, showEmoMessages: !settings.cappellaTuning.showEmoMessages } }),
      }), "显示表情回复"),
      h("label", null, "Emoji 来源"),
      h("div", { className: "folia-segmented" }, [["builtin", "内置"], ["custom", "自定义"]].map(([value, label]) => h("button", { key: value, className: (settings.cappellaTuning.emojiPackSource || "builtin") === value ? "is-active" : "", onClick: () => update({ cappellaTuning: { ...settings.cappellaTuning, emojiPackSource: value } }) }, label))),
      h("label", null, "头像来源"),
      h("div", { className: "folia-segmented" }, [["cover", "封面"], ["builtin", "内置"], ["color", "纯色"], ["custom", "自定义"]].map(([value, label]) => h("button", {
        key: value,
        className: settings.cappellaTuning.avatarSource === value ? "is-active" : "",
        onClick: () => update({ cappellaTuning: { ...settings.cappellaTuning, avatarSource: value } }),
      }, label))),
      h("label", null, "气泡动画"),
      h("div", { className: "folia-segmented" }, ["calm", "normal", "chaotic"].map((value) => h("button", {
        key: value,
        className: settings.cappellaTuning.animationIntensity === value ? "is-active" : "",
        onClick: () => update({ cappellaTuning: { ...settings.cappellaTuning, animationIntensity: value } }),
      }, value === "calm" ? "平静" : value === "chaotic" ? "强烈" : "标准"))),
      h(CappellaAssetPoolSettings, { tuning: settings.cappellaTuning, update }),
    ),
    settings.mode === "partita" && h("div", { className: "folia-settings__section folia-settings__partita" },
      h("label", null, "原版 Partita 调节"),
      h("label", null, h("input", {
        type: "checkbox",
        checked: settings.partitaTuning.showGuideLines,
        onChange: () => update({ partitaTuning: { ...settings.partitaTuning, showGuideLines: !settings.partitaTuning.showGuideLines } }),
      }), "显示引导线"),
      h("label", null, h("input", {
        type: "checkbox",
        checked: settings.partitaTuning.useSemanticLayout,
        onChange: () => update({ partitaTuning: { ...settings.partitaTuning, useSemanticLayout: !settings.partitaTuning.useSemanticLayout } }),
      }), "CJK 语义分组"),
      h("label", null, `最小错位 ${settings.partitaTuning.staggerMin}px`),
      h("input", { type: "range", min: 0, max: 180, step: 5, value: settings.partitaTuning.staggerMin, onChange: (event) => { const value = Number(event.target.value); update({ partitaTuning: { ...settings.partitaTuning, staggerMin: value, staggerMax: Math.max(value, settings.partitaTuning.staggerMax) } }); } }),
      h("label", null, `最大错位 ${settings.partitaTuning.staggerMax}px`),
      h("input", { type: "range", min: 0, max: 180, step: 5, value: settings.partitaTuning.staggerMax, onChange: (event) => { const value = Number(event.target.value); update({ partitaTuning: { ...settings.partitaTuning, staggerMin: Math.min(settings.partitaTuning.staggerMin, value), staggerMax: value } }); } }),
      h("div", { className: "folia-segmented" }, ["calm", "normal", "chaotic"].map((value) => h("button", {
        key: value,
        className: settings.partitaTuning.animationIntensity === value ? "is-active" : "",
        onClick: () => update({ partitaTuning: { ...settings.partitaTuning, animationIntensity: value } }),
      }, value === "calm" ? "平静" : value === "chaotic" ? "强烈" : "标准"))),
    ),
    settings.mode === "claddagh" && h("div", { className: "folia-settings__section folia-settings__advanced" },
      h("label", null, "原版 Claddagh / 环歌"),
      [["focusScaleRatio", "焦点放大", .1, 1.5], ["radiusScale", "环形半径", .4, 1.8], ["ellipseTiltDeg", "椭圆倾角", 0, 90], ["letterSpacingOffset", "字距偏移", -12, 30]].map(([key, label, min, max]) => h(React.Fragment, { key },
        h("label", null, `${label} ${Number(settings.claddaghTuning[key]).toFixed(2)}`),
        h("input", { type: "range", min, max, step: key === "ellipseTiltDeg" || key === "letterSpacingOffset" ? 1 : .05, value: settings.claddaghTuning[key], onChange: (event) => update({ claddaghTuning: { ...settings.claddaghTuning, [key]: Number(event.target.value) } }) }),
      )),
      h("label", null, h("input", { type: "checkbox", checked: settings.claddaghTuning.showAxisLine, onChange: () => update({ claddaghTuning: { ...settings.claddaghTuning, showAxisLine: !settings.claddaghTuning.showAxisLine } }) }), "显示动态轴线"),
    ),
    settings.mode === "monet" && h("div", { className: "folia-settings__section folia-settings__advanced" },
      h("label", null, "原版 Monet / 莫奈"),
      h("label", null, `舞台字号 ${settings.monetTuning.fontScale.toFixed(2)}x`),
      h("input", { type: "range", min: .7, max: 1.5, step: .05, value: settings.monetTuning.fontScale, onChange: (event) => update({ monetTuning: { ...settings.monetTuning, fontScale: Number(event.target.value) } }) }),
      h("label", null, `肖像横移 ${settings.monetTuning.portraitOffsetX}px`),
      h("input", { type: "range", min: -500, max: 500, step: 5, value: settings.monetTuning.portraitOffsetX, onChange: (event) => update({ monetTuning: { ...settings.monetTuning, portraitOffsetX: Number(event.target.value) } }) }),
      h("label", null, "音频图形"),
      h("div", { className: "folia-segmented" }, [["bar", "条形"], ["wave", "波形"], ["none", "无"]].map(([value, label]) => h("button", { key: value, className: settings.monetTuning.audioStyle === value ? "is-active" : "", onClick: () => update({ monetTuning: { ...settings.monetTuning, audioStyle: value, showAudioVisualization: value !== "none" } }) }, label))),
      h("label", null, "肖像形状"),
      h("div", { className: "folia-segmented" }, [["square", "方形"], ["rectangular", "竖幅"]].map(([value, label]) => h("button", { key: value, className: settings.monetTuning.portraitStyle === value ? "is-active" : "", onClick: () => update({ monetTuning: { ...settings.monetTuning, portraitStyle: value } }) }, label))),
      [["keywordColoringEnabled", "关键词着色"], ["showDescription", "歌曲说明"], ["showPortraitDragHanger", "肖像拖拽柄"]].map(([key, label]) => h("label", { key }, h("input", { type: "checkbox", checked: Boolean(settings.monetTuning[key]), onChange: () => update({ monetTuning: { ...settings.monetTuning, [key]: !settings.monetTuning[key] } }) }), label)),
      h("label", null, "肖像来源"),
      h("div", { className: "folia-segmented" }, [["cover", "封面"], ["custom", "自定义"]].map(([value, label]) => h("button", { key: value, className: (settings.monetTuning.portraitSource || "cover") === value ? "is-active" : "", onClick: () => update({ monetTuning: { ...settings.monetTuning, portraitSource: value } }) }, label))),
      h(MonetAssetSettings, { settings, update }),
    ),
    settings.mode === "pendolo" && h("div", { className: "folia-settings__section folia-settings__advanced" },
      h("label", null, "原版 Pendolo / 钟摆"),
      [["arcRadius", "弧形半径", .2, .8], ["arcAngleDeg", "弧形角度", 40, 180], ["wheelCenterX", "中心横移", -.5, .5], ["wheelCenterY", "中心纵移", .1, .9], ["tickSnappiness", "擒纵弹性", .5, 4], ["activeScale", "当前行比例", .8, 1.8]].map(([key, label, min, max]) => h(React.Fragment, { key },
        h("label", null, `${label} ${Number(settings.pendoloTuning[key]).toFixed(2)}`),
        h("input", { type: "range", min, max, step: key === "arcAngleDeg" ? 2 : .02, value: settings.pendoloTuning[key], onChange: (event) => update({ pendoloTuning: { ...settings.pendoloTuning, [key]: Number(event.target.value) } }) }),
      )),
      h("label", null, "齿轮装饰"),
      h("div", { className: "folia-segmented" }, [["none", "无"], ["subtle", "轻量"], ["full", "完整"]].map(([value, label]) => h("button", { key: value, className: settings.pendoloTuning.showGearDecor === value ? "is-active" : "", onClick: () => update({ pendoloTuning: { ...settings.pendoloTuning, showGearDecor: value } }) }, label))),
      [["showCenterGradient", "中心渐变"], ["showCoverOnWatchFace", "表盘封面"], ["enableLineGlow", "歌词辉光"]].map(([key, label]) => h("label", { key }, h("input", { type: "checkbox", checked: Boolean(settings.pendoloTuning[key]), onChange: () => update({ pendoloTuning: { ...settings.pendoloTuning, [key]: !settings.pendoloTuning[key] } }) }), label)),
    ),
    settings.mode === "diorama" && h("div", { className: "folia-settings__section folia-settings__advanced" },
      h("label", null, "原版 Diorama / 立景 3D"),
      [["cameraSpeed", "镜头速度", .4, 2], ["motionAmount", "运动幅度", 0, 2], ["audioReactivity", "音乐响应", 0, 2], ["particleDensity", "点云密度", 96, 1536], ["particleScale", "点云尺度", .65, 1.6], ["particleGlowIntensity", "点云辉光", .1, 1.5], ["glowIntensity", "跟唱辉光", .1, 1.5], ["soulIntensity", "灵魂漂移", .1, 1.5], ["gradientIntensity", "渐变跟唱", .1, 1.5], ["backgroundParticleCircumference", "背景环周长", 8, 64], ["backgroundParticleRadial", "背景环径向", .5, 5]].map(([key, label, min, max]) => h(React.Fragment, { key },
        h("label", null, `${label} ${Number(settings.dioramaTuning[key]).toFixed(key === "particleDensity" ? 0 : 2)}`),
        h("input", { type: "range", min, max, step: key === "particleDensity" ? 24 : .05, value: settings.dioramaTuning[key], onChange: (event) => update({ dioramaTuning: { ...settings.dioramaTuning, [key]: Number(event.target.value) } }) }),
      )),
      h("label", null, "几何模式"),
      h("div", { className: "folia-segmented" }, [["clouds", "场景点云"], ["corridor", "点隧道"]].map(([value, label]) => h("button", { key: value, className: settings.dioramaTuning.geometryVisibility.mode === value ? "is-active" : "", onClick: () => update({ dioramaTuning: { ...settings.dioramaTuning, geometryVisibility: { ...settings.dioramaTuning.geometryVisibility, mode: value } } }) }, label))),
      [["showParticles", "背景粒子"], ["particleGlowEnabled", "点云光晕"], ["glowEnabled", "普通辉光跟唱"], ["soulEnabled", "灵魂出窍跟唱"], ["soulActiveEnabled", "当前字漂移"], ["gradientEnabled", "渐变跟唱"], ["keywordColoringEnabled", "关键词着色"]].map(([key, label]) => h("label", { key }, h("input", { type: "checkbox", checked: Boolean(settings.dioramaTuning[key]), onChange: () => update({ dioramaTuning: { ...settings.dioramaTuning, [key]: !settings.dioramaTuning[key] } }) }), label)),
      [["strands", "几何丝带"], ["blobs", "几何团块"], ["ribbons", "几何飘带"], ["rings", "几何圆环"]].map(([key, label]) => h("label", { key }, h("input", { type: "checkbox", checked: settings.dioramaTuning.geometryVisibility[key] !== false, onChange: () => update({ dioramaTuning: { ...settings.dioramaTuning, geometryVisibility: { ...settings.dioramaTuning.geometryVisibility, [key]: settings.dioramaTuning.geometryVisibility[key] === false } } }) }), label)),
      h("label", null, h("input", { type: "checkbox", checked: settings.dioramaTuning.geometryVisibility.enabled, onChange: () => update({ dioramaTuning: { ...settings.dioramaTuning, geometryVisibility: { ...settings.dioramaTuning.geometryVisibility, enabled: !settings.dioramaTuning.geometryVisibility.enabled } } }) }), "几何点云"),
    ),
    settings.mode === "tempera" && h("div", { className: "folia-settings__section folia-settings__tempera" },
      h("label", null, "原版 Tempera / 凝彩"),
      h("label", null, "颜色模式"),
      h("div", { className: "folia-segmented" }, [["duo", "双色"], ["mono", "单色"], ["gradient", "渐变"]].map(([value, label]) => h("button", {
        key: value,
        className: settings.temperaTuning.colorMode === value ? "is-active" : "",
        onClick: () => update({ temperaTuning: { ...settings.temperaTuning, colorMode: value } }),
      }, label))),
      h("label", null, `镜头强度 ${settings.temperaTuning.cameraIntensity.toFixed(2)}x`),
      h("input", { type: "range", min: 0, max: 2, step: .05, value: settings.temperaTuning.cameraIntensity, onChange: (event) => update({ temperaTuning: { ...settings.temperaTuning, cameraIntensity: Number(event.target.value) } }) }),
      h("label", null, `字形运动 ${settings.temperaTuning.glyphMotion.toFixed(2)}x`),
      h("input", { type: "range", min: 0, max: 2, step: .05, value: settings.temperaTuning.glyphMotion, onChange: (event) => update({ temperaTuning: { ...settings.temperaTuning, glyphMotion: Number(event.target.value) } }) }),
      h("label", null, `落定延展 ${Math.round(settings.temperaTuning.glyphSettleStretch * 100)}%`),
      h("input", { type: "range", min: 0, max: 1, step: .05, value: settings.temperaTuning.glyphSettleStretch, onChange: (event) => update({ temperaTuning: { ...settings.temperaTuning, glyphSettleStretch: Number(event.target.value) } }) }),
      [["wholeLineLyrics", "整行镜头"], ["showBlocks", "色块"], ["showDecor", "装饰"], ["showCornerMarks", "边角线框"], ["textInversion", "文字动态反色"], ["enableTransitions", "镜头转场"], ["postProcessEnabled", "后处理"]].map(([key, label]) => h("label", { key }, h("input", {
        type: "checkbox",
        checked: Boolean(settings.temperaTuning[key]),
        onChange: () => update({ temperaTuning: { ...settings.temperaTuning, [key]: !settings.temperaTuning[key] } }),
      }), label)),
      h("label", null, `纹理分辨率 ${settings.temperaTuning.textureResolution.toFixed(2)}x`),
      h("input", { type: "range", min: .5, max: 2, step: .25, value: settings.temperaTuning.textureResolution, onChange: (event) => update({ temperaTuning: { ...settings.temperaTuning, textureResolution: Number(event.target.value) } }) }),
      h(TemperaImagePoolSettings, { tuning: settings.temperaTuning, update }),
      settings.temperaTuning.postProcessEnabled && h(React.Fragment, null,
        h("label", null, h("input", { type: "checkbox", checked: Boolean(settings.temperaTuning.postProcessTextureCompression), onChange: () => update({ temperaTuning: { ...settings.temperaTuning, postProcessTextureCompression: !settings.temperaTuning.postProcessTextureCompression } }) }), "纹理压缩"),
        h("label", null, `胶片颗粒 ${Math.round(settings.temperaTuning.postProcessGrain * 100)}%`),
        h("input", { type: "range", min: 0, max: 1, step: .05, value: settings.temperaTuning.postProcessGrain, onChange: (event) => update({ temperaTuning: { ...settings.temperaTuning, postProcessGrain: Number(event.target.value) } }) }),
        h("label", null, `对比度 ${Number(settings.temperaTuning.postProcessContrast).toFixed(2)}`),
        h("input", { type: "range", min: -1, max: 1, step: .05, value: settings.temperaTuning.postProcessContrast, onChange: (event) => update({ temperaTuning: { ...settings.temperaTuning, postProcessContrast: Number(event.target.value) } }) }),
        h("label", null, `RGB 偏移 ${Number(settings.temperaTuning.postProcessRgbShift).toFixed(2)}`),
        h("input", { type: "range", min: 0, max: 2, step: .05, value: settings.temperaTuning.postProcessRgbShift, onChange: (event) => update({ temperaTuning: { ...settings.temperaTuning, postProcessRgbShift: Number(event.target.value) } }) }),
        h("label", null, `暗角 ${settings.temperaTuning.postProcessVignette.toFixed(2)}x`),
        h("input", { type: "range", min: 0, max: 2, step: .05, value: settings.temperaTuning.postProcessVignette, onChange: (event) => update({ temperaTuning: { ...settings.temperaTuning, postProcessVignette: Number(event.target.value) } }) }),
        h("label", null, `镜头畸变 ${settings.temperaTuning.postProcessLensDistortion.toFixed(2)}x`),
        h("input", { type: "range", min: 0, max: 2, step: .05, value: settings.temperaTuning.postProcessLensDistortion, onChange: (event) => update({ temperaTuning: { ...settings.temperaTuning, postProcessLensDistortion: Number(event.target.value) } }) }),
      ),
    ),
    settings.mode === "sonnet" && h("div", { className: "folia-settings__section folia-settings__advanced" },
      h("label", null, "原版 Sonnet / 商籁"),
      h("label", null, `镜头强度 ${settings.sonnetTuning.cameraIntensity.toFixed(2)}x`),
      h("input", { type: "range", min: 0, max: 2, step: .05, value: settings.sonnetTuning.cameraIntensity, onChange: (event) => update({ sonnetTuning: { ...settings.sonnetTuning, cameraIntensity: Number(event.target.value) } }) }),
      h("label", null, `排版运动 ${settings.sonnetTuning.typographyMotion.toFixed(2)}x`),
      h("input", { type: "range", min: 0, max: 2, step: .05, value: settings.sonnetTuning.typographyMotion, onChange: (event) => update({ sonnetTuning: { ...settings.sonnetTuning, typographyMotion: Number(event.target.value) } }) }),
      h("label", null, `MG 密度 ${settings.sonnetTuning.mgDensity.toFixed(2)}x`),
      h("input", { type: "range", min: 0, max: 2, step: .05, value: settings.sonnetTuning.mgDensity, onChange: (event) => update({ sonnetTuning: { ...settings.sonnetTuning, mgDensity: Number(event.target.value) } }) }),
      h("label", null, "外框"),
      h("div", { className: "folia-segmented" }, [["none", "无"], ["frame", "画框"], ["full", "完整"]].map(([value, label]) => h("button", { key: value, className: settings.sonnetTuning.outerFrameMode === value ? "is-active" : "", onClick: () => update({ sonnetTuning: { ...settings.sonnetTuning, outerFrameMode: value } }) }, label))),
      [["showOnlyText", "仅显示文字"], ["showGuide", "引导线"], ["showBackgroundMg", "背景 MG"], ["showFixedGeo", "固定几何"], ["showGiantDecorativeText", "巨大装饰文字"], ["showBackgroundDecor", "背景装饰"], ["enableTransitions", "镜头转场"], ["postProcessEnabled", "后处理"]].map(([key, label]) => h("label", { key }, h("input", { type: "checkbox", checked: Boolean(settings.sonnetTuning[key]), onChange: () => update({ sonnetTuning: { ...settings.sonnetTuning, [key]: !settings.sonnetTuning[key] } }) }), label)),
      h("label", null, `纹理分辨率 ${Number(settings.sonnetTuning.textureResolution).toFixed(2)}x`),
      h("input", { type: "range", min: .5, max: 2, step: .25, value: settings.sonnetTuning.textureResolution, onChange: (event) => update({ sonnetTuning: { ...settings.sonnetTuning, textureResolution: Number(event.target.value) } }) }),
      settings.sonnetTuning.postProcessEnabled && h(React.Fragment, null,
        h("label", null, `胶片颗粒 ${Math.round(settings.sonnetTuning.postProcessGrain * 100)}%`),
        h("input", { type: "range", min: 0, max: 1, step: .05, value: settings.sonnetTuning.postProcessGrain, onChange: (event) => update({ sonnetTuning: { ...settings.sonnetTuning, postProcessGrain: Number(event.target.value) } }) }),
        h("label", null, `对比度 ${Number(settings.sonnetTuning.postProcessContrast).toFixed(2)}`),
        h("input", { type: "range", min: -1, max: 1, step: .05, value: settings.sonnetTuning.postProcessContrast, onChange: (event) => update({ sonnetTuning: { ...settings.sonnetTuning, postProcessContrast: Number(event.target.value) } }) }),
        h("label", null, `RGB 偏移 ${Number(settings.sonnetTuning.postProcessRgbShift).toFixed(2)}`),
        h("input", { type: "range", min: 0, max: 2, step: .05, value: settings.sonnetTuning.postProcessRgbShift, onChange: (event) => update({ sonnetTuning: { ...settings.sonnetTuning, postProcessRgbShift: Number(event.target.value) } }) }),
        h("label", null, `半色调 ${Number(settings.sonnetTuning.postProcessHalftone).toFixed(2)}`),
        h("input", { type: "range", min: 0, max: 2, step: .05, value: settings.sonnetTuning.postProcessHalftone, onChange: (event) => update({ sonnetTuning: { ...settings.sonnetTuning, postProcessHalftone: Number(event.target.value) } }) }),
        h("label", null, `暗角 ${Number(settings.sonnetTuning.postProcessVignette).toFixed(2)}x`),
        h("input", { type: "range", min: 0, max: 2, step: .05, value: settings.sonnetTuning.postProcessVignette, onChange: (event) => update({ sonnetTuning: { ...settings.sonnetTuning, postProcessVignette: Number(event.target.value) } }) }),
        h("label", null, `镜头畸变 ${Number(settings.sonnetTuning.postProcessLensDistortion).toFixed(2)}x`),
        h("input", { type: "range", min: 0, max: 2, step: .05, value: settings.sonnetTuning.postProcessLensDistortion, onChange: (event) => update({ sonnetTuning: { ...settings.sonnetTuning, postProcessLensDistortion: Number(event.target.value) } }) }),
        h("label", null, `镜头色散 ${Number(settings.sonnetTuning.postProcessLensDispersion).toFixed(2)}x`),
        h("input", { type: "range", min: 0, max: 2, step: .05, value: settings.sonnetTuning.postProcessLensDispersion, onChange: (event) => update({ sonnetTuning: { ...settings.sonnetTuning, postProcessLensDispersion: Number(event.target.value) } }) }),
      ),
    ),
    settings.mode === "jizura" && h("div", { className: "folia-settings__section folia-settings__files" },
      h("label", null, `本曲 JIZURA 工程${jizuraProject?.saved ? jizuraProject.dirty ? " · 有未保存修改" : " · 已保存" : " · 未保存"}`),
      h("div", { className: "folia-settings__file-row" },
        h("button", { className: "folia-button", onClick: onSaveJizuraProject }, "保存本曲"),
        h("button", { className: "folia-button", onClick: onUndoJizura, disabled: !jizuraProject?.canUndo }, "撤销"),
        h("button", { className: "folia-button", onClick: onRedoJizura, disabled: !jizuraProject?.canRedo }, "重做"),
        h("button", { className: "folia-button", onClick: onExportJizuraProject }, "导出工程"),
        h("button", { className: "folia-button", onClick: onExportNativeJizuraProject }, "导出原版 JSON"),
        h("button", { className: "folia-button", onClick: onImportJizuraProject }, "导入工程"),
        jizuraProject?.saved && h("button", { className: "folia-button", onClick: onRemoveJizuraProject }, "清除本曲"),
      ),
    ),
    settings.mode === "lumiere" && h("div", { className: "folia-settings__section folia-settings__advanced" },
      h("label", null, "原版 Lumiere / 绘光"),
      [["lightIntensity", "光强", .3, 2], ["audioResponse", "音乐响应", 0, 2], ["fogDensity", "烟雾浓度", 0, 2], ["darkField", "暗场", 0, 1], ["moteAmount", "浮尘", 0, 2], ["bloom", "图形辉光", 0, 2], ["textBloom", "文字辉光", 0, 2], ["decay", "崩解", 0, 2], ["echo", "背景歌词", 0, 2], ["themeColorMix", "主题色占比", 0, 1], ["unlitOpacity", "未点亮透明度", 0, 1], ["windowNeighbors", "邻近窗口", 0, 6], ["fogOctaves", "烟雾层数", 1, 8]].map(([key, label, min, max]) => h(React.Fragment, { key },
        h("label", null, `${label} ${Number(settings.lumiereTuning[key]).toFixed(2)}x`),
        h("input", { type: "range", min, max, step: .05, value: settings.lumiereTuning[key], onChange: (event) => update({ lumiereTuning: { ...settings.lumiereTuning, [key]: Number(event.target.value) } }) }),
      )),
      [["lineArt", "线稿"], ["frontBokeh", "前景散景"], ["trails", "轨迹线"], ["seamlessTransitions", "无缝段落转场"], ["overlayFrame", "画框"], ["textOnly", "仅显示文字"], ["keywordColors", "关键词着色"], ["themeIcons", "主题图标"]].map(([key, label]) => h("label", { key }, h("input", { type: "checkbox", checked: Boolean(settings.lumiereTuning[key]), onChange: () => update({ lumiereTuning: { ...settings.lumiereTuning, [key]: !settings.lumiereTuning[key] } }) }), label)),
      h("label", null, h("input", { type: "checkbox", checked: settings.lumiereTuning.hideTrails === true, onChange: () => update({ lumiereTuning: { ...settings.lumiereTuning, hideTrails: !settings.lumiereTuning.hideTrails } }) }), "隐藏轨迹线"),
      h("label", null, "画质"),
      h("div", { className: "folia-segmented" }, [["full", "完整"], ["balanced", "平衡"], ["low", "省电"]].map(([value, label]) => h("button", { key: value, className: settings.lumiereTuning.renderQuality === value ? "is-active" : "", onClick: () => update({ lumiereTuning: { ...settings.lumiereTuning, renderQuality: value } }) }, label))),
    ),
    h("div", { className: "folia-settings__section" },
      h("label", null, "歌词来源"),
      h("div", { className: "folia-provider-grid" }, ["local", "spotify", "lrclib", "netease"].map((provider) => h("button", {
        key: provider,
        className: settings.providers[provider] ? "is-active" : "",
        onClick: () => toggleProvider(provider),
      }, provider === "netease" ? "网易云" : provider))),
    ),
    h("div", { className: "folia-settings__section folia-settings__files" },
      h("button", { className: "folia-button folia-button--primary", onClick: onImport }, lyrics?.provider === "local" ? "替换本地歌词" : "导入本地歌词"),
      lyrics?.provider === "local" && h("button", { className: "folia-button", onClick: onRemoveLocal }, "移除本地歌词"),
      lyrics && h("button", { className: "folia-button", onClick: onEditSegmentation }, "调整歌词分词"),
    ),
    h("div", { className: "folia-settings__section folia-settings__files" },
      h("label", null, "设置备份"),
      h("div", { className: "folia-settings__file-row" },
        h("button", { className: "folia-button", onClick: onExportSettings }, "导出"),
        h("button", { className: "folia-button", onClick: onImportSettings }, "导入"),
        h("button", { className: "folia-button", onClick: onResetSettings }, "恢复初始设置"),
      ),
    ),
    h("div", { className: "folia-settings__section folia-diagnostics" },
      h("label", null, "运行状态"),
      h("span", null, `渲染器 ${diagnostics.renderer}`),
      h("span", null, `歌词 ${diagnostics.lines} 行 / ${diagnostics.words} 词`),
      h("span", null, diagnostics.memory),
    ),
  );
}

function FoliaStage() {
  const releaseConfig = getFoliaStageRelease();
  useEffect(() => {
    const cacheKey = "spotify-folia-release-check-v1";
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
      if (cached && Date.now() - cached.checkedAt < 6 * 60 * 60 * 1000) {
        if (releaseConfig.compareVersions(cached.version, releaseConfig.version) > 0) {
          Spicetify.showNotification?.(`Spotify Folia ${cached.version} is available. Open Version information for the PowerShell update command.`);
        }
        return undefined;
      }
    } catch { /* Continue with a fresh public release check. */ }
    let active = true;
    if (typeof fetch !== "function") return undefined;
    fetch(releaseConfig.latestReleaseApi, { headers: { Accept: "application/vnd.github+json" }, credentials: "omit" })
      .then((response) => response.ok ? response.json() : null)
      .then((release) => {
        if (!active || !release?.tag_name) return;
        const version = release.tag_name.replace(/^v/, "");
        try { localStorage.setItem(cacheKey, JSON.stringify({ version, checkedAt: Date.now() })); } catch { /* Optional cache. */ }
        if (releaseConfig.compareVersions(version, releaseConfig.version) > 0) {
          Spicetify.showNotification?.(`Spotify Folia ${release.tag_name} is available. Open Version information for the PowerShell update command.`);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);
  const playback = useSpotifyPlayback();
  const [settings, setSettings] = useState(FoliaStageCore.loadSettings);
  const [rawLyrics, setRawLyrics] = useState(null);
  const [status, setStatus] = useState("idle");
  const [errors, setErrors] = useState([]);
  const [offset, setOffsetState] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [sponsorOpen, setSponsorOpen] = useState(false);
  const [segmentationOpen, setSegmentationOpen] = useState(false);
  const [segmentationRevision, setSegmentationRevision] = useState(0);
  const [audioAnalysis, setAudioAnalysis] = useState("unknown");
  const [audioData, setAudioData] = useState(null);
  const [accent, setAccent] = useState(FoliaStageCore.DEFAULT_SETTINGS.theme.primaryColor);
  const [pageVisible, setPageVisible] = useState(!document.hidden);
  const [jizuraProject, setJizuraProject] = useState(null);
  const [jizuraHistory, setJizuraHistory] = useState({past: [], future: []});
  useEffect(() => {
    const key = "spotify-folia-sponsor-prompt-v1";
    const interval = 14 * 24 * 60 * 60 * 1000;
    const timer = setTimeout(() => {
      let last = 0;
      try { last = Number(localStorage.getItem(key) || 0); } catch { /* Optional local preference. */ }
      if (!last || Date.now() - last >= interval) {
        try { localStorage.setItem(key, String(Date.now())); } catch { /* Optional local preference. */ }
        setSponsorOpen(true);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, []);
  const jizuraHistoryRef = useRef(jizuraHistory);
  jizuraHistoryRef.current = jizuraHistory;
  const jizuraTuningRef = useRef(settings.jizuraTuning || {});
  jizuraTuningRef.current = settings.jizuraTuning || {};
  const fileInput = useRef(null);
  const settingsInput = useRef(null);
  const rootRef = useRef(null);
  const requestRef = useRef(0);
  const jizuraProjectInput = useRef(null);

  const visualTheme = useMemo(() => {
    const configured = settings.theme || {};
    return {
      primaryColor: configured.primaryColor || "#f4f4f5",
      secondaryColor: configured.secondaryColor || "#71717a",
      backgroundColor: configured.backgroundColor || "#09090b",
      accentColor: isHexColor(configured.accentColor) ? configured.accentColor : accent,
      fontFamily: configured.customFont?.family || configured.fontFamily || "Spotify Mix",
      fontStyle: configured.fontStyle || "sans",
      fontWeight: Number(configured.fontWeight) || 700,
      animationIntensity: configured.animationIntensity || "normal",
      wordColors: Array.isArray(configured.wordColors) ? configured.wordColors : [],
      lyricsIcons: Array.isArray(configured.lyricsIcons) ? configured.lyricsIcons : [],
      provider: configured.provider || "spotify",
      description: configured.description || "",
    };
  }, [accent, settings.theme]);

  useEffect(() => {
    const customFont = settings.theme?.customFont;
    if (!customFont?.dataUrl || !customFont.family || typeof FontFace === "undefined") return undefined;
    let active = true;
    const font = new FontFace(customFont.family, `url(${customFont.dataUrl})`);
    font.load().then((loaded) => {
      if (active) document.fonts.add(loaded);
    }).catch((error) => console.warn("[FoliaStage] Custom font failed to load", error));
    return () => { active = false; };
  }, [settings.theme?.customFont?.dataUrl, settings.theme?.customFont?.family]);

  useEffect(() => FoliaStageCore.saveSettings(settings), [settings]);

  useEffect(() => {
    const updateVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  const loadLyrics = async (force = false) => {
    if (!playback.uri) {
      setRawLyrics(null);
      setStatus("idle");
      return;
    }
    const requestId = ++requestRef.current;
    setStatus("loading");
    setErrors([]);
    const result = await FoliaStageProviders.load(playback, settings, { force });
    if (requestId !== requestRef.current) return;
    setRawLyrics(result.document);
    setErrors(result.errors);
    setStatus(result.document ? "ready" : "missing");
  };

  useEffect(() => {
    setOffsetState(FoliaStageCore.getOffset(playback.uri));
    const saved = FoliaStageCore.getJizuraProject(playback.uri);
    setJizuraProject(saved);
    setJizuraHistory({past: [], future: []});
    setSettings(current => ({...current, jizuraTuning: saved?.tuning
      ? {...FoliaStageCore.DEFAULT_SETTINGS.jizuraTuning, ...saved.tuning}
      : {...current.jizuraTuning, overrides: {}, sourceMarkup: {}, lineTimes: {}, importReport: undefined}}));
    loadLyrics(false);
  }, [playback.uri]);

  const lyrics = useMemo(
    () => FoliaStageCore.applyWordSegmentation(rawLyrics, playback.uri),
    [rawLyrics, playback.uri, segmentationRevision],
  );

  useEffect(() => {
    let disposed = false;
    if (!playback.uri || typeof Spicetify.getAudioData !== "function") {
      setAudioData(null);
      setAudioAnalysis("unavailable");
      return undefined;
    }
    setAudioAnalysis("loading");
    Spicetify.getAudioData(playback.uri).then((data) => {
      if (!disposed) {
        setAudioData(data || null);
        setAudioAnalysis(data?.beats?.length || data?.segments?.length ? "available" : "missing");
      }
    }).catch(() => {
      if (!disposed) {
        setAudioData(null);
        setAudioAnalysis("missing");
      }
    });
    return () => { disposed = true; };
  }, [playback.uri]);

  useEffect(() => {
    let disposed = false;
    if (!playback.uri) return undefined;
    Spicetify.CosmosAsync.get(
      `https://spclient.wg.spotify.com/colorextractor/v1/extract-presets?uri=${encodeURIComponent(playback.uri)}&format=json`,
    ).then((result) => {
      const swatches = result?.entries?.[0]?.color_swatches || [];
      const color = swatches.find((item) => item.preset === "VIBRANT_NON_ALARMING")?.color
        || swatches[0]?.color
        || result?.color;
      if (!disposed && color !== undefined) setAccent(colorToCss(color));
    }).catch(() => {});
    return () => { disposed = true; };
  }, [playback.uri]);

  const setOffset = (value) => setOffsetState(FoliaStageCore.setOffset(playback.uri, value));
  const timeMs = Math.max(0, playback.displayProgress + offset);
  const activeIndex = useMemo(
    () => FoliaStageCore.findActiveLine(lyrics?.lines, timeMs),
    [lyrics, timeMs],
  );
  const progress = playback.durationMs
    ? Math.min(1, playback.displayProgress / playback.durationMs)
    : 0;
  const audioSignals = useMemo(
    () => FoliaAudioSignals.create(audioData, lyrics?.lines || []),
    [audioData, lyrics],
  );

  const seek = (time) => Spicetify.Player.seek(Math.max(0, Number(time) || 0));
  const updateJizuraTuning = useMemo(() => (next) => {
    const before = jizuraTuningRef.current;
    const after = typeof next === "function" ? next(before) : next;
    if (JSON.stringify(before) === JSON.stringify(after)) return;
    const history = {past: [...jizuraHistoryRef.current.past.slice(-39), before], future: []};
    jizuraHistoryRef.current = history;
    jizuraTuningRef.current = after;
    setJizuraHistory(history);
    setSettings(current => ({...current, jizuraTuning: after}));
  }, []);
  const saveJizuraProject = () => {
    if (!playback.uri) return;
    try {
      const project = FoliaStageCore.setJizuraProject(playback.uri, { tuning: settings.jizuraTuning, sourceLines: lyrics?.lines || [] });
      setJizuraProject(project);
      foliaStageNotify("本曲 JIZURA 工程已保存");
    } catch(error) { foliaStageNotify(error.message,true); }
  };
  const exportJizuraProject = () => {
    try {
      const project = FoliaStageCore.setJizuraProject(playback.uri, { tuning: settings.jizuraTuning, sourceLines: lyrics?.lines || [] });
      setJizuraProject(project);
      const payload = FoliaStageCore.exportJizuraProject(playback.uri);
      const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = "folia-jizura-project.json"; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { foliaStageNotify(`工程导出失败：${error.message}`, true); }
  };
  const exportNativeJizuraProject = () => {
    try {
      const project = FoliaJizuraStage.nativeProjectFor(lyrics?.lines || [], playback, settings.jizuraTuning || {});
      delete project.audio;
      const url = URL.createObjectURL(new Blob([JSON.stringify(project, null, 2)], { type: "application/json" }));
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = "jizura-project.json"; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { foliaStageNotify(`原版工程导出失败：${error.message}`, true); }
  };
  const importJizuraProject = () => jizuraProjectInput.current?.click();
  const onJizuraProjectFile = async (event) => {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file || !playback.uri) return;
    const requestId=requestRef.current;
    try {
      if (file.size > 8 * 1024 * 1024) throw new Error("工程超过 8 MB，请移除嵌入媒体后重试");
      const payload = JSON.parse(await file.text());
      if(requestRef.current!==requestId)throw new Error("导入期间歌曲已切换，请重新导入");
      FoliaJizuraStage.validateData(payload);
      if(payload?.format === "folia-stage-jizura-project" && payload.project?.tuning){
        const source=payload.project.sourceLines;
        const mapped=Array.isArray(source)?FoliaJizuraStage.tuningFromNativeProject(FoliaJizuraStage.nativeProjectFor(source,{},payload.project.tuning),lyrics?.lines||[]):null;
        if(mapped||payload.songKey!==playback.uri)payload.project.tuning={...payload.project.tuning,overrides:mapped?.overrides||{},sourceMarkup:mapped?.sourceMarkup||{},lineTimes:mapped?.lineTimes||{},importReport:mapped?.importReport};
        payload.project.sourceLines=lyrics?.lines||[];
      }
      const imported = payload?.format === "folia-stage-jizura-project"
        ? FoliaStageCore.importJizuraProject(playback.uri, payload)
        : FoliaStageCore.setJizuraProject(playback.uri, { tuning: FoliaJizuraStage.tuningFromNativeProject(payload, lyrics?.lines || []), sourceLines: lyrics?.lines||[], nativeProject: payload });
      const tuning = { ...FoliaStageCore.DEFAULT_SETTINGS.jizuraTuning, ...(imported.tuning || {}) };
      setJizuraProject(imported); setJizuraHistory({past: [], future: []});
      setSettings(current => ({...current, mode: "jizura", jizuraTuning: tuning}));
      const report=tuning.importReport;
      foliaStageNotify(report ? `JIZURA 已导入：歌词匹配 ${report.matched}/${report.total} 行，未匹配的逐行设置已跳过` : "JIZURA 工程已导入到当前歌曲");
    } catch (error) { foliaStageNotify(`工程导入失败：${error.message}`, true); }
  };
  const removeJizuraProject = () => {
    try{
      FoliaStageCore.removeJizuraProject(playback.uri); setJizuraProject(null);
      updateJizuraTuning({...settings.jizuraTuning,overrides:{},sourceMarkup:{},lineTimes:{},importReport:undefined});
      foliaStageNotify("已清除本曲 JIZURA 工程及逐行设置");
    }catch(error){foliaStageNotify(error.message,true);}
  };
  const undoJizura = () => {
    const history=jizuraHistoryRef.current;
    const previous = history.past[history.past.length - 1]; if (!previous) return;
    const current = jizuraTuningRef.current;
    jizuraTuningRef.current=previous;
    setSettings(state => ({...state, jizuraTuning: previous}));
    jizuraHistoryRef.current={past: history.past.slice(0, -1), future: [current, ...history.future].slice(0, 40)};
    setJizuraHistory(jizuraHistoryRef.current);
  };
  const redoJizura = () => {
    const history=jizuraHistoryRef.current;
    const next = history.future[0]; if (!next) return;
    const current = jizuraTuningRef.current;
    jizuraTuningRef.current=next;
    setSettings(state => ({...state, jizuraTuning: next}));
    jizuraHistoryRef.current={past: [...history.past, current].slice(-40), future: history.future.slice(1)};
    setJizuraHistory(jizuraHistoryRef.current);
  };
  const importLyrics = () => fileInput.current?.click();
  const importFont = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const family = file.name.replace(/\.(ttf|otf|woff2?)$/i, "").trim() || "Folia Custom Font";
        setSettings((current) => ({
          ...current,
          theme: { ...current.theme, fontFamily: family, customFont: { name: file.name, family, dataUrl: String(reader.result || "") } },
        }));
      foliaStageNotify(`已导入字体：${file.name}`);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };
  const onFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !playback.uri) return;
    try {
      const content = await file.text();
      const extension = file.name.split(".").pop().toLowerCase();
      const parsed = ["yrc", "qrc", "krc", "awlrc", "vtt", "ttml"].includes(extension)
        ? await FoliaStageCore.parseLyricsFileWithWorker(file.name, content, playback.durationMs)
        : FoliaStageCore.parseLyricsFile(file.name, content, playback.durationMs);
      if (!parsed.lines.length) throw new Error("文件中没有可用歌词");
      FoliaStageCore.setLocalLyrics(playback.uri, parsed);
      setRawLyrics(parsed);
      setStatus("ready");
      foliaStageNotify(`已为《${playback.title}》导入歌词`);
    } catch (error) {
      foliaStageNotify(`歌词导入失败：${error.message}`, true);
    }
  };
  const removeLocal = () => {
    FoliaStageCore.removeLocalLyrics(playback.uri);
    loadLyrics(true);
  };
  const exportSettings = async () => {
    const assets = await globalThis.FoliaStageAssets?.exportPool().catch(() => ({ version: 1, format: "folia-stage-assets", assets: {} })) || { version: 1, format: "folia-stage-assets", assets: {} };
    const temperaPool = settings.temperaTuning?.layerImages?.length
      ? await globalThis.FoliaTemperaAssets?.exportPool(settings.temperaTuning.layerImages).catch(() => null)
      : null;
    const payload = JSON.stringify({
      format: "folia-stage-settings",
      version: 3,
      settings,
      assets,
      temperaPool,
      wordSegmentations: FoliaStageCore.exportWordSegmentations(),
    }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "folia-stage-settings.json";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importSettings = () => settingsInput.current?.click();
  const onSettingsFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      if (payload?.format !== "folia-stage-settings" || !payload.settings) {
        throw new Error("不是 Folia Stage 设置文件");
      }
      if (payload.assets?.format === "folia-stage-assets") {
        await globalThis.FoliaStageAssets?.importPool(payload.assets, true);
      }
      if (payload.wordSegmentations) {
        FoliaStageCore.importWordSegmentations(payload.wordSegmentations, true);
      }
      let importedTempera = null;
      if (payload.temperaPool?.kind === "spotify-folia-tempera-pool") {
        importedTempera = await globalThis.FoliaTemperaAssets?.importPool(payload.temperaPool, 16);
      }
      const next = {
        ...FoliaStageCore.DEFAULT_SETTINGS,
        ...payload.settings,
        theme: {
          ...FoliaStageCore.DEFAULT_SETTINGS.theme,
          ...(payload.settings.theme || {}),
        },
        providers: {
          ...FoliaStageCore.DEFAULT_SETTINGS.providers,
          ...(payload.settings.providers || {}),
        },
        classicTuning: {
          ...FoliaStageCore.DEFAULT_SETTINGS.classicTuning,
          ...(payload.settings.classicTuning || {}),
        },
        cadenzaTuning: {
          ...FoliaStageCore.DEFAULT_SETTINGS.cadenzaTuning,
          ...(payload.settings.cadenzaTuning || {}),
        },
        cappellaTuning: {
          ...FoliaStageCore.DEFAULT_SETTINGS.cappellaTuning,
          ...(payload.settings.cappellaTuning || {}),
        },
        partitaTuning: {
          ...FoliaStageCore.DEFAULT_SETTINGS.partitaTuning,
          ...(payload.settings.partitaTuning || {}),
        },
        fumeTuning: {
          ...FoliaStageCore.DEFAULT_SETTINGS.fumeTuning,
          ...(payload.settings.fumeTuning || {}),
        },
        claddaghTuning: {
          ...FoliaStageCore.DEFAULT_SETTINGS.claddaghTuning,
          ...(payload.settings.claddaghTuning || {}),
        },
        monetTuning: {
          ...FoliaStageCore.DEFAULT_SETTINGS.monetTuning,
          ...(payload.settings.monetTuning || {}),
        },
        pendoloTuning: {
          ...FoliaStageCore.DEFAULT_SETTINGS.pendoloTuning,
          ...(payload.settings.pendoloTuning || {}),
        },
        tiltTuning: {
          ...FoliaStageCore.DEFAULT_SETTINGS.tiltTuning,
          ...(payload.settings.tiltTuning || {}),
        },
        dioramaTuning: {
          ...FoliaStageCore.DEFAULT_SETTINGS.dioramaTuning,
          ...(payload.settings.dioramaTuning || {}),
          geometryVisibility: {
            ...FoliaStageCore.DEFAULT_SETTINGS.dioramaTuning.geometryVisibility,
            ...(payload.settings.dioramaTuning?.geometryVisibility || {}),
          },
        },
        temperaTuning: {
          ...FoliaStageCore.DEFAULT_SETTINGS.temperaTuning,
          ...(payload.settings.temperaTuning || {}),
          ...(importedTempera ? { layerImages: importedTempera } : {}),
        },
        sonnetTuning: {
          ...FoliaStageCore.DEFAULT_SETTINGS.sonnetTuning,
          ...(payload.settings.sonnetTuning || {}),
        },
        lumiereTuning: {
          ...FoliaStageCore.DEFAULT_SETTINGS.lumiereTuning,
          ...(payload.settings.lumiereTuning || {}),
        },
        englishTuning: {
          ...FoliaStageCore.DEFAULT_SETTINGS.englishTuning,
          ...(payload.settings.englishTuning || {}),
        },
        jizuraTuning: {
          ...FoliaStageCore.DEFAULT_SETTINGS.jizuraTuning,
          ...(payload.settings.jizuraTuning || {}),
        },
        backgroundTunings: {
          ...FoliaStageCore.DEFAULT_SETTINGS.backgroundTunings,
          ...(payload.settings.backgroundTunings || {}),
          common: { ...FoliaStageCore.DEFAULT_SETTINGS.backgroundTunings.common, ...(payload.settings.backgroundTunings?.common || {}) },
          monet: { ...FoliaStageCore.DEFAULT_SETTINGS.backgroundTunings.monet, ...(payload.settings.backgroundTunings?.monet || {}) },
          nomand: { ...FoliaStageCore.DEFAULT_SETTINGS.backgroundTunings.nomand, ...(payload.settings.backgroundTunings?.nomand || {}) },
          latent: { ...FoliaStageCore.DEFAULT_SETTINGS.backgroundTunings.latent, ...(payload.settings.backgroundTunings?.latent || {}) },
          sora: { ...FoliaStageCore.DEFAULT_SETTINGS.backgroundTunings.sora, ...(payload.settings.backgroundTunings?.sora || {}) },
          url: { ...FoliaStageCore.DEFAULT_SETTINGS.backgroundTunings.url, ...(payload.settings.backgroundTunings?.url || {}) },
        },
        backgroundAssets: {
          ...FoliaStageCore.DEFAULT_SETTINGS.backgroundAssets,
          ...(payload.settings.backgroundAssets || {}),
        },
      };
      if (!FoliaStageVisualizers.has(next.mode)) next.mode = FoliaStageCore.DEFAULT_SETTINGS.mode;
      setSettings(next);
      foliaStageNotify("Folia Stage 设置已导入");
    } catch (error) {
      foliaStageNotify(`设置导入失败：${error.message}`, true);
    }
  };
  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else rootRef.current?.requestFullscreen?.();
  };
  const resetSettings = () => {
    const confirmed = typeof window.confirm !== "function" || window.confirm("恢复 Folia Stage 初始设置？歌词、缓存和已导入资源不会被删除。");
    if (!confirmed) return;
    setSettings(JSON.parse(JSON.stringify(FoliaStageCore.DEFAULT_SETTINGS)));
    setOffset(0);
    foliaStageNotify("舞台设置已恢复初始值");
  };

  const extensionStage = lyrics && FoliaStageVisualizers.render(settings.mode, {
    playback,
    lyrics,
    activeIndex,
    timeMs,
    showTranslation: settings.showTranslation && (settings.subtitleContentMode || "translation") !== "none",
    renderLine: (line, currentTime) => h(WordLine, { line, timeMs: currentTime }),
    accent,
    theme: visualTheme,
    visible: pageVisible,
    settings: {...settings, jizuraTuning: settings.jizuraTuning},
    audioSignals,
  });
  const stage = lyrics && status === "ready"
    ? extensionStage || (settings.mode === "flow"
      ? h(FlowStage, { document: lyrics, activeIndex, timeMs, showTranslation: settings.showTranslation && (settings.subtitleContentMode || "translation") !== "none", onSeek: seek })
      : settings.mode === "poster"
        ? h(PosterStage, { playback, document: lyrics, activeIndex, timeMs, showTranslation: settings.showTranslation && (settings.subtitleContentMode || "translation") !== "none" })
        : h(FoliaFaithfulClassic.ClassicStage, {
          document: lyrics,
          activeIndex,
          timeMs,
          showTranslation: settings.showTranslation && (settings.subtitleContentMode || "translation") !== "none",
          accent,
          settings: { ...settings, pageVisible },
        }))
    : h(EmptyState, { status, errors, onImport: importLyrics, onRefresh: () => loadLyrics(true) });

  const wordCount = lyrics?.lines?.reduce((total, line) => total + (line.words?.length || 0), 0) || 0;
  const memory = performance.memory?.usedJSHeapSize
    ? `内存 ${Math.round(performance.memory.usedJSHeapSize / 1048576)} MB`
    : "内存数据不可用";
  const diagnostics = {
    renderer: FoliaStageVisualizers.modes.find((mode) => mode.id === settings.mode)?.kind || "dom",
    lines: lyrics?.lines?.length || 0,
    words: wordCount,
    memory,
  };

  return h("main", {
    ref: rootRef,
    className: `folia-stage folia-mode-${settings.mode}${settings.dimInactive ? " folia-dim-inactive" : ""}`,
    style: {
      "--folia-progress": `${progress * 100}%`,
      "--folia-scale": settings.fontScale,
      "--folia-accent": visualTheme.accentColor,
      "--folia-primary": visualTheme.primaryColor,
      "--folia-secondary": visualTheme.secondaryColor,
      "--folia-background": visualTheme.backgroundColor,
      "--folia-font-weight": visualTheme.fontWeight,
      "--folia-font-style": visualTheme.fontStyle,
      "--folia-font-family": `'${visualTheme.fontFamily.replace(/'/g, "")}', "Noto Sans SC", sans-serif`,
    },
  },
  settings.mode !== "jizura" && h("div", { className: "folia-stage__background-host" }, h(BackgroundHandover, { mode: settings.backgroundMode }, FoliaStageBackgrounds.render(settings.backgroundMode, {
    cover: playback.cover,
    accent,
    paused: playback.paused,
    visible: pageVisible,
    timeMs,
    settings,
    audioSignals,
  }))),
  h("div", { className: "folia-stage__body" },
    h(StageHandover, { mode: settings.mode }, stage),
    h("header", { className: "folia-topbar" },
      h("div", { className: "folia-toolbar" },
        lyrics && h("span", { className: "folia-source", title: `歌词来源：${lyrics.provider}` }, lyrics.provider),
        audioAnalysis === "available" && h("span", { className: "folia-audio-dot", title: "音频分析可用" }),
        h(IconButton, { label: "重新匹配歌词", onClick: () => loadLyrics(true) }, "↻"),
        h(IconButton, { label: "导入歌词", onClick: importLyrics }, "+"),
        lyrics && h(IconButton, { label: "Edit lyric segmentation", className: segmentationOpen ? "is-active" : "", onClick: () => setSegmentationOpen(true) },
          h("svg", { viewBox: "0 0 24 24", width: 19, height: 19, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
            h("path", { d: "M4 6h16M4 12h10M4 18h7" }), h("path", { d: "m17 15 3 3-3 3m3-3h-6" }))),
        h(IconButton, { label: "全屏", onClick: toggleFullscreen }, "⛶"),
        h(IconButton, { label: "设置", className: settingsOpen ? "is-active" : "", onClick: () => setSettingsOpen((open) => !open) }, "⚙"),
        h(IconButton, { label: "Version information", onClick: () => setReleaseOpen(true) }, "ⓘ"),
        h(IconButton, { className: "folia-sponsor-button", label: "Support this project", onClick: () => setSponsorOpen(true) }, "♥"),
      ),
    ),
  ),
  settingsOpen && h(SettingsPanel, {
    settings,
    setSettings,
    playback,
    updateJizuraTuning,
    audioSignals,
    offset,
    setOffset,
    lyrics,
    onImport: importLyrics,
    onRemoveLocal: removeLocal,
    onExportSettings: exportSettings,
    onImportSettings: importSettings,
    onEditSegmentation: () => setSegmentationOpen(true),
    onImportFont: importFont,
    onResetSettings: resetSettings,
    jizuraProject: {saved: Boolean(jizuraProject), dirty: Boolean(jizuraProject)&&JSON.stringify({...FoliaStageCore.DEFAULT_SETTINGS.jizuraTuning,...jizuraProject.tuning})!==JSON.stringify(settings.jizuraTuning), canUndo: jizuraHistory.past.length > 0, canRedo: jizuraHistory.future.length > 0},
    onSaveJizuraProject: saveJizuraProject,
    onExportJizuraProject: exportJizuraProject,
    onExportNativeJizuraProject: exportNativeJizuraProject,
    onImportJizuraProject: importJizuraProject,
    onRemoveJizuraProject: removeJizuraProject,
    onUndoJizura: undoJizura,
    onRedoJizura: redoJizura,
    diagnostics,
  }),
  releaseOpen && h(ReleaseInfoDialog, { onClose: () => setReleaseOpen(false) }),
  sponsorOpen && h(SponsorDialog, { onClose: () => setSponsorOpen(false) }),
  segmentationOpen && lyrics && h(SegmentationEditor, {
    uri: playback.uri,
    lyrics: rawLyrics,
    onClose: () => setSegmentationOpen(false),
    onSaved: () => setSegmentationRevision((value) => value + 1),
  }),
  h("input", {
    ref: fileInput,
    className: "folia-file-input",
    type: "file",
    accept: ".lrc,.yrc,.qrc,.ttml,.txt",
    onChange: onFile,
  }),
  h("input", {
    ref: settingsInput,
    className: "folia-file-input",
    type: "file",
    accept: ".json,application/json",
    onChange: onSettingsFile,
  }),
  h("input", { ref: jizuraProjectInput, className: "folia-file-input", type: "file", accept: ".json,application/json", onChange: onJizuraProjectFile }),
  );
}

function render() {
  return h(FoliaStage);
}
