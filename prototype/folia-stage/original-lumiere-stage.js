const FoliaOriginalLumiereStage = (() => {
  const React = Spicetify.React;
  const { useEffect, useRef, useState } = React;
  const h = React.createElement;
  const motion = (get) => ({ get });

  function OriginalLumiere({ playback, lyrics, timeMs, accent, visible, settings, showTranslation, audioSignals, theme: themeOverride }) {
    const hostRef = useRef(null);
    const runtimeRef = useRef(null);
    const timeRef = useRef(timeMs / 1000);
    const audioRef = useRef(audioSignals);
    const [error, setError] = useState("");
    timeRef.current = timeMs / 1000;
    audioRef.current = audioSignals;
    const tuning = settings.lumiereTuning || FoliaOriginalVisualizers.DEFAULT_LUMIERE_TUNING;
    const paused = playback.paused || !visible;
    useEffect(() => { runtimeRef.current?.setPaused(paused); }, [paused]);
    useEffect(() => { runtimeRef.current?.setTuning(tuning); }, [tuning]);
    useEffect(() => {
      const host = hostRef.current;
      if (!host || !lyrics?.lines?.length) return undefined;
      let disposed = false;
      const controller = new AbortController();
      const lines = FoliaOriginalTemperaStage.toOriginalLines(lyrics);
      const theme = {
        name: "Spotify Folia", backgroundColor: themeOverride?.backgroundColor || "#09090b", primaryColor: themeOverride?.primaryColor || "#f4f4f5",
        accentColor: themeOverride?.accentColor || accent || "#f4f4f5", secondaryColor: themeOverride?.secondaryColor || "#71717a", fontStyle: themeOverride?.fontStyle || "sans",
        fontFamily: themeOverride?.fontFamily || "Spotify Mix", fontFamilyStack: [themeOverride?.fontFamily || "Spotify Mix", "Noto Sans SC", "sans-serif"],
        fontWeight: themeOverride?.fontWeight ?? 700, animationIntensity: themeOverride?.animationIntensity || "normal",
        wordColors: Array.isArray(themeOverride?.wordColors) ? themeOverride.wordColors : [],
        lyricsIcons: Array.isArray(themeOverride?.lyricsIcons) ? themeOverride.lyricsIcons : [],
      };
      const seed = playback.uri || playback.title;
      const program = FoliaOriginalVisualizers.compileLumiereProgram(lines, seed, {}, {
        duration: Math.max(1, playback.durationMs / 1000),
        ...FoliaOriginalVisualizers.resolveLumiereCompileOptions(tuning),
      });
      const sample = (name) => motion(() => audioRef.current?.sample(timeRef.current)?.[name] || 0);
      const audioBands = {
        bass: sample("bass"), lowMid: sample("lowMid"), mid: sample("mid"),
        vocal: sample("vocal"), treble: sample("treble"),
      };
      FoliaOriginalVisualizers.LumierePixiRuntime.create({
        host, song: { seed, program, theme }, tuning, currentTime: motion(() => timeRef.current),
        audioPower: sample("power"), audioBands, staticMode: false, showText: true, paused,
        metadata: { title: playback.title, artist: playback.artist, album: playback.album }, signal: controller.signal,
      }).then((runtime) => { if (disposed) runtime.destroy(); else runtimeRef.current = runtime; })
        .catch((runtimeError) => { if (!disposed && runtimeError?.name !== "AbortError") setError(runtimeError?.message || String(runtimeError)); });
      return () => { disposed = true; controller.abort(); runtimeRef.current?.destroy(); runtimeRef.current = null; host.replaceChildren(); };
    }, [playback.uri, lyrics, tuning.seamlessTransitions, themeOverride?.backgroundColor, themeOverride?.primaryColor, themeOverride?.secondaryColor, themeOverride?.accentColor, themeOverride?.fontFamily, themeOverride?.fontStyle, themeOverride?.fontWeight, themeOverride?.animationIntensity]);
    const line = lyrics.lines[Math.max(0, FoliaStageCore.findActiveLine(lyrics.lines, timeMs))] || lyrics.lines[0];
    return h("section", { className: "folia-original-lumiere" },
      h("div", { ref: hostRef, className: "folia-original-lumiere__host" }),
      error && h("div", { className: "folia-original-runtime__error" }, `Lumiere: ${error}`),
      showTranslation && line?.translation && h("div", { className: "folia-translation folia-original-runtime__translation" }, line.translation));
  }
  return { OriginalLumiere };
})();
