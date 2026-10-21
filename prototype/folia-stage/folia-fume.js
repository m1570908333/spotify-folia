const FoliaFaithfulFume = (() => {
  const React = Spicetify.React;
  const { useEffect, useMemo, useRef, useState } = React;
  const h = React.createElement;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const mix = (from, to, amount) => from + (to - from) * amount;
  let measureCanvas = null;

  function hashString(input) {
    let hash = 2166136261;
    for (let index = 0; index < String(input).length; index += 1) {
      hash ^= String(input).charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function seeded(input) {
    return (hashString(input) % 10000) / 10000;
  }

  function resolveTuning(tuning = {}) {
    return {
      hidePrintSymbols: Boolean(tuning.hidePrintSymbols),
      disableGeometricBackground: tuning.disableGeometricBackground !== false,
      backgroundObjectOpacity: clamp(Number.isFinite(tuning.backgroundObjectOpacity) ? tuning.backgroundObjectOpacity : 0.5, 0, 1),
      textHoldRatio: clamp(Number.isFinite(tuning.textHoldRatio) ? tuning.textHoldRatio : 1, 0, 1),
      cameraTrackingMode: tuning.cameraTrackingMode === "stepped" ? "stepped" : "smooth",
      cameraSpeed: clamp(Number.isFinite(tuning.cameraSpeed) ? tuning.cameraSpeed : 1, 0.55, 1.85),
      glowIntensity: clamp(Number.isFinite(tuning.glowIntensity) ? tuning.glowIntensity : 1, 0, 1.8),
      heroScale: clamp(Number.isFinite(tuning.heroScale) ? tuning.heroScale : 1, 0.82, 1.32),
    };
  }

  function fontSpec(fontPx, variant) {
    return `${variant === "hero" ? 760 : 640} ${fontPx}px "Spotify Mix", "Noto Sans SC", sans-serif`;
  }

  function context2d() {
    if (!measureCanvas) measureCanvas = document.createElement("canvas");
    return measureCanvas.getContext("2d");
  }

  function measure(text, font) {
    const context = context2d();
    if (!context) return FoliaFaithfulClassic.splitGraphemes(text).length * Number.parseFloat(font) * 0.6;
    context.font = font;
    return context.measureText(text).width;
  }

  function chooseNaturalVariant(line, index, total) {
    const count = FoliaFaithfulClassic.splitGraphemes(line.text).filter((char) => char.trim()).length;
    if (!count) return "body";
    if (line.isChorus && count <= 22) return "hero";
    const centered = Math.abs(index - total / 2) / Math.max(total, 1);
    return count >= 4 && count <= 28 && centered < 0.72 && ((index + 1) % 6 === 0 || seeded(`${line.text}:${index}`) > 0.965)
      ? "hero"
      : "body";
  }

  function fallbackHeroIndex(entries) {
    if (entries.some(({ line }, index) => chooseNaturalVariant(line, index, entries.length) === "hero")) return -1;
    let best = -1;
    let score = -Infinity;
    entries.forEach(({ line }, index) => {
      const count = FoliaFaithfulClassic.splitGraphemes(line.text).filter((char) => char.trim()).length;
      if (!count || count > 36) return;
      const centered = Math.abs(index - entries.length / 2) / Math.max(entries.length, 1);
      const lengthScore = count >= 6 && count <= 22 ? 1 : count <= 28 ? 0.72 : 0.36;
      const next = (1 - centered) * 0.62 + lengthScore * 0.34 + (line.isChorus ? 0.28 : 0) + seeded(`${line.text}:${index}:fallback-hero`) * 0.04;
      if (next > score) { score = next; best = index; }
    });
    return best;
  }

  function chooseFontPx(line, variant, width, fontScale, densityScale, heroScale) {
    const count = Math.max(FoliaFaithfulClassic.splitGraphemes(line.text).filter((char) => char.trim()).length, 1);
    const density = count + (line.words?.length || 0) * 1.4;
    const base = variant === "hero"
      ? width / Math.max(Math.sqrt(density) * 1.5, 4.5)
      : width / Math.max(Math.sqrt(density) * 2.25, 7);
    const scaled = base * fontScale * densityScale * (variant === "hero" ? heroScale : 1);
    return variant === "hero" ? clamp(scaled, 24, 54 * heroScale) : clamp(scaled, 14, 28);
  }

  function wrapText(text, fontPx, variant, maxWidth) {
    const graphemes = FoliaFaithfulClassic.splitGraphemes(text);
    const font = fontSpec(fontPx, variant);
    const lines = [];
    let start = 0;
    let current = "";
    let width = 0;
    let lastSpace = -1;
    for (let index = 0; index < graphemes.length; index += 1) {
      const char = graphemes[index];
      const next = current + char;
      const nextWidth = measure(next, font);
      if (nextWidth > maxWidth && current) {
        let end = index;
        if (lastSpace >= start) end = lastSpace + 1;
        const slice = graphemes.slice(start, end).join("").trimEnd();
        lines.push({ text: slice, start, end, width: measure(slice, font) });
        start = end;
        while (/\s/.test(graphemes[start] || "")) start += 1;
        index = start - 1;
        current = "";
        width = 0;
        lastSpace = -1;
        continue;
      }
      current = next;
      width = nextWidth;
      if (/\s/.test(char)) lastSpace = index;
    }
    if (start < graphemes.length) {
      const slice = graphemes.slice(start).join("").trimEnd();
      lines.push({ text: slice, start, end: graphemes.length, width: measure(slice, font) });
    }
    return { graphemes, lines, font };
  }

  function buildWordRanges(line, graphemes) {
    const words = FoliaFaithfulClassic.normalizeWords(line);
    let cursor = 0;
    return words.map((word) => {
      const length = FoliaFaithfulClassic.splitGraphemes(word.text).length;
      const start = clamp(cursor, 0, graphemes.length);
      let end = clamp(start + length, start, graphemes.length);
      while (end < graphemes.length && /\s/.test(graphemes[end])) end += 1;
      cursor = end;
      return { word, start, end };
    });
  }

  function buildAttempt(lines, viewport, fontScale, tuning, options, details) {
    const { paperWidth, columns, gap, densityScale, seedKey } = options;
    const horizontalMargin = Math.max(viewport.width * 0.86, 280);
    const verticalMargin = Math.max(viewport.height * 0.82, 220);
    const columnWidth = (paperWidth - gap * (columns - 1)) / columns;
    const entries = lines.map((line, index) => ({ line, index }))
      .filter(({ line }) => line.text.trim())
      .sort((a, b) => seeded(`${seedKey}:${a.index}:${a.line.text}`) - seeded(`${seedKey}:${b.index}:${b.line.text}`));
    const forcedHero = fallbackHeroIndex(entries);
    const heights = Array.from({ length: columns }, () => verticalMargin);
    const blocks = [];
    let bodyCursor = 0;
    let heroCursor = 0;
    entries.forEach(({ line, index }, blockIndex) => {
      const variant = blockIndex === forcedHero ? "hero" : chooseNaturalVariant(line, blockIndex, entries.length);
      const heroSpan = variant === "hero" ? Math.min(columns, columns <= 1 ? 1 : 2) : 1;
      const heroSpanWidth = heroSpan > 1 ? columnWidth * heroSpan + gap * (heroSpan - 1) : paperWidth;
      const blockWidth = variant === "hero"
        ? heroSpan === 1 ? paperWidth : columns === 2 ? columnWidth * 1.5 + gap * 0.5 : heroSpanWidth
        : columnWidth;
      const fontPx = chooseFontPx(line, variant, blockWidth, fontScale, densityScale, tuning.heroScale);
      const wrapped = wrapText(line.text, fontPx, variant, Math.max(blockWidth, 120));
      const lineHeight = Math.round(fontPx * (variant === "hero" ? 1.02 : 1.06));
      const blockGap = variant === "hero" ? Math.max(Math.round(lineHeight * 0.2), 6) : Math.max(Math.round(lineHeight * 0.08), 2);
      const blockHeight = wrapped.lines.length * lineHeight;
      let x;
      let y;
      if (variant === "hero") {
        if (heroSpan === 1) {
          y = Math.max(...heights);
          x = horizontalMargin;
          heights[0] = y + blockHeight + blockGap;
        } else {
          let bestHeight = Infinity;
          let candidates = [];
          for (let start = 0; start <= columns - heroSpan; start += 1) {
            let covered = 0;
            for (let column = start; column < start + heroSpan; column += 1) covered = Math.max(covered, heights[column]);
            if (covered < bestHeight) { bestHeight = covered; candidates = [start]; }
            else if (covered === bestHeight) candidates.push(start);
          }
          const target = candidates[heroCursor % candidates.length] || 0;
          heroCursor += 1;
          y = bestHeight;
          x = horizontalMargin + target * (columnWidth + gap) + Math.max((heroSpanWidth - blockWidth) * 0.5, 0);
          for (let column = target; column < target + heroSpan; column += 1) heights[column] = y + blockHeight + blockGap;
        }
      } else {
        const min = Math.min(...heights);
        const candidates = heights.map((height, column) => ({ height, column })).filter((item) => item.height === min);
        const target = candidates[bodyCursor % candidates.length]?.column || 0;
        bodyCursor += 1;
        x = horizontalMargin + target * (columnWidth + gap);
        y = heights[target];
        heights[target] = y + blockHeight + blockGap;
      }
      if (details) {
        const renderLines = wrapped.lines.map((renderLine, lineIndex) => {
          const chars = wrapped.graphemes.slice(renderLine.start, renderLine.end);
          const offsets = [0];
          let prefix = "";
          chars.forEach((char) => {
            prefix += char;
            offsets.push(measure(prefix, wrapped.font));
          });
          return {
            ...renderLine,
            graphemes: chars,
            offsets,
            left: variant === "hero" ? Math.max((blockWidth - renderLine.width) * 0.08, 0) : 0,
            top: lineIndex * lineHeight,
          };
        });
        blocks.push({
          id: `fume-${line.startMs}-${index}`,
          sourceLineIndex: index,
          line,
          variant,
          x,
          y,
          width: blockWidth,
          height: blockHeight,
          fontPx,
          lineHeight,
          font: wrapped.font,
          graphemes: wrapped.graphemes,
          renderLines,
          wordRanges: buildWordRanges(line, wrapped.graphemes),
        });
      }
    });
    const height = Math.max(0, ...heights) + verticalMargin;
    return {
      width: paperWidth + horizontalMargin * 2,
      height,
      columns,
      gap,
      paperBounds: { left: horizontalMargin, top: verticalMargin, right: horizontalMargin + paperWidth, bottom: Math.max(height - verticalMargin, verticalMargin) },
      blocks,
    };
  }

  function buildArticleLayout(lines, viewport, fontScale = 1, rawTuning = {}) {
    if (!lines?.length || viewport.width <= 0 || viewport.height <= 0) return null;
    const tuning = resolveTuning(rawTuning);
    const paperWidth = clamp(Math.max(viewport.width * 1.95, viewport.width + 520), 920, 2400);
    const maxColumns = paperWidth >= 1120 ? 4 : paperWidth >= 760 ? 3 : paperWidth >= 500 ? 2 : 1;
    const targetHeight = Math.max(viewport.height, 240) * 2.45;
    let best = null;
    let bestScore = Infinity;
    for (let columns = maxColumns; columns >= 1; columns -= 1) {
      let low = 0.82;
      let high = 1.42;
      const gap = clamp(Math.round(paperWidth * (columns >= 4 ? 0.0065 : columns === 3 ? 0.0085 : 0.0115)), 6, 14);
      for (let iteration = 0; iteration < 8; iteration += 1) {
        const densityScale = (low + high) / 2;
        const options = { paperWidth, columns, gap, densityScale, seedKey: `spotify-fume:${columns}:${paperWidth}` };
        const measured = buildAttempt(lines, viewport, fontScale, tuning, options, false);
        const score = Math.abs(measured.height - targetHeight) + (measured.height < targetHeight ? 0 : (measured.height - targetHeight) * 0.14);
        if (score < bestScore) { bestScore = score; best = options; }
        if (measured.height < targetHeight) low = densityScale;
        else high = densityScale;
      }
    }
    if (!best) return null;
    const article = buildAttempt(lines, viewport, fontScale, tuning, best, true);
    article.chronologicalBlocks = [...article.blocks].sort((a, b) => a.sourceLineIndex - b.sourceLineIndex);
    article.blockBySourceLineIndex = new Map(article.blocks.map((block) => [block.sourceLineIndex, block]));
    return article;
  }

  function printedProgress(block, timeMs) {
    if (timeMs < block.line.startMs) return 0;
    if (timeMs >= block.line.endMs) return block.graphemes.length;
    if (!block.wordRanges.length) {
      return clamp((timeMs - block.line.startMs) / Math.max(block.line.endMs - block.line.startMs, 120), 0, 1) * block.graphemes.length;
    }
    let printed = 0;
    for (const range of block.wordRanges) {
      if (timeMs < range.word.startMs) return printed;
      const progress = clamp((timeMs - range.word.startMs) / Math.max(range.word.endMs - range.word.startMs, 80), 0, 1);
      printed = range.start + progress * Math.max(range.end - range.start, 0);
      if (progress < 1) return clamp(printed, 0, block.graphemes.length);
    }
    return block.graphemes.length;
  }

  function focusPoint(block, progress, stepped) {
    const offset = clamp(stepped ? Math.floor(progress) : progress, 0, block.graphemes.length);
    const line = block.renderLines.find((item) => offset <= item.end) || block.renderLines[block.renderLines.length - 1];
    if (!line) return { x: block.x + block.width / 2, y: block.y + block.height / 2 };
    const local = clamp(offset - line.start, 0, line.graphemes.length);
    const base = Math.floor(local);
    const fraction = local - base;
    const x = (line.offsets[base] || 0) + ((line.offsets[base + 1] || line.offsets[base] || 0) - (line.offsets[base] || 0)) * fraction;
    return { x: block.x + line.left + clamp(x, 0, line.width), y: block.y + line.top + block.lineHeight / 2 };
  }

  function cameraTarget(article, activeIndex, timeMs, viewport, tuning) {
    const block = article.blockBySourceLineIndex.get(activeIndex) || article.chronologicalBlocks.find((item) => timeMs <= item.line.endMs) || article.chronologicalBlocks[article.chronologicalBlocks.length - 1];
    if (!block) return { x: article.width / 2, y: article.height / 2, scale: 0.5 };
    const last = article.chronologicalBlocks[article.chronologicalBlocks.length - 1];
    if (last && timeMs >= last.line.startMs + (last.line.endMs - last.line.startMs) * 0.5) {
      const width = article.paperBounds.right - article.paperBounds.left + clamp(viewport.width * 0.4, 240, 560);
      const height = article.paperBounds.bottom - article.paperBounds.top + clamp(viewport.height * 0.4, 192, 440);
      return {
        x: (article.paperBounds.left + article.paperBounds.right) / 2,
        y: (article.paperBounds.top + article.paperBounds.bottom) / 2,
        scale: clamp(Math.min(viewport.width / width, viewport.height / height), 0.22, 0.72),
      };
    }
    const point = focusPoint(block, printedProgress(block, timeMs), tuning.cameraTrackingMode === "stepped");
    const targetLineHeight = clamp(Math.min(viewport.width, viewport.height) * 0.115, 64, 124);
    return { ...point, scale: clamp(targetLineHeight / Math.max(block.lineHeight, 1), 0.88, 2.2) };
  }

  function rgba(color, alpha) {
    const hex = String(color || "").replace("#", "");
    if (/^[0-9a-f]{6}$/i.test(hex)) {
      return `rgba(${parseInt(hex.slice(0, 2), 16)},${parseInt(hex.slice(2, 4), 16)},${parseInt(hex.slice(4, 6), 16)},${alpha})`;
    }
    return `rgba(217,255,103,${alpha})`;
  }

  function drawBackground(context, viewport, camera, article, accent, tuning, now) {
    const gradient = context.createRadialGradient(viewport.width * 0.5, viewport.height * 0.44, 0, viewport.width * 0.5, viewport.height * 0.5, Math.max(viewport.width, viewport.height) * 0.72);
    gradient.addColorStop(0, "rgba(18,20,18,.12)");
    gradient.addColorStop(1, "rgba(0,0,0,.58)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, viewport.width, viewport.height);
    if (tuning.disableGeometricBackground) return;
    context.save();
    context.globalAlpha = tuning.backgroundObjectOpacity * 0.32;
    for (let index = 0; index < 9; index += 1) {
      const phase = now * 0.00008 * (index % 2 ? 1 : -1) + index;
      const x = viewport.width * (0.5 + Math.sin(phase) * 0.55);
      const y = viewport.height * (0.5 + Math.cos(phase * 1.3) * 0.48);
      context.strokeStyle = index % 3 ? "rgba(255,255,255,.16)" : rgba(accent, 0.28);
      context.lineWidth = 1;
      context.strokeRect(x - 40 - index * 3, y - 28 - index * 2, 80 + index * 6, 56 + index * 4);
    }
    context.restore();
  }

  function glyphTiming(block, globalIndex) {
    const range = block.wordRanges.find((item) => globalIndex >= item.start && globalIndex < item.end);
    if (!range) return { start: block.line.startMs, end: block.line.endMs };
    const length = Math.max(range.end - range.start, 1);
    const local = globalIndex - range.start;
    const duration = Math.max(range.word.endMs - range.word.startMs, 1);
    return { start: range.word.startMs + duration * local / length, end: range.word.startMs + duration * (local + 1) / length };
  }

  function drawBlock(context, block, timeMs, accent, tuning, songSpan) {
    const active = timeMs >= block.line.startMs && timeMs <= block.line.endMs;
    const passed = timeMs > block.line.endMs;
    const progress = printedProgress(block, timeMs);
    let passedAlpha = block.variant === "hero" ? 0.74 : 0.58;
    if (passed && tuning.textHoldRatio < 1) {
      const fade = clamp((timeMs - block.line.endMs) / clamp(songSpan * tuning.textHoldRatio, 2400, 130000), 0, 1);
      passedAlpha = mix(passedAlpha, block.variant === "hero" ? 0.11 : 0.075, fade * fade * fade);
    }
    context.font = block.font;
    context.textAlign = "left";
    context.textBaseline = "middle";
    block.renderLines.forEach((line) => {
      line.graphemes.forEach((char, localIndex) => {
        const globalIndex = line.start + localIndex;
        const x = block.x + line.left + line.offsets[localIndex];
        const y = block.y + line.top + block.lineHeight * 0.5;
        const timing = glyphTiming(block, globalIndex);
        const glyphProgress = passed ? 1 : clamp(progress - globalIndex, 0, 1);
        const smoothGlyphProgress = glyphProgress * glyphProgress * (3 - 2 * glyphProgress);
        const recentlyActive = timeMs >= timing.start && timeMs <= timing.end + Math.max(timing.end - timing.start, 80) * 0.45;
        const alpha = passed ? passedAlpha : active ? 0.08 + smoothGlyphProgress * 0.88 : 0.04;
        context.fillStyle = recentlyActive ? rgba(accent, alpha) : `rgba(248,250,247,${alpha})`;
        if (recentlyActive) {
          context.shadowColor = rgba(accent, 0.72);
          context.shadowBlur = (5 + block.fontPx * 0.28) * tuning.glowIntensity;
        } else if (passed && tuning.glowIntensity > 0) {
          context.shadowColor = rgba(accent, 0.1 * tuning.glowIntensity);
          context.shadowBlur = 2 + block.fontPx * 0.05 * tuning.glowIntensity;
        } else {
          context.shadowColor = "transparent";
          context.shadowBlur = 0;
        }
        context.save();
        context.translate(x, y + (1 - smoothGlyphProgress) * 5);
        context.scale(.97 + smoothGlyphProgress * .03, .97 + smoothGlyphProgress * .03);
        context.fillText(char, 0, 0);
        context.restore();
        if (!tuning.hidePrintSymbols && active && char.trim() && timeMs >= timing.start - 90 && timeMs <= timing.start + 130) {
          const stamp = 1 - clamp(Math.abs(timeMs - timing.start) / 130, 0, 1);
          context.save();
          context.globalAlpha = stamp * 0.7;
          context.strokeStyle = rgba(accent, 0.8);
          context.lineWidth = 1 / Math.max(1, block.fontPx / 24);
          context.strokeRect(x - 2, y - block.fontPx * 0.72 - stamp * 8, Math.max(line.offsets[localIndex + 1] - line.offsets[localIndex], 4) + 4, block.fontPx * 0.2);
          context.restore();
        }
      });
    });
    context.shadowBlur = 0;
    context.shadowColor = "transparent";
  }

  function FumeCanvas({ article, viewport, timeMs, activeIndex, accent, tuning, visible }) {
    const canvasRef = useRef(null);
    const live = useRef({ timeMs, activeIndex, tuning, visible });
    live.current = { timeMs, activeIndex, tuning, visible };
    const cameraRef = useRef(null);
    useEffect(() => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context || !article || !viewport.width || !viewport.height) return undefined;
      const ratio = clamp(window.devicePixelRatio || 1, 1, 2);
      canvas.width = Math.round(viewport.width * ratio);
      canvas.height = Math.round(viewport.height * ratio);
      let frame = 0;
      let last = performance.now();
      const first = article.chronologicalBlocks[0];
      const lastBlock = article.chronologicalBlocks[article.chronologicalBlocks.length - 1];
      const songSpan = Math.max((lastBlock?.line.endMs || 0) - (first?.line.startMs || 0), 2400);
      const draw = (now) => {
        const dt = clamp((now - last) / 1000, 0, 0.08);
        last = now;
        const state = live.current;
        const target = cameraTarget(article, state.activeIndex, state.timeMs, viewport, state.tuning);
        if (!cameraRef.current) cameraRef.current = { ...target };
        const camera = cameraRef.current;
        const amount = 1 - Math.exp(-dt * 8 * state.tuning.cameraSpeed);
        camera.x = mix(camera.x, target.x, amount);
        camera.y = mix(camera.y, target.y, amount);
        camera.scale = mix(camera.scale, target.scale, amount);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.clearRect(0, 0, viewport.width, viewport.height);
        drawBackground(context, viewport, camera, article, accent, state.tuning, now);
        context.save();
        context.translate(viewport.width / 2, viewport.height / 2);
        context.scale(camera.scale, camera.scale);
        context.translate(-camera.x, -camera.y);
        context.fillStyle = "rgba(10,11,10,.2)";
        context.fillRect(article.paperBounds.left, article.paperBounds.top, article.paperBounds.right - article.paperBounds.left, article.paperBounds.bottom - article.paperBounds.top);
        article.blocks.forEach((block) => drawBlock(context, block, state.timeMs, accent, state.tuning, songSpan));
        context.restore();
        if (state.visible !== false) frame = requestAnimationFrame(draw);
      };
      frame = requestAnimationFrame(draw);
      return () => cancelAnimationFrame(frame);
    }, [article, viewport.width, viewport.height, accent, visible]);
    return h("canvas", { ref: canvasRef, className: "folia-fume-faithful__canvas", "aria-hidden": "true" });
  }

  function FumeStage({ lyrics, activeIndex, timeMs, showTranslation, accent, settings, visible }) {
    const hostRef = useRef(null);
    const [viewport, setViewport] = useState({ width: 0, height: 0 });
    useEffect(() => {
      const host = hostRef.current;
      if (!host) return undefined;
      const observer = new ResizeObserver(([entry]) => {
        if (!entry) return;
        setViewport({ width: entry.contentRect.width, height: entry.contentRect.height });
      });
      observer.observe(host);
      return () => observer.disconnect();
    }, []);
    const tuning = resolveTuning(settings.fumeTuning);
    const article = useMemo(
      () => buildArticleLayout(lyrics.lines, viewport, settings.fontScale || 1, tuning),
      [lyrics.lines, viewport.width, viewport.height, settings.fontScale, tuning.heroScale],
    );
    const line = lyrics.lines[Math.max(0, activeIndex)] || lyrics.lines[0];
    const upcoming = lyrics.lines.slice(activeIndex + 1, activeIndex + 3);
    return h("section", { ref: hostRef, className: "folia-fume-faithful" },
      article && h(FumeCanvas, { article, viewport, timeMs, activeIndex, accent, tuning, visible }),
      !article && h("div", { className: "folia-fume-faithful__loading" }, h("span"), h("span"), h("span")),
      h("div", { className: "folia-fume-faithful__subtitles" },
        showTranslation && line?.translation && h("div", { className: "folia-fume-faithful__translation" }, line.translation),
        upcoming.map((next, index) => h("div", { key: next.startMs, className: `folia-fume-faithful__upcoming is-${index + 1}` }, next.text)),
      ),
    );
  }

  return { FumeStage, buildArticleLayout, cameraTarget, chooseNaturalVariant, printedProgress, resolveTuning };
})();
