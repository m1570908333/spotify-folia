const FoliaOriginalDioramaStage = (() => {
  const React = Spicetify.React;
  const { useEffect, useRef, useState } = React;
  const h = React.createElement;

  function buildTheme(accent, themeOverride) {
    return {
      name: "Spotify Folia", backgroundColor: themeOverride?.backgroundColor || "#09090b", primaryColor: themeOverride?.primaryColor || "#f4f4f5",
      accentColor: themeOverride?.accentColor || accent || "#f4f4f5", secondaryColor: themeOverride?.secondaryColor || "#71717a", fontStyle: themeOverride?.fontStyle || "sans",
      fontFamily: themeOverride?.fontFamily || "Spotify Mix", fontFamilyStack: [themeOverride?.fontFamily || "Spotify Mix", "Noto Sans SC", "sans-serif"],
      translationFontFamilyStack: [themeOverride?.fontFamily || "Spotify Mix", "Noto Sans SC", "sans-serif"],
      fontWeight: themeOverride?.fontWeight ?? 700, animationIntensity: themeOverride?.animationIntensity || "normal",
      wordColors: Array.isArray(themeOverride?.wordColors) ? themeOverride.wordColors : [],
      lyricsIcons: Array.isArray(themeOverride?.lyricsIcons) ? themeOverride.lyricsIcons : [],
    };
  }

  function OriginalDiorama({ playback, lyrics, activeIndex, timeMs, accent, visible, settings, audioSignals, theme: themeOverride }) {
    const hostRef = useRef(null);
    const runtimeRef = useRef(null);
    const [error, setError] = useState("");
    const sample = audioSignals?.sample(timeMs / 1000) || {};
    const frame = {
      time: timeMs / 1000, currentLineIndex: activeIndex, power: sample.power || 0,
      bass: sample.bass || 0, lowMid: sample.lowMid || 0, mid: sample.mid || 0,
      vocal: sample.vocal || 0, treble: sample.treble || 0,
    };
    useEffect(() => {
      const host = hostRef.current;
      if (!host || !lyrics?.lines?.length) return undefined;
      setError("");
      try {
        runtimeRef.current = FoliaOriginalDiorama.createDioramaRuntime({
          host,
          frame,
          lines: FoliaOriginalTemperaStage.toOriginalLines(lyrics),
          theme: buildTheme(accent, themeOverride),
          subtitleTheme: buildTheme(accent, themeOverride),
          showText: true,
          showSubtitleTranslation: settings.showTranslation && settings.subtitleContentMode !== "none",
          hideTranslationSubtitle: !settings.showTranslation || settings.subtitleContentMode === "none",
          subtitleContentMode: settings.subtitleContentMode || "translation",
          lyricsFontScale: settings.fontScale || 1,
          subtitleFontScale: settings.subtitleFontScale || settings.fontScale || 1,
          subtitleOverlayOpacity: settings.subtitleOverlayOpacity ?? .72,
          subtitleOverlayBackground: settings.subtitleOverlayBackground !== false,
          subtitleUpcomingLyricsBlur: settings.subtitleUpcomingLyricsBlur !== false,
          seed: playback.uri || playback.title,
          songTitle: playback.title,
          songArtist: playback.artist,
          songAlbum: playback.album,
          coverUrl: playback.cover,
          paused: playback.paused || !visible,
          dioramaTuning: settings.dioramaTuning,
          onLyricLineSeek: (seconds) => Spicetify.Player.seek(Math.max(0, seconds * 1000)),
        });
      } catch (runtimeError) {
        setError(runtimeError?.message || String(runtimeError));
      }
      return () => { runtimeRef.current?.destroy(); runtimeRef.current = null; host.replaceChildren(); };
    }, [playback.uri, lyrics, themeOverride?.backgroundColor, themeOverride?.primaryColor, themeOverride?.secondaryColor, themeOverride?.accentColor, themeOverride?.fontFamily]);
    useEffect(() => { runtimeRef.current?.setFrame(frame); });
    useEffect(() => { runtimeRef.current?.setOptions({
      paused: playback.paused || !visible,
      theme: buildTheme(accent, themeOverride),
      subtitleTheme: buildTheme(accent, themeOverride),
      showSubtitleTranslation: settings.showTranslation && settings.subtitleContentMode !== "none",
      hideTranslationSubtitle: !settings.showTranslation || settings.subtitleContentMode === "none",
      subtitleContentMode: settings.subtitleContentMode || "translation",
      lyricsFontScale: settings.fontScale || 1,
      subtitleFontScale: settings.subtitleFontScale || settings.fontScale || 1,
      subtitleOverlayOpacity: settings.subtitleOverlayOpacity ?? .72,
      subtitleOverlayBackground: settings.subtitleOverlayBackground !== false,
      subtitleUpcomingLyricsBlur: settings.subtitleUpcomingLyricsBlur !== false,
      dioramaTuning: settings.dioramaTuning,
    }); });
    return h("section", { className: "folia-original-diorama" },
      h("div", { ref: hostRef, className: "folia-original-diorama__host" }),
      error && h("div", { className: "folia-original-runtime__error" }, `Diorama: ${error}`),
    );
  }

  return { OriginalDiorama };
})();
