const FoliaOriginalTemperaStage = (() => {
  const React = Spicetify.React;
  const { useEffect, useRef, useState } = React;
  const h = React.createElement;

  function toOriginalLines(lyrics) {
    return (lyrics?.lines || []).map((line, index) => ({
      id: `${line.startMs}-${index}`,
      startTime: line.startMs / 1000,
      endTime: line.endMs / 1000,
      fullText: line.text,
      translation: line.translation || undefined,
      romanization: line.romanization || undefined,
      alternateTexts: line.alternateTexts || undefined,
      wordSegments: line.wordSegments,
      words: (line.words || []).map((word) => ({
        text: word.text,
        startTime: word.startMs / 1000,
        endTime: word.endMs / 1000,
      })),
    }));
  }

  function OriginalTempera({ playback, lyrics, timeMs, accent, visible, settings, showTranslation, theme: themeOverride }) {
    const hostRef = useRef(null);
    const runtimeRef = useRef(null);
    const timeRef = useRef(timeMs / 1000);
    const [error, setError] = useState("");
    timeRef.current = timeMs / 1000;
    const tuning = settings.temperaTuning || FoliaOriginalVisualizers.DEFAULT_TEMPERA_TUNING;
    const paused = playback.paused || !visible;

    useEffect(() => {
      runtimeRef.current?.setPaused(paused);
    }, [paused]);

    useEffect(() => {
      runtimeRef.current?.setTuning(tuning);
    }, [tuning]);

    useEffect(() => {
      const host = hostRef.current;
      if (!host || !lyrics?.lines?.length) return undefined;
      let disposed = false;
      const controller = new AbortController();
      const lines = toOriginalLines(lyrics);
      const theme = {
        name: "Spotify Folia",
        backgroundColor: themeOverride?.backgroundColor || "#0a0c0b",
        primaryColor: themeOverride?.primaryColor || "#f4f4f5",
        accentColor: themeOverride?.accentColor || accent || "#f4f4f5",
        secondaryColor: themeOverride?.secondaryColor || "#71717a",
        fontStyle: themeOverride?.fontStyle || "sans",
        fontFamily: themeOverride?.fontFamily || "Spotify Mix",
        fontFamilyStack: [themeOverride?.fontFamily || "Spotify Mix", "Noto Sans SC", "sans-serif"],
        fontWeight: themeOverride?.fontWeight ?? 700,
        animationIntensity: themeOverride?.animationIntensity || "normal",
        wordColors: Array.isArray(themeOverride?.wordColors) ? themeOverride.wordColors : [],
        lyricsIcons: Array.isArray(themeOverride?.lyricsIcons) ? themeOverride.lyricsIcons : [],
      };
      const program = FoliaOriginalVisualizers.compileTemperaProgram(lines, playback.uri || playback.title, {
        wholeLineLyrics: tuning.wholeLineLyrics,
      });
      setError("");
      const layerImages = Array.isArray(tuning.layerImages) ? tuning.layerImages : [];
      globalThis.FoliaTemperaAssets.getBlobs(layerImages).then((imageBlobs) => FoliaOriginalVisualizers.TemperaPixiRuntime.create({
        host,
        songSeed: playback.uri || playback.title,
        program,
        theme,
        tuning,
        currentTime: { get: () => timeRef.current },
        lyricsFontScale: settings.fontScale || 1,
        staticMode: false,
        coverColors: [accent || "#f4f4f5", "#f4f4f5", "#16161a", "#71717a"],
        imageBlobs,
        paused,
        songTitle: playback.title,
        songArtist: playback.artist,
        songAlbum: playback.album,
        signal: controller.signal,
      })).then((runtime) => {
        if (disposed) runtime.destroy();
        else runtimeRef.current = runtime;
      }).catch((runtimeError) => {
        if (!disposed && runtimeError?.name !== "AbortError") {
          console.error("[FoliaStage] Original Tempera failed", runtimeError);
          setError(runtimeError?.message || String(runtimeError));
        }
      });
      return () => {
        disposed = true;
        controller.abort();
        runtimeRef.current?.destroy();
        runtimeRef.current = null;
        host.replaceChildren();
      };
    }, [playback.uri, lyrics, (settings.temperaTuning?.layerImages || []).map((image) => image.id).join("|"), themeOverride?.backgroundColor, themeOverride?.primaryColor, themeOverride?.secondaryColor, themeOverride?.accentColor, themeOverride?.fontFamily, themeOverride?.fontStyle, themeOverride?.fontWeight, themeOverride?.animationIntensity]);

    const line = lyrics.lines[Math.max(0, FoliaStageCore.findActiveLine(lyrics.lines, timeMs))] || lyrics.lines[0];
    return h("section", { className: "folia-original-tempera" },
      h("div", { ref: hostRef, className: "folia-original-tempera__host" }),
      error && h("div", { className: "folia-original-tempera__error" }, `Tempera: ${error}`),
      showTranslation && line?.translation && h("div", { className: "folia-translation folia-original-tempera__translation" }, line.translation),
    );
  }

  return { OriginalTempera, toOriginalLines };
})();
