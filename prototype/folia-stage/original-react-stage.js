const FoliaOriginalReactStage = (() => {
  const React = Spicetify.React;
  const { useEffect, useRef } = React;
  const h = React.createElement;

  const COMPONENTS = {
    claddagh: FoliaOriginalReactStages.VisualizerCladdagh,
    monet: FoliaOriginalReactStages.VisualizerMonet,
    pendolo: FoliaOriginalReactStages.VisualizerPendolo,
    tilt: FoliaOriginalReactStages.VisualizerTilt,
  };

  const TUNINGS = {
    claddagh: ["claddaghTuning", FoliaOriginalReactStages.DEFAULT_CLADDAGH_TUNING],
    monet: ["monetTuning", FoliaOriginalReactStages.DEFAULT_MONET_TUNING],
    pendolo: ["pendoloTuning", FoliaOriginalReactStages.DEFAULT_PENDOLO_TUNING],
    tilt: ["tiltTuning", FoliaOriginalReactStages.DEFAULT_TILT_TUNING],
  };

  function createMotionSet(initial = 0) {
    return {
      currentTime: FoliaOriginalReactStages.motionValue(initial),
      power: FoliaOriginalReactStages.motionValue(0),
      bass: FoliaOriginalReactStages.motionValue(0),
      lowMid: FoliaOriginalReactStages.motionValue(0),
      mid: FoliaOriginalReactStages.motionValue(0),
      vocal: FoliaOriginalReactStages.motionValue(0),
      treble: FoliaOriginalReactStages.motionValue(0),
    };
  }

  function OriginalReactStage({ mode, playback, lyrics, activeIndex, timeMs, accent, visible, settings, audioSignals, theme: themeOverride }) {
    const motionsRef = useRef(null);
    if (!motionsRef.current) motionsRef.current = createMotionSet(timeMs / 1000);
    const motions = motionsRef.current;
    const sample = audioSignals?.sample(timeMs / 1000) || {};
    motions.currentTime.set(timeMs / 1000);
    motions.power.set(sample.power || 0);
    motions.bass.set(sample.bass || 0);
    motions.lowMid.set(sample.lowMid || 0);
    motions.mid.set(sample.mid || 0);
    motions.vocal.set(sample.vocal || 0);
    motions.treble.set(sample.treble || 0);

    useEffect(() => () => {
      Object.values(motions).forEach((value) => value.destroy?.());
    }, []);

    const Component = COMPONENTS[mode];
    if (!Component) return null;
    const [tuningKey, defaultTuning] = TUNINGS[mode];
    const lines = FoliaOriginalTemperaStage.toOriginalLines(lyrics);
    const theme = {
      name: "Spotify Folia",
      backgroundColor: themeOverride?.backgroundColor || "#09090b",
      primaryColor: themeOverride?.primaryColor || "#f4f4f5",
      accentColor: themeOverride?.accentColor || accent || "#f4f4f5",
      secondaryColor: themeOverride?.secondaryColor || "#71717a",
      fontStyle: themeOverride?.fontStyle || "sans",
      fontFamily: themeOverride?.fontFamily || "Spotify Mix",
      fontFamilyStack: [themeOverride?.fontFamily || "Spotify Mix", "Noto Sans SC", "sans-serif"],
      translationFontFamilyStack: [themeOverride?.fontFamily || "Spotify Mix", "Noto Sans SC", "sans-serif"],
      fontWeight: themeOverride?.fontWeight ?? 700,
      animationIntensity: themeOverride?.animationIntensity || "normal",
      wordColors: Array.isArray(themeOverride?.wordColors) ? themeOverride.wordColors : [],
      lyricsIcons: Array.isArray(themeOverride?.lyricsIcons) ? themeOverride.lyricsIcons : [],
    };
    const props = {
      currentTime: motions.currentTime,
      currentLineIndex: activeIndex,
      lines,
      theme,
      subtitleTheme: theme,
      audioPower: motions.power,
      audioBands: {
        bass: motions.bass,
        lowMid: motions.lowMid,
        mid: motions.mid,
        vocal: motions.vocal,
        treble: motions.treble,
      },
      showText: true,
      songTitle: playback.title,
      songArtist: playback.artist,
      songAlbum: playback.album,
      coverUrl: playback.cover,
      monetPortraitImage: mode === "monet" ? settings.monetTuning?.customPortraitImage || null : null,
      monetBackgroundImage: mode === "monet" ? settings.backgroundAssets?.customImage || null : null,
      seed: playback.uri || playback.title,
      paused: playback.paused || !visible,
      staticMode: playback.paused || !visible,
      backgroundStaticMode: playback.paused || !visible,
      visualizerOpacity: 1,
      lyricsFontScale: settings.fontScale || 1,
      subtitleFontScale: settings.subtitleFontScale || settings.fontScale || 1,
      subtitleOverlayOpacity: settings.subtitleOverlayOpacity ?? .72,
      subtitleOverlayBackground: settings.subtitleOverlayBackground !== false,
      subtitleUpcomingLyricsBlur: settings.subtitleUpcomingLyricsBlur !== false,
      showSubtitleTranslation: settings.showTranslation && settings.subtitleContentMode !== "none",
      hideTranslationSubtitle: !settings.showTranslation || settings.subtitleContentMode === "none",
      subtitleContentMode: settings.subtitleContentMode || "translation",
      onLyricLineSeek: (seconds) => Spicetify.Player.seek(Math.max(0, seconds * 1000)),
      [tuningKey]: { ...defaultTuning, ...(settings[tuningKey] || {}) },
    };
    return h("section", { className: `folia-original-react-stage folia-original-react-stage--${mode}` },
      h(Component, props),
    );
  }

  return { OriginalReactStage };
})();
