const FoliaFaithfulClassic = (() => {
  const React = Spicetify.React;
  const { useMemo } = React;
  const h = React.createElement;
  const segmenter = typeof Intl !== "undefined" && Intl.Segmenter
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;
  let measureCanvas = null;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function splitGraphemes(text) {
    if (!text) return [];
    return segmenter
      ? Array.from(segmenter.segment(text), ({ segment }) => segment)
      : Array.from(text);
  }

  function buildRenderProfile(line) {
    const start = Number(line?.startMs) || 0;
    const end = Math.max(start, Number(line?.endMs) || start);
    const rawDuration = end - start;
    const timingClass = rawDuration < 100 ? "micro" : rawDuration < 180 ? "short" : "normal";
    const lineTransitionMode = timingClass === "micro" ? "none" : timingClass === "short" ? "fast" : "normal";
    const wordRevealMode = timingClass === "micro" ? "instant" : timingClass === "short" ? "fast" : "normal";
    const lastWordEnd = line?.words?.length ? line.words[line.words.length - 1].endMs : end;
    let renderEndMs;
    if (lineTransitionMode === "none") {
      renderEndMs = Math.max(end, start + 67);
    } else {
      const enter = lineTransitionMode === "fast"
        ? clamp(rawDuration * 0.45, 45, 60)
        : Math.min(420, Math.max(220, Math.max(rawDuration, 120) * 0.34));
      const exit = lineTransitionMode === "fast"
        ? clamp(rawDuration * 0.22, 30, 40)
        : Math.min(320, Math.max(180, Math.max(rawDuration, 120) * 0.18));
      const hold = wordRevealMode === "instant" ? 0 : lineTransitionMode === "fast" ? 30 : 60;
      const passStart = Math.max(lastWordEnd || end, start) + hold;
      const exitStart = lineTransitionMode === "fast"
        ? Math.max(start + enter + 10, passStart, end - exit)
        : Math.max(passStart, end - exit);
      renderEndMs = Math.max(end, exitStart + exit);
    }
    return {
      rawDuration,
      timingClass,
      lineTransitionMode,
      wordRevealMode,
      renderEndMs,
      wordLookaheadMs: wordRevealMode === "instant" ? 30 : wordRevealMode === "fast" ? 80 : 150,
    };
  }

  function getActiveEndMs(word, profile) {
    if (profile.wordRevealMode === "instant") return profile.renderEndMs;
    if (profile.wordRevealMode === "fast") {
      return Math.min(profile.renderEndMs, Math.max(word.endMs, word.startMs + 120));
    }
    return word.endMs;
  }

  function getWordStatus(word, timeMs, profile) {
    const activeEnd = getActiveEndMs(word, profile);
    if (timeMs >= word.startMs - profile.wordLookaheadMs && timeMs <= activeEnd) return "active";
    return timeMs > activeEnd ? "passed" : "waiting";
  }

  function buildGraphemeTimings(word) {
    const graphemes = splitGraphemes(word.text);
    if (!graphemes.length) return [];
    const duration = Math.max(0, word.endMs - word.startMs);
    const unit = duration / graphemes.length;
    return graphemes.map((char, index) => ({
      char,
      startMs: word.startMs + unit * index,
      endMs: index === graphemes.length - 1 ? word.endMs : word.startMs + unit * (index + 1),
    }));
  }

  function glowAmount(timeMs, timing, profile, word) {
    if (profile.wordRevealMode !== "normal") {
      const duration = profile.wordRevealMode === "instant"
        ? Math.min(Math.max(word.endMs - word.startMs, 80), 120)
        : Math.min(Math.max(word.endMs - word.startMs, 120), 200);
      const progress = clamp((timeMs - (word.startMs - profile.wordLookaheadMs)) / duration, 0, 1);
      const peak = profile.wordRevealMode === "instant" ? 0.35 : 0.4;
      return progress <= peak ? progress / peak : (1 - progress) / (1 - peak);
    }
    const charDuration = Math.max(1, timing.endMs - timing.startMs);
    const progress = clamp((timeMs - timing.startMs) / (charDuration * 6), 0, 1);
    return progress <= 0.3 ? progress / 0.3 : (1 - progress) / 0.7;
  }

  function measureWord(text, pxSize) {
    if (!measureCanvas) measureCanvas = document.createElement("canvas");
    const context = measureCanvas.getContext("2d");
    if (!context) return text.length * pxSize * 0.65;
    context.font = `700 ${pxSize}px "Spotify Mix", "Noto Sans SC", sans-serif`;
    return context.measureText(text).width;
  }

  function normalizeWords(line) {
    if (line?.words?.length) return line.words;
    const text = String(line?.text || "");
    if (!text) return [];
    const tokens = /[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(text)
      ? splitGraphemes(text)
      : text.match(/\S+\s*/g) || [text];
    const duration = Math.max(100, line.endMs - line.startMs);
    return tokens.map((token, index) => ({
      text: token,
      startMs: line.startMs + duration * index / tokens.length,
      endMs: line.startMs + duration * (index + 1) / tokens.length,
    }));
  }

  function buildLayout(line, words, tuning, viewportWidth, fontScale) {
    const seed = line.startMs / 1000;
    const intensity = tuning.animationIntensity || "normal";
    const chaotic = intensity === "chaotic";
    const calm = intensity === "calm";
    const justifyOptions = calm ? ["center"] : ["flex-start", "center", "flex-end", "space-around", "space-between"];
    const alignOptions = calm ? ["center"] : ["flex-start", "center", "flex-end"];
    const interlude = line.text === "......";
    const fontPx = clamp((6 * fontScale * viewportWidth) / 100, 36 * fontScale, 72 * fontScale);
    const widths = words.map((word) => measureWord(word.text, fontPx));
    const baseSpread = chaotic ? 60 : calm ? 0 : 20;
    const baseRotate = chaotic ? 30 : calm ? 0 : 5;
    const configs = words.map((word, index) => {
      const wordSeed = seed + index;
      const random = (offset) => {
        const value = Math.sin(wordSeed + offset) * 10000;
        return value - Math.floor(value);
      };
      if (interlude) {
        return { id: `${index}-${seed}`, x: 0, y: (random(2) - 0.5) * 15, rotate: 0, scale: 1.5, marginRight: "3rem", alignSelf: "center", passedRotate: 0 };
      }
      const scale = chaotic ? 0.8 + random(4) * 0.6 : 1.1 + random(4) * 0.2;
      const x = (random(1) - 0.5) * baseSpread * 2;
      const y = (random(2) - 0.5) * baseSpread * 2;
      let marginRight = chaotic ? `${random(5) * 1.5}rem` : "0.8rem";
      if (!tuning.useLegacyLayout) {
        const nextSeed = seed + index + 1;
        const nextRandom = (offset) => {
          const value = Math.sin(nextSeed + offset) * 10000;
          return value - Math.floor(value);
        };
        const nextScale = index + 1 < words.length
          ? (chaotic ? 0.8 + nextRandom(4) * 0.6 : 1.1 + nextRandom(4) * 0.2)
          : 1;
        const nextX = index + 1 < words.length ? (nextRandom(1) - 0.5) * baseSpread * 2 : 0;
        const spacing = clamp(Number(tuning.wordSpacing) || 0.7, 0, 2);
        const overflow = widths[index] * (scale * 1.4 - 1) / 2
          + (widths[index + 1] || 0) * (nextScale * 1.4 - 1) / 2
          + x - nextX + fontPx * 0.05;
        marginRight = `${Math.max((chaotic ? 0.08 : 0.12) * fontPx * spacing, overflow * spacing).toFixed(1)}px`;
      }
      return {
        id: `${index}-${seed}`,
        x,
        y,
        rotate: tuning.enableWordRotation === false ? 0 : (random(3) - 0.5) * baseRotate * 2,
        scale,
        marginRight,
        alignSelf: chaotic && random(6) > 0.7 ? (random(7) > 0.5 ? "flex-start" : "flex-end") : "auto",
        passedRotate: tuning.enableWordRotation === false ? 0 : (random(8) - 0.5) * 45,
      };
    });
    return {
      configs,
      justifyContent: interlude ? "center" : justifyOptions[Math.floor(seed % justifyOptions.length)],
      alignItems: alignOptions[Math.floor((seed * 2) % alignOptions.length)],
      perspective: chaotic ? 500 + (seed % 500) : 1000,
    };
  }

  function GlowWord({ word, config, timeMs, profile, accent, isChorus, fontSize }) {
    const status = getWordStatus(word, timeMs, profile);
    const activeScale = Number.isFinite(config.scale) ? config.scale * 1.4 : 1.5;
    const waitingX = config.x + Math.sin(config.y) * 100;
    const waitingY = config.y + Math.cos(config.x) * 50;
    const activeEnd = getActiveEndMs(word, profile);
    const entryProgress = clamp((timeMs - (word.startMs - profile.wordLookaheadMs)) / Math.max(activeEnd - word.startMs + profile.wordLookaheadMs, 180), 0, 1);
    const entryEase = entryProgress * entryProgress * (3 - 2 * entryProgress);
    const exitProgress = clamp((timeMs - activeEnd) / Math.max(700, Math.min(1800, activeEnd - word.startMs)), 0, 1);
    const exitEase = exitProgress * exitProgress * (3 - 2 * exitProgress);
    const x = waitingX + (config.x - waitingX) * entryEase + config.passedRotate * exitEase * 0.35;
    const y = waitingY + (config.y - waitingY) * entryEase - exitEase * 10;
    const rotation = config.rotate + 20 * (1 - entryEase) + config.passedRotate * exitEase;
    const scale = .5 + (activeScale - .5) * entryEase + ((config.scale || 1) - activeScale) * exitEase;
    const opacity = .12 + .88 * entryEase - .12 * exitEase;
    const activeMix = Math.sin(Math.PI * clamp(entryProgress, 0, 1));
    const transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg) scale(${scale})`;
    const graphemes = buildGraphemeTimings(word);
    return h("span", {
      className: `folia-faithful-word is-${status}`,
      style: { transform, opacity, marginRight: config.marginRight, alignSelf: config.alignSelf, fontSize },
    },
    h("span", { className: "folia-faithful-word__glow", "aria-hidden": "true" },
      graphemes.map((timing, index) => {
        const amount = clamp(glowAmount(timeMs, timing, profile, word), 0, 1);
        const inner = 8 * amount;
        const outer = 16 * amount;
        return h("span", {
          key: index,
          style: {
            color: accent,
            opacity: amount,
            filter: amount > 0.001 ? `drop-shadow(0 0 ${inner}px ${accent}) drop-shadow(0 0 ${outer}px ${accent})` : "none",
          },
        }, timing.char);
      }),
    ),
    h("span", { className: "folia-faithful-word__body", style: { color: activeMix > .02 ? accent : "rgba(248,250,247,.88)", textShadow: activeMix > .02 ? `0 0 ${8 + activeMix * 16}px ${accent}` : "none" } }, word.text),
    lineRipple(activeMix > .15 ? "active" : status, isChorus, accent));
  }

  function lineRipple(status, isChorus, accent) {
    if (!isChorus || status !== "active") return null;
    return h("span", { className: "folia-faithful-word__ripple", style: { borderColor: accent } });
  }

  function ClassicStage({ document: lyrics, activeIndex, timeMs, showTranslation, accent, settings }) {
    const line = lyrics.lines[Math.max(0, activeIndex)] || lyrics.lines[0];
    const tuning = settings.classicTuning || {};
    const words = useMemo(() => normalizeWords(line), [line]);
    const profile = useMemo(() => buildRenderProfile(line), [line]);
    const layout = useMemo(
      () => buildLayout(line, words, tuning, window.innerWidth, settings.fontScale || 1),
      [line, words, tuning.enableWordRotation, tuning.useLegacyLayout, tuning.wordSpacing, tuning.animationIntensity, settings.fontScale],
    );
    const transitionClass = `is-transition-${profile.lineTransitionMode}`;
    const breathing = clamp(Number(tuning.breathingFloatMultiplier) || 0, 0, 2);
    const distance = (tuning.animationIntensity === "chaotic" ? 18 : tuning.animationIntensity === "calm" ? 10 : 14) * breathing;
    const duration = tuning.animationIntensity === "chaotic" ? 5.8 : tuning.animationIntensity === "calm" ? 8.5 : 7;
    const upcoming = lyrics.lines.slice(activeIndex + 1, activeIndex + 3);
    return h("section", { className: "folia-faithful-classic" },
      h("div", {
        className: "folia-faithful-classic__breath",
        style: { "--classic-float": `${distance}px`, "--classic-breath-duration": `${duration}s`, animationPlayState: settings.pageVisible === false ? "paused" : "running" },
      },
      h("div", {
        key: line.startMs,
        className: `folia-faithful-classic__line ${transitionClass}`,
        style: { justifyContent: layout.justifyContent, alignItems: layout.alignItems, perspective: `${layout.perspective}px` },
      }, words.map((word, index) => h(GlowWord, {
        key: layout.configs[index]?.id || index,
        word,
        config: layout.configs[index],
        timeMs,
        profile,
        accent,
        isChorus: Boolean(line.isChorus),
      })))),
      h("div", { className: "folia-faithful-classic__subtitles" },
        showTranslation && line.translation && h("div", { className: "folia-faithful-classic__translation" }, line.translation),
        upcoming.map((next, index) => h("div", { key: next.startMs, className: `folia-faithful-classic__upcoming is-${index + 1}` }, next.text)),
      ),
    );
  }

  return {
    ClassicStage,
    GlowWord,
    buildGraphemeTimings,
    buildLayout,
    buildRenderProfile,
    getActiveEndMs,
    getWordStatus,
    normalizeWords,
    splitGraphemes,
  };
})();
