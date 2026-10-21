const FoliaEnglishCinematicStage = (() => {
  const React = Spicetify.React;
  const { useEffect, useMemo, useRef } = React;
  const h = React.createElement;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const smooth = (value) => { const x = clamp(value, 0, 1); return x * x * (3 - 2 * x); };

  function wordsFor(line) {
    if (line?.words?.length) return line.words;
    const parts = String(line?.text || "").match(/\S+\s*/g) || [];
    const start = Number(line?.startMs) || 0;
    const duration = Math.max(Number(line?.endMs || 0) - start, 800);
    return parts.map((text, index) => ({
      text,
      startMs: start + duration * index / Math.max(parts.length, 1),
      endMs: start + duration * (index + 1) / Math.max(parts.length, 1),
    }));
  }

  function activeWordIndex(words, timeMs, lineEnd) {
    const index = words.findIndex(word => timeMs < (Number(word.endMs) || lineEnd));
    return index < 0 ? Math.max(0, words.length - 1) : index;
  }

  function seeded(value) {
    let hash = 2166136261;
    for (const char of String(value || "")) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    return Math.abs(hash >>> 0) / 4294967295;
  }

  function drawKineticLyrics(ctx, width, height, latest, energy, pulse, time) {
    const words = latest.words || [];
    if (!words.length) return;
    const activeIndex = latest.activeIndex ?? 0;
    const scene = latest.scene ?? 0;
    const progress = clamp(latest.wordProgress || 0, 0, 1);
    const scale = Math.min(width / 1280, height / 720);
    const centerX = width * .5;
    const centerY = height * .5;
    const accent = latest.accent || "#8adfff";
    const tuning = latest.tuning || {};
    const motion = Number.isFinite(Number(tuning.motionAmount)) ? Number(tuning.motionAmount) : 1;
    const spread = Number.isFinite(Number(tuning.wordSpread)) ? Number(tuning.wordSpread) : 1;
    const ghost = Number.isFinite(Number(tuning.ghostIntensity)) ? Number(tuning.ghostIntensity) : 1;
    const showContextWords = tuning.showContextWords !== false;
    const activeText = String(words[activeIndex]?.text || latest.lineText || "").trim();
    const activeSize = Math.max(44, Math.min(184, 150 * scale * (activeText.length > 14 ? 14 / activeText.length : 1)));
    const drawWord = (text, x, y, size, alpha, rotation = 0, active = false, ghost = false) => {
      if (!text) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.font = `${active ? 800 : 620} ${size}px Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = alpha;
      if (active) {
        ctx.shadowBlur = 24 + energy * 44 + pulse * 22;
        ctx.shadowColor = accent;
        ctx.fillStyle = "#f8fbff";
      } else if (ghost) {
        ctx.shadowBlur = 18;
        ctx.shadowColor = accent;
        ctx.strokeStyle = accent;
        ctx.lineWidth = Math.max(1, size * .018);
        ctx.strokeText(text, 0, 0);
      } else {
        ctx.fillStyle = `rgba(225, 239, 248, ${Math.min(1, alpha + .12)})`;
      }
      if (!ghost) ctx.fillText(text, 0, 0);
      ctx.restore();
    };
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    if (scene === 0) {
      // Words orbit the current word, then settle into a diagonal composition.
      showContextWords && words.slice(0, 12).forEach((word, index) => {
        if (index === activeIndex) return;
        const offset = index - activeIndex;
        const angle = offset * .5 + time * .18 * motion;
        const radius = Math.min(width, height) * (.24 + Math.abs(offset) * .035 * spread);
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius * .72 + offset * 12;
        drawWord(String(word.text).trim(), x, y, 28 * scale, .2, angle * .16, false);
      });
      drawWord(activeText, centerX + Math.sin(time * .8 * motion) * (12 + energy * 18 * motion), centerY - progress * 42 * motion, activeSize, .96, Math.sin(time * .4 * motion) * .03, true);
      drawWord(activeText, centerX - 32 - progress * 40 * spread, centerY + 34, activeSize * .72, (1 - progress) * .3 * ghost, -.06, false, true);
    } else if (scene === 1) {
      // A vertical kinetic stack: the active word climbs through the sentence.
      words.slice(0, 12).forEach((word, index) => {
        if (index !== activeIndex && !showContextWords) return;
        const offset = index - activeIndex;
        const x = centerX + Math.sin(time * .55 * motion + index * .7) * (26 + energy * 30 * motion) + offset * 16 * spread;
        const y = centerY + offset * Math.min(78, height * .1) * spread - progress * 54 * motion;
        const active = index === activeIndex;
        drawWord(String(word.text).trim(), x, y, active ? activeSize * .82 : 32 * scale, active ? .98 : .2, (index % 2 ? 1 : -1) * (.04 + energy * .02), active);
      });
      ctx.strokeStyle = accent;
      ctx.globalAlpha = .22 + energy * .35;
      ctx.lineWidth = 1 + pulse * 2;
      ctx.beginPath(); ctx.moveTo(centerX, height * .08); ctx.lineTo(centerX, height * .92); ctx.stroke();
    } else if (scene === 2) {
      // Words travel across the entire viewport on a rising diagonal track.
      const startX = -Math.min(width * .32, 420);
      words.slice(0, 14).forEach((word, index) => {
        if (index !== activeIndex && !showContextWords) return;
        const active = index === activeIndex;
        const x = startX + index * Math.max(84, width * .095) * spread - progress * width * .18 * motion;
        const y = height * .28 + index * Math.min(42, height * .06) * spread + Math.sin(time * .7 * motion + index) * (14 + energy * 24 * motion);
        drawWord(String(word.text).trim(), x, y, active ? activeSize * .62 : 28 * scale, active ? .98 : .24, -.08 + index * .012, active);
      });
      ctx.strokeStyle = accent;
      ctx.globalAlpha = .38 + energy * .3;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, height * .76); ctx.lineTo(width, height * .24); ctx.stroke();
    } else {
      // Spiral layout: the sentence expands from the active word into a full-screen orbit.
      showContextWords && words.slice(0, 14).forEach((word, index) => {
        if (index === activeIndex) return;
        const offset = index - activeIndex;
        const angle = offset * .72 + time * .12 * motion;
        const radius = Math.min(width, height) * (.12 + Math.abs(offset) * .085 * spread + progress * .06 * motion);
        drawWord(String(word.text).trim(), centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius, 27 * scale, .2, angle + Math.PI / 2, false);
      });
      ctx.beginPath();
      ctx.arc(centerX, centerY, Math.min(width, height) * (.2 + energy * .05), 0, Math.PI * 2);
      ctx.strokeStyle = accent;
      ctx.globalAlpha = .25 + pulse * .5;
      ctx.lineWidth = 2 + pulse * 3;
      ctx.stroke();
      drawWord(activeText, centerX, centerY - progress * 30, activeSize * .78, .98, Math.sin(time * .3) * .02, true);
    }
    ctx.restore();
  }

  function EnglishLightCanvas({ timeMs, cover, audioSignals, visible, seed, words, activeIndex, lineText, wordProgress, scene, accent, tuning }) {
    const canvasRef = useRef(null);
    const stateRef = useRef({ time: 0, last: 0, latest: {} });
    stateRef.current.latest = { timeMs, audioSignals, visible, seed, words, activeIndex, lineText, wordProgress, scene, accent, tuning };

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return undefined;
      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) return undefined;
      const state = stateRef.current;
      let frame = 0;
      let running = true;
      const image = new Image();
      image.crossOrigin = "anonymous";
      if (cover) image.src = cover;
      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
        canvas.width = Math.max(1, Math.round(rect.width * ratio));
        canvas.height = Math.max(1, Math.round(rect.height * ratio));
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      };
      const observer = new ResizeObserver(resize);
      observer.observe(canvas);
      resize();
      const draw = (now) => {
        if (!running) return;
        const rect = canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const dt = Math.min(0.05, (now - (state.last || now)) / 1000);
        state.last = now;
        const latest = state.latest;
        if (latest.visible && !document.hidden) state.time += dt;
        const sample = latest.audioSignals?.sample?.((latest.timeMs || 0) / 1000) || {};
        const response = Number.isFinite(Number(latest.tuning?.audioResponse)) ? Number(latest.tuning.audioResponse) : 1;
        const intensity = latest.tuning?.animationIntensity === "calm" ? .68 : latest.tuning?.animationIntensity === "chaotic" ? 1.35 : 1;
        const energy = clamp(((sample.power || 0) * .38 + (sample.bass || 0) * .22 + (sample.lowMid || 0) * .14 + (sample.mid || 0) * .12 + (sample.vocal || 0) * .08 + (sample.treble || 0) * .06) * response * intensity, 0, 1);
        const pulse = clamp(((sample.beat || 0) * .55 + (sample.tatum || 0) * .2 + (sample.bar || 0) * .25) * response * intensity, 0, 1);
        const barPulse = clamp((sample.bar || 0) * response * intensity, 0, 1);
        const cameraSpeed = Number.isFinite(Number(latest.tuning?.cameraSpeed)) ? Number(latest.tuning.cameraSpeed) : 1;
        const t = state.time * cameraSpeed;
        ctx.clearRect(0, 0, width, height);
        const bg = ctx.createLinearGradient(0, 0, width, height);
        bg.addColorStop(0, "#05070d");
        bg.addColorStop(.48, "#11152a");
        bg.addColorStop(1, "#09050d");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);
        if (image.complete && image.naturalWidth) {
          const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
          ctx.save();
          ctx.globalAlpha = .14 + energy * .06;
          ctx.filter = `blur(${28 + energy * 16}px) saturate(1.4)`;
          ctx.drawImage(image, (width - image.naturalWidth * scale) / 2, (height - image.naturalHeight * scale) / 2, image.naturalWidth * scale, image.naturalHeight * scale);
          ctx.restore();
        }
        const lowWave = clamp((sample.bass || 0) * .7 + (sample.lowMid || 0) * .3, 0, 1);
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = .08 + lowWave * .2;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1 + lowWave * 3;
        for (let wave = 0; wave < 5; wave += 1) {
          ctx.beginPath();
          for (let x = -20; x <= width + 20; x += 18) {
            const y = height * (.78 + wave * .035) + Math.sin(x * .012 + t * (.8 + wave * .12)) * (8 + lowWave * 34) + Math.sin(x * .028 - t * .5) * 5;
            if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.restore();
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = .035 + (sample.vocal || 0) * .12;
        for (let haze = 0; haze < 4; haze += 1) {
          const hx = width * (.2 + haze * .2 + Math.sin(t * .18 + haze) * .08);
          const hy = height * (.3 + Math.cos(t * .23 + haze) * .18);
          const hr = Math.min(width, height) * (.22 + (sample.mid || 0) * .18);
          const hazeGradient = ctx.createRadialGradient(hx, hy, 0, hx, hy, hr);
          hazeGradient.addColorStop(0, `${accent}38`);
          hazeGradient.addColorStop(1, "transparent");
          ctx.fillStyle = hazeGradient;
          ctx.beginPath(); ctx.arc(hx, hy, hr, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
        const cx = width * (.5 + Math.sin(t * .16 + latest.seed * 7) * .08);
        const cy = height * (.48 + Math.cos(t * .13 + latest.seed * 4) * .06);
        for (let beam = 0; beam < 8; beam += 1) {
          const angle = -1.2 + beam * .34 + Math.sin(t * .18 + beam) * .035;
          const spread = 90 + energy * 100 + pulse * 150;
          const gradient = ctx.createLinearGradient(cx, cy, cx + Math.cos(angle) * width, cy + Math.sin(angle) * width);
          gradient.addColorStop(0, beam % 2 ? "rgba(95,211,255,.12)" : "rgba(255,92,190,.1)");
          gradient.addColorStop(.55, "rgba(255,255,255,.015)");
          gradient.addColorStop(1, "transparent");
          ctx.save();
          ctx.globalCompositeOperation = "screen";
          const beamIntensity = Number.isFinite(Number(latest.tuning?.beamIntensity)) ? Number(latest.tuning.beamIntensity) : 1;
          ctx.globalAlpha = (.55 + energy * .35) * beamIntensity;
          ctx.translate(cx, cy);
          ctx.rotate(angle);
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.moveTo(0, -spread * .04);
          ctx.lineTo(width * 1.1, -spread);
          ctx.lineTo(width * 1.1, spread);
          ctx.lineTo(0, spread * .04);
          ctx.fill();
          ctx.restore();
        }
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        const particleAmount = Number.isFinite(Number(latest.tuning?.particleAmount)) ? Number(latest.tuning.particleAmount) : 1;
        const particleCount = Math.round((24 + 52 * particleAmount + (sample.treble || 0) * 28) * Math.min(1, particleAmount * 2));
        for (let particle = 0; particle < particleCount; particle += 1) {
          const phase = latest.seed * 30 + particle * 1.618;
          const x = width * (.08 + ((Math.sin(phase) + 1) / 2) * .84);
          const y = height * (.1 + ((Math.cos(phase * 1.7 + t * (.08 + particle % 3 * .03)) + 1) / 2) * .78);
          const radius = 1 + ((particle * 7) % 4) + pulse * 2 + (sample.treble || 0) * 2;
          ctx.fillStyle = particle % 3 === 0 ? "rgba(255,183,110,.65)" : "rgba(119,219,255,.58)";
          ctx.globalAlpha = .18 + energy * .45;
          ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = .08 + (sample.treble || 0) * .18;
        ctx.strokeStyle = "rgba(255,255,255,.55)";
        ctx.lineWidth = 1;
        const scanY = ((t * 80 + (sample.tatum || 0) * height * .4) % (height + 160)) - 80;
        ctx.beginPath(); ctx.moveTo(0, scanY); ctx.lineTo(width, scanY - height * .14); ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = .16 + energy * .24 + barPulse * .16;
        ctx.strokeStyle = pulse > .45 ? "rgba(255,255,255,.32)" : "rgba(126,216,255,.22)";
        ctx.lineWidth = 1;
        const ringRadius = Math.min(width, height) * (.16 + energy * .12);
        for (let ring = 0; ring < 4; ring += 1) {
          ctx.beginPath();
          ctx.arc(cx, cy, ringRadius + ring * 42 + Math.sin(t * .7 + ring) * 8, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
        if (barPulse > .05) {
          ctx.save();
          ctx.globalCompositeOperation = "screen";
          ctx.globalAlpha = barPulse * .12;
          ctx.fillStyle = accent;
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        }
        drawKineticLyrics(ctx, width, height, latest, energy, pulse, t);
        frame = requestAnimationFrame(draw);
      };
      frame = requestAnimationFrame(draw);
      return () => { running = false; cancelAnimationFrame(frame); observer.disconnect(); image.src = ""; };
    }, [cover]);
    return h("canvas", { ref: canvasRef, className: "folia-english-cinematic__canvas", "aria-hidden": "true" });
  }

  function EnglishStage({ lyrics, activeIndex, timeMs, showTranslation, accent, playback, audioSignals, visible, settings }) {
    const line = lyrics.lines[Math.max(0, activeIndex)] || lyrics.lines[0] || { text: "" };
    const words = useMemo(() => wordsFor(line), [line]);
    const lineStart = Number(line.startMs) || 0;
    const lineEnd = Math.max(lineStart + 500, Number(line.endMs) || lineStart + 1200);
    const focusedIndex = activeWordIndex(words, timeMs, lineEnd);
    const focusedWord = String(words[focusedIndex]?.text || line.text || "").trim();
    const wordStart = Number(words[focusedIndex]?.startMs) || lineStart;
    const wordEnd = Math.max(wordStart + 80, Number(words[focusedIndex]?.endMs) || lineEnd);
    const wordProgress = smooth((timeMs - wordStart + 70) / Math.max(wordEnd - wordStart + 70, 180));
    const before = words.slice(Math.max(0, focusedIndex - 2), focusedIndex).map(word => String(word.text || "").trim()).join(" ");
    const after = words.slice(focusedIndex + 1, focusedIndex + 3).map(word => String(word.text || "").trim()).join(" ");
    const stageSeed = useMemo(() => seeded(line.text), [line.text]);
    const scene = Math.floor(stageSeed * 1000) % 4;
    const tuning = settings?.englishTuning || {};
    return h("section", { className: `folia-english-cinematic scene-${scene}`, style: { "--english-accent": accent || "#8adfff" } },
      h(EnglishLightCanvas, { timeMs, cover: playback?.cover, audioSignals, visible, seed: stageSeed, words, activeIndex: focusedIndex, lineText: line.text, wordProgress, scene, accent, tuning }),
      h("div", { className: "folia-english-cinematic__veil" }),
      tuning.showHud !== false && h("div", { className: "folia-english-cinematic__hud" },
        h("div", { className: "folia-english-cinematic__label" }, "ENGLISH / LIVE LYRIC"),
        h("div", { className: "folia-english-cinematic__line-number" }, String(activeIndex + 1).padStart(2, "0")),
      ),
      h("div", { className: "folia-english-cinematic__focus" },
        tuning.showContextWords !== false && h("div", { className: "folia-english-cinematic__context" }, before),
        h("div", { className: "folia-english-cinematic__word-stack", key: `${focusedIndex}-${focusedWord}` },
          h("div", { className: "folia-english-cinematic__word folia-english-cinematic__word--ghost", style: { "--english-word-progress": wordProgress, "--english-ghost": 1 } }, focusedWord),
          h("div", { className: "folia-english-cinematic__word folia-english-cinematic__word--ghost", style: { "--english-word-progress": wordProgress, "--english-ghost": 2 } }, focusedWord),
          h("div", { className: "folia-english-cinematic__word", style: { "--english-word-progress": wordProgress, "--english-accent": accent } }, focusedWord),
        ),
        tuning.showContextWords !== false && h("div", { className: "folia-english-cinematic__context" }, after),
        tuning.showFullLine !== false && h("div", { className: "folia-english-cinematic__full-line" }, line.text),
      ),
      h("div", { className: "folia-english-cinematic__bottom" },
        h("div", { className: "folia-english-cinematic__translation" }, showTranslation && line.translation ? line.translation : ""),
        h("div", { className: "folia-english-cinematic__next" }, lyrics.lines[activeIndex + 1]?.text || ""),
      ),
    );
  }

  return { EnglishStage, wordsFor, activeWordIndex };
})();
