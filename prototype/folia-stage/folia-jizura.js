const FoliaJizuraStage = (() => {
  const React = Spicetify.React;
  const { useEffect, useMemo, useRef } = React;
  const h = React.createElement;
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, Number(value) || 0));

  function hash(value) {
    let result = 2166136261;
    for (const char of String(value || "")) result = Math.imul(result ^ char.codePointAt(0), 16777619);
    return result >>> 0;
  }

  const scenes = [
    { id: "storm", color: "#9cb9ff", match: /\b(rain|storm|thunder|tears|cry|crying)\b|\u96e8|\u6cea|\u54ed|\u96f7/giu },
    { id: "ember", color: "#ffb39e", match: /\b(fire|burn|burning|flame|sun|sunrise)\b|\u706b|\u71c3|\u70ed|\u65e5\u51fa/giu },
    { id: "neon", color: "#e7a9d8", match: /\b(city|street|neon|train|dance|dancing)\b|\u57ce|\u8857|\u9713\u8679|\u5217\u8f66|\u8df3\u821e/giu },
    { id: "sky", color: "#b4dbf3", match: /\b(star|stars|sky|moon|light|fly|flying|satellites|constellation)\b|\u661f|\u5929\u7a7a|\u6708|\u5149|\u98de/giu },
    { id: "quiet", color: "#d5d2e8", match: /\b(silence|quiet|dream|dreams|sleep|alone|remember)\b|\u5b89\u9759|\u68a6|\u5b64\u72ec|\u56de\u5fc6/giu },
  ];

  function sceneFor(text, mode = "auto") {
    if (mode !== "auto") return scenes.find(scene => scene.id === mode) || scenes[3];
    let best = scenes[3];
    let score = 0;
    for (const scene of scenes) {
      const count = Array.from(String(text || "").matchAll(scene.match)).length;
      if (count > score) { best = scene; score = count; }
    }
    return best;
  }

  function wordsFor(line) {
    if (Array.isArray(line?.words) && line.words.length) return line.words;
    const text = String(line?.text || "");
    const matches = text.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]\s*|[^\s\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]+\s*/gu) || [];
    const start = Number(line?.startMs) || 0;
    const end = Math.max(start + 700, Number(line?.endMs) || start + 1800);
    return matches.map((word, index) => ({
      text: word,
      startMs: start + (end - start) * index / Math.max(1, matches.length),
      endMs: start + (end - start) * (index + 1) / Math.max(1, matches.length),
    }));
  }

  function shotAt(line, timeMs, cutSpeed = 1, layoutMode = "auto", lineIndex = 0) {
    const start = Number(line?.startMs) || 0;
    const elapsed = Math.max(0, timeMs - start);
    const interval = 2700 / clamp(cutSpeed, .5, 2);
    const cycle = Math.floor(elapsed / interval);
    const base = hash(`${line?.text || ""}:${lineIndex}`) % 5;
    if (layoutMode === "wide") return { index: (base + cycle) % 5, layout: "wide", cycle };
    if (layoutMode === "vertical") return { index: (base + cycle) % 5, layout: "vertical", cycle };
    return { index: (base + cycle) % 5, layout: ["wide", "vertical", "center", "diagonal", "split"][(base + cycle) % 5], cycle };
  }

  function JizuraCanvas({ cover, accent, scene, audioSignals, timeMs, visible, paused, tuning }) {
    const canvasRef = useRef(null);
    const latestRef = useRef({});
    latestRef.current = { accent, scene, audioSignals, timeMs, visible, paused, tuning };

    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d", { alpha: true });
      if (!ctx) return undefined;
      const image = new Image();
      image.crossOrigin = "anonymous";
      if (cover) image.src = cover;
      let frame = 0;
      let running = true;
      let elapsed = 0;
      let previous = 0;
      let width = 1;
      let height = 1;
      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
        width = Math.max(1, rect.width);
        height = Math.max(1, rect.height);
        canvas.width = Math.max(1, Math.round(width * ratio));
        canvas.height = Math.max(1, Math.round(height * ratio));
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      };
      const observer = new ResizeObserver(resize);
      observer.observe(canvas);
      resize();

      const draw = (now) => {
        if (!running) return;
        const dt = Math.min(.05, Math.max(0, (now - (previous || now)) / 1000));
        previous = now;
        const current = latestRef.current;
        if (current.visible === false || document.hidden) {
          frame = requestAnimationFrame(draw);
          return;
        }
        if (!current.paused) elapsed += dt;
        const sample = current.audioSignals?.sample?.((current.timeMs || 0) / 1000) || {};
        const response = Number.isFinite(Number(current.tuning?.beatResponse)) ? Number(current.tuning.beatResponse) : 1;
        const intensity = Number.isFinite(Number(current.tuning?.motionIntensity)) ? Number(current.tuning.motionIntensity) : 1;
        const low = clamp(((sample.bass || 0) * .65 + (sample.lowMid || 0) * .35) * response);
        const high = clamp((sample.treble || 0) * response);
        const pulse = clamp((sample.beat * .58 + sample.tatum * .16 + sample.bar * .26) * response);
        const energy = clamp((sample.power * .4 + low * .28 + sample.mid * .17 + high * .15) * response);
        const color = current.scene?.color || current.accent || "#a8ddff";
        const sceneId = current.scene?.id || "sky";
        const t = elapsed * intensity;
        ctx.clearRect(0, 0, width, height);
        const background = ctx.createLinearGradient(0, 0, width, height);
        background.addColorStop(0, "#070912");
        background.addColorStop(.48, "#101426");
        background.addColorStop(1, "#090910");
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, width, height);

        if (image.complete && image.naturalWidth) {
          const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
          ctx.save();
          ctx.globalAlpha = .09 + energy * .1;
          ctx.filter = `blur(${32 + low * 22}px) saturate(1.35)`;
          ctx.drawImage(image, (width - image.naturalWidth * scale) / 2, (height - image.naturalHeight * scale) / 2, image.naturalWidth * scale, image.naturalHeight * scale);
          ctx.restore();
        }

        ctx.save();
        ctx.globalCompositeOperation = "screen";
        const centerX = width * (.5 + Math.sin(t * .17) * .11);
        const centerY = height * (.5 + Math.cos(t * .13) * .08);
        for (let beam = 0; beam < (sceneId === "quiet" ? 2 : 6); beam += 1) {
          const angle = t * .08 + beam * Math.PI / 3;
          const radius = Math.max(width, height) * (.55 + energy * .16 + pulse * .12);
          const gradient = ctx.createLinearGradient(centerX, centerY, centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
          gradient.addColorStop(0, `${color}36`);
          gradient.addColorStop(.55, `${color}0d`);
          gradient.addColorStop(1, "transparent");
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 18 + low * 48 + pulse * 70;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
          ctx.stroke();
        }

        const particleScale = Number.isFinite(Number(current.tuning?.particleDensity)) ? Number(current.tuning.particleDensity) : 1;
        const count = Math.round((36 + high * 32) * particleScale);
        const seed = 0x9e3779b9;
        for (let index = 0; index < count; index += 1) {
          const a = Math.sin((index + 1) * seed) * 43758.5453;
          const b = Math.sin((index + 7) * seed * .71) * 24634.6345;
          const x = ((a - Math.floor(a) + t * (.012 + index % 4 * .003)) % 1) * width;
          const speed = sceneId === "storm" ? .24 : sceneId === "ember" ? -.06 : .008;
          const y = (((b - Math.floor(b) + t * (speed + index % 3 * .002)) % 1 + 1) % 1) * height;
          const size = .7 + index % 3 + high * 2 + pulse * 1.5;
          ctx.globalAlpha = .16 + energy * .32 + pulse * .2;
          ctx.fillStyle = index % 5 === 0 ? "#fff2dc" : color;
          ctx.beginPath();
          if (sceneId === "storm") {
            ctx.lineWidth = 1;
            ctx.strokeStyle = color;
            ctx.moveTo(x, y);
            ctx.lineTo(x - 8, y + 24 + high * 28);
            ctx.stroke();
          } else {
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.globalAlpha = .08 + low * .15;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1 + low * 2.5;
        for (let ring = 0; ring < (sceneId === "sky" ? 4 : 0); ring += 1) {
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, width * (.18 + ring * .085 + low * .025), height * (.1 + ring * .065 + low * .02), -.18, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (sceneId === "neon") {
          for (let lane = -6; lane <= 6; lane += 1) {
            ctx.beginPath();
            ctx.moveTo(width * .5, height * .44);
            ctx.lineTo(width * .5 + lane * width * .18, height);
            ctx.stroke();
          }
          for (let row = 0; row < 10; row += 1) {
            const depth = ((row / 10 + t * .1) % 1) ** 2;
            const y = height * (.44 + depth * .56);
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
          }
        }
        ctx.restore();

        if (pulse > .08) {
          ctx.save();
          ctx.globalCompositeOperation = "screen";
          ctx.globalAlpha = pulse * .11;
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        }
        frame = requestAnimationFrame(draw);
      };
      frame = requestAnimationFrame(draw);
      return () => {
        running = false;
        cancelAnimationFrame(frame);
        observer.disconnect();
        image.src = "";
      };
    }, [cover]);

    return h("canvas", { ref: canvasRef, className: "folia-jizura__canvas", "aria-hidden": "true" });
  }

  function JizuraStage({ playback, lyrics, activeIndex, timeMs, showTranslation, accent, visible, audioSignals, settings }) {
    const lineIndex = Math.max(0, activeIndex);
    const line = lyrics.lines[lineIndex] || lyrics.lines[0] || { text: "", startMs: timeMs, endMs: timeMs + 1000 };
    const tuning = settings?.jizuraTuning || {};
    const units = useMemo(() => wordsFor(line), [line]);
    const cutSpeed = Number.isFinite(Number(tuning.cutSpeed)) ? Number(tuning.cutSpeed) : 1;
    const layoutMode = tuning.layoutMode || "auto";
    const shot = shotAt(line, timeMs, cutSpeed, layoutMode, lineIndex);
    const elapsed = Math.max(0, timeMs - (Number(line.startMs) || 0));
    const nextLine = lyrics.lines[lineIndex + 1];
    const seed = hash(`${line.text}:${shot.cycle}`);
    const lineProgress = clamp(elapsed / Math.max(500, (Number(line.endMs) || timeMs + 1800) - (Number(line.startMs) || 0)));
    const fontScale = Number.isFinite(Number(tuning.typographyScale)) ? Number(tuning.typographyScale) : 1;
    const scene = sceneFor(line.text, tuning.sceneMode);
    const frameRef = useRef(null);

    useEffect(() => {
      const frame = frameRef.current;
      const stage = frame?.closest(".folia-jizura");
      const text = frame?.querySelector(".folia-jizura__line");
      if (!stage || !text) return undefined;
      const fit = () => {
        const availableHeight = Math.max(40, stage.clientHeight * .56 - 36);
        const base = (shot.layout === "wide" ? 128 : shot.layout === "vertical" ? 92 : 112) * clamp(fontScale, .65, 1.5);
        let low = 8;
        let high = base;
        // Fit the untransformed text box so active-word motion cannot cause resize feedback.
        for (let i = 0; i < 10; i += 1) {
          const size = (low + high) / 2;
          text.style.fontSize = `${size}px`;
          if (text.scrollWidth > frame.clientWidth || text.offsetHeight > availableHeight) high = size;
          else low = size;
        }
        text.style.fontSize = `${low}px`;
      };
      const observer = new ResizeObserver(fit);
      observer.observe(stage);
      fit();
      return () => observer.disconnect();
    }, [line, shot.layout, shot.cycle, fontScale]);

    return h("section", {
      className: `folia-jizura folia-jizura--${shot.layout} folia-jizura--shot-${shot.index}`,
      style: { "--jizura-accent": scene.color, "--jizura-motion": clamp(tuning.motionIntensity ?? 1, 0, 2), "--jizura-progress": lineProgress },
    },
    h(JizuraCanvas, { cover: playback?.cover, accent, scene, audioSignals, timeMs, visible, paused: playback?.paused, tuning }),
    h("div", { className: "folia-jizura__veil", "aria-hidden": true }),
    tuning.showHud !== false && h("div", { className: "folia-jizura__hud" },
      h("span", null, "JIZURA / LYRIC PV"),
      h("span", null, `CUT ${String(shot.cycle + 1).padStart(2, "0")} · ${String(shot.index + 1).padStart(2, "0")}`),
    ),
    h("div", { ref: frameRef, className: "folia-jizura__frame", key: `${lineIndex}-${shot.cycle}`, style: { animationPlayState: playback?.paused || visible === false ? "paused" : "running" } },
      h("div", { className: "folia-jizura__ghost", "aria-hidden": true }, line.text),
      h("div", { className: "folia-jizura__line", "aria-label": line.text }, units.map((unit, index) => {
        const active = timeMs >= (Number(unit.startMs) || 0) && timeMs < (Number(unit.endMs) || Number(line.endMs) || Infinity);
        const passed = timeMs >= (Number(unit.endMs) || Infinity);
        return h("span", {
          key: `${unit.startMs}-${index}`,
          className: `folia-jizura__unit${active ? " is-active" : passed ? " is-passed" : " is-future"}`,
          style: { "--jizura-unit-index": index, "--jizura-unit-seed": ((seed >>> (index % 24)) % 17) - 8 },
        }, unit.text);
      })),
      h("div", { className: "folia-jizura__rule", "aria-hidden": true }),
    ),
    showTranslation && line.translation && h("div", { className: "folia-jizura__translation" }, line.translation),
    tuning.showUpcoming !== false && nextLine?.text && h("div", { className: "folia-jizura__upcoming" }, nextLine.text),
    );
  }

  return { JizuraStage, wordsFor, shotAt, sceneFor };
})();
