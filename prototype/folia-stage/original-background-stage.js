const FoliaOriginalBackgroundStage = (() => {
  const React = Spicetify.React;
  const { useEffect, useRef } = React;
  const h = React.createElement;

  function buildTheme(accent) {
    return {
      name: "Spotify Folia",
      backgroundColor: "#09090b",
      primaryColor: "#f4f4f5",
      accentColor: accent || "#f4f4f5",
      secondaryColor: "#71717a",
      fontStyle: "sans",
      fontFamily: "Spotify Mix",
      fontFamilyStack: ["Spotify Mix", "Noto Sans SC", "sans-serif"],
      translationFontFamilyStack: ["Spotify Mix", "Noto Sans SC", "sans-serif"],
      fontWeight: 700,
      animationIntensity: "normal",
      wordColors: [],
      lyricsIcons: [],
    };
  }

  function OriginalBackground({ mode, cover, customImage, accent, tuning = {}, paused, visible, audioSignals, timeMs = 0 }) {
    const motionsRef = useRef(null);
    if (!motionsRef.current) {
      motionsRef.current = {
        power: FoliaOriginalBackgrounds.motionValue(0),
        bass: FoliaOriginalBackgrounds.motionValue(0),
        lowMid: FoliaOriginalBackgrounds.motionValue(0),
        mid: FoliaOriginalBackgrounds.motionValue(0),
        vocal: FoliaOriginalBackgrounds.motionValue(0),
        treble: FoliaOriginalBackgrounds.motionValue(0),
      };
    }
    const motions = motionsRef.current;
    const sample = audioSignals?.sample(timeMs / 1000) || {};
    motions.power.set(sample.power || 0);
    motions.bass.set(sample.bass || 0);
    motions.lowMid.set(sample.lowMid || 0);
    motions.mid.set(sample.mid || 0);
    motions.vocal.set(sample.vocal || 0);
    motions.treble.set(sample.treble || 0);
    useEffect(() => () => Object.values(motions).forEach((value) => value.destroy?.()), []);

    const theme = buildTheme(accent);
    const frozen = paused || !visible;
    const audioBands = { bass: motions.bass, lowMid: motions.lowMid, mid: motions.mid, vocal: motions.vocal, treble: motions.treble };
    if (mode === "monet") return h(FoliaOriginalBackgrounds.MonetBackgroundLayer, {
      coverUrl: cover,
      monetBackgroundImage: customImage,
      theme,
      isDaylight: false,
      tuning: { ...FoliaOriginalBackgrounds.DEFAULT_MONET_BACKGROUND_TUNING, ...tuning },
      transparentBackground: false,
      staticMode: frozen,
    });
    if (mode === "nomand") return h(FoliaOriginalBackgrounds.NomandBackgroundLayer, {
      coverUrl: cover,
      monetBackgroundImage: customImage,
      theme,
      isDaylight: false,
      tuning: { ...FoliaOriginalBackgrounds.DEFAULT_NOMAND_BACKGROUND_TUNING, ...tuning },
    });
    if (mode === "latent") return h(FoliaOriginalBackgrounds.LatentBackground, {
      coverUrl: cover,
      theme,
      audioPower: motions.power,
      audioBands,
      staticMode: frozen,
      paused: frozen,
      tuning: { ...FoliaOriginalBackgrounds.DEFAULT_LATENT_BACKGROUND_TUNING, ...tuning },
    });
    if (mode === "sora") {
      const resolved = { ...FoliaOriginalBackgrounds.DEFAULT_SORA_BACKGROUND_TUNING, ...tuning };
      return h("div", { className: "absolute inset-0 z-0", style: { position: "absolute", inset: 0, backgroundColor: "#000" } },
        !resolved.blank && h(FoliaOriginalBackgrounds.SoraBackground, { theme, isDaylight: false, paused: frozen }));
    }
    if (mode === "url") {
      const url = String(tuning.url || "").trim();
      return h(FoliaOriginalBackgrounds.UrlBackgroundLayer, {
        urlBackgroundList: url ? [{ id: "spotify-folia-active", url, note: "" }] : [],
        urlBackgroundSelectedId: url ? "spotify-folia-active" : null,
      });
    }
    return h(React.Fragment, null,
      tuning.useCoverColorBg && h(FoliaOriginalBackgrounds.FluidBackground, { coverUrl: cover, theme }),
      h("div", {
        className: "absolute inset-0 z-0 transition-all duration-1000",
        style: { position: "absolute", inset: 0, backgroundColor: theme.backgroundColor, opacity: tuning.useCoverColorBg ? tuning.opacity ?? 0.75 : 1 },
      }),
      h("div", { className: "absolute inset-0 z-0", style: { position: "absolute", inset: 0 } },
        h(FoliaOriginalBackgrounds.GeometricBackground, {
          theme,
          audioPower: motions.power,
          audioBands,
          seed: cover || accent,
          hideShapes: tuning.disableGeometricBackground ?? false,
          disableVignette: tuning.disableVignette ?? false,
          paused: frozen,
        })),
    );
  }

  return { OriginalBackground };
})();
