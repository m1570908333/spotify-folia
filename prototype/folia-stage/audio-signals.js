const FoliaAudioSignals = (() => {
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, Number(value) || 0));
  const smoothstep = (value) => {
    const t = clamp(value);
    return t * t * (3 - 2 * t);
  };

  function findAt(items, time) {
    if (!items?.length) return null;
    let low = 0;
    let high = items.length - 1;
    while (low <= high) {
      const middle = (low + high) >> 1;
      const item = items[middle];
      if (time < item.start) high = middle - 1;
      else if (time >= item.start + Math.max(0.001, item.duration || 0)) low = middle + 1;
      else return item;
    }
    return items[Math.max(0, Math.min(items.length - 1, high))] || null;
  }

  function eventPulse(items, time, width = 0.18) {
    const item = findAt(items, time);
    if (!item) return 0;
    const elapsed = Math.max(0, time - item.start);
    const attack = smoothstep(elapsed / 0.025);
    const decay = Math.exp(-elapsed / Math.max(0.04, Math.min(width, item.duration || width)));
    return clamp(attack * decay * (0.55 + clamp(item.confidence, 0, 1) * 0.45));
  }

  function loudnessPower(segment) {
    if (!segment) return 0;
    const db = Number.isFinite(segment.loudness_max)
      ? segment.loudness_max
      : Number.isFinite(segment.loudness_start) ? segment.loudness_start : -24;
    return clamp((db + 42) / 38);
  }

  function pitchBand(pitches, indices) {
    if (!Array.isArray(pitches)) return 0;
    return clamp(indices.reduce((sum, index) => sum + clamp(pitches[index]), 0) / indices.length);
  }

  function create(analysis, lyricLines = []) {
    const segments = Array.isArray(analysis?.segments) ? analysis.segments : [];
    const beats = Array.isArray(analysis?.beats) ? analysis.beats : [];
    const tatums = Array.isArray(analysis?.tatums) ? analysis.tatums : [];
    const bars = Array.isArray(analysis?.bars) ? analysis.bars : [];
    const sections = Array.isArray(analysis?.sections) ? analysis.sections : [];
    const lyricEvents = (lyricLines || []).map((line) => ({
      start: Math.max(0, Number(line.startMs) / 1000),
      duration: Math.max(0.12, (Number(line.endMs) - Number(line.startMs)) / 1000),
      confidence: 0.78,
    }));
    const hasAnalysis = segments.length > 0 || beats.length > 0;
    let cacheTime = -1;
    let cache = null;
    let smoothTime = -1;
    let smoothed = null;

    const sample = (requestedTime) => {
      const time = Math.max(0, Number(requestedTime) || 0);
      const quantized = Math.round(time * 120) / 120;
      if (cache && quantized === cacheTime) return cache;
      const segment = findAt(segments, time);
      const pitches = segment?.pitches || [];
      const section = findAt(sections, time);
      const power = loudnessPower(segment);
      const beat = eventPulse(beats.length ? beats : lyricEvents, time, 0.24);
      const tatum = eventPulse(tatums, time, 0.1);
      const bar = eventPulse(bars, time, 0.42);
      const sectionEnergy = clamp(((section?.loudness ?? -18) + 36) / 32);
      const fallbackWave = 0.5 + 0.5 * Math.sin(time * 1.73 + Math.sin(time * 0.19) * 1.7);
      const energy = hasAnalysis
        ? clamp(power * 0.72 + beat * 0.2 + sectionEnergy * 0.08)
        : clamp(0.18 + fallbackWave * 0.16 + beat * 0.56);
      const shape = (value, fallback, pulse = beat) => clamp(
        (hasAnalysis ? value : fallback) * (0.45 + energy * 0.55) + pulse * 0.22,
      );
      const raw = {
        bass: shape(pitchBand(pitches, [0, 1, 2, 3]), 0.35 + fallbackWave * 0.18, bar),
        lowMid: shape(pitchBand(pitches, [3, 4, 5, 6]), 0.25 + fallbackWave * 0.2),
        mid: shape(pitchBand(pitches, [5, 6, 7, 8]), 0.3 + fallbackWave * 0.16, tatum || beat),
        vocal: shape(pitchBand(pitches, [2, 4, 7, 9, 11]), 0.28 + fallbackWave * 0.14, beat),
        treble: shape(pitchBand(pitches, [8, 9, 10, 11]), 0.22 + fallbackWave * 0.2, tatum),
        power: energy,
        beat,
        tatum,
        bar,
      };
      if (!smoothed || smoothTime < 0 || time < smoothTime) {
        smoothed = { ...raw };
      } else {
        const delta = clamp(time - smoothTime, 0, 0.12);
        const amount = 1 - Math.exp(-delta * 14);
        ["bass", "lowMid", "mid", "vocal", "treble", "power"].forEach((key) => {
          smoothed[key] = clamp(smoothed[key] + (raw[key] - smoothed[key]) * amount);
        });
        smoothed.beat = raw.beat;
        smoothed.tatum = raw.tatum;
        smoothed.bar = raw.bar;
      }
      smoothTime = time;
      cacheTime = quantized;
      cache = smoothed;
      return cache;
    };

    const nativeTimeline = (response = 1) => {
      if (!hasAnalysis || response <= 0) return null;
      const duration = Math.max(0, ...segments.map(s => s.start + s.duration), ...lyricEvents.map(s => s.start + s.duration));
      const energyRate = 12;
      const energy = Array.from({ length: Math.ceil(duration * energyRate) + 1 }, (_, index) =>
        clamp(loudnessPower(findAt(segments, index / energyRate)) * response));
      return {duration, energy, energyRate, beats: beats.map(beat => beat.start)};
    };
    return { available: hasAnalysis, sample, nativeTimeline };
  }

  return { create };
})();
