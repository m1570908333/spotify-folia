const FoliaEnglishStage = (() => {
  const React = Spicetify.React;
  const { useMemo } = React;
  const h = React.createElement;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const ease = (value) => { const amount = clamp(value, 0, 1); return amount * amount * (3 - 2 * amount); };

  function wordsFor(line) {
    if (line?.words?.length) return line.words;
    const parts = String(line?.text || "").match(/\S+\s*/g) || [];
    const duration = Math.max(Number(line?.endMs || 0) - Number(line?.startMs || 0), 600);
    return parts.map((text, index) => ({
      text,
      startMs: line.startMs + duration * index / Math.max(parts.length, 1),
      endMs: line.startMs + duration * (index + 1) / Math.max(parts.length, 1),
    }));
  }

  function isEnglishLine(line) {
    const text = String(line?.text || "");
    const latin = (text.match(/[A-Za-z]/g) || []).length;
    const visible = (text.match(/[^\s]/g) || []).length;
    return visible > 0 && latin / visible >= 0.45;
  }

  function wordProgress(word, timeMs, lineStart, lineEnd) {
    const wordStart = Number(word.startMs) || lineStart;
    const wordEnd = Math.max(wordStart + 40, Number(word.endMs) || lineEnd);
    const progress = clamp((timeMs - wordStart) / Math.max(wordEnd - wordStart, 80), 0, 1);
    return { progress, reveal: ease((timeMs - wordStart + 110) / Math.max(wordEnd - wordStart + 110, 200)) };
  }

  function activeWordIndexAt(words, timeMs, lineEnd) {
    return words.findIndex((word) => timeMs < Number(word.endMs || lineEnd));
  }

  function EnglishWord({ word, index, activeIndex, timing, accent }) {
    const active = index === activeIndex;
    const passed = index < activeIndex;
    return h("span", {
      className: "folia-english__word" + (active ? " is-active" : "") + (passed ? " is-passed" : ""),
      style: {
        "--english-reveal": timing.reveal,
        "--english-word-progress": timing.progress,
        "--english-accent": accent,
      },
    }, word.text);
  }

  function EnglishStage({ lyrics, activeIndex, timeMs, showTranslation, accent, settings, audioSignals }) {
    const line = lyrics.lines[Math.max(0, activeIndex)] || lyrics.lines[0];
    const words = useMemo(() => wordsFor(line), [line]);
    const lineStart = Number(line?.startMs) || 0;
    const lineEnd = Math.max(lineStart + 400, Number(line?.endMs) || lineStart + 1200);
    const timings = words.map((word) => wordProgress(word, timeMs, lineStart, lineEnd));
    const activeWordIndex = activeWordIndexAt(words, timeMs, lineEnd);
    const focusedIndex = activeWordIndex < 0 ? Math.max(0, words.length - 1) : activeWordIndex;
    const focusedWord = words[focusedIndex] || { text: line?.text || "" };
    const wordLength = String(focusedWord.text || "").trim().length;
    const heroScale = wordLength > 16 ? 0.48 : wordLength > 12 ? 0.62 : wordLength > 9 ? 0.76 : wordLength > 6 ? 0.9 : 1;
    const lineProgress = ease((timeMs - lineStart) / Math.max(lineEnd - lineStart, 1));
    const enter = ease((timeMs - (lineStart - 240)) / 680);
    const signal = audioSignals?.sample?.(timeMs / 1000) || {};
    const energy = clamp((signal.power || 0) * 0.72 + (signal.beat || 0) * 0.28, 0, 1);
    const upcoming = lyrics.lines.slice(activeIndex + 1, activeIndex + 2);
    const intensity = settings.theme?.animationIntensity || "normal";
    const lineNumber = String(activeIndex + 1).padStart(2, "0");
    const totalLines = String(lyrics.lines.length).padStart(2, "0");
    const readableWords = words.map((word, index) => h(EnglishWord, {
      key: String(word.startMs) + "-" + index,
      word,
      index,
      activeIndex: focusedIndex,
      timing: timings[index],
      accent,
    }));
    return h("section", {
      className: "folia-english" + (isEnglishLine(line) ? " is-english" : "") + " is-" + intensity,
      style: { "--english-energy": energy, "--english-accent": accent, "--english-enter": enter },
    },
      h("div", { className: "folia-english__architecture", "aria-hidden": "true" },
        h("div", { className: "folia-english__rule folia-english__rule--top" }),
        h("div", { className: "folia-english__rule folia-english__rule--side" }),
        h("div", { className: "folia-english__beam" }),
      ),
      h("div", { className: "folia-english__composition", key: lineStart },
        h("div", { className: "folia-english__eyebrow" },
          h("span", null, "LYRIC / ", lineNumber),
          h("span", { className: "folia-english__counter" }, totalLines),
        ),
        h("div", { className: "folia-english__sentence", style: { opacity: 0.34 + enter * 0.66 } }, readableWords),
        h("div", { className: "folia-english__hero-wrap" },
          h("div", {
            key: focusedIndex + ":" + focusedWord.text,
            className: "folia-english__hero",
            style: { "--english-hero-scale": heroScale, "--english-hero-progress": timings[focusedIndex]?.progress || 0 },
          }, String(focusedWord.text || "").trim()),
          h("div", { className: "folia-english__hero-caption" }, line?.text || ""),
        ),
        h("div", { className: "folia-english__footer" },
          h("div", { className: "folia-english__translation" }, (showTranslation && line?.translation) || ""),
          h("div", { className: "folia-english__upcoming" }, upcoming.map((next) => next.text)),
        ),
        h("div", { className: "folia-english__progress", "aria-hidden": "true" },
          h("span", { className: "folia-english__progress-line", style: { transform: "scaleX(" + lineProgress + ")" } }),
          h("span", { className: "folia-english__progress-word", style: { transform: "scaleX(" + (timings[focusedIndex]?.progress || 0) + ")" } }),
        ),
      ),
    );
  }

  return { EnglishStage, isEnglishLine, wordsFor, activeWordIndexAt };
})();
