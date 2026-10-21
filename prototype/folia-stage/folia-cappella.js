const FoliaFaithfulCappella = (() => {
  const React = Spicetify.React;
  const { useMemo } = React;
  const h = React.createElement;
  const SHORT_LINE_CHAR_LIMIT = 12;
  const LEFT_AVATARS = [0, 3, 6, 1, 4];
  const RIGHT_AVATAR = 8;
  const AVATAR_FILES = [2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((value) => `avatar${value}.png`);
  const EMO_FILES = ["happy1.png", "love1.png", "normal1.png", "sleepy1.png", "sleepy2.png", "sleepy3.png", "vibe1.png", "vibe2.png", "vibe3.png"];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const smoothstep = (value) => {
    const amount = clamp(value, 0, 1);
    return amount * amount * (3 - 2 * amount);
  };

  const assetUrl = (kind, filename) => FoliaCappellaAssets?.[kind]?.[filename] || "";

  function hashString(input) {
    let hash = 2166136261;
    for (let index = 0; index < String(input).length; index += 1) {
      hash ^= String(input).charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  const seededUnit = (...parts) => hashString(parts.join("|")) / 0xffffffff;

  function resolveTuning(settings = {}) {
    const source = settings.cappellaTuning || {};
    const customEmojiAssets = globalThis.FoliaStageAssets?.get("cappellaEmoji") || [];
    const customAvatarAssets = globalThis.FoliaStageAssets?.get("cappellaAvatar") || [];
    return {
      showEmoMessages: source.showEmoMessages !== false,
      emojiPackSource: source.emojiPackSource === "custom" ? "custom" : "builtin",
      avatarSource: ["cover", "builtin", "color", "custom"].includes(source.avatarSource) ? source.avatarSource : "cover",
      animationIntensity: source.animationIntensity || "normal",
      customEmojiAssets,
      customAvatarAssets,
    };
  }

  function intensityConfig(value) {
    if (value === "calm") return {
      forceRightEveryLines: 7, shortLineCarryChance: 0.92, sideSequence: ["left", "left", "right", "left", "right"], sideFlipChance: 0.08,
      randomEmoChance: 0, minLinesBetweenRandomEmos: 6, maxRandomEmoRatio: 0,
      activeScale: 1.07, passedScale: 0.96, passedOpacity: 0.88, activeFontMultiplier: 1.22, inactiveFontMultiplier: 0.96,
      activePaddingX: 18, activePaddingY: 14, inactivePaddingX: 16, inactivePaddingY: 12, emoActiveSize: 132, emoInactiveSize: 96,
    };
    if (value === "chaotic") return {
      forceRightEveryLines: 3, shortLineCarryChance: 0.36, sideSequence: ["left", "right", "right", "left", "right", "left"], sideFlipChance: 0.42,
      randomEmoChance: 0.22, minLinesBetweenRandomEmos: 2, maxRandomEmoRatio: 1 / 6,
      activeScale: 1.18, passedScale: 0.88, passedOpacity: 0.76, activeFontMultiplier: 1.4, inactiveFontMultiplier: 0.92,
      activePaddingX: 22, activePaddingY: 17, inactivePaddingX: 15, inactivePaddingY: 11, emoActiveSize: 178, emoInactiveSize: 122,
    };
    return {
      forceRightEveryLines: 5, shortLineCarryChance: 0.68, sideSequence: ["left", "right", "left", "right", "right"], sideFlipChance: 0.18,
      randomEmoChance: 0.1, minLinesBetweenRandomEmos: 3, maxRandomEmoRatio: 1 / 8,
      activeScale: 1.12, passedScale: 0.92, passedOpacity: 0.82, activeFontMultiplier: 1.34, inactiveFontMultiplier: 0.94,
      activePaddingX: 20, activePaddingY: 16, inactivePaddingX: 16, inactivePaddingY: 12, emoActiveSize: 160, emoInactiveSize: 110,
    };
  }

  function compactLength(text) {
    return FoliaFaithfulClassic.splitGraphemes(String(text || "").replace(/\s/g, "")).length;
  }

  function chooseEmo(parts, pool = EMO_FILES) {
    const source = Array.isArray(pool) && pool.length ? pool : EMO_FILES;
    return source[Math.floor(seededUnit(...parts) * source.length) % source.length];
  }

  function createAgentResolver(lines) {
    const ids = [];
    const seen = new Set();
    lines.forEach((line) => {
      const id = String(line.agentId || "").trim();
      if (id && !seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    });
    if (ids.length < 2) return null;
    const senders = new Map();
    ids.forEach((id, index) => senders.set(id, index === 0
      ? { side: "right", avatarIndex: RIGHT_AVATAR }
      : { side: "left", avatarIndex: (index - 1) % LEFT_AVATARS.length }));
    return (line) => senders.get(String(line.agentId || "").trim()) || null;
  }

  function buildMessages(lines, title, settings = {}) {
    const tuning = resolveTuning(settings);
    const config = intensityConfig(tuning.animationIntensity);
    const messages = [{ id: "title", kind: "title", text: title || "Spotify", side: "right", avatarIndex: RIGHT_AVATAR, lineIndex: -1 }];
    let sideCursor = 0;
    let leftCursor = 0;
    let lastSender = null;
    let sinceEmo = Number.POSITIVE_INFINITY;
    let emoCount = 0;
    const emoCap = Math.floor(lines.length * config.maxRandomEmoRatio);
    const resolveAgent = createAgentResolver(lines);

    lines.forEach((line, lineIndex) => {
      const agentSender = resolveAgent?.(line) || null;
      const short = compactLength(line.text) <= SHORT_LINE_CHAR_LIMIT;
      const forceRight = !agentSender && (lineIndex + 1) % config.forceRightEveryLines === 0;
      const carry = !agentSender && short && lastSender && seededUnit("carry", line.startMs, lineIndex) <= config.shortLineCarryChance;
      const baseSide = config.sideSequence[sideCursor % config.sideSequence.length];
      const flip = !forceRight && seededUnit("flip", line.startMs, lineIndex) < config.sideFlipChance;
      const side = flip ? (baseSide === "left" ? "right" : "left") : baseSide;
      const sender = agentSender || (forceRight
        ? { side: "right", avatarIndex: RIGHT_AVATAR }
        : carry ? lastSender : { side, avatarIndex: side === "left" ? leftCursor : RIGHT_AVATAR });
      const interlude = line.text === "......";
      if (interlude && tuning.showEmoMessages) {
        messages.push({
          id: `emo-${line.startMs}-${lineIndex}`, kind: "emo", line, lineIndex, ...sender,
          emo: chooseEmo(["interlude", line.startMs, lineIndex], tuning.emojiPackSource === "custom" ? tuning.customEmojiAssets : EMO_FILES), activationStartMs: line.startMs, activationEndMs: line.endMs,
        });
      } else {
        messages.push({ id: `line-${line.startMs}-${lineIndex}`, kind: "lyric", line, lineIndex, ...sender });
      }
      sinceEmo += 1;
      if (!interlude && tuning.showEmoMessages && emoCount < emoCap && sinceEmo >= config.minLinesBetweenRandomEmos
        && seededUnit("random-emo", line.startMs, line.endMs, lineIndex) < config.randomEmoChance) {
        messages.push({
          id: `reaction-${line.startMs}-${lineIndex}`, kind: "emo", line, lineIndex, ...sender,
          emo: chooseEmo(["reaction", line.startMs, lineIndex, sender.side], tuning.emojiPackSource === "custom" ? tuning.customEmojiAssets : EMO_FILES), activationStartMs: line.endMs,
          activationEndMs: Math.max(line.endMs + 80, lines[lineIndex + 1]?.startMs || line.endMs + 900),
        });
        emoCount += 1;
        sinceEmo = 0;
      }
      if (agentSender) lastSender = sender;
      else if (forceRight) {
        sideCursor = 0;
        lastSender = null;
      } else if (!carry) {
        if (sender.side === "left") leftCursor += 1;
        sideCursor += 1;
        lastSender = sender;
      }
    });
    return messages;
  }

  function messageState(message, activeIndex, timeMs) {
    if (message.kind === "title") return { active: activeIndex < 0, passed: activeIndex >= 0, visible: true, phase: 1 };
    if (message.kind === "emo") {
      const active = timeMs >= message.activationStartMs && timeMs <= message.activationEndMs;
      const enter = clamp((timeMs - (message.activationStartMs - 220)) / 320, 0, 1);
      const leave = clamp((timeMs - message.activationEndMs) / 420, 0, 1);
      return { active, passed: timeMs > message.activationEndMs, visible: enter > 0, phase: enter * (1 - leave) };
    }
    const start = message.line?.startMs || 0;
    const end = message.line?.endMs || start + 800;
    const enter = clamp((timeMs - (start - 240)) / 360, 0, 1);
    const leave = clamp((timeMs - end) / 520, 0, 1);
    return {
      active: message.lineIndex === activeIndex,
      passed: message.lineIndex < activeIndex,
      visible: message.lineIndex <= Math.max(activeIndex, 0),
      phase: message.lineIndex < activeIndex ? 1 : enter * (1 - leave),
    };
  }

  function getVisibleMessages(messages, activeIndex, timeMs, viewportHeight) {
    const candidates = messages.filter((message) => messageState(message, activeIndex, timeMs).visible);
    const max = clamp(Math.floor((viewportHeight - 190) / 76), 4, 12);
    return candidates.slice(-max);
  }

  function revealCount(line, timeMs) {
    const graphemes = FoliaFaithfulClassic.splitGraphemes(line.text);
    if (!graphemes.length || timeMs < line.startMs) return 0;
    if (line.words?.length) {
      let count = 0;
      for (const word of line.words) {
        const wordChars = FoliaFaithfulClassic.splitGraphemes(word.text);
        if (timeMs >= word.endMs) count += wordChars.length;
        else if (timeMs >= word.startMs) {
          const progress = clamp((timeMs - word.startMs) / Math.max(word.endMs - word.startMs, 40), 0, 1);
          count += Math.ceil(wordChars.length * progress);
          break;
        } else break;
      }
      return clamp(count, 0, graphemes.length);
    }
    return Math.ceil(graphemes.length * clamp((timeMs - line.startMs) / Math.max(line.endMs - line.startMs, 300), 0, 1));
  }

  function characterProgresses(line, timeMs) {
    const graphemes = FoliaFaithfulClassic.splitGraphemes(line?.text || "");
    if (!graphemes.length) return [];
    if (!line?.words?.length) {
      const progress = clamp((timeMs - line.startMs) / Math.max(line.endMs - line.startMs, 300), 0, 1);
      return graphemes.map((_, index) => clamp(progress * graphemes.length - index, 0, 1));
    }
    let cursor = 0;
    const output = graphemes.map(() => 0);
    for (const word of line.words) {
      const chars = FoliaFaithfulClassic.splitGraphemes(word.text);
      const progress = clamp((timeMs - word.startMs) / Math.max(word.endMs - word.startMs, 40), 0, 1);
      chars.forEach((_, index) => {
        if (cursor + index < output.length) output[cursor + index] = clamp(progress * chars.length - index, 0, 1);
      });
      cursor += chars.length;
    }
    return output;
  }

  function formatTimestamp(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
  }

  function avatarStyle(message, playback, tuning, title) {
    const safeIndex = ((message.avatarIndex % 9) + 9) % 9;
    const col = safeIndex % 3;
    const row = Math.floor(safeIndex / 3);
    if (tuning.avatarSource === "color") return { backgroundImage: `linear-gradient(135deg, var(--folia-accent), rgba(255,255,255,.22))` };
    if (tuning.avatarSource === "cover" && playback.cover) return {
      backgroundImage: `url("${playback.cover}")`, backgroundSize: "300% 300%", backgroundPosition: `${col * 50}% ${row * 50}%`,
    };
    if (tuning.avatarSource === "custom" && tuning.customAvatarAssets?.length) {
      const selected = tuning.customAvatarAssets[(message.avatarIndex + hashString(`${title}|custom-avatar`) % tuning.customAvatarAssets.length) % tuning.customAvatarAssets.length];
      return { backgroundImage: `url("${selected.url}")`, backgroundSize: "cover", backgroundPosition: "center" };
    }
    const rightIndex = hashString(`${title}|right|${AVATAR_FILES.length}`) % AVATAR_FILES.length;
    const pool = AVATAR_FILES.filter((_, index) => index !== rightIndex);
    const selected = message.side === "right"
      ? AVATAR_FILES[rightIndex]
      : pool[(message.avatarIndex + hashString(`${title}|left`) % pool.length) % pool.length];
    return { backgroundImage: `url("${assetUrl("avatars", selected)}")`, backgroundSize: "cover", backgroundPosition: "center" };
  }

  function MessageRow({ message, activeIndex, timeMs, playback, tuning, config, title }) {
    const state = messageState(message, activeIndex, timeMs);
    const active = state.active;
    const passed = state.passed;
    const right = message.side === "right";
    const lineStart = message.line?.startMs ?? timeMs;
    const lineEnd = message.line?.endMs ?? lineStart + 800;
    const focusIn = smoothstep((timeMs - (lineStart - 180)) / 420);
    const focusOut = smoothstep((timeMs - lineEnd) / 620);
    const focus = message.kind === "lyric" ? focusIn * (1 - focusOut) : active ? 1 : 0;
    const scale = message.kind === "lyric"
      ? 1 + (config.activeScale - 1) * focus + (config.passedScale - 1) * focusOut
      : active ? config.activeScale : passed ? config.passedScale : 1;
    const phase = state.phase ?? 1;
    const lyricOpacity = message.kind === "lyric" ? 1 - focusOut * (1 - config.passedOpacity) : 1;
    const opacity = lyricOpacity * phase;
    const fontMultiplier = message.kind === "title"
      ? 1
      : config.inactiveFontMultiplier + (config.activeFontMultiplier - config.inactiveFontMultiplier) * focus;
    const paddingX = message.kind === "lyric"
      ? config.inactivePaddingX + (config.activePaddingX - config.inactivePaddingX) * focus
      : config.inactivePaddingX;
    const paddingY = message.kind === "lyric"
      ? config.inactivePaddingY + (config.activePaddingY - config.inactivePaddingY) * focus
      : config.inactivePaddingY;
    const fullText = message.kind === "title" ? message.text : message.line?.text || "";
    const characters = FoliaFaithfulClassic.splitGraphemes(fullText);
    // Present each bubble as one conversational beat; row-level phase owns the entrance.
    const characterProgress = characters.map(() => 1);
    const timestampVisible = message.kind !== "title" && (passed || timeMs >= message.line.endMs);
    return h("div", {
      className: `folia-cappella__row is-${message.side}${active ? " is-active" : ""}${passed ? " is-passed" : ""}${message.kind === "emo" ? " is-emo" : ""}`,
    }, h("div", {
      className: "folia-cappella__message",
      style: { opacity, transform: `translate3d(${(1 - phase) * (right ? 32 : -32)}px, ${(1 - phase) * 8}px, 0) scale(${scale})`, transformOrigin: right ? "100% 100%" : "0% 100%" },
    },
    h("span", { className: "folia-cappella__avatar", style: avatarStyle(message, playback, tuning, title), "aria-hidden": "true" }),
    message.kind === "emo"
      ? h("div", { className: "folia-cappella__emo-wrap", style: { width: active ? config.emoActiveSize : config.emoInactiveSize, height: active ? config.emoActiveSize : config.emoInactiveSize } },
        h("img", { src: message.emo?.url || assetUrl("emos", message.emo), alt: "", className: "folia-cappella__emo" }),
        timestampVisible && h("span", { className: "folia-cappella__timestamp" }, formatTimestamp(message.line.endMs)))
      : h("div", {
        className: "folia-cappella__bubble",
        style: {
          fontSize: `calc(${18 * fontMultiplier}px * var(--folia-scale))`,
          padding: `${paddingY}px ${paddingX}px`,
          boxShadow: focus > 0.01
            ? `0 18px 48px color-mix(in srgb, var(--folia-accent) ${Math.round(focus * 28)}%, transparent)`
            : "0 12px 32px rgba(0, 0, 0, .2)",
        },
      },
      focus > 0.01 && h("span", { className: "folia-cappella__glow", style: { opacity: focus }, "aria-hidden": "true" }),
      h("span", { className: "folia-cappella__text" }, characters.map((character, index) => h("span", {
        key: `${index}-${character}`,
        className: active ? "is-revealed" : "",
        style: active ? {
          opacity: characterProgress[index] > 0 ? 0.35 + characterProgress[index] * 0.65 : 0,
          transform: `translateY(${(1 - characterProgress[index]) * 5}px) scale(${0.96 + characterProgress[index] * 0.04})`,
        } : undefined,
      }, character))),
      timestampVisible && h("span", { className: "folia-cappella__timestamp" }, formatTimestamp(message.line.endMs))),
    ));
  }

  function CappellaStage({ playback, lyrics, activeIndex, timeMs, showTranslation, settings }) {
    const tuning = resolveTuning(settings);
    const config = intensityConfig(tuning.animationIntensity);
    const title = playback.title || "Spotify";
    const messages = useMemo(
      () => buildMessages(lyrics.lines, title, settings),
      [lyrics, title, tuning.showEmoMessages, tuning.avatarSource, tuning.emojiPackSource, tuning.animationIntensity, tuning.customEmojiAssets, tuning.customAvatarAssets],
    );
    const visible = getVisibleMessages(messages, activeIndex, timeMs, window.innerHeight);
    const line = lyrics.lines[Math.max(0, activeIndex)] || lyrics.lines[0];
    const upcoming = lyrics.lines.slice(activeIndex + 1, activeIndex + 3);
    return h("section", { className: "folia-cappella" },
      h("div", { className: "folia-cappella__conversation" }, visible.map((message) => h(MessageRow, {
        key: message.id, message, activeIndex, timeMs, playback, tuning, config, title,
      }))),
      h("div", { className: "folia-cappella__subtitles" },
        showTranslation && line?.translation && h("div", { className: "folia-cappella__translation" }, line.translation),
        upcoming.map((next, index) => h("div", { key: next.startMs, className: `folia-cappella__upcoming is-${index + 1}` }, next.text)),
      ),
    );
  }

  return { CappellaStage, buildMessages, getVisibleMessages, intensityConfig, messageState, revealCount, resolveTuning };
})();
