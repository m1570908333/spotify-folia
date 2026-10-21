const FoliaStageProviders = (() => {
  const { makeDocument, mergeTranslation, normalizeMatchText, parseLrc, parseNeteaseWordLyrics } = FoliaStageCore;

  function parseSimpleLrc(text, durationMs, provider) {
    const parsed = parseLrc(text, durationMs);
    return { ...parsed, provider };
  }

  async function spotify(track) {
    const id = track.uri?.split(":")[2];
    if (!id) throw new Error("Spotify track id unavailable");
    const response = await Spicetify.CosmosAsync.get(
      `https://spclient.wg.spotify.com/color-lyrics/v2/track/${id}?format=json&vocalRemoval=false&market=from_token`,
    );
    const payload = response?.lyrics;
    if (!payload?.lines?.length) throw new Error("Spotify has no lyrics");
    const timed = payload.syncType === "LINE_SYNCED";
    const lines = payload.lines.map((line, index) => {
      const startMs = timed ? Number(line.startTimeMs) || 0 : 0;
      const nextStartMs = Number(payload.lines[index + 1]?.startTimeMs) || track.durationMs || startMs + 5000;
      const syllables = Array.isArray(line.syllables) ? line.syllables : [];
      const words = syllables.map((syllable, syllableIndex) => ({
        text: syllable.chars || syllable.text || "",
        startMs: Number(syllable.startTimeMs) || startMs,
        endMs: Number(syllable.endTimeMs) || Number(syllable.startTimeMs) || nextStartMs,
        background: Boolean(syllable.isBackground || syllable.background),
      })).filter((word) => word.text);
      return {
        startMs,
        endMs: nextStartMs,
        text: line.words || words.map((word) => word.text).join(""),
        words,
        translation: line.translation || line.translatedWords || "",
        romanization: line.romanizedWords || line.romanization || "",
      };
    });
    return makeDocument({
      provider: "spotify",
      sourceKind: timed ? "line" : "plain",
      lines,
      durationMs: track.durationMs,
      copyright: payload.provider || "",
    });
  }

  async function lrclib(track) {
    const params = new URLSearchParams({
      track_name: track.title,
      artist_name: track.artist,
      album_name: track.album || "",
      duration: String(Math.round(track.durationMs / 1000)),
    });
    const response = await fetch(`https://lrclib.net/api/get?${params}`, {
      headers: { "x-user-agent": `folia-stage spicetify/${Spicetify.Config?.version || "unknown"}` },
    });
    if (!response.ok) throw new Error(`LRCLIB returned ${response.status}`);
    const body = await response.json();
    if (body.instrumental) {
      return makeDocument({ provider: "lrclib", sourceKind: "plain", lines: [{ text: "♪ Instrumental ♪" }], durationMs: track.durationMs });
    }
    const source = body.syncedLyrics || body.plainLyrics;
    if (!source) throw new Error("LRCLIB has no lyrics");
    return parseSimpleLrc(source, track.durationMs, "lrclib");
  }

  function parseTranslation(text, durationMs) {
    if (!text) return [];
    return parseLrc(text, durationMs).lines;
  }

  function scoreNeteaseCandidate(track, candidate) {
    const title = normalizeMatchText(candidate.name);
    const expectedTitle = normalizeMatchText(track.title);
    const album = normalizeMatchText(candidate.album?.name || candidate.al?.name);
    const expectedAlbum = normalizeMatchText(track.album);
    const artists = normalizeMatchText((candidate.artists || candidate.ar || []).map((artist) => artist.name).join(" "));
    const expectedArtist = normalizeMatchText(track.artist);
    const duration = Number(candidate.duration || candidate.dt || 0);
    let score = 0;
    if (title === expectedTitle) score += 60;
    else if (title.includes(expectedTitle) || expectedTitle.includes(title)) score += 35;
    if (album && expectedAlbum && album === expectedAlbum) score += 20;
    if (artists && expectedArtist && (artists.includes(expectedArtist) || expectedArtist.includes(artists))) score += 20;
    if (duration && Math.abs(duration - track.durationMs) <= 2500) score += 20;
    else if (duration && Math.abs(duration - track.durationMs) <= 6000) score += 8;
    return score;
  }

  async function netease(track) {
    const searchUrl = `https://music.xianqiao.wang/neteaseapiv2/search?limit=10&type=1&keywords=${encodeURIComponent(`${track.title} ${track.artist}`)}`;
    const search = await Spicetify.CosmosAsync.get(searchUrl, null, {
      "User-Agent": "Mozilla/5.0",
    });
    const candidates = search?.result?.songs || [];
    if (!candidates.length) throw new Error("NetEase found no candidates");
    const ranked = candidates
      .map((candidate) => ({ candidate, score: scoreNeteaseCandidate(track, candidate) }))
      .sort((left, right) => right.score - left.score);
    if (!ranked[0] || ranked[0].score < 35) throw new Error("NetEase match confidence too low");

    const lyric = await Spicetify.CosmosAsync.get(
      `https://music.xianqiao.wang/neteaseapiv2/lyric?id=${ranked[0].candidate.id}`,
      null,
      { "User-Agent": "Mozilla/5.0" },
    );
    const wordSource = lyric?.yrc?.lyric || lyric?.klyric?.lyric;
    let document = wordSource ? parseNeteaseWordLyrics(wordSource, track.durationMs) : null;
    if (!document?.lines?.length && lyric?.lrc?.lyric) {
      document = parseSimpleLrc(lyric.lrc.lyric, track.durationMs, "netease");
    }
    if (!document?.lines?.length) throw new Error("NetEase has no usable lyrics");
    return mergeTranslation(document, parseTranslation(lyric?.tlyric?.lyric, track.durationMs));
  }

  const PROVIDERS = { spotify, lrclib, netease };

  async function load(track, settings, options = {}) {
    const errors = [];
    const local = FoliaStageCore.getLocalLyrics(track.uri);
    if (settings.providers.local && local) return { document: local, errors, cached: true };

    if (!options.force) {
      const cached = FoliaStageCore.getCachedLyrics(track.uri);
      if (cached && settings.providers[cached.provider] !== false) {
        return { document: cached, errors, cached: true };
      }
    }

    for (const id of settings.providerOrder) {
      if (id === "local" || settings.providers[id] === false || !PROVIDERS[id]) continue;
      try {
        const document = await PROVIDERS[id](track);
        if (document?.lines?.length) {
          FoliaStageCore.setCachedLyrics(track.uri, document);
          return { document, errors, cached: false };
        }
      } catch (error) {
        errors.push({ provider: id, message: error instanceof Error ? error.message : String(error) });
      }
    }

    return { document: null, errors, cached: false };
  }

  return { load, spotify, lrclib, netease };
})();
