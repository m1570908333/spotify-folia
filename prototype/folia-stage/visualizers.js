const FoliaStageVisualizers = (() => {
  const React = Spicetify.React;
  const { useEffect, useMemo, useRef, useState } = React;
  const h = (...args) => typeof FoliaStageLocale === "undefined" ? React.createElement(...args) : FoliaStageLocale.element(React, ...args);

  const MODES = [
    { id: "english", label: "English Stage", kind: "canvas" },
    { id: "jizura", label: "JIZURA", kind: "canvas" },
    { id: "flow", label: "Flow", kind: "dom" },
    { id: "poster", label: "Poster", kind: "dom" },
    { id: "cappella", label: "Cappella", kind: "dom" },
    { id: "claddagh", label: "Claddagh", kind: "motion" },
    { id: "monet", label: "Monet", kind: "motion" },
    { id: "pendolo", label: "Pendolo", kind: "motion" },
    { id: "diorama", label: "Diorama", kind: "three" },
    { id: "sonnet", label: "Sonnet", kind: "pixi" },
    { id: "tempera", label: "Tempera", kind: "pixi" },
    { id: "lumiere", label: "Lumiere", kind: "pixi" },
  ];

  function hashNumber(value) {
    let hash = 2166136261;
    for (const character of String(value || "")) {
      hash ^= character.codePointAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return Math.abs(hash >>> 0);
  }

  function getDisplayUnits(line) {
    if (line?.words?.length) return line.words;
    const text = line?.text || "";
    const segmenter = typeof Intl !== "undefined" && Intl.Segmenter
      ? new Intl.Segmenter(undefined, { granularity: "word" })
      : null;
    const parts = segmenter
      ? [...segmenter.segment(text)].map((entry) => entry.segment).filter(Boolean)
      : text.split(/(\s+)/).filter(Boolean);
    const duration = Math.max(800, (line?.endMs || 0) - (line?.startMs || 0));
    return parts.map((part, index) => ({
      text: part,
      startMs: line.startMs + duration * index / Math.max(1, parts.length),
      endMs: line.startMs + duration * (index + 1) / Math.max(1, parts.length),
    }));
  }

  function Still({ lyrics, activeIndex, showTranslation }) {
    const [effectiveIndex, setEffectiveIndex] = useState(() => Math.max(0, activeIndex));
    useEffect(() => {
      if (activeIndex !== -1) setEffectiveIndex(activeIndex);
      else if (effectiveIndex >= lyrics.lines.length) setEffectiveIndex(0);
    }, [activeIndex, effectiveIndex, lyrics.lines.length]);

    return h("section", { className: "folia-lyrics folia-lyrics--still" },
      h("div", { className: "folia-still__vignette", "aria-hidden": "true" }),
      h("div", { className: "folia-still__stack" },
        [-1, 0, 1].map((offset) => {
          const lineIndex = effectiveIndex + offset;
          const line = lyrics.lines[lineIndex];
          if (!line) return h("div", { key: `empty-${offset}`, className: "folia-still__line folia-still__line--empty" });
          const current = offset === 0;
          return h("div", {
            key: lineIndex,
            className: `folia-still__line${current ? " is-active" : ""}`,
          },
          line.text && h("div", { className: "folia-still__text" }, line.text),
          showTranslation && line.translation && h("div", { className: "folia-still__translation" }, line.translation),
          );
        }),
      ),
    );
  }

  function Partita({ lyrics, activeIndex, timeMs, showTranslation, renderLine }) {
    const line = lyrics.lines[Math.max(0, activeIndex)] || lyrics.lines[0];
    const units = useMemo(() => getDisplayUnits(line), [line]);
    const seed = hashNumber(`${line?.startMs}:${line?.text}`);
    return h("section", { className: "folia-lyrics folia-lyrics--partita" },
      h("div", { className: "folia-partita__score" },
        units.map((word, index) => {
          const direction = index % 2 === 0 ? -1 : 1;
          const spread = 8 + ((seed + index * 17) % 34);
          const rotate = ((seed + index * 11) % 7) - 3;
          const active = timeMs >= word.startMs;
          return h("span", {
            key: `${word.startMs}-${index}`,
            className: `folia-partita__unit${active ? " is-entered" : ""}`,
            style: {
              "--partita-x": `${direction * spread}px`,
              "--partita-r": `${rotate}deg`,
              "--partita-delay": `${index * 24}ms`,
            },
          }, word.text);
        }),
      ),
      showTranslation && line?.translation && h("div", { className: "folia-translation folia-partita__translation" }, line.translation),
      h("div", { className: "folia-partita__next" }, lyrics.lines[activeIndex + 1]?.text || ""),
    );
  }

  function render(mode, props) {
    if (mode === "english") return h(FoliaEnglishCinematicStage.EnglishStage, props);
    if (mode === "jizura") return h(FoliaJizuraStage.JizuraStage, props);
    if (mode === "still") return h(Still, props);
    if (mode === "cappella") return h(FoliaFaithfulCappella.CappellaStage, props);
    if (mode === "partita") return h(FoliaFaithfulPartita.PartitaStage, props);
    if (["claddagh", "monet", "pendolo"].includes(mode)) {
      return h(FoliaOriginalReactStage.OriginalReactStage, { ...props, mode });
    }
    if (mode === "diorama") return h(FoliaOriginalDioramaStage.OriginalDiorama, props);
    const pixiStage = FoliaStagePixiVisualizers.render(mode, props);
    if (pixiStage) return pixiStage;
    return null;
  }

  return {
    modes: MODES,
    has: (mode) => MODES.some((entry) => entry.id === mode),
    render,
  };
})();
