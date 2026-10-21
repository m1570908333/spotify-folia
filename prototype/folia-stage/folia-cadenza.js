const FoliaFaithfulCadenza = (() => {
  const React = Spicetify.React;
  const { useEffect, useMemo, useRef, useState } = React;
  const h = React.createElement;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const mix = (from, to, amount) => from + (to - from) * amount;
  const easeOut = (value) => 1 - Math.pow(1 - clamp(value, 0, 1), 3);

  function hashNumber(value) {
    let hash = 2166136261;
    for (const character of String(value || "")) {
      hash ^= character.codePointAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function random(seed, salt) {
    const value = Math.sin((seed + salt * 374761393) * 0.000001) * 43758.5453123;
    return value - Math.floor(value);
  }

  function resolveTuning(settings = {}) {
    const source = settings.cadenzaTuning || {};
    return {
      fontScale: clamp(Number(source.fontScale) || 1.12, 0.72, 1.65),
      widthRatio: clamp(Number(source.widthRatio) || 0.72, 0.42, 0.92),
      motionAmount: clamp(Number(source.motionAmount) || 0, 0, 2),
      glowIntensity: clamp(Number(source.glowIntensity) || 0, 0, 2),
      beamIntensity: clamp(Number(source.beamIntensity) || 0, 0, 1.5),
      animationIntensity: source.animationIntensity || "normal",
    };
  }

  function chooseHero(words) {
    const center = (words.length - 1) / 2;
    let best = -1;
    let score = -Infinity;
    words.forEach((word, index) => {
      const length = FoliaFaithfulClassic.splitGraphemes(word.text.trim()).length;
      if (!length) return;
      const semantic = /[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(word.text) ? 0.18 : Math.min(length * 0.08, 0.36);
      const centerBias = 1 - Math.abs(index - center) / Math.max(words.length, 1);
      const next = semantic + centerBias * 0.18;
      if (next > score) {
        score = next;
        best = index;
      }
    });
    return best;
  }

  function chooseFontPx(width, line, tuning) {
    const graphemes = Math.max(FoliaFaithfulClassic.splitGraphemes(line.text).length, 1);
    const words = Math.max(FoliaFaithfulClassic.normalizeWords(line).length, 1);
    const base = clamp(width * 0.086, 34, 94);
    const lengthPenalty = graphemes > 12 ? Math.min((graphemes - 12) * 1.8, 34) : 0;
    const densityPenalty = words > 7 ? Math.min((words - 7) * 1.5, 18) : 0;
    return clamp((base - lengthPenalty - densityPenalty) * tuning.fontScale, 24, 132);
  }

  function buildLayout(line, viewport, settings = {}, context = null) {
    if (!line || viewport.width <= 0 || viewport.height <= 0) return null;
    const tuning = resolveTuning(settings);
    const words = FoliaFaithfulClassic.normalizeWords(line);
    const fontPx = chooseFontPx(viewport.width, line, tuning);
    const font = `700 ${fontPx}px "Segoe UI", sans-serif`;
    if (context) context.font = font;
    const measure = (text) => context
      ? Math.max(fontPx * 0.25, context.measureText(text).width)
      : Math.max(fontPx * 0.25, FoliaFaithfulClassic.splitGraphemes(text).length * fontPx * 0.58);
    const graphemeCount = Math.max(FoliaFaithfulClassic.splitGraphemes(line.text).length, 1);
    const wrapCompression = graphemeCount > 12
      ? clamp(0.92 - (graphemeCount - 12) * 0.018, 0.62, 0.92)
      : 0.92;
    const available = Math.max(viewport.width - 48, 120);
    const maxWidth = clamp(viewport.width * tuning.widthRatio * wrapCompression, Math.min(220, available), Math.min(820, available));
    const lineHeight = Math.round(fontPx * (/[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(line.text) ? 1.22 : 1.1));
    const heroIndex = chooseHero(words);
    const rows = [];
    let row = [];
    let rowWidth = 0;
    words.forEach((word, wordIndex) => {
      const width = measure(word.text);
      const gap = row.length ? Math.max(5, fontPx * 0.12) : 0;
      if (row.length && rowWidth + gap + width > maxWidth) {
        rows.push({ words: row, width: rowWidth });
        row = [];
        rowWidth = 0;
      }
      const item = { word, wordIndex, width, gap: row.length ? gap : 0 };
      row.push(item);
      rowWidth += item.gap + width;
    });
    if (row.length) rows.push({ words: row, width: rowWidth });

    const seed = hashNumber(`${line.startMs}:${line.text}`);
    const totalHeight = Math.max(rows.length, 1) * lineHeight;
    const placements = [];
    rows.forEach((entry, rowIndex) => {
      let cursor = -entry.width / 2;
      entry.words.forEach((item) => {
        cursor += item.gap;
        const hero = item.wordIndex === heroIndex && words.length > 1;
        const direction = random(seed, item.wordIndex * 9 + 4) > 0.5 ? 1 : -1;
        const rotationRange = tuning.animationIntensity === "chaotic" ? 7 : tuning.animationIntensity === "calm" ? 2 : 4;
        placements.push({
          id: `${line.startMs}-${item.wordIndex}`,
          word: item.word,
          text: item.word.text,
          wordIndex: item.wordIndex,
          x: cursor + (random(seed, item.wordIndex * 9 + 1) - 0.5) * fontPx * (hero ? 0.16 : 0.08),
          y: -totalHeight / 2 + fontPx + rowIndex * lineHeight + (random(seed, item.wordIndex * 9 + 2) - 0.5) * fontPx * 0.16,
          width: item.width,
          scale: (hero ? 1.46 : 1) * (tuning.animationIntensity === "chaotic" ? 1.02 : 1.01),
          rotate: (random(seed, item.wordIndex * 9 + 3) - 0.5) * rotationRange,
          entryOffsetX: direction * (30 + random(seed, item.wordIndex * 9 + 5) * 58),
          entryOffsetY: (random(seed, item.wordIndex * 9 + 6) - 0.5) * 52,
          passedDriftX: direction * (14 + random(seed, item.wordIndex * 9 + 7) * 34),
          passedDriftY: -12 - random(seed, item.wordIndex * 9 + 8) * 32,
          passedRotate: direction * (5 + random(seed, item.wordIndex * 9 + 9) * 10),
          hero,
          graphemes: FoliaFaithfulClassic.buildGraphemeTimings(item.word),
        });
        cursor += item.width;
      });
    });
    return { placements, font, fontPx, lineHeight, maxWidth, rows: rows.length, heroIndex };
  }

  function wordFrame(placement, timeMs, profile, tuning, energy, index) {
    const status = FoliaFaithfulClassic.getWordStatus(timeMs, placement.word, profile);
    const start = placement.word.startMs;
    const end = FoliaFaithfulClassic.getActiveEndMs(placement.word, profile);
    const progress = clamp((timeMs - start) / Math.max(end - start, 80), 0, 1);
    const entered = easeOut((timeMs - (start - 180)) / 380);
    const passed = status === "passed" ? easeOut((timeMs - end) / 5000) : 0;
    const pulse = 1 + Math.sin(timeMs * 0.01 + start * 0.005) * 0.04 * tuning.motionAmount;
    const activeScale = profile.wordRevealMode === "instant" ? placement.scale : placement.scale * 1.3 * pulse;
    const scale = status === "waiting"
      ? mix(Math.max(placement.scale * 0.5, 0.5), placement.scale, entered)
      : status === "active" ? mix(placement.scale, activeScale, Math.sin(progress * Math.PI)) : placement.scale;
    return {
      status,
      progress,
      x: placement.x + Math.sin(timeMs * 0.0012 + index * 0.6) * energy * tuning.motionAmount * 4
        + (status === "waiting" ? placement.entryOffsetX * (1 - entered) : placement.passedDriftX * passed),
      y: placement.y + Math.cos(timeMs * 0.0015 + index * 0.4) * energy * tuning.motionAmount * 2.5
        + (status === "waiting" ? placement.entryOffsetY * (1 - entered) : placement.passedDriftY * passed),
      rotation: placement.rotate + (status === "waiting" ? 20 * (1 - entered) : placement.passedRotate * passed),
      scale,
      alpha: status === "waiting" ? entered * 0.12 : status === "active" ? 1 : 0.82,
      blur: status === "waiting" ? (1 - entered) * 10 : 0,
    };
  }

  function color(hex, alpha) {
    const match = String(hex || "").match(/^#([0-9a-f]{6})$/i);
    const value = match ? Number.parseInt(match[1], 16) : 0xd9ff67;
    return `rgba(${(value >> 16) & 255},${(value >> 8) & 255},${value & 255},${clamp(alpha, 0, 1)})`;
  }

  function drawPlacement(context, placement, frame, center, layout, accent, tuning, timeMs) {
    if (frame.alpha < 0.01) return;
    context.save();
    context.translate(center.x + frame.x, center.y + frame.y);
    context.rotate(frame.rotation * Math.PI / 180);
    context.scale(frame.scale, frame.scale);
    context.globalAlpha = frame.alpha;
    context.filter = frame.blur > 0.05 ? `blur(${frame.blur.toFixed(2)}px)` : "none";
    context.font = layout.font;
    context.textBaseline = "alphabetic";
    const activeMix = frame.status === "active" ? Math.sin(frame.progress * Math.PI) : 0;
    if (frame.status === "active" && tuning.beamIntensity > 0.01) {
      const gradient = context.createLinearGradient(-20, 0, placement.width + 20, 0);
      gradient.addColorStop(0, color(accent, 0));
      gradient.addColorStop(clamp(frame.progress, 0.05, 0.95), color(accent, tuning.beamIntensity * 0.32));
      gradient.addColorStop(1, color(accent, 0));
      context.fillStyle = gradient;
      context.fillRect(-20, -layout.fontPx * 1.05, placement.width + 40, layout.fontPx * 1.35);
    }
    let glyphX = 0;
    placement.graphemes.forEach((glyph) => {
      const glyphWidth = context.measureText(glyph.char).width;
      const duration = Math.max(glyph.endMs - glyph.startMs, 40);
      const elapsed = timeMs - glyph.startMs;
      const glow = elapsed <= 0 ? 0 : Math.max(0, 1 - Math.abs(elapsed / (duration * 3) - 0.34));
      if (glow > 0.01 && tuning.glowIntensity > 0) {
        context.save();
        context.shadowColor = color(accent, Math.min(1, glow * tuning.glowIntensity));
        context.shadowBlur = 18 + glow * tuning.glowIntensity * 28;
        context.fillStyle = color(accent, 0.9);
        context.fillText(glyph.char, glyphX, 0);
        context.restore();
      }
      glyphX += glyphWidth;
    });
    context.fillStyle = activeMix > 0.01 ? color(accent, 0.72 + activeMix * 0.28) : "rgba(248,250,247,.86)";
    context.fillText(placement.text, 0, 0);
    context.restore();
  }

  function CadenzaCanvas({ line, previousLine, timeMs, accent, settings, visible, viewport, layout, previousLayout, audioSignals }) {
    const canvasRef = useRef(null);
    const timeRef = useRef(timeMs);
    timeRef.current = timeMs;
    useEffect(() => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d", { alpha: true });
      if (!canvas || !context || !layout || !line) return undefined;
      const tuning = resolveTuning(settings);
      const profile = FoliaFaithfulClassic.buildRenderProfile(line);
      const previousProfile = previousLine ? FoliaFaithfulClassic.buildRenderProfile(previousLine) : null;
      let frameId = 0;
      let running = true;
      const draw = () => {
        if (!running) return;
        const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
        const width = Math.max(1, Math.round(viewport.width));
        const height = Math.max(1, Math.round(viewport.height));
        if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
          canvas.width = Math.round(width * ratio);
          canvas.height = Math.round(height * ratio);
        }
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.clearRect(0, 0, width, height);
        if (visible !== false && !document.hidden) {
          const now = timeRef.current;
          const audio = audioSignals?.sample(now / 1000) || {};
          const energy = clamp(Number(audio.power) || 0, 0, 1);
          const center = { x: width / 2, y: height * 0.42 + Math.sin(now * 0.0023) * tuning.motionAmount * 3 };
          const drawLayer = (layerLine, layerLayout, layerProfile, alpha, scale) => {
            if (!layerLine || !layerLayout || !layerProfile || alpha <= 0.001) return;
            context.save();
            context.globalAlpha = alpha;
            context.translate(width / 2, height * 0.42);
            context.scale(scale, scale);
            context.translate(-width / 2, -height * 0.42);
            ["waiting", "passed", "active"].forEach((status) => {
              layerLayout.placements.forEach((placement, index) => {
                const frame = wordFrame(placement, now, layerProfile, tuning, 0.24 + energy * 0.42, index);
                if (frame.status === status) drawPlacement(context, placement, frame, center, layerLayout, accent, tuning, now);
              });
            });
            context.restore();
          };
          const lineEnd = Math.max(line.endMs, line.words?.[line.words.length - 1]?.endMs || 0);
          const enter = easeOut((now - (line.startMs - 120)) / 460);
          const exit = easeOut((now - Math.max(line.startMs + 300, lineEnd - 520)) / 520);
          const previousFade = previousLine ? 1 - easeOut((now - (line.startMs - 100)) / 560) : 0;
          drawLayer(previousLine, previousLayout, previousProfile, previousFade * 0.78, 0.96 + (1 - previousFade) * 0.04);
          drawLayer(line, layout, profile, enter * (1 - exit), mix(0.9, 1, enter) + exit * 0.1);
        }
        frameId = requestAnimationFrame(draw);
      };
      frameId = requestAnimationFrame(draw);
      return () => {
        running = false;
        cancelAnimationFrame(frameId);
      };
    }, [line, previousLine, accent, settings.cadenzaTuning, visible, viewport.width, viewport.height, layout, previousLayout, audioSignals]);
    return h("canvas", { ref: canvasRef, className: "folia-cadenza-faithful__canvas", "aria-hidden": "true" });
  }

  function CadenzaStage({ lyrics, activeIndex, timeMs, showTranslation, accent, settings, visible, audioSignals }) {
    const hostRef = useRef(null);
    const measureRef = useRef(null);
    const [viewport, setViewport] = useState(() => ({
      width: Math.max(1, window.innerWidth),
      height: Math.max(1, window.innerHeight - 198),
    }));
    const line = lyrics.lines[Math.max(0, activeIndex)] || lyrics.lines[0];
    const previousLine = activeIndex > 0 ? lyrics.lines[activeIndex - 1] : null;
    useEffect(() => {
      const host = hostRef.current;
      if (!host) return undefined;
      const observer = new ResizeObserver(([entry]) => {
        if (entry) setViewport({ width: entry.contentRect.width, height: entry.contentRect.height });
      });
      observer.observe(host);
      return () => observer.disconnect();
    }, []);
    const layout = useMemo(() => {
      if (!measureRef.current) measureRef.current = document.createElement("canvas").getContext("2d");
      return buildLayout(line, viewport, settings, measureRef.current);
    }, [line, viewport.width, viewport.height, settings.cadenzaTuning, settings.fontScale]);
    const previousLayout = useMemo(() => {
      if (!previousLine) return null;
      if (!measureRef.current) measureRef.current = document.createElement("canvas").getContext("2d");
      return buildLayout(previousLine, viewport, settings, measureRef.current);
    }, [previousLine, viewport.width, viewport.height, settings.cadenzaTuning, settings.fontScale]);
    const upcoming = lyrics.lines.slice(activeIndex + 1, activeIndex + 3);
    return h("section", { ref: hostRef, className: "folia-cadenza-faithful" },
      layout && h(CadenzaCanvas, { line, previousLine, timeMs, accent, settings, visible, viewport, layout, previousLayout, audioSignals }),
      !layout && h("div", { className: "folia-cadenza-faithful__loading" }, "Mindscape"),
      h("div", { className: "folia-cadenza-faithful__subtitles" },
        showTranslation && line?.translation && h("div", { className: "folia-cadenza-faithful__translation" }, line.translation),
        upcoming.map((next, index) => h("div", { key: next.startMs, className: `folia-cadenza-faithful__upcoming is-${index + 1}` }, next.text)),
      ),
    );
  }

  return { CadenzaStage, buildLayout, chooseHero, resolveTuning, wordFrame };
})();
