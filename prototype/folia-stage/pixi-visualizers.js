const FoliaStagePixiVisualizers = (() => {
  const React = Spicetify.React;
  const { useEffect, useRef } = React;
  const h = React.createElement;

  function colorNumber(value, fallback = 0xd9ff67) {
    const normalized = String(value || "").replace("#", "");
    const parsed = Number.parseInt(normalized, 16);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function drawSonnet(graphics, width, height, time, accent) {
    const pulse = (Math.sin(time * 0.00045) + 1) / 2;
    graphics.clear();
    graphics.rect(0, 0, width, height).fill({ color: 0x101210 });
    graphics.rect(width * 0.055, height * 0.08, width * 0.89, height * 0.84)
      .stroke({ color: 0xf3f4ed, width: 1, alpha: 0.2 });
    graphics.rect(width * 0.09, height * 0.14, width * (0.18 + pulse * 0.08), 5)
      .fill({ color: accent, alpha: 0.92 });
    graphics.rect(width * 0.09, height * 0.18, width * 0.52, 1)
      .fill({ color: 0xf3f4ed, alpha: 0.18 });
    for (let index = 0; index < 9; index += 1) {
      const offset = (time * 0.018 + index * 92) % (width * 1.2);
      graphics.rect(offset - width * 0.1, height * (0.74 + index * 0.012), width * 0.18, 1)
        .fill({ color: index % 3 === 0 ? accent : 0xf3f4ed, alpha: 0.12 + index * 0.012 });
    }
    graphics.circle(width * 0.82, height * 0.26, Math.min(width, height) * (0.05 + pulse * 0.012))
      .stroke({ color: accent, width: 2, alpha: 0.55 });
  }

  function drawTempera(graphics, width, height, time, accent) {
    const shift = Math.sin(time * 0.00032);
    const ink = 0x151716;
    const paper = 0xe7e0d5;
    graphics.clear();
    graphics.rect(0, 0, width, height).fill({ color: paper });
    graphics.rect(-width * 0.08 + shift * 24, height * 0.08, width * 0.48, height * 0.44)
      .fill({ color: accent, alpha: 0.88 });
    graphics.rect(width * 0.58 - shift * 20, height * 0.42, width * 0.5, height * 0.48)
      .fill({ color: ink });
    graphics.circle(width * 0.64, height * 0.18, Math.min(width, height) * 0.19)
      .fill({ color: 0xffffff, alpha: 0.72 })
      .stroke({ color: ink, width: 3, alpha: 0.9 });
    for (let x = -height; x < width + height; x += 24) {
      graphics.moveTo(x + shift * 10, 0)
        .lineTo(x - height + shift * 10, height)
        .stroke({ color: ink, width: 1, alpha: 0.12 });
    }
    for (let index = 0; index < 8; index += 1) {
      const x = width * (0.08 + index * 0.105);
      const size = 5 + ((index * 7) % 14);
      graphics.circle(x, height * 0.88, size)
        .fill({ color: index % 2 ? accent : ink, alpha: 0.7 });
    }
  }

  function drawLumiere(graphics, width, height, time, accent) {
    const travel = (Math.sin(time * 0.00022) + 1) / 2;
    graphics.clear();
    graphics.rect(0, 0, width, height).fill({ color: 0x06090a });
    for (let index = 0; index < 5; index += 1) {
      const originX = width * (0.08 + index * 0.21);
      const endX = width * (0.18 + index * 0.16 + (travel - 0.5) * 0.08);
      graphics.poly([
        originX - 6, 0,
        originX + 6, 0,
        endX + width * 0.15, height,
        endX - width * 0.15, height,
      ]).fill({ color: index % 2 ? accent : 0xb9dfff, alpha: 0.045 + index * 0.012 });
    }
    for (let index = 0; index < 11; index += 1) {
      const phase = time * 0.00016 + index * 0.72;
      const x = width * (0.5 + Math.sin(phase) * 0.48);
      const y = height * (0.5 + Math.cos(phase * 1.3) * 0.46);
      const radius = 18 + (index % 4) * 14;
      graphics.circle(x, y, radius).fill({
        color: index % 3 === 0 ? accent : 0xffffff,
        alpha: 0.025 + (index % 4) * 0.012,
      });
    }
    graphics.rect(width * 0.1, height * 0.82, width * 0.8, 1)
      .fill({ color: accent, alpha: 0.3 });
  }

  const DRAWERS = {
    sonnet: drawSonnet,
    tempera: drawTempera,
    lumiere: drawLumiere,
  };

  function PixiSurface({ mode, accent, visible }) {
    const hostRef = useRef(null);
    const stateRef = useRef({ accent, visible });
    stateRef.current = { accent, visible };

    useEffect(() => {
      const host = hostRef.current;
      if (!host || typeof PIXI === "undefined" || !PIXI.Application) return undefined;
      let disposed = false;
      let app = null;
      let graphics = null;
      let visibilityHandler = null;

      (async () => {
        app = new PIXI.Application();
        await app.init({
          resizeTo: host,
          backgroundAlpha: 0,
          antialias: true,
          autoDensity: true,
          resolution: Math.min(window.devicePixelRatio || 1, 1.5),
          preference: "webgl",
          powerPreference: "high-performance",
        });
        if (disposed) {
          app.destroy({ removeView: true }, { children: true });
          return;
        }
        host.dataset.pixiVersion = PIXI.VERSION || "unknown";
        host.dataset.pixiRenderer = app.renderer?.type || app.renderer?.name || "webgl";
        app.canvas.className = "folia-pixi__canvas";
        host.appendChild(app.canvas);
        graphics = new PIXI.Graphics();
        app.stage.addChild(graphics);
        const drawer = DRAWERS[mode];
        app.ticker.add(() => {
          if (!stateRef.current.visible || document.hidden || !drawer) return;
          drawer(
            graphics,
            app.screen.width,
            app.screen.height,
            performance.now(),
            colorNumber(stateRef.current.accent),
          );
        });
        visibilityHandler = () => {
          if (document.hidden || !stateRef.current.visible) app.ticker.stop();
          else app.ticker.start();
        };
        document.addEventListener("visibilitychange", visibilityHandler);
        visibilityHandler();
      })().catch((error) => {
        console.warn("[FoliaStage] Pixi runtime failed", error);
        host.dataset.pixiError = error?.message || String(error);
      });

      return () => {
        disposed = true;
        if (visibilityHandler) document.removeEventListener("visibilitychange", visibilityHandler);
        if (app) {
          app.ticker.stop();
          try {
            app.destroy({ removeView: true }, {
              children: true,
              texture: true,
              textureSource: true,
            });
          } catch (error) {
            console.warn("[FoliaStage] Pixi cleanup fallback", error);
            app.destroy(true);
          }
        }
      };
    }, [mode]);

    return h("div", { ref: hostRef, className: `folia-pixi folia-pixi--${mode}` });
  }

  function Sonnet(props) {
    if (typeof FoliaOriginalSonnetStage !== "undefined") return h(FoliaOriginalSonnetStage.OriginalSonnet, props);
    const line = props.lyrics.lines[Math.max(0, props.activeIndex)] || props.lyrics.lines[0];
    return h("section", { className: "folia-lyrics folia-lyrics--sonnet" },
      h(PixiSurface, props),
      h("div", { className: "folia-sonnet__index" }, String(Math.max(1, props.activeIndex + 1)).padStart(2, "0")),
      h("div", { className: "folia-sonnet__content" },
        h("div", { className: "folia-sonnet__title" }, props.playback.title),
        h("div", { className: "folia-sonnet__lyric" }, props.renderLine(line, props.timeMs)),
        props.showTranslation && line?.translation && h("div", { className: "folia-translation" }, line.translation),
      ),
    );
  }

  function Tempera(props) {
    if (typeof FoliaOriginalTemperaStage !== "undefined") {
      return h(FoliaOriginalTemperaStage.OriginalTempera, props);
    }
    const line = props.lyrics.lines[Math.max(0, props.activeIndex)] || props.lyrics.lines[0];
    return h("section", { className: "folia-lyrics folia-lyrics--tempera" }, h("div", { className: "folia-tempera__lyric" }, props.renderLine(line, props.timeMs)));
  }

  function Lumiere(props) {
    if (typeof FoliaOriginalLumiereStage !== "undefined") return h(FoliaOriginalLumiereStage.OriginalLumiere, props);
    const line = props.lyrics.lines[Math.max(0, props.activeIndex)] || props.lyrics.lines[0];
    return h("section", { className: "folia-lyrics folia-lyrics--lumiere" },
      h(PixiSurface, props),
      h("div", { className: "folia-lumiere__content" },
        h("div", { className: "folia-lumiere__lyric" }, props.renderLine(line, props.timeMs)),
        props.showTranslation && line?.translation && h("div", { className: "folia-translation" }, line.translation),
      ),
      h("div", { className: "folia-lumiere__artist" }, props.playback.artist),
    );
  }

  function render(mode, props) {
    if (mode === "sonnet") return h(Sonnet, { ...props, mode });
    if (mode === "tempera") return h(Tempera, { ...props, mode });
    if (mode === "lumiere") return h(Lumiere, { ...props, mode });
    return null;
  }

  return { render };
})();
