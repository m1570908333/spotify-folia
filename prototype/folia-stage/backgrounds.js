const FoliaStageBackgrounds = (() => {
  const React = Spicetify.React;
  const { useEffect, useMemo, useRef } = React;
  const h = (...args) => typeof FoliaStageLocale === "undefined" ? React.createElement(...args) : FoliaStageLocale.element(React, ...args);

  const MODES = [
    { id: "common", label: "Standard" },
    { id: "monet", label: "Monet" },
    { id: "nomand", label: "Paper" },
    { id: "latent", label: "Latent" },
    { id: "url", label: "Web" },
    { id: "sora", label: "Starfield" },
  ];

  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, Number(value) || 0));

  function CommonBackground({ cover, accent, tuning }) {
    return h("div", { className: "folia-bg folia-bg--common" },
      tuning.useCoverColorBg && h("div", {
        className: "folia-bg__cover",
        style: cover ? { backgroundImage: `url(${cover})`, opacity: clamp(tuning.opacity) } : undefined,
      }),
      h("div", { className: "folia-bg__common-wash", style: { "--bg-accent": accent } }),
      !tuning.disableGeometricBackground && h("div", { className: "folia-bg__geometry", "aria-hidden": "true" },
        Array.from({ length: 7 }, (_, index) => h("i", { key: index, style: { "--i": index } })),
      ),
      !tuning.disableVignette && h("div", { className: "folia-bg__vignette" }),
    );
  }

  function MonetBackground({ cover, accent, tuning }) {
    const filter = `blur(${clamp(tuning.backgroundBlurPx, 0, 30)}px) grayscale(${clamp(tuning.backgroundGrayscale)} ) saturate(${clamp(tuning.backgroundSaturation, 0, 2.5)})`;
    return h("div", {
      className: `folia-bg folia-bg--monet is-${tuning.backgroundLayout}${tuning.backgroundDriftEnabled ? " is-drifting" : ""}`,
      style: {
        "--monet-overlay": clamp(tuning.backgroundOverlayOpacity),
        "--monet-wash": clamp(tuning.backgroundWash),
        "--monet-offset": `${clamp(tuning.backgroundHalfPaneOffsetX, -40, 40)}%`,
        "--monet-drift": clamp(tuning.backgroundDriftStrength),
        "--bg-accent": accent,
      },
    },
    h("div", { className: "folia-bg__monet-image", style: cover ? { backgroundImage: `url(${cover})`, filter } : undefined }),
    tuning.backgroundStreaksEnabled && h("div", { className: "folia-bg__monet-streaks" }),
    h("div", { className: "folia-bg__monet-wash" }));
  }

  function NomandBackground({ cover, tuning }) {
    return h("div", {
      className: `folia-bg folia-bg--nomand is-${tuning.effect}${tuning.inverted ? " is-inverted" : ""}`,
      style: {
        "--nomand-size": `${clamp(tuning.size, 1, 12)}px`,
        "--nomand-steps": Math.max(2, Math.round(tuning.colorSteps || 4)),
        "--nomand-overlay": tuning.overlayEnabled ? clamp(tuning.overlayOpacity) : 0,
      },
    },
    h("div", { className: "folia-bg__nomand-image", style: cover ? { backgroundImage: `url(${cover})` } : undefined }),
    h("div", { className: "folia-bg__nomand-screen" }),
    h("div", { className: "folia-bg__nomand-paper" }));
  }

  function LatentCanvas({ cover, accent, tuning, paused, visible }) {
    const canvasRef = useRef(null);
    const stateRef = useRef({ cover, accent, tuning, paused, visible });
    stateRef.current = { cover, accent, tuning, paused, visible };
    useEffect(() => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d", { alpha: false });
      if (!canvas || !context) return undefined;
      let frame = 0;
      let timer = 0;
      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.max(1, Math.round(rect.width * ratio));
        canvas.height = Math.max(1, Math.round(rect.height * ratio));
      };
      const draw = () => {
        const state = stateRef.current;
        if (!state.visible) return;
        resize();
        const width = canvas.width;
        const height = canvas.height;
        const time = state.paused ? 0 : performance.now() / 1000;
        const gradient = context.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, "#070909");
        gradient.addColorStop(.5, state.accent || "#f4f4f5");
        gradient.addColorStop(1, "#111727");
        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);
        const mode = state.tuning.displayMode || "both";
        if (mode !== "dithering") {
          context.globalCompositeOperation = "screen";
          for (let index = 0; index < 9; index += 1) {
            const phase = time * state.tuning.meshSpeed + index * 1.71;
            const x = width * (.5 + Math.sin(phase) * .42);
            const y = height * (.5 + Math.cos(phase * 1.23) * .4);
            const radius = Math.max(width, height) * (.12 + (index % 3) * .06);
            const glow = context.createRadialGradient(x, y, 0, x, y, radius);
            glow.addColorStop(0, `rgba(255,255,255,${.12 * state.tuning.meshDistortion})`);
            glow.addColorStop(1, "rgba(0,0,0,0)");
            context.fillStyle = glow;
            context.fillRect(0, 0, width, height);
          }
        }
        if (mode !== "mesh") {
          context.globalCompositeOperation = "overlay";
          const size = Math.max(2, state.tuning.ditheringSize * (window.devicePixelRatio || 1));
          context.fillStyle = `rgba(0,0,0,${clamp(state.tuning.ditheringOpacity)})`;
          for (let y = 0; y < height; y += size * 2) {
            for (let x = ((y / size) % 2) * size; x < width; x += size * 2) context.fillRect(x, y, size, size);
          }
        }
        context.globalCompositeOperation = "source-over";
        frame += 1;
      };
      const loop = () => {
        draw();
        timer = requestAnimationFrame(loop);
      };
      loop();
      return () => cancelAnimationFrame(timer);
    }, []);
    return h("canvas", { ref: canvasRef, className: "folia-bg__latent-canvas", "data-frame": frame });
  }

  function LatentBackground(props) {
    return h("div", { className: "folia-bg folia-bg--latent" },
      h(LatentCanvas, props),
      props.tuning.overlayEnabled && h("div", { className: "folia-bg__latent-overlay", style: { opacity: clamp(props.tuning.overlayOpacity) } }),
    );
  }

  function SoraBackground({ tuning, paused }) {
    const stars = useMemo(() => Array.from({ length: 110 }, (_, index) => ({
      x: (index * 47.73) % 100,
      y: (index * 29.17) % 100,
      size: 1 + (index % 4) * .55,
      delay: -(index % 17) * .31,
      duration: 2.8 + (index % 11) * .32,
    })), []);
    return h("div", { className: `folia-bg folia-bg--sora${paused ? " is-paused" : ""}` },
      !tuning.blank && stars.map((star, index) => h("i", {
        key: index,
        style: { left: `${star.x}%`, top: `${star.y}%`, width: star.size, height: star.size, animationDelay: `${star.delay}s`, animationDuration: `${star.duration}s` },
      })),
      !tuning.blank && h("div", { className: "folia-bg__sora-nebula" }),
    );
  }

  function UrlBackground({ tuning }) {
    const url = String(tuning.url || "").trim();
    return h("div", { className: "folia-bg folia-bg--url" }, url
      ? h("iframe", { src: url, title: "Folia background", sandbox: "allow-scripts allow-same-origin", style: { opacity: clamp(tuning.opacity) } })
      : h("div", { className: "folia-bg__url-empty" }, "在背景设置中填写网页 URL"));
  }

  function render(mode, props) {
    const tuning = props.settings.backgroundTunings?.[mode] || {};
    if (typeof FoliaOriginalBackgroundStage !== "undefined" && typeof FoliaOriginalBackgrounds !== "undefined") {
      return h(FoliaOriginalBackgroundStage.OriginalBackground, {
        mode,
        cover: props.cover,
        customImage: props.settings.backgroundAssets?.customImage || null,
        accent: props.accent,
        tuning,
        paused: props.paused,
        visible: props.visible,
        audioSignals: props.audioSignals,
        timeMs: props.timeMs,
      });
    }
    if (mode === "monet") return h(MonetBackground, { ...props, tuning });
    if (mode === "nomand") return h(NomandBackground, { ...props, tuning });
    if (mode === "latent") return h(LatentBackground, { ...props, tuning });
    if (mode === "sora") return h(SoraBackground, { ...props, tuning });
    if (mode === "url") return h(UrlBackground, { ...props, tuning });
    return h(CommonBackground, { ...props, tuning: props.settings.backgroundTunings?.common || {} });
  }

  return { modes: MODES, has: (mode) => MODES.some((entry) => entry.id === mode), render };
})();
