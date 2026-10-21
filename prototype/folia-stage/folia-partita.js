const FoliaFaithfulPartita = (() => {
  const React = Spicetify.React;
  const { useEffect, useMemo, useState } = React;
  const h = React.createElement;
  const CJK = /[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/;
  const APOSTROPHE_ONLY = /^['’]\s*$/;
  const CONTRACTION_SUFFIX = /^(s|t|m|d|ll|re|ve|em)\s*$/i;
  const DIRECT_CONTRACTION = /^['’](s|t|m|d|ll|re|ve|em)\s*$/i;
  const TRAILING_APOSTROPHE = /['’]\s*$/;
  const TRAILING_WORD = /[\p{L}\p{N}]$/u;
  const STICKY_PUNCTUATION = /^[,.;:!?，。！？、：；）】》」』〉〕］)}\]"'’”’]+$/u;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function resolveTuning(tuning = {}) {
    const rawMin = Number.isFinite(tuning.staggerMin) ? clamp(tuning.staggerMin, 0, 180) : 20;
    const rawMax = Number.isFinite(tuning.staggerMax) ? clamp(tuning.staggerMax, 0, 180) : 100;
    return {
      showGuideLines: tuning.showGuideLines !== false,
      useSemanticLayout: tuning.useSemanticLayout !== false,
      staggerMin: Math.min(rawMin, rawMax),
      staggerMax: Math.max(rawMin, rawMax),
    };
  }

  function singleWordUnits(words) {
    return words.map((word) => ({
      text: word.text,
      words: [word],
      startMs: word.startMs,
      endMs: word.endMs,
      isSemantic: false,
      isSticky: false,
    }));
  }

  function semanticUnits(line, words) {
    if (line?.wordSegments?.length) {
      return words.map((word) => ({
        text: word.text,
        words: [word],
        startMs: word.startMs,
        endMs: word.endMs,
        isSemantic: CJK.test(word.text) && Array.from(word.text).length > 1,
        isSticky: false,
      }));
    }
    if (!line.text || !CJK.test(line.text) || typeof Intl.Segmenter !== "function") return singleWordUnits(words);
    const segments = Array.from(new Intl.Segmenter(undefined, { granularity: "word" }).segment(line.text));
    const units = [];
    let wordIndex = 0;
    for (const segment of segments) {
      if (!segment.segment || /^\s+$/.test(segment.segment)) continue;
      const start = wordIndex;
      let collected = "";
      while (wordIndex < words.length && collected.length < segment.segment.length) {
        collected += words[wordIndex].text;
        wordIndex += 1;
        if (!segment.segment.startsWith(collected)) return singleWordUnits(words);
      }
      if (collected !== segment.segment) return singleWordUnits(words);
      const grouped = words.slice(start, wordIndex);
      if (!grouped.length) return singleWordUnits(words);
      if (segment.isWordLike === false && units.length) {
        const previous = units[units.length - 1];
        previous.text += segment.segment;
        previous.words.push(...grouped);
        previous.endMs = grouped[grouped.length - 1].endMs;
      } else {
        units.push({
          text: segment.segment,
          words: grouped,
          startMs: grouped[0].startMs,
          endMs: grouped[grouped.length - 1].endMs,
          isSemantic: Boolean(segment.isWordLike !== false && CJK.test(segment.segment) && grouped.length > 1),
          isSticky: false,
        });
      }
    }
    return wordIndex === words.length && units.length ? units : singleWordUnits(words);
  }

  function applySticky(units) {
    const merged = [];
    const append = (target, source) => {
      target.text += source.text;
      target.words.push(...source.words);
      target.endMs = source.endMs;
      target.isSticky = true;
    };
    for (let index = 0; index < units.length; index += 1) {
      const current = { ...units[index], words: [...units[index].words] };
      const previous = merged[merged.length - 1];
      if (!previous) {
        merged.push(current);
        continue;
      }
      const next = units[index + 1];
      const attachable = TRAILING_WORD.test(previous.text.trimEnd());
      if (APOSTROPHE_ONLY.test(current.text.trim()) && next && attachable && CONTRACTION_SUFFIX.test(next.text.trim())) {
        append(previous, current);
        append(previous, next);
        index += 1;
      } else if (DIRECT_CONTRACTION.test(current.text.trim()) && attachable) {
        append(previous, current);
      } else if (CONTRACTION_SUFFIX.test(current.text.trim()) && TRAILING_APOSTROPHE.test(previous.text.trimEnd())) {
        append(previous, current);
      } else if (STICKY_PUNCTUATION.test(current.text.trim()) && attachable) {
        append(previous, current);
      } else {
        merged.push(current);
      }
    }
    return merged;
  }

  function displayWords(units) {
    return units.flatMap((unit) => unit.isSticky && !unit.isSemantic
      ? [{ text: unit.text, startMs: unit.startMs, endMs: unit.endMs }]
      : unit.words);
  }

  function buildLayout(line, windowHeight, rawTuning = {}, intensity = "normal") {
    const tuning = resolveTuning(rawTuning);
    const words = FoliaFaithfulClassic.normalizeWords(line);
    const totalGraphemes = Math.max(FoliaFaithfulClassic.splitGraphemes(String(line.text || "").replace(/\s+/g, "")).length, words.length, 1);
    const baseUnits = tuning.useSemanticLayout ? semanticUnits(line, words) : singleWordUnits(words);
    const units = applySticky(baseUnits);
    const availableHeight = windowHeight * 0.65;
    const targetRows = Math.max(1, Math.floor(availableHeight / 100));
    const actualRows = Math.min(units.length, targetRows);
    if (!actualRows) return { chunks: [], totalGraphemes, perspective: 1000 };

    let seed = (Number(line.startMs) || 0) / 1000;
    const random = () => {
      const value = Math.sin(seed++) * 10000;
      return value - Math.floor(value);
    };
    const chunkUnits = [];
    let remainingUnits = units.length;
    let remainingChunks = actualRows;
    let unitIndex = 0;
    for (let row = 0; row < actualRows; row += 1) {
      const last = row === actualRows - 1;
      const average = remainingUnits / remainingChunks;
      let length = last ? remainingUnits : Math.max(1, Math.min(Math.ceil(average * 1.5), Math.round(average + (random() - 0.5) * average)));
      length = Math.max(1, Math.min(length, remainingUnits - (remainingChunks - 1)));
      chunkUnits.push(units.slice(unitIndex, unitIndex + length));
      unitIndex += length;
      remainingUnits -= length;
      remainingChunks -= 1;
    }

    const calm = intensity === "calm";
    const chaotic = intensity === "chaotic";
    const chunks = chunkUnits.flatMap((rowUnits, rowIndex) => {
      const rawWords = rowUnits.flatMap((unit) => unit.words);
      if (!rawWords.length) return [];
      const visibleWords = displayWords(rowUnits);
      const graphemes = FoliaFaithfulClassic.splitGraphemes(rawWords.map((word) => word.text.trim()).join("").replace(/\s+/g, "")).length;
      const rowBias = rowIndex - (actualRows - 1) / 2;
      const left = rowIndex % 2 === 0;
      const magnitude = tuning.staggerMin + random() * Math.max(tuning.staggerMax - tuning.staggerMin, 0);
      const staggerScale = calm ? 1 : 0.8 + random() * 0.9;
      return [{
        id: `${rowIndex}-${rawWords[0].startMs}`,
        rawWords,
        displayWords: visibleWords,
        rowIndex,
        config: {
          x: left ? -magnitude : magnitude,
          y: calm ? 0 : rowBias * 2.5,
          rotate: chaotic ? (left ? -3 : 3) : 0,
          scale: (chaotic ? 1 + Math.min(graphemes * 0.01, 0.05) : 1) * staggerScale,
          marginBottom: chaotic ? "0.4rem" : "0.6rem",
        },
      }];
    });
    return { chunks, totalGraphemes, perspective: chaotic ? 720 : 1000 };
  }

  function getChunkStatus(chunk, timeMs, profile) {
    const start = chunk.rawWords[0].startMs;
    const end = FoliaFaithfulClassic.getActiveEndMs(chunk.rawWords[chunk.rawWords.length - 1], profile);
    if (timeMs >= start - profile.wordLookaheadMs && timeMs <= end) return "active";
    return timeMs > end ? "passed" : "waiting";
  }

  function wordConfig(chunk, word, index, intensity) {
    const seed = word.startMs / 1000 + index * 7.13;
    const random = (offset) => {
      const value = Math.sin(seed + offset) * 10000;
      return value - Math.floor(value);
    };
    const calm = intensity === "calm";
    const chaotic = intensity === "chaotic";
    const spread = chaotic ? 15 : calm ? 0 : 6;
    const rotate = chaotic ? 8 : calm ? 0 : 3;
    return {
      id: `${chunk.id}-w${index}`,
      x: (random(1) - 0.5) * spread * 2,
      y: (random(2) - 0.5) * spread * 2,
      rotate: (random(3) - 0.5) * rotate * 2,
      scale: chunk.config.scale,
      marginRight: "0.8rem",
      alignSelf: "auto",
      passedRotate: (random(8) - 0.5) * 20,
    };
  }

  function PartitaChunk({ chunk, timeMs, profile, intensity, accent, tuning, fontSize, isChorus }) {
    const status = getChunkStatus(chunk, timeMs, profile);
    const left = chunk.rowIndex % 2 === 0;
    const waitingX = chunk.config.x + (left ? -40 : 40);
    const start = chunk.rawWords[0]?.startMs || chunk.startMs;
    const end = chunk.rawWords[chunk.rawWords.length - 1]?.endMs || chunk.endMs;
    const entry = Math.max(0, Math.min(1, (timeMs - (start - profile.wordLookaheadMs)) / Math.max(260, end - start)));
    const smoothEntry = entry * entry * (3 - 2 * entry);
    const x = waitingX + (chunk.config.x - waitingX) * smoothEntry;
    const y = chunk.config.y + (status === "waiting" ? 18 * (1 - smoothEntry) : 0);
    const scale = .85 + .15 * smoothEntry;
    const transform = `translate3d(${x}px, ${y}px, 0) rotate(${chunk.config.rotate}deg) scale(${scale})`;
    return h("div", {
      className: `folia-partita-faithful__chunk is-${status} is-guide-${left ? "left" : "right"}`,
      style: { transform, marginBottom: chunk.config.marginBottom, "--partita-active": accent },
    },
    tuning.showGuideLines && h("span", { className: "folia-partita-faithful__guide-vertical", "aria-hidden": "true" }),
    tuning.showGuideLines && h("span", { className: "folia-partita-faithful__guide-horizontal", "aria-hidden": "true" }),
    chunk.displayWords.map((word, index) => h(FoliaFaithfulClassic.GlowWord, {
      key: `${word.startMs}-${index}`,
      word,
      config: wordConfig(chunk, word, index, intensity),
      timeMs,
      profile,
      accent,
      isChorus,
      fontSize,
    })));
  }

  function PartitaStage({ lyrics, activeIndex, timeMs, showTranslation, accent, settings, visible }) {
    const line = lyrics.lines[Math.max(0, activeIndex)] || lyrics.lines[0];
    const [windowHeight, setWindowHeight] = useState(() => window.innerHeight);
    useEffect(() => {
      const resize = () => setWindowHeight(window.innerHeight);
      window.addEventListener("resize", resize);
      return () => window.removeEventListener("resize", resize);
    }, []);
    const tuning = resolveTuning(settings.partitaTuning);
    const intensity = settings.partitaTuning?.animationIntensity || settings.classicTuning?.animationIntensity || "normal";
    const layout = useMemo(
      () => buildLayout(line, windowHeight, tuning, intensity),
      [line, windowHeight, tuning.showGuideLines, tuning.useSemanticLayout, tuning.staggerMin, tuning.staggerMax, intensity],
    );
    const profile = useMemo(() => FoliaFaithfulClassic.buildRenderProfile(line), [line]);
    const density = layout.totalGraphemes > 40 ? 0.8 : 1;
    const fontSize = `calc(clamp(${(40 * density).toFixed(1)}px, ${(5.5 * density).toFixed(2)}vw, ${(72 * density).toFixed(1)}px) * var(--folia-scale))`;
    const distance = intensity === "chaotic" ? 18 : intensity === "calm" ? 10 : 14;
    const duration = intensity === "chaotic" ? 5.8 : intensity === "calm" ? 8.5 : 7;
    const upcoming = lyrics.lines.slice(activeIndex + 1, activeIndex + 3);
    return h("section", { className: "folia-partita-faithful" },
      h("div", {
        className: "folia-partita-faithful__breath",
        style: { "--partita-float": `${distance}px`, "--partita-breath-duration": `${duration}s`, animationPlayState: visible === false ? "paused" : "running" },
      },
      h("div", { key: line.startMs, className: "folia-partita-faithful__line", style: { perspective: `${layout.perspective}px` } },
        h("div", { className: "folia-partita-faithful__column" },
          h("div", { className: "folia-partita-faithful__rows" }, layout.chunks.map((chunk) => h(PartitaChunk, {
            key: chunk.id,
            chunk,
            timeMs,
            profile,
            intensity,
            accent,
            tuning,
            fontSize,
            isChorus: Boolean(line.isChorus),
          }))),
        ),
      )),
      h("div", { className: "folia-partita-faithful__subtitles" },
        showTranslation && line.translation && h("div", { className: "folia-partita-faithful__translation" }, line.translation),
        upcoming.map((next, index) => h("div", { key: next.startMs, className: `folia-partita-faithful__upcoming is-${index + 1}` }, next.text)),
      ),
    );
  }

  return { PartitaStage, applySticky, buildLayout, getChunkStatus, resolveTuning };
})();
