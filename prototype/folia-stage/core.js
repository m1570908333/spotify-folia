const FoliaStageCore = (() => {
  const SETTINGS_KEY = "folia-stage:settings:v1";
  const CACHE_KEY = "folia-stage:lyrics-cache:v1";
  const LOCAL_KEY = "folia-stage:local-lyrics:v1";
  const OFFSET_KEY = "folia-stage:offsets:v1";
  const SEGMENTATION_KEY = "folia-stage:word-segmentation:v1";
  const JIZURA_PROJECT_KEY = "folia-stage:jizura-projects:v1";

  const DEFAULT_SETTINGS = {
    mode: "flow",
    fontScale: 1,
    theme: {
      primaryColor: "#f4f4f5",
      secondaryColor: "#71717a",
      backgroundColor: "#09090b",
      accentColor: "",
      fontFamily: "Spotify Mix",
      fontStyle: "sans",
      fontWeight: 700,
      animationIntensity: "normal",
      wordColors: [],
      lyricsIcons: [],
      provider: "spotify",
      description: "",
      customFont: null,
    },
    showTranslation: true,
    subtitleContentMode: "translation",
    subtitleFontScale: 1,
    subtitleOverlayOpacity: 0.72,
    subtitleOverlayBackground: true,
    subtitleUpcomingLyricsBlur: true,
    providerOrder: ["local", "spotify", "lrclib", "netease"],
    providers: { local: true, spotify: true, lrclib: true, netease: true },
    dimInactive: true,
    backgroundMode: "common",
    backgroundAssets: { customImage: null },
    backgroundTunings: {
      common: {
        useCoverColorBg: true,
        opacity: 0.75,
        disableGeometricBackground: false,
        disableVignette: false,
      },
      monet: {
        backgroundSource: "cover-derived",
        backgroundLayout: "full-overlay",
        backgroundBlurPx: 6,
        backgroundOverlayOpacity: 0.74,
        backgroundGrayscale: 0,
        backgroundSaturation: 1.05,
        backgroundWash: 0.34,
        backgroundHalfPaneOffsetX: 0,
        backgroundWashColorMode: "theme",
        backgroundWashCustomColor: "#8fb7ff",
        backgroundDriftEnabled: true,
        backgroundDriftStrength: 0.5,
        backgroundStreaksEnabled: true,
      },
      nomand: {
        imageSource: "cover-derived",
        effect: "dithering",
        ditheringType: "8x8",
        size: 3,
        colorSteps: 4,
        originalColors: false,
        inverted: false,
        flutedGlassSize: 0.5,
        flutedGlassDistortion: 0.5,
        flutedGlassBlur: 0.08,
        paperTextureContrast: 0.32,
        paperTextureRoughness: 0.42,
        paperTextureFiber: 0.3,
        halftoneDotsSize: 0.5,
        halftoneDotsRadius: 1.25,
        halftoneDotsContrast: 0.4,
        halftoneDotsOriginalColors: false,
        halftoneDotsInverted: false,
        lensDistortionSpread: 0.45,
        lensDistortionBulge: 0.3,
        lensDistortionDispersion: 0.65,
        overlayEnabled: true,
        overlayOpacity: 0.35,
      },
      latent: {
        displayMode: "both",
        colorSource: "cover-theme",
        dynamicOnlyInPlayer: true,
        enhancedBeatResponse: true,
        ditheringSpeed: 0.1,
        ditheringAudioSpeed: 1.2,
        ditheringSize: 2.5,
        ditheringOpacity: 0.55,
        meshSpeed: 0.3,
        meshAudioSpeed: 2,
        meshDistortion: 0.8,
        meshSwirl: 0.1,
        overlayEnabled: true,
        overlayOpacity: 0.35,
      },
      sora: { blank: false },
      url: { url: "", opacity: 1 },
    },
    classicTuning: {
      enableWordRotation: true,
      breathingFloatMultiplier: 1,
      useLegacyLayout: false,
      wordSpacing: 0.7,
      animationIntensity: "normal",
    },
    cadenzaTuning: {
      fontScale: 1.12,
      widthRatio: 0.72,
      motionAmount: 1,
      glowIntensity: 1,
      beamIntensity: 0,
      animationIntensity: "normal",
    },
    cappellaTuning: {
      showEmoMessages: true,
      emojiPackSource: "builtin",
      avatarSource: "cover",
      animationIntensity: "normal",
    },
    partitaTuning: {
      showGuideLines: true,
      useSemanticLayout: true,
      staggerMin: 20,
      staggerMax: 100,
      animationIntensity: "normal",
    },
    fumeTuning: {
      hidePrintSymbols: false,
      disableGeometricBackground: true,
      backgroundObjectOpacity: 0.5,
      textHoldRatio: 1,
      cameraTrackingMode: "smooth",
      cameraSpeed: 1,
      glowIntensity: 1,
      heroScale: 1,
    },
    claddaghTuning: {
      focusScaleRatio: 0.65,
      radiusScale: 1,
      ellipseTiltDeg: 45,
      showAxisLine: true,
      letterSpacingOffset: 0,
    },
    monetTuning: {
      keywordColoringEnabled: true,
      showDescription: true,
      showAudioVisualization: true,
      audioStyle: "bar",
      fontScale: 1.2,
      portraitSource: "cover",
      customPortraitImage: null,
      portraitOffsetX: 0,
      portraitStyle: "square",
      showPortraitDragHanger: true,
    },
    pendoloTuning: {
      arcRadius: 0.42,
      arcAngleDeg: 100,
      wheelCenterX: 0,
      wheelCenterY: 0.5,
      tickSnappiness: 2,
      activeScale: 1.25,
      showGearDecor: "subtle",
      showCenterGradient: true,
      showCoverOnWatchFace: false,
      enableLineGlow: false,
    },
    tiltTuning: {
      splitProbability: 0.75,
      tiltStyleProbability: 0.35,
      colorScheme: "default",
    },
    dioramaTuning: {
      cameraSpeed: 1,
      motionAmount: 1,
      audioReactivity: 1,
      geometryVisibility: { enabled: true, mode: "clouds", strands: true, blobs: true, ribbons: true, rings: true },
      particleDensity: 576,
      particleScale: 1,
      particleGlowEnabled: true,
      particleGlowIntensity: 0.65,
      showParticles: true,
      backgroundParticleCircumference: 28,
      backgroundParticleRadial: 2,
      glowEnabled: true,
      glowIntensity: 1,
      soulEnabled: true,
      soulIntensity: 1,
      soulActiveEnabled: false,
      gradientEnabled: false,
      gradientIntensity: 1,
      keywordColoringEnabled: true,
    },
    temperaTuning: {
      cameraIntensity: 1,
      glyphMotion: 1,
      wholeLineLyrics: false,
      glyphSettleStretch: 0.5,
      colorMode: "duo",
      showBlocks: true,
      showDecor: true,
      showCornerMarks: true,
      textInversion: true,
      layerImages: [],
      layerImageDepth: "back",
      layerImageFrequency: 0.6,
      enableTransitions: true,
      textureResolution: 1.5,
      postProcessEnabled: true,
      postProcessTextureCompression: false,
      postProcessGrain: 0.2,
      postProcessContrast: 0,
      postProcessRgbShift: 0,
      postProcessVignette: 0.85,
      postProcessLensDistortion: 0.3,
    },
    sonnetTuning: {
      cameraIntensity: 1,
      typographyMotion: 1,
      mgDensity: 1,
      showOnlyText: false,
      showGuide: true,
      showBackgroundMg: true,
      showFixedGeo: true,
      showGiantDecorativeText: true,
      showBackgroundDecor: true,
      enableTransitions: true,
      outerFrameMode: "full",
      textureResolution: 1.5,
      postProcessEnabled: false,
      postProcessGrain: 0.2,
      postProcessContrast: 0,
      postProcessRgbShift: 0,
      postProcessHalftone: 0,
      postProcessVignette: 0.85,
      postProcessLensDistortion: 0.3,
      postProcessLensDispersion: 0.6,
    },
    lumiereTuning: {
      lightIntensity: 1,
      audioResponse: 1,
      fogDensity: 1,
      darkField: 0.75,
      moteAmount: 1,
      bloom: 1,
      textBloom: 1,
      unlitOpacity: 0.22,
      windowNeighbors: 2,
      decay: 1,
      echo: 1,
      fogOctaves: 5,
      lineArt: true,
      frontBokeh: true,
      trails: true,
      hideTrails: false,
      seamlessTransitions: true,
      overlayFrame: true,
      textOnly: false,
      keywordColors: true,
      themeIcons: true,
      themeColorMix: 0.3,
      renderQuality: "full",
    },
    englishTuning: {
      motionAmount: 1,
      audioResponse: 1,
      beamIntensity: 1,
      particleAmount: 1,
      ghostIntensity: 1,
      cameraSpeed: 1,
      wordSpread: 1,
      showContextWords: true,
      showHud: true,
      showFullLine: true,
      animationIntensity: "normal",
    },
    jizuraTuning: {
      centerFree: false,
      centerDir: "tb",
      keyBg: "off",
      colors: { enabled: false, accentOn: false },
      fontRoles: {},
      userFonts: [],
      enabledTechniques: {},
      overrides: {},
      sourceMarkup: {},
      locks: { tech: {}, params: {} },
      nativeTheme: "lyricpv",
      nativeStyle: "",
      mood: "",
      typeset: false,
      extra: true,
      typo: true,
      kinetic: true,
      hideNo: false,
      hideTime: false,
      seed: 0,
      unify: true,
      stepped: false,
      wa: true,
      horror: false,
      flash: false,
      onlineFonts: false,
      glitch: .55,
      chroma: .7,
      texture: .6,
      bgSwitch: .35,
      techniques: {},
      cutSpeed: 1,
      beatResponse: 1,
      motionIntensity: 1,
      particleDensity: 1,
      showHud: true,
    },
  };

  function readJson(key, fallback) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key));
      return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`[FoliaStage] Failed to write ${key}`, error);
      return false;
    }
  }

  function loadSettings() {
    const saved = readJson(SETTINGS_KEY, {});
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      mode: ["cadenza", "fume", "tilt", "classic", "partita", "still"].includes(saved.mode) ? DEFAULT_SETTINGS.mode : saved.mode || DEFAULT_SETTINGS.mode,
      theme: { ...DEFAULT_SETTINGS.theme, ...(saved.theme || {}) },
      providers: { ...DEFAULT_SETTINGS.providers, ...(saved.providers || {}) },
      classicTuning: { ...DEFAULT_SETTINGS.classicTuning, ...(saved.classicTuning || {}) },
      cadenzaTuning: { ...DEFAULT_SETTINGS.cadenzaTuning, ...(saved.cadenzaTuning || {}) },
      cappellaTuning: { ...DEFAULT_SETTINGS.cappellaTuning, ...(saved.cappellaTuning || {}) },
      partitaTuning: { ...DEFAULT_SETTINGS.partitaTuning, ...(saved.partitaTuning || {}) },
      fumeTuning: { ...DEFAULT_SETTINGS.fumeTuning, ...(saved.fumeTuning || {}) },
      claddaghTuning: { ...DEFAULT_SETTINGS.claddaghTuning, ...(saved.claddaghTuning || {}) },
      monetTuning: { ...DEFAULT_SETTINGS.monetTuning, ...(saved.monetTuning || {}) },
      pendoloTuning: { ...DEFAULT_SETTINGS.pendoloTuning, ...(saved.pendoloTuning || {}) },
      tiltTuning: { ...DEFAULT_SETTINGS.tiltTuning, ...(saved.tiltTuning || {}) },
      dioramaTuning: {
        ...DEFAULT_SETTINGS.dioramaTuning,
        ...(saved.dioramaTuning || {}),
        geometryVisibility: {
          ...DEFAULT_SETTINGS.dioramaTuning.geometryVisibility,
          ...(saved.dioramaTuning?.geometryVisibility || {}),
        },
      },
      temperaTuning: { ...DEFAULT_SETTINGS.temperaTuning, ...(saved.temperaTuning || {}) },
      sonnetTuning: { ...DEFAULT_SETTINGS.sonnetTuning, ...(saved.sonnetTuning || {}) },
      lumiereTuning: { ...DEFAULT_SETTINGS.lumiereTuning, ...(saved.lumiereTuning || {}) },
      englishTuning: { ...DEFAULT_SETTINGS.englishTuning, ...(saved.englishTuning || {}) },
      jizuraTuning: { ...DEFAULT_SETTINGS.jizuraTuning, ...(saved.jizuraTuning || {}) },
      backgroundTunings: {
        ...DEFAULT_SETTINGS.backgroundTunings,
        ...(saved.backgroundTunings || {}),
        common: { ...DEFAULT_SETTINGS.backgroundTunings.common, ...(saved.backgroundTunings?.common || {}) },
        monet: { ...DEFAULT_SETTINGS.backgroundTunings.monet, ...(saved.backgroundTunings?.monet || {}) },
        nomand: { ...DEFAULT_SETTINGS.backgroundTunings.nomand, ...(saved.backgroundTunings?.nomand || {}) },
        latent: { ...DEFAULT_SETTINGS.backgroundTunings.latent, ...(saved.backgroundTunings?.latent || {}) },
        sora: { ...DEFAULT_SETTINGS.backgroundTunings.sora, ...(saved.backgroundTunings?.sora || {}) },
        url: { ...DEFAULT_SETTINGS.backgroundTunings.url, ...(saved.backgroundTunings?.url || {}) },
      },
      backgroundAssets: {
        ...DEFAULT_SETTINGS.backgroundAssets,
        ...(saved.backgroundAssets || {}),
      },
      providerOrder: Array.isArray(saved.providerOrder) ? saved.providerOrder : DEFAULT_SETTINGS.providerOrder,
    };
  }

  function saveSettings(settings) {
    writeJson(SETTINGS_KEY, settings);
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFKC")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeMatchText(value) {
    return normalizeText(value)
      .toLowerCase()
      .replace(/\([^)]*(?:live|remaster|version|版|伴奏|翻唱)[^)]*\)/gi, "")
      .replace(/[\s\-_/·•.,，。!！?？'"“”‘’]/g, "");
  }

  function parseTimeMs(value) {
    const text = String(value || "").trim();
    if (!text) return null;
    if (/^\d+(?:\.\d+)?ms$/i.test(text)) return Number.parseFloat(text);
    if (/^\d+(?:\.\d+)?s$/i.test(text)) return Number.parseFloat(text) * 1000;
    if (/^\d+(?:\.\d+)?$/.test(text)) return Number.parseFloat(text) * 1000;

    const parts = text.split(":").map(Number);
    if (parts.some((part) => !Number.isFinite(part))) return null;
    if (parts.length === 2) return (parts[0] * 60 + parts[1]) * 1000;
    if (parts.length === 3) return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
    return null;
  }

  function finalizeLines(input, durationMs = 0) {
    const lines = input
      .filter((line) => line && normalizeText(line.text || line.words?.map((word) => word.text).join("")))
      .map((line) => ({
        ...line,
        startMs: Math.max(0, Number(line.startMs) || 0),
        text: normalizeText(line.text || line.words?.map((word) => word.text).join("")),
        translation: normalizeText(line.translation || ""),
        words: Array.isArray(line.words)
          ? line.words
              .filter((word) => word && normalizeText(word.text))
              .map((word) => ({
                ...word,
                text: String(word.text),
                startMs: Math.max(0, Number(word.startMs) || 0),
                endMs: Math.max(0, Number(word.endMs) || Number(word.startMs) || 0),
              }))
          : [],
      }))
      .sort((left, right) => left.startMs - right.startMs);

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const nextStart = lines[index + 1]?.startMs;
      const inferredEnd = Number.isFinite(nextStart)
        ? Math.max(line.startMs + 500, nextStart)
        : Math.max(line.startMs + 3000, durationMs || line.startMs + 5000);
      line.endMs = Math.max(line.startMs + 100, Number(line.endMs) || inferredEnd);

      if (line.words.length) {
        for (let wordIndex = 0; wordIndex < line.words.length; wordIndex += 1) {
          const word = line.words[wordIndex];
          const nextWord = line.words[wordIndex + 1];
          word.endMs = Math.min(
            line.endMs,
            Math.max(word.startMs + 40, word.endMs || nextWord?.startMs || line.endMs),
          );
        }
      }
    }

    return lines;
  }

  function makeDocument({ provider, sourceKind, lines, durationMs, copyright = "", raw = "" }) {
    const finalized = finalizeLines(lines || [], durationMs);
    const hasWords = finalized.some((line) => line.words.length > 0);
    const hasTiming = finalized.some((line) => line.startMs > 0);
    return {
      provider,
      sourceKind: hasWords ? "word" : hasTiming ? "line" : sourceKind || "plain",
      lines: finalized,
      copyright: normalizeText(copyright),
      raw,
      loadedAt: Date.now(),
    };
  }

  function parseEnhancedWords(content, lineStartMs, lineEndMs) {
    const matches = [...String(content).matchAll(/<([0-9:.]+)>\s*([^<]+)/g)];
    if (!matches.length) return [];

    const starts = matches.map((match) => parseTimeMs(match[1])).filter(Number.isFinite);
    const timestampsLookAbsolute = starts.some((time) => time >= lineStartMs - 100);
    return matches.map((match, index) => {
      const parsed = parseTimeMs(match[1]);
      const startMs = timestampsLookAbsolute ? parsed : lineStartMs + parsed;
      const nextParsed = matches[index + 1] ? parseTimeMs(matches[index + 1][1]) : null;
      const nextStart = Number.isFinite(nextParsed)
        ? timestampsLookAbsolute ? nextParsed : lineStartMs + nextParsed
        : lineEndMs;
      return { text: match[2], startMs, endMs: nextStart };
    });
  }

  function parseLrc(text, durationMs = 0) {
    const source = String(text || "").replace(/^\uFEFF/, "");
    const offsetMatch = source.match(/^\[offset:([+-]?\d+)\]/im);
    const fileOffset = offsetMatch ? Number(offsetMatch[1]) : 0;
    const rows = [];

    for (const rawLine of source.split(/\r?\n/)) {
      const stamps = [...rawLine.matchAll(/\[([0-9]{1,3}:[0-9]{1,2}(?:[.:][0-9]{1,3})?)\]/g)];
      if (!stamps.length) continue;
      const content = rawLine.replace(/\[[^\]]+\]/g, "").trim();
      if (!content) continue;
      for (const stamp of stamps) {
        const startMs = Math.max(0, parseTimeMs(stamp[1].replace(/(\d+:\d+)\.(\d+)/, "$1.$2")) + fileOffset);
        rows.push({ startMs, text: content.replace(/<[^>]+>/g, "").trim(), enhanced: content });
      }
    }

    rows.sort((left, right) => left.startMs - right.startMs);
    const lines = rows.map((row, index) => {
      const endMs = rows[index + 1]?.startMs || durationMs || row.startMs + 5000;
      return {
        startMs: row.startMs,
        endMs,
        text: row.text,
        words: parseEnhancedWords(row.enhanced, row.startMs, endMs),
      };
    });

    if (!lines.length) {
      const plainLines = source
        .split(/\r?\n/)
        .map(normalizeText)
        .filter((line) => line && !/^\[[a-z]+:/i.test(line));
      return makeDocument({ provider: "local", sourceKind: "plain", lines: plainLines.map((line) => ({ text: line })), durationMs, raw: source });
    }

    return makeDocument({ provider: "local", sourceKind: "line", lines, durationMs, raw: source });
  }

  function parseNeteaseWordLyrics(text, durationMs = 0) {
    const lines = [];
    for (const rawLine of String(text || "").split(/\r?\n/)) {
      const lineMatch = rawLine.match(/^\[(\d+),(\d+)\](.*)$/);
      if (!lineMatch) continue;
      const lineStart = Number(lineMatch[1]);
      const lineDuration = Number(lineMatch[2]);
      const content = lineMatch[3];
      const words = [];
      const pattern = /\((\d+),(\d+)(?:,\d+)?\)([^()]*)/g;
      let match;
      let sequentialStart = lineStart;
      while ((match = pattern.exec(content))) {
        const rawStart = Number(match[1]);
        const wordDuration = Math.max(40, Number(match[2]));
        const startMs = rawStart >= lineStart ? rawStart : rawStart > 0 ? lineStart + rawStart : sequentialStart;
        words.push({ text: match[3], startMs, endMs: startMs + wordDuration });
        sequentialStart = startMs + wordDuration;
      }
      if (words.length) {
        lines.push({
          startMs: lineStart,
          endMs: lineStart + lineDuration,
          text: words.map((word) => word.text).join(""),
          words,
        });
      }
    }
    return makeDocument({ provider: "netease", sourceKind: "word", lines, durationMs, raw: text });
  }

  function parseTtml(text, durationMs = 0) {
    const xml = new DOMParser().parseFromString(String(text || ""), "application/xml");
    if (xml.querySelector("parsererror")) throw new Error("Invalid TTML file");
    const paragraphs = [...xml.querySelectorAll("p")];
    const lines = paragraphs.map((paragraph) => {
      const startMs = parseTimeMs(paragraph.getAttribute("begin")) || 0;
      const endMs = parseTimeMs(paragraph.getAttribute("end")) || 0;
      const spans = [...paragraph.querySelectorAll("span[begin], span[data-start], span[data-begin]")];
      const words = spans.map((span) => ({
        text: span.textContent || "",
        startMs: parseTimeMs(span.getAttribute("begin") || span.getAttribute("data-start")) || startMs,
        endMs: parseTimeMs(span.getAttribute("end") || span.getAttribute("data-end")) || endMs,
      }));
      return { startMs, endMs, text: paragraph.textContent || "", words };
    });
    if (!lines.length) {
      const fallback = [...xml.querySelectorAll("div[begin], div[data-start], line[begin], line[data-start]")].map((line) => ({
        startMs: parseTimeMs(line.getAttribute("begin") || line.getAttribute("data-start")) || 0,
        endMs: parseTimeMs(line.getAttribute("end") || line.getAttribute("data-end")) || 0,
        text: (line.textContent || "").trim(),
        words: [],
      })).filter((line) => line.text);
      return makeDocument({ provider: "local", sourceKind: "line", lines: fallback, durationMs, raw: text });
    }
    return makeDocument({ provider: "local", sourceKind: "word", lines, durationMs, raw: text });
  }

  function parseLyricsFile(name, text, durationMs = 0) {
    const extension = String(name || "").split(".").pop().toLowerCase();
    if (extension === "ttml" || /^\s*<\?xml|<tt[\s>]/i.test(text)) return parseTtml(text, durationMs);
    if (extension === "yrc" || extension === "qrc" || /^\[\d+,\d+\]\(/m.test(text)) {
      const parsed = parseNeteaseWordLyrics(text, durationMs);
      if (parsed.lines.length) return { ...parsed, provider: "local" };
    }
    return parseLrc(text, durationMs);
  }

  let parserWorkerPromise = null;
  let parserRequestId = 0;

  function workerScriptUrl() {
    return new URL("/custom_apps/folia-stage/assets/lyricsParser.worker-2bb3W2Wd.js", location.origin).href;
  }

  async function getLyricsParserWorker() {
    if (typeof Worker === "undefined") throw new Error("Lyrics parser worker unavailable");
    if (!parserWorkerPromise) {
      parserWorkerPromise = Promise.resolve().then(() => new Worker(workerScriptUrl()));
    }
    return parserWorkerPromise;
  }

  function convertWorkerLines(result, durationMs) {
    const lines = (result?.lines || []).map((line) => {
      const lineStartMs = Math.round(Number(line.startTime || 0) * 1000);
      const lineEndMs = Math.round(Number(line.endTime || 0) * 1000);
      const rawWords = (line.words || []).map((word) => ({
        text: word.text || "",
        startMs: Math.round(Number(word.startTime || 0) * 1000),
        endMs: Math.round(Number(word.endTime || 0) * 1000),
        background: Boolean(word.isBackground || word.background),
      }));
      const relativeWords = rawWords.length > 0
        && rawWords.every((word) => word.startMs < lineStartMs)
        && rawWords[rawWords.length - 1].endMs <= Math.max(lineEndMs - lineStartMs, 0);
      const words = rawWords.map((word) => relativeWords
        ? { ...word, startMs: word.startMs + lineStartMs, endMs: word.endMs + lineStartMs }
        : word);
      return {
      startMs: lineStartMs,
      endMs: lineEndMs,
      text: line.fullText || line.text || line.words?.map((word) => word.text).join("") || "",
      translation: line.translation || "",
      romanization: line.romanization || "",
      alternateTexts: line.alternateTexts || line.alternatives || undefined,
      songPart: line.songPart || line.songPartName || undefined,
      isChorus: Boolean(line.isChorus || line.chorus),
      agentId: line.agentId || line.agent || undefined,
      renderHints: line.renderHints,
      words,
    }; });
    return makeDocument({ provider: "local", sourceKind: result?.isWordByWord ? "word" : "line", lines, durationMs, raw: "" });
  }

  async function parseLyricsFileWithWorker(name, text, durationMs = 0, options = {}) {
    const extension = String(name || "").split(".").pop().toLowerCase();
    const format = options.format || ({ yrc: "yrc", qrc: "qrc", krc: "krc", awlrc: "awlrc", vtt: "vtt", ttml: "ttml" }[extension] || (/<tt[\s>]/i.test(text) ? "ttml" : "lrc"));
    if (format === "lrc" && !options.forceWorker) return parseLyricsFile(name, text, durationMs);
    const worker = await getLyricsParserWorker();
    const requestId = ++parserRequestId;
    return new Promise((resolve, reject) => {
      const onMessage = (event) => {
        if (event.data?.requestId !== requestId) return;
        worker.removeEventListener("message", onMessage);
        if (event.data.type === "error") reject(new Error(event.data.message || "Lyrics parser failed"));
        else resolve(convertWorkerLines(event.data.data, durationMs));
      };
      worker.addEventListener("message", onMessage);
      worker.postMessage({ type: "parse", format, content: String(text || ""), translation: options.translation || "", romanization: options.romanization || "", options: options.parserOptions || {}, requestId });
    });
  }

  function mergeTranslation(document, translationLines) {
    if (!document?.lines?.length || !translationLines?.length) return document;
    const translations = [...translationLines];
    return {
      ...document,
      lines: document.lines.map((line) => {
        const match = translations.find((candidate) => Math.abs(candidate.startMs - line.startMs) <= 250);
        return match ? { ...line, translation: match.text } : line;
      }),
    };
  }

  function findActiveLine(lines, timeMs) {
    if (!Array.isArray(lines) || !lines.length) return -1;
    let low = 0;
    let high = lines.length - 1;
    let answer = -1;
    while (low <= high) {
      const middle = Math.floor((low + high) / 2);
      if (lines[middle].startMs <= timeMs) {
        answer = middle;
        low = middle + 1;
      } else {
        high = middle - 1;
      }
    }
    return answer;
  }

  function getCache() {
    return readJson(CACHE_KEY, {});
  }

  function getCachedLyrics(uri) {
    return getCache()[uri] || null;
  }

  function setCachedLyrics(uri, document) {
    const cache = getCache();
    cache[uri] = document;
    const entries = Object.entries(cache).sort((left, right) => (right[1]?.loadedAt || 0) - (left[1]?.loadedAt || 0));
    writeJson(CACHE_KEY, Object.fromEntries(entries.slice(0, 40)));
  }

  function getLocalLyrics(uri) {
    return readJson(LOCAL_KEY, {})[uri] || null;
  }

  function setLocalLyrics(uri, document) {
    const all = readJson(LOCAL_KEY, {});
    all[uri] = { ...document, provider: "local", loadedAt: Date.now() };
    writeJson(LOCAL_KEY, all);
  }

  function removeLocalLyrics(uri) {
    const all = readJson(LOCAL_KEY, {});
    delete all[uri];
    writeJson(LOCAL_KEY, all);
  }

  function getOffset(uri) {
    return Number(readJson(OFFSET_KEY, {})[uri]) || 0;
  }

  function setOffset(uri, value) {
    const offsets = readJson(OFFSET_KEY, {});
    offsets[uri] = Math.max(-10000, Math.min(10000, Math.round(Number(value) || 0)));
    writeJson(OFFSET_KEY, offsets);
    return offsets[uri];
  }

  function cloneJson(value) {
    return JSON.parse(JSON.stringify(value == null ? {} : value));
  }

  function getJizuraProject(uri) {
    if (!uri) return null;
    const all = readJizuraProjects();
    return Object.hasOwn(all, uri) ? all[uri] : null;
  }

  function setJizuraProject(uri, project) {
    if (typeof uri !== "string" || !uri || ["__proto__", "constructor", "prototype"].includes(uri) || !project || typeof project !== "object" || !project.tuning || typeof project.tuning !== "object" || Array.isArray(project.tuning)) throw new Error("JIZURA 工程缺少有效设置或歌曲");
    validateProjectData(project);
    const all = readJizuraProjects();
    all[uri] = { ...cloneJson(project), songKey: uri, updatedAt: Date.now() };
    if (!writeJson(JIZURA_PROJECT_KEY, all)) throw new Error("工程保存失败，请检查本地存储空间");
    return all[uri];
  }

  function removeJizuraProject(uri) {
    const all = readJizuraProjects();
    delete all[uri];
    if (!writeJson(JIZURA_PROJECT_KEY, all)) throw new Error("工程删除失败，请检查本地存储空间");
  }

  function exportJizuraProject(uri) {
    const project = getJizuraProject(uri);
    if (!project) throw new Error("当前歌曲还没有 JIZURA 工程");
    return { format: "folia-stage-jizura-project", version: 1, songKey: uri, exportedAt: Date.now(), project };
  }

  function readJizuraProjects() {
    const saved = readJson(JIZURA_PROJECT_KEY, {});
    return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  }

  function importJizuraProject(uri, payload) {
    if (!payload || payload.format !== "folia-stage-jizura-project" || payload.version !== 1 || !payload.project) {
      throw new Error("JIZURA 工程文件格式无效");
    }
    validateProjectData(payload.project);
    const project = cloneJson(payload.project);
    delete project.updatedAt;
    return setJizuraProject(uri, project);
  }

  function validateProjectData(value, depth = 0) {
    if (depth > 32) throw new Error("JIZURA 工程嵌套过深");
    if (typeof value === "number" && !Number.isFinite(value)) throw new Error("JIZURA 工程含无效数值");
    if (value && typeof value === "object") for (const key of Object.keys(value)) {
      if (["__proto__", "constructor", "prototype"].includes(key)) throw new Error("JIZURA 工程含不安全字段");
      validateProjectData(value[key], depth + 1);
    }
  }

  function getSegmentationLineKey(line) {
    return `${Math.round(Number(line?.startMs) || 0)}|${String(line?.text || "")}`;
  }

  function isValidWordSegmentation(text, segments) {
    return Array.isArray(segments)
      && segments.length > 0
      && segments.every((segment) => typeof segment === "string" && segment.length > 0)
      && segments.join("") === String(text || "");
  }

  function defaultWordSegments(text) {
    const source = String(text || "");
    if (!source) return [];
    if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
      try {
        return Array.from(new Intl.Segmenter(undefined, { granularity: "word" }).segment(source), ({ segment }) => segment);
      } catch {}
    }
    return Array.from(source);
  }

  function getWordSegmentation(uri) {
    const record = readJson(SEGMENTATION_KEY, {})[uri];
    if (!record || record.version !== 1 || typeof record.lines !== "object") return null;
    return record;
  }

  function saveWordSegmentation(uri, lines, source = "manual") {
    if (!uri) return null;
    const all = readJson(SEGMENTATION_KEY, {});
    const record = {
      version: 1,
      songKey: uri,
      updatedAt: Date.now(),
      source: source === "ai" ? "ai" : "manual",
      lines: { ...(lines || {}) },
    };
    all[uri] = record;
    writeJson(SEGMENTATION_KEY, all);
    return record;
  }

  function removeWordSegmentation(uri) {
    const all = readJson(SEGMENTATION_KEY, {});
    delete all[uri];
    writeJson(SEGMENTATION_KEY, all);
  }

  function exportWordSegmentations() {
    return { version: 1, records: readJson(SEGMENTATION_KEY, {}) };
  }

  function importWordSegmentations(payload, replace = false) {
    if (!payload || typeof payload !== "object" || !payload.records || typeof payload.records !== "object") {
      throw new Error("分词备份格式无效");
    }
    const current = replace ? {} : readJson(SEGMENTATION_KEY, {});
    Object.entries(payload.records).forEach(([uri, record]) => {
      if (!uri || !record || record.version !== 1 || !record.lines || typeof record.lines !== "object") return;
      current[uri] = record;
    });
    writeJson(SEGMENTATION_KEY, current);
    return current;
  }

  function buildWordSegmentationPayload(uri, lyrics) {
    const lines = Array.isArray(lyrics?.lines) ? lyrics.lines : [];
    const record = getWordSegmentation(uri);
    return {
      format: "folia-stage-word-segmentation",
      version: 1,
      songKey: uri,
      exportedAt: Date.now(),
      lines: lines.map((line) => {
        const key = getSegmentationLineKey(line);
        const saved = record?.lines?.[key];
        const explicit = Array.isArray(line.segments)
          ? line.segments
          : Array.isArray(line.wordSegments)
            ? line.wordSegments
            : Array.isArray(line.words) && line.words.every((word) => typeof word === "string")
              ? line.words
              : null;
        const segments = isValidWordSegmentation(line.text, explicit)
          ? explicit
          : isValidWordSegmentation(line.text, saved)
            ? saved
            : defaultWordSegments(line.text);
        return {
          key,
          startMs: Number(line.startMs) || 0,
          text: String(line.text || ""),
          segments: [...segments],
        };
      }),
    };
  }

  function parseWordSegmentationPayload(payload, uri, lyrics) {
    if (!payload || typeof payload !== "object") throw new Error("分词文件格式无效");
    if (payload.format && payload.format !== "folia-stage-word-segmentation") {
      throw new Error("不是 Folia Stage 分词文件");
    }
    if (payload.songKey && uri && payload.songKey !== uri) {
      throw new Error("分词文件不属于当前歌曲");
    }
    const sourceLines = Array.isArray(payload.lines) ? payload.lines : [];
    const targetLines = Array.isArray(lyrics?.lines) ? lyrics.lines : [];
    const result = {};
    let matched = 0;
    sourceLines.forEach((source, index) => {
      const target = source.key
        ? targetLines.find((line) => getSegmentationLineKey(line) === source.key)
        : targetLines[index];
      if (!target || String(source.text || target.text) !== String(target.text || "")) return;
      const segments = Array.isArray(source.segments) ? source.segments.map(String) : [];
      if (!isValidWordSegmentation(target.text, segments)) return;
      result[getSegmentationLineKey(target)] = segments;
      matched += 1;
    });
    if (!matched && sourceLines.length) throw new Error("没有找到可匹配的歌词行");
    return result;
  }

  function buildWordSegmentationText(lyrics) {
    const payload = buildWordSegmentationPayload("", lyrics);
    return payload.lines.map((line) => `[${formatTimeTag(line.startMs)}]${line.segments.join("/")}`).join("\n");
  }

  function formatTimeTag(milliseconds) {
    const total = Math.max(0, Number(milliseconds) || 0) / 1000;
    const minutes = Math.floor(total / 60);
    const seconds = (total - minutes * 60).toFixed(3).padStart(6, "0");
    return `${String(minutes).padStart(2, "0")}:${seconds}`;
  }

  function parseWordSegmentationText(text, uri, lyrics) {
    const source = String(text || "").replace(/^\uFEFF/, "").trim();
    if (!source) throw new Error("分词文件为空");
    try {
      return parseWordSegmentationPayload(JSON.parse(source), uri, lyrics);
    } catch (error) {
      if (/不是 Folia|不属于当前|没有找到|格式无效/.test(error.message)) throw error;
    }
    const targetLines = Array.isArray(lyrics?.lines) ? lyrics.lines : [];
    const result = {};
    let matched = 0;
    source.split(/\r?\n/).forEach((raw, index) => {
      if (!raw.trim()) return;
      const match = raw.match(/^\s*(?:\[(\d{1,3}):(\d{2})(?:\.(\d{1,3}))?\])?(.+)$/);
      if (!match) return;
      const fraction = (match[3] || "").padEnd(3, "0");
      const startMs = match[1]
        ? (Number(match[1]) * 60 + Number(match[2]) + Number(`0.${fraction || "0"}`)) * 1000
        : null;
      const content = match[4].trim();
      const segments = content.split("/").filter(Boolean);
      const target = startMs === null
        ? targetLines[index]
        : targetLines.find((line) => Math.abs((Number(line.startMs) || 0) - startMs) < 120);
      if (!target || !isValidWordSegmentation(target.text, segments)) return;
      result[getSegmentationLineKey(target)] = segments;
      matched += 1;
    });
    if (!matched) throw new Error("没有找到可匹配的 slash-text 歌词行");
    return result;
  }

  function buildSourceRanges(line) {
    const text = String(line?.text || "");
    const words = Array.isArray(line?.words) ? line.words : [];
    const ranges = [];
    let cursor = 0;
    for (const word of words) {
      const token = String(word?.text || "");
      if (!token) continue;
      let start = text.indexOf(token, cursor);
      if (start < 0 && text.slice(cursor, cursor + token.length) === token) start = cursor;
      if (start < 0) return [];
      ranges.push({
        start,
        end: start + token.length,
        startMs: Number(word.startMs) || Number(line.startMs) || 0,
        endMs: Number(word.endMs) || Number(word.startMs) || Number(line.endMs) || 0,
      });
      cursor = start + token.length;
    }
    return ranges;
  }

  function mapSegmentsToTiming(line, segments) {
    const lineStart = Number(line?.startMs) || 0;
    const lineEnd = Math.max(lineStart + 100, Number(line?.endMs) || lineStart + 3000);
    const text = String(line?.text || "");
    const ranges = buildSourceRanges(line);
    let cursor = 0;
    return segments.map((segment, index) => {
      const start = cursor;
      const end = start + segment.length;
      cursor = end;
      const overlaps = ranges.filter((range) => range.end > start && range.start < end);
      if (overlaps.length) {
        const first = overlaps[0];
        const last = overlaps[overlaps.length - 1];
        const startRatio = Math.max(0, Math.min(1, (start - first.start) / Math.max(1, first.end - first.start)));
        const endRatio = Math.max(0, Math.min(1, (end - last.start) / Math.max(1, last.end - last.start)));
        const startMs = first.startMs + (first.endMs - first.startMs) * startRatio;
        const endMs = last.startMs + (last.endMs - last.startMs) * endRatio;
        return { text: segment, startMs, endMs: Math.max(startMs + 40, endMs) };
      }
      const startMs = lineStart + (lineEnd - lineStart) * start / Math.max(1, text.length);
      const endMs = lineStart + (lineEnd - lineStart) * end / Math.max(1, text.length);
      return { text: segment, startMs, endMs: Math.max(startMs + 40, endMs) };
    }).map((word, index, words) => ({
      ...word,
      startMs: index ? Math.max(words[index - 1].startMs, word.startMs) : word.startMs,
      endMs: Math.min(lineEnd, word.endMs),
    }));
  }

  function applyWordSegmentation(document, uri) {
    const record = getWordSegmentation(uri);
    if (!document || !record) return document;
    let changed = false;
    const lines = document.lines.map((line) => {
      const segments = record.lines[getSegmentationLineKey(line)];
      if (!isValidWordSegmentation(line.text, segments)) return line;
      changed = true;
      return {
        ...line,
        words: mapSegmentsToTiming(line, segments),
        wordSegments: [...segments],
      };
    });
    return changed ? { ...document, lines, segmentation: record } : document;
  }

  return {
    DEFAULT_SETTINGS,
    loadSettings,
    saveSettings,
    normalizeText,
    normalizeMatchText,
    parseTimeMs,
    finalizeLines,
    makeDocument,
    parseLrc,
    parseNeteaseWordLyrics,
    parseTtml,
    parseLyricsFile,
    parseLyricsFileWithWorker,
    mergeTranslation,
    findActiveLine,
    getCachedLyrics,
    setCachedLyrics,
    getLocalLyrics,
    setLocalLyrics,
    removeLocalLyrics,
    getOffset,
    setOffset,
    getJizuraProject,
    setJizuraProject,
    removeJizuraProject,
    exportJizuraProject,
    importJizuraProject,
    getSegmentationLineKey,
    isValidWordSegmentation,
    defaultWordSegments,
    getWordSegmentation,
    saveWordSegmentation,
    removeWordSegmentation,
    exportWordSegmentations,
    importWordSegmentations,
    buildWordSegmentationPayload,
    parseWordSegmentationPayload,
    buildWordSegmentationText,
    parseWordSegmentationText,
    applyWordSegmentation,
  };
})();
