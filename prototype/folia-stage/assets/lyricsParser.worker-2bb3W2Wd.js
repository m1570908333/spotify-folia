(function() {
	var xe = (r, n) => () => (n || (r((n = { exports: {} }).exports, n), r = null), n.exports);
	const er = (r) => r.words?.[r.words.length - 1]?.endTime ?? r.endTime, tr = (r, n, i) => n === "none" ? {
		enterDuration: 0,
		exitDuration: 0,
		linePassHold: 0
	} : n === "fast" ? {
		enterDuration: xt(r * .45, .045, .06),
		exitDuration: xt(r * .22, .03, .04),
		linePassHold: i === "instant" ? 0 : .03
	} : {
		enterDuration: Math.min(.42, Math.max(.22, Math.max(r, .12) * .34)),
		exitDuration: Math.min(.32, Math.max(.18, Math.max(r, .12) * .18)),
		linePassHold: i === "instant" ? 0 : .06
	}, rr = (r) => r < .1 ? "micro" : r < .18 ? "short" : "normal", nr = (r) => r === "micro" ? "none" : r === "short" ? "fast" : "normal", ir = (r) => r === "micro" ? "instant" : r === "short" ? "fast" : "normal", xt = (r, n, i) => Math.min(Math.max(r, n), i), ar = (r, n, i, a) => {
		if (i === "none") return Math.max(r.endTime, r.startTime + .067);
		const s = tr(n, i, a), c = Math.max(er(r), r.startTime) + s.linePassHold, l = i === "fast" ? Math.max(r.startTime + s.enterDuration + .01, c, r.endTime - s.exitDuration) : Math.max(c, r.endTime - s.exitDuration);
		return Math.max(r.endTime, l + s.exitDuration);
	};
	function or(r, n) {
		const i = typeof r == "number" ? {
			startTime: r,
			endTime: n ?? r
		} : r, a = Math.max(i.endTime - i.startTime, 0), s = rr(a), c = nr(s), l = ir(s);
		return {
			rawDuration: a,
			timingClass: s,
			renderEndTime: ar(i, a, c, l),
			lineTransitionMode: c,
			wordRevealMode: l
		};
	}
	const sr = (r, n) => {
		const i = r.renderHints;
		return !!(i && i.rawDuration === n.rawDuration && i.timingClass === n.timingClass && i.renderEndTime === n.renderEndTime && i.lineTransitionMode === n.lineTransitionMode && i.wordRevealMode === n.wordRevealMode);
	}, lr = (r) => {
		let n = !1;
		const i = r.map((a) => {
			const s = or(a);
			return sr(a, s) ? a : (n = !0, {
				...a,
				renderHints: s
			});
		});
		return {
			value: n ? i : r,
			changed: n
		};
	}, cr = (r) => lr(r).value, J = {
		TT: "http://www.w3.org/ns/ttml",
		TTM: "http://www.w3.org/ns/ttml#metadata",
		ITUNES: "http://music.apple.com/lyric-ttml-internal",
		AMLL: "http://www.example.com/ns/amll",
		XML: "http://www.w3.org/XML/1998/namespace",
		XMLNS: "http://www.w3.org/2000/xmlns/",
		ITUNES_INTERNAL: "http://music.apple.com/lyric-ttml-internal",
		TTS: "http://www.w3.org/ns/ttml#styling"
	}, se = {
		TT: "tt",
		Head: "head",
		Body: "body",
		Div: "div",
		P: "p",
		Span: "span",
		Title: "title",
		Name: "name",
		Meta: "meta",
		ITunesMetadata: "iTunesMetadata",
		TTMLMetadata: "metadata",
		Songwriters: "songwriters",
		Songwriter: "songwriter",
		Translation: "translation",
		Translations: "translations",
		Transliteration: "transliteration",
		Transliterations: "transliterations",
		Text: "text",
		ParserError: "parsererror",
		Agent: "agent"
	}, j = {
		Timing: "timing",
		Id: "id",
		Key: "key",
		Value: "value",
		Lang: "lang",
		For: "for",
		SongPart: "songPart",
		SongPartKebab: "song-part",
		Begin: "begin",
		End: "end",
		Role: "role",
		Type: "type",
		Dur: "dur",
		Xmlns: "xmlns",
		Ruby: "ruby",
		Obscene: "obscene",
		EmptyBeat: "empty-beat"
	}, Ge = {
		ITunesTiming: "itunes:timing",
		ITunesPart: "itunes:songPart",
		ITunesKey: "itunes:key",
		TTMAgent: "ttm:agent",
		TTMRole: "ttm:role",
		TTMName: "ttm:name",
		AmllMeta: "amll:meta",
		AmllObscene: "amll:obscene",
		AmllEmptyBeat: "amll:empty-beat",
		XmlLang: "xml:lang",
		XmlId: "xml:id",
		XmlnsTtm: "xmlns:ttm",
		XmlnsTts: "xmlns:tts",
		XmlnsItunes: "xmlns:itunes",
		XmlnsAmll: "xmlns:amll",
		TtsRuby: "tts:ruby"
	}, le = {
		Word: "Word",
		Line: "Line",
		MimeXML: "application/xml",
		MusicName: "musicName",
		Artists: "artists",
		Album: "album",
		ISRC: "isrc",
		TTMLAuthorGithub: "ttmlAuthorGithub",
		TTMLAuthorGithubLogin: "ttmlAuthorGithubLogin",
		NCMMusicId: "ncmMusicId",
		QQMusicId: "qqMusicId",
		SpotifyId: "spotifyId",
		AppleMusicId: "appleMusicId",
		RoleBg: "x-bg",
		RoleTranslation: "x-translation",
		RoleRoman: "x-roman",
		Group: "group",
		Person: "person",
		Other: "other",
		Full: "full",
		AgentGroup: "v1000",
		AgentDefault: "v1",
		AgentDefaultDuet: "v2",
		RubyContainer: "container",
		RubyBase: "base",
		RubyTextContainer: "textContainer",
		RubyText: "text",
		True: "true",
		TimingMode: "timingMode",
		Language: "language"
	};
	var ur = class Be {
		domParser;
		static TIME_REGEX = /^(?:(?:(?<hours>\d+):)?(?<minutes>\d+):)?(?<seconds>\d+(?:\.\d+)?)$/;
		static LEADING_SPACE_REGEX = /^\s/;
		static TRAILING_SPACE_REGEX = /\s$/;
		static MULTI_SPACE_REGEX = /\s+/g;
		normalizeText(n, i = !0) {
			if (!n) return "";
			const a = n.replace(Be.MULTI_SPACE_REGEX, " ");
			return i ? a.trim() : a;
		}
		constructor(n) {
			if (n?.domParser) this.domParser = n.domParser;
			else if (typeof DOMParser < "u") this.domParser = new DOMParser();
			else throw new Error("No DOMParser found. If you are running in Node.js, please inject a DOMParser (e.g., @xmldom/xmldom).");
		}
		static parse(n, i) {
			return new Be(i).parse(n);
		}
		parse(n) {
			if (!n || typeof n != "string") throw new Error("TTMLParser: Input must be a valid XML string.");
			const i = this.domParser.parseFromString(n, le.MimeXML), { metadata: a, sidecar: s } = this.parseHead(i), c = i.getElementsByTagName(se.ParserError)[0];
			if (c) throw new Error(`TTMLParser: XML parsing error: ${c.textContent}`);
			const l = {
				metadata: a,
				lines: []
			}, d = i.documentElement;
			if (d) {
				const g = this.getAttr(d, J.XML, j.Lang);
				g && (l.metadata.language = g);
				const T = this.getAttr(d, J.ITUNES, j.Timing);
				(T && T === le.Word || T === le.Line) && (l.metadata.timingMode = T);
			}
			return this.parseBody(i, l, s), l.metadata.timingMode ??= this.inferTimingMode(l.lines), l.metadata.platformIds && (l.metadata.platformIds = this.sortPlatformIds(l.metadata.platformIds)), l;
		}
		inferTimingMode(n) {
			return n.some((i) => (i.words?.length ?? 0) > 1 || (i.backgroundVocal?.words?.length ?? 0) > 1) ? "Word" : "Line";
		}
		sortPlatformIds(n) {
			const i = [
				"ncmMusicId",
				"qqMusicId",
				"spotifyId",
				"appleMusicId"
			], a = {};
			for (const s of i) n[s] && (a[s] = n[s]);
			for (const s of Object.keys(n)) a[s] || (a[s] = n[s]);
			return a;
		}
		parseHead(n) {
			const i = n.getElementsByTagName(se.Head)[0], a = {
				title: [],
				artist: [],
				album: [],
				isrc: [],
				authorIds: [],
				authorNames: [],
				songwriters: [],
				agents: {},
				rawProperties: {}
			}, s = {};
			return i ? (this.parseTTMElements(i, a), this.parseAMLLMeta(i, a), this.parseiTunesExtensions(i, a, s), this.deduplicateMetadata(a), {
				metadata: a,
				sidecar: s
			}) : {
				metadata: a,
				sidecar: s
			};
		}
		deduplicateMetadata(n) {
			const i = (a) => a ? Array.from(new Set(a)) : [];
			if (n.title = i(n.title), n.artist = i(n.artist), n.album = i(n.album), n.isrc = i(n.isrc), n.authorIds = i(n.authorIds), n.authorNames = i(n.authorNames), n.songwriters = i(n.songwriters), n.platformIds) for (const a of Object.keys(n.platformIds)) n.platformIds[a] && (n.platformIds[a] = i(n.platformIds[a]));
			if (n.rawProperties) for (const a of Object.keys(n.rawProperties)) n.rawProperties[a] && (n.rawProperties[a] = i(n.rawProperties[a]));
		}
		parseTTMElements(n, i) {
			const a = n.getElementsByTagNameNS(J.TTM, se.Title);
			a.length > 0 && a[0].textContent && i.title?.push(a[0].textContent.trim());
			const s = Array.from(n.getElementsByTagNameNS(J.TTM, se.Agent));
			for (const c of s) {
				const l = this.getAttr(c, J.XML, j.Id);
				if (!l) continue;
				const d = this.getAttr(c, J.TTM, j.Type, j.Type), g = c.getElementsByTagNameNS(J.TTM, se.Name), T = { id: l };
				if (d && (T.type = d), g.length > 0 && g[0].textContent) {
					const p = g[0].textContent.trim();
					p.length > 0 && (T.name = p);
				}
				i.agents ??= {}, i.agents[l] = T;
			}
		}
		parseAMLLMeta(n, i) {
			const a = Array.from(n.getElementsByTagNameNS(J.AMLL, se.Meta)).filter((s) => this.getAttr(s, J.AMLL, j.Key) && this.getAttr(s, J.AMLL, j.Value));
			for (const s of a) {
				const c = this.getAttr(s, J.AMLL, j.Key), l = this.getAttr(s, J.AMLL, j.Value)?.trim();
				if (!(!c || !l)) switch (c) {
					case le.MusicName:
						i.title?.push(l);
						break;
					case le.Artists:
						i.artist?.push(l);
						break;
					case le.Album:
						i.album?.push(l);
						break;
					case le.ISRC:
						i.isrc?.push(l);
						break;
					case le.TTMLAuthorGithub:
						i.authorIds?.push(l);
						break;
					case le.TTMLAuthorGithubLogin:
						i.authorNames?.push(l);
						break;
					case le.NCMMusicId:
					case le.QQMusicId:
					case le.SpotifyId:
					case le.AppleMusicId:
						i.platformIds ??= {}, (i.platformIds[c] ??= []).push(l);
						break;
					default: i.rawProperties ??= {}, (i.rawProperties[c] ??= []).push(l);
				}
			}
		}
		extractSubContent(n, i, a = !1) {
			const s = {}, c = this.normalizeText(n.text), l = !a && n.words && n.words.length > 0;
			if (c || l) {
				const d = { text: c };
				i && (d.language = i), l && (n.words?.length === 1 && n.words?.[0].startTime === 0 && n.words?.[0].endTime === 0 || (d.words = n.words)), s.main = d;
			}
			if ("backgroundVocal" in n && n.backgroundVocal) {
				const d = n.backgroundVocal, g = this.normalizeText(d.text), T = !a && d.words && d.words.length > 0;
				if (g || T) {
					const p = { text: g };
					i && (p.language = i), T && (d.words?.length === 1 && d.words?.[0].startTime === 0 && d.words?.[0].endTime === 0 || (p.words = d.words)), s.bg = p;
				}
			}
			return s;
		}
		parseiTunesExtensions(n, i, a) {
			const s = Array.from(n.getElementsByTagName(se.ITunesMetadata));
			if (s.length !== 0) for (const c of s) {
				const l = c.getElementsByTagName(se.Songwriters)[0];
				if (l) {
					const g = Array.from(l.getElementsByTagName(se.Songwriter));
					for (const T of g) {
						const p = T.textContent?.trim();
						p && i.songwriters?.push(p);
					}
				}
				const d = (g, T, p) => {
					const y = c.getElementsByTagName(g)[0];
					if (!y) return;
					const m = Array.from(y.getElementsByTagName(T));
					for (const E of m) {
						const v = this.getAttr(E, J.XML, j.Lang), b = Array.from(E.getElementsByTagName(se.Text));
						for (const S of b) {
							const P = S.getAttribute(j.For), M = this.parseCommonContent(S);
							if (P) {
								const D = this.extractSubContent(M, v, !1);
								if (a[P] ??= {}, D.main && (a[P][p] ??= []).push(D.main), D.bg) {
									const B = p === "translations" ? "bgTranslations" : "bgRomanizations";
									(a[P][B] ??= []).push(D.bg);
								}
							}
						}
					}
				};
				d(se.Translations, se.Translation, "translations"), d(se.Transliterations, se.Transliteration, "romanizations");
			}
		}
		parseTime(n) {
			if (!n) return 0;
			const i = n.trim();
			if (i.length === 0) return 0;
			if (i.endsWith("s")) {
				const s = Number(i.slice(0, -1));
				return Number.isNaN(s) ? 0 : Math.round(s * 1e3);
			}
			const a = i.match(Be.TIME_REGEX);
			if (a?.groups) {
				const { seconds: s, minutes: c, hours: l } = a.groups, d = Number(s), g = c ? parseInt(c, 10) : 0, T = l ? parseInt(l, 10) : 0;
				if (!Number.isNaN(d) && !Number.isNaN(g) && !Number.isNaN(T)) {
					const p = T * 3600 + g * 60 + d;
					return Math.round(p * 1e3);
				}
			}
			return 0;
		}
		parseBody(n, i, a) {
			const s = n.getElementsByTagName(se.Body)[0];
			if (!s) return;
			const c = Array.from(s.childNodes);
			let l = 0;
			for (const d of c) {
				if (d.nodeType !== 1) continue;
				const g = d, T = g.localName || g.tagName.toLowerCase().split(":").pop();
				if (T === se.Div) {
					l++;
					const p = this.getAttr(g, J.ITUNES, j.SongPartKebab) || this.getAttr(g, J.ITUNES, j.SongPart), y = g.getElementsByTagNameNS(J.TT, se.P), m = y.length > 0 ? Array.from(y) : Array.from(g.getElementsByTagName(se.P));
					for (const E of m) this.processLineElement(E, i.lines, a, p, l);
				} else T === se.P && (l++, this.processLineElement(g, i.lines, a, void 0, l));
			}
		}
		processLineElement(n, i, a, s, c) {
			const l = this.getAttr(n, J.ITUNES, j.Key);
			if (!l) return;
			const d = {
				id: l,
				...this.parseCommonContent(n)
			};
			s && (d.songPart = s), c !== void 0 && (d.blockIndex = c);
			const g = this.getAttr(n, J.TTM, se.Agent);
			g && (d.agentId = g);
			const T = a[l];
			T && (T.translations && (d.translations ??= []).push(...T.translations), T.romanizations && (d.romanizations ??= []).push(...T.romanizations), T.bgTranslations && d.backgroundVocal && (d.backgroundVocal.translations ??= []).push(...T.bgTranslations), T.bgRomanizations && d.backgroundVocal && (d.backgroundVocal.romanizations ??= []).push(...T.bgRomanizations)), i.push(d);
		}
		parseCommonContent(n) {
			const i = this.getAttr(n, J.XML, j.Begin, j.Begin), a = this.getAttr(n, J.XML, j.End, j.End), s = this.parseTime(i), c = this.parseTime(a), l = this.extractNodeState(n);
			l.backgroundVocal && (l.bgTranslations.length > 0 && (l.backgroundVocal.translations ??= []).push(...l.bgTranslations), l.bgRomanizations.length > 0 && (l.backgroundVocal.romanizations ??= []).push(...l.bgRomanizations)), this.finalizeWords(l.words);
			const { startTime: d, endTime: g } = this.calculateTimeRange(s, c, l.words, l.backgroundVocal), T = this.normalizeText(l.fullText), p = i !== null || a !== null;
			return this.applyFallbackWord(l.words, T, p, s, c, d, g), this.buildLyricBase(l, T, d, g);
		}
		extractNodeState(n) {
			const i = {
				fullText: "",
				words: [],
				translations: [],
				romanizations: [],
				bgTranslations: [],
				bgRomanizations: [],
				backgroundVocal: void 0
			}, a = Array.from(n.childNodes);
			for (const s of a) s.nodeType === 3 ? this.processTextNode(i, s) : s.nodeType === 1 && this.processElementNode(i, s);
			return i;
		}
		calculateTimeRange(n, i, a, s) {
			let c = n, l = i;
			const d = [...a];
			if (s && d.push(s), d.length > 0) {
				let g = 1 / 0, T = 0;
				for (const p of d) p.startTime < g && (g = p.startTime), p.endTime > T && (T = p.endTime);
				(c === 0 || g > 0 && g < c) && (c = g === 1 / 0 ? 0 : g), (l === 0 || T > l) && (l = T);
			}
			return {
				startTime: c,
				endTime: l
			};
		}
		applyFallbackWord(n, i, a, s, c, l, d) {
			n.length === 0 && i.length > 0 && a && n.push({
				text: i,
				startTime: s > 0 ? s : l,
				endTime: c > 0 ? c : d,
				endsWithSpace: !1
			});
		}
		buildLyricBase(n, i, a, s) {
			return {
				text: i,
				startTime: a,
				endTime: s,
				words: n.words.length > 0 ? n.words : void 0,
				translations: n.translations.length > 0 ? n.translations : void 0,
				romanizations: n.romanizations.length > 0 ? n.romanizations : void 0,
				backgroundVocal: n.backgroundVocal
			};
		}
		processTextNode(n, i) {
			const a = i.textContent || "", s = a.includes(`
`);
			if (s && a.trim().length === 0) return;
			const c = this.normalizeText(a, !1);
			n.fullText += c, !s && c.length > 0 && c.trim().length === 0 && n.words.length > 0 && (n.words[n.words.length - 1].endsWithSpace = !0);
		}
		processElementNode(n, i) {
			const a = this.getAttr(i, J.TTM, j.Role);
			if (this.getAttr(i, J.TTS, j.Ruby, Ge.TtsRuby) === le.RubyContainer) {
				this.processRubyElement(n, i);
				return;
			}
			switch (a) {
				case le.RoleBg:
					n.backgroundVocal = this.parseBackgroundVocal(i);
					break;
				case le.RoleTranslation: {
					const s = this.parseInlineSubContent(i);
					s && (s.main && n.translations.push(s.main), s.bg && n.bgTranslations.push(s.bg));
					break;
				}
				case le.RoleRoman: {
					const s = this.parseInlineSubContent(i);
					s && (s.main && n.romanizations.push(s.main), s.bg && n.bgRomanizations.push(s.bg));
					break;
				}
				default: this.processWordElement(n, i);
			}
		}
		processRubyElement(n, i) {
			const a = this.getAttr(i, J.AMLL, j.Obscene, Ge.AmllObscene) === "true", s = this.getAttr(i, J.AMLL, j.EmptyBeat, Ge.AmllEmptyBeat);
			let c;
			if (s) {
				const m = parseInt(s, 10);
				Number.isNaN(m) || (c = m);
			}
			let l = "";
			const d = [], g = Array.from(i.childNodes);
			for (const m of g) {
				if (m.nodeType !== 1) continue;
				const E = m, v = this.getAttr(E, J.TTS, j.Ruby, Ge.TtsRuby);
				if (v === le.RubyBase) l = this.normalizeText(E.textContent, !1);
				else if (v === le.RubyTextContainer) {
					const b = Array.from(E.childNodes);
					for (const S of b) {
						if (S.nodeType !== 1) continue;
						const P = S;
						if (this.getAttr(P, J.TTS, j.Ruby, Ge.TtsRuby) === le.RubyText) {
							const M = this.getAttr(P, J.XML, j.Begin, j.Begin), D = this.getAttr(P, J.XML, j.End, j.End), B = this.normalizeText(P.textContent, !1).trim();
							B && M && D && d.push({
								text: B,
								startTime: this.parseTime(M),
								endTime: this.parseTime(D)
							});
						}
					}
				}
			}
			if (!l) return;
			n.fullText += l;
			let T = 0, p = 0;
			d.length > 0 && (T = Math.min(...d.map((m) => m.startTime)), p = Math.max(...d.map((m) => m.endTime)));
			const y = l.trim();
			if (y.length > 0) {
				const m = Be.TRAILING_SPACE_REGEX.test(l);
				Be.LEADING_SPACE_REGEX.test(l) && n.words.length > 0 && (n.words[n.words.length - 1].endsWithSpace = !0), n.words.push({
					text: y,
					startTime: T,
					endTime: p,
					ruby: d.length > 0 ? d : void 0,
					endsWithSpace: m,
					obscene: a ? !0 : void 0,
					emptyBeat: c
				});
			}
		}
		processWordElement(n, i) {
			const a = this.getAttr(i, J.XML, j.Begin, j.Begin), s = this.getAttr(i, J.XML, j.End, j.End), c = this.getAttr(i, J.AMLL, j.Obscene, Ge.AmllObscene) === "true", l = this.getAttr(i, J.AMLL, j.EmptyBeat, Ge.AmllEmptyBeat);
			let d;
			if (l) {
				const p = parseInt(l, 10);
				Number.isNaN(p) || (d = p);
			}
			const g = i.textContent || "", T = this.normalizeText(g, !1);
			if (n.fullText += T, a && s) {
				const p = g.includes(`
`);
				let y = !1, m = !1;
				p || (y = Be.LEADING_SPACE_REGEX.test(T), m = Be.TRAILING_SPACE_REGEX.test(T));
				const E = T.trim();
				y && n.words.length > 0 && (n.words[n.words.length - 1].endsWithSpace = !0), E.length > 0 && n.words.push({
					text: E,
					startTime: this.parseTime(a),
					endTime: this.parseTime(s),
					endsWithSpace: m,
					obscene: c ? !0 : void 0,
					emptyBeat: d
				});
			}
		}
		parseBackgroundVocal(n) {
			const { backgroundVocal: i, ...a } = this.parseCommonContent(n);
			if (a.text = a.text.replace(/^[(（]+/, "").replace(/[)）]+$/, ""), a.words && a.words.length > 0) {
				a.words[0].text = a.words[0].text.replace(/^[(（]+/, "").trimStart();
				const s = a.words.length - 1;
				a.words[s].text = a.words[s].text.replace(/[)）]+$/, "").trimEnd();
			}
			return a;
		}
		parseInlineSubContent(n) {
			const i = this.getAttr(n, J.XML, j.Lang), a = this.parseCommonContent(n), s = this.extractSubContent(a, i, !0);
			return s.main || s.bg ? s : null;
		}
		finalizeWords(n) {
			if (n.length === 0) return [];
			n[0].text = n[0].text.trimStart();
			const i = n.length - 1;
			return n[i].text = n[i].text.trimEnd(), n[i].endsWithSpace = !1, n;
		}
		getAttr(n, i, a, s) {
			const c = n.getAttributeNS(i, a);
			if (c) return c;
			if (s) {
				const l = n.getAttribute(s);
				if (l) return l;
			}
			if (n.hasAttributes()) {
				const l = Array.from(n.attributes);
				for (const d of l) if ((d.localName || d.nodeName.split(":").pop()) === a) return d.value;
			}
			return null;
		}
	}, $e = xe(((r) => {
		function n(M, D, B) {
			if (B === void 0 && (B = Array.prototype), M && typeof B.find == "function") return B.find.call(M, D);
			for (var W = 0; W < M.length; W++) if (a(M, W)) {
				var Z = M[W];
				if (D.call(void 0, Z, W, M)) return Z;
			}
		}
		function i(M, D) {
			return D === void 0 && (D = Object), D && typeof D.getOwnPropertyDescriptors == "function" && (M = D.create(null, D.getOwnPropertyDescriptors(M))), D && typeof D.freeze == "function" ? D.freeze(M) : M;
		}
		function a(M, D) {
			return Object.prototype.hasOwnProperty.call(M, D);
		}
		function s(M, D) {
			if (M === null || typeof M != "object") throw new TypeError("target is not an object");
			for (var B in D) a(D, B) && (M[B] = D[B]);
			return M;
		}
		var c = i({
			allowfullscreen: !0,
			async: !0,
			autofocus: !0,
			autoplay: !0,
			checked: !0,
			controls: !0,
			default: !0,
			defer: !0,
			disabled: !0,
			formnovalidate: !0,
			hidden: !0,
			ismap: !0,
			itemscope: !0,
			loop: !0,
			multiple: !0,
			muted: !0,
			nomodule: !0,
			novalidate: !0,
			open: !0,
			playsinline: !0,
			readonly: !0,
			required: !0,
			reversed: !0,
			selected: !0
		});
		function l(M) {
			return a(c, M.toLowerCase());
		}
		var d = i({
			area: !0,
			base: !0,
			br: !0,
			col: !0,
			embed: !0,
			hr: !0,
			img: !0,
			input: !0,
			link: !0,
			meta: !0,
			param: !0,
			source: !0,
			track: !0,
			wbr: !0
		});
		function g(M) {
			return a(d, M.toLowerCase());
		}
		var T = i({
			script: !1,
			style: !1,
			textarea: !0,
			title: !0
		});
		function p(M) {
			var D = M.toLowerCase();
			return a(T, D) && !T[D];
		}
		function y(M) {
			var D = M.toLowerCase();
			return a(T, D) && T[D];
		}
		function m(M) {
			return M === v.HTML;
		}
		function E(M) {
			return m(M) || M === v.XML_XHTML_APPLICATION;
		}
		var v = i({
			HTML: "text/html",
			XML_APPLICATION: "application/xml",
			XML_TEXT: "text/xml",
			XML_XHTML_APPLICATION: "application/xhtml+xml",
			XML_SVG_IMAGE: "image/svg+xml"
		}), b = Object.keys(v).map(function(M) {
			return v[M];
		});
		function S(M) {
			return b.indexOf(M) > -1;
		}
		var P = i({
			HTML: "http://www.w3.org/1999/xhtml",
			SVG: "http://www.w3.org/2000/svg",
			XML: "http://www.w3.org/XML/1998/namespace",
			XMLNS: "http://www.w3.org/2000/xmlns/"
		});
		r.assign = s, r.find = n, r.freeze = i, r.HTML_BOOLEAN_ATTRIBUTES = c, r.HTML_RAW_TEXT_ELEMENTS = T, r.HTML_VOID_ELEMENTS = d, r.hasDefaultHTMLNamespace = E, r.hasOwn = a, r.isHTMLBooleanAttribute = l, r.isHTMLRawTextElement = p, r.isHTMLEscapableRawTextElement = y, r.isHTMLMimeType = m, r.isHTMLVoidElement = g, r.isValidMimeType = S, r.MIME_TYPE = v, r.NAMESPACE = P;
	})), lt = xe(((r) => {
		var n = $e();
		function i(E, v) {
			E.prototype = Object.create(Error.prototype, {
				constructor: { value: E },
				name: {
					value: E.name,
					enumerable: !0,
					writable: v
				}
			});
		}
		var a = n.freeze({
			Error: "Error",
			IndexSizeError: "IndexSizeError",
			DomstringSizeError: "DomstringSizeError",
			HierarchyRequestError: "HierarchyRequestError",
			WrongDocumentError: "WrongDocumentError",
			InvalidCharacterError: "InvalidCharacterError",
			NoDataAllowedError: "NoDataAllowedError",
			NoModificationAllowedError: "NoModificationAllowedError",
			NotFoundError: "NotFoundError",
			NotSupportedError: "NotSupportedError",
			InUseAttributeError: "InUseAttributeError",
			InvalidStateError: "InvalidStateError",
			SyntaxError: "SyntaxError",
			InvalidModificationError: "InvalidModificationError",
			NamespaceError: "NamespaceError",
			InvalidAccessError: "InvalidAccessError",
			ValidationError: "ValidationError",
			TypeMismatchError: "TypeMismatchError",
			SecurityError: "SecurityError",
			NetworkError: "NetworkError",
			AbortError: "AbortError",
			URLMismatchError: "URLMismatchError",
			QuotaExceededError: "QuotaExceededError",
			TimeoutError: "TimeoutError",
			InvalidNodeTypeError: "InvalidNodeTypeError",
			DataCloneError: "DataCloneError",
			EncodingError: "EncodingError",
			NotReadableError: "NotReadableError",
			UnknownError: "UnknownError",
			ConstraintError: "ConstraintError",
			DataError: "DataError",
			TransactionInactiveError: "TransactionInactiveError",
			ReadOnlyError: "ReadOnlyError",
			VersionError: "VersionError",
			OperationError: "OperationError",
			NotAllowedError: "NotAllowedError",
			OptOutError: "OptOutError"
		}), s = Object.keys(a);
		function c(E) {
			return typeof E == "number" && E >= 1 && E <= 25;
		}
		function l(E) {
			return typeof E == "string" && E.substring(E.length - a.Error.length) === a.Error;
		}
		function d(E, v) {
			c(E) ? (this.name = s[E], this.message = v || "") : (this.message = E, this.name = l(v) ? v : a.Error), Error.captureStackTrace && Error.captureStackTrace(this, d);
		}
		i(d, !0), Object.defineProperties(d.prototype, { code: {
			enumerable: !0,
			get: function() {
				var E = s.indexOf(this.name);
				return c(E) ? E : 0;
			}
		} });
		for (var g = {
			INDEX_SIZE_ERR: 1,
			DOMSTRING_SIZE_ERR: 2,
			HIERARCHY_REQUEST_ERR: 3,
			WRONG_DOCUMENT_ERR: 4,
			INVALID_CHARACTER_ERR: 5,
			NO_DATA_ALLOWED_ERR: 6,
			NO_MODIFICATION_ALLOWED_ERR: 7,
			NOT_FOUND_ERR: 8,
			NOT_SUPPORTED_ERR: 9,
			INUSE_ATTRIBUTE_ERR: 10,
			INVALID_STATE_ERR: 11,
			SYNTAX_ERR: 12,
			INVALID_MODIFICATION_ERR: 13,
			NAMESPACE_ERR: 14,
			INVALID_ACCESS_ERR: 15,
			VALIDATION_ERR: 16,
			TYPE_MISMATCH_ERR: 17,
			SECURITY_ERR: 18,
			NETWORK_ERR: 19,
			ABORT_ERR: 20,
			URL_MISMATCH_ERR: 21,
			QUOTA_EXCEEDED_ERR: 22,
			TIMEOUT_ERR: 23,
			INVALID_NODE_TYPE_ERR: 24,
			DATA_CLONE_ERR: 25
		}, T = Object.entries(g), p = 0; p < T.length; p++) {
			var y = T[p][0];
			d[y] = T[p][1];
		}
		function m(E, v, b) {
			this.message = E, this.locator = v, this.cause = b, Error.captureStackTrace && Error.captureStackTrace(this, m);
		}
		i(m), r.DOMException = d, r.DOMExceptionName = a, r.ExceptionCode = g, r.ParseError = m;
	})), Ot = xe(((r) => {
		function n(ee) {
			try {
				typeof ee != "function" && (ee = RegExp);
				var ce = new ee("𝌆", "u").exec("𝌆");
				return !!ce && ce[0].length === 2;
			} catch {}
			return !1;
		}
		var i = n();
		function a(ee) {
			if (ee.source[0] !== "[") throw new Error(ee + " can not be used with chars");
			return ee.source.slice(1, ee.source.lastIndexOf("]"));
		}
		function s(ee, ce) {
			if (ee.source[0] !== "[") throw new Error("/" + ee.source + "/ can not be used with chars_without");
			if (!ce || typeof ce != "string") throw new Error(JSON.stringify(ce) + " is not a valid search");
			if (ee.source.indexOf(ce) === -1) throw new Error("\"" + ce + "\" is not is /" + ee.source + "/");
			if (ce === "-" && ee.source.indexOf(ce) !== 1) throw new Error("\"" + ce + "\" is not at the first postion of /" + ee.source + "/");
			return new RegExp(ee.source.replace(ce, ""), i ? "u" : "");
		}
		function c(ee) {
			var ce = this;
			return new RegExp(Array.prototype.slice.call(arguments).map(function(oe) {
				var Ue = typeof oe == "string";
				if (Ue && ce === void 0 && oe === "|") throw new Error("use regg instead of reg to wrap expressions with `|`!");
				return Ue ? oe : oe.source;
			}).join(""), i ? "u" : "");
		}
		function l(ee) {
			if (arguments.length === 0) throw new Error("no parameters provided");
			return c.apply(l, ["(?:"].concat(Array.prototype.slice.call(arguments), [")"]));
		}
		var d = "�", g = /[-\x09\x0A\x0D\x20-\x2C\x2E-\uD7FF\uE000-\uFFFD]/;
		i && (g = c("[", a(g), "\\u{10000}-\\u{10FFFF}", "]"));
		var T = new RegExp("[^" + a(g) + "]", i ? "u" : ""), p = /[\x20\x09\x0D\x0A]/, y = a(p), m = c(p, "+"), E = c(p, "*"), v = /[:_a-zA-Z\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
		i && (v = c("[", a(v), "\\u{10000}-\\u{10FFFF}", "]"));
		var b = c("[", a(v), a(/[-.0-9\xB7]/), a(/[\u0300-\u036F\u203F-\u2040]/), "]"), S = c(v, b, "*"), P = c("^", S, "$"), M = c(b, "+"), D = l(c("&", S, ";"), "|", l(/&#[0-9]+;|&#x[0-9a-fA-F]+;/)), B = c("%", S, ";"), W = l(c("\"", l(/[^%&"]/, "|", B, "|", D), "*", "\""), "|", c("'", l(/[^%&']/, "|", B, "|", D), "*", "'")), Z = l("\"", l(/[^<&"]/, "|", D), "*", "\"", "|", "'", l(/[^<&']/, "|", D), "*", "'"), N = c(s(v, ":"), s(b, ":"), "*"), C = c("^", N, "$"), k = c(N, l(":", N), "?"), H = c("^", k, "$"), X = c("(", k, ")"), Y = l(/"[^"]*"|'[^']*'/), de = c(/^<\?/, "(", S, ")", l(m, "(?!", p, ")(", g, "*?)"), "?", /\?>/), ie = /[\x20\x0D\x0Aa-zA-Z0-9-'()+,./:=?;!*#@$_%]/, ae = l("\"", ie, "*\"", "|", "'", s(ie, "'"), "*'"), h = "<!--", A = "-->", R = c(h, l(s(g, "-"), "|", c("-", s(g, "-"))), "*", A), _ = "#PCDATA", q = l("EMPTY", "|", "ANY", "|", l(c(/\(/, E, _, l(E, /\|/, E, k), "*", E, /\)\*/), "|", c(/\(/, E, _, E, /\)/)), "|", c(/\([^>]+\)/, /[?*+]?/)), I = c("<!ELEMENT", m, l(k, "|", B), m, l(q, "|", B), E, ">"), U = c("<!ATTLIST", m, S, l(m, S, m, l(/CDATA|ID|IDREF|IDREFS|ENTITY|ENTITIES|NMTOKEN|NMTOKENS/, "|", l(c("NOTATION", m, /\(/, E, S, l(E, /\|/, E, S), "*", E, /\)/), "|", c(/\(/, E, M, l(E, /\|/, E, M), "*", E, /\)/))), m, l(/#REQUIRED|#IMPLIED/, "|", l(l("#FIXED", m), "?", Z))), "*", E, ">"), $ = "about:legacy-compat", V = l("\"" + $ + "\"", "|", "'" + $ + "'"), L = "SYSTEM", x = "PUBLIC", G = l(l(L, m, Y), "|", l(x, m, ae, m, Y)), Q = c("^", l(l(L, m, "(?<SystemLiteralOnly>", Y, ")"), "|", l(x, m, "(?<PubidLiteral>", ae, ")", m, "(?<SystemLiteral>", Y, ")"))), fe = c("^", ae, "$"), Te = c("^", Y, "$"), be = l(W, "|", l(G, l(m, "NDATA", m, S), "?")), ue = "<!ENTITY", me = l(c(ue, m, S, m, be, E, ">"), "|", c(ue, m, "%", m, S, m, l(W, "|", G), E, ">")), He = c("<!NOTATION", m, S, m, l(G, "|", c(x, m, ae)), E, ">"), Me = c(E, "=", E), De = /1[.]\d+/, z = c(m, "version", Me, l("'", De, "'", "|", "\"", De, "\"")), _e = /[A-Za-z][-A-Za-z0-9._]*/, we = c(/^<\?xml/, z, l(m, "encoding", Me, l("\"", _e, "\"", "|", "'", _e, "'")), "?", l(m, "standalone", Me, l("'", l("yes", "|", "no"), "'", "|", "\"", l("yes", "|", "no"), "\"")), "?", E, /\?>/), re = "<!DOCTYPE", pe = "<![CDATA[", nt = "]]>", qe = c(/<!\[CDATA\[/, c(g, "*?", /\]\]>/));
		r.chars = a, r.chars_without = s, r.detectUnicodeSupport = n, r.reg = c, r.regg = l, r.ABOUT_LEGACY_COMPAT = $, r.ABOUT_LEGACY_COMPAT_SystemLiteral = V, r.AttlistDecl = U, r.CDATA_START = pe, r.CDATA_END = nt, r.CDSect = qe, r.Char = g, r.Comment = R, r.COMMENT_START = h, r.COMMENT_END = A, r.DOCTYPE_DECL_START = re, r.elementdecl = I, r.EntityDecl = me, r.EntityValue = W, r.ExternalID = G, r.ExternalID_match = Q, r.Name = S, r.Name_exact = P, r.NCName_exact = C, r.NotationDecl = He, r.Reference = D, r.PEReference = B, r.PI = de, r.PUBLIC = x, r.PubidLiteral = ae, r.PubidLiteral_match = fe, r.QName = k, r.QName_exact = H, r.QName_group = X, r.S = m, r.SChar_s = y, r.S_OPT = E, r.SYSTEM = L, r.SystemLiteral = Y, r.SystemLiteral_match = Te, r.InvalidChar = T, r.UNICODE_REPLACEMENT_CHARACTER = d, r.UNICODE_SUPPORT = i, r.XMLDecl = we;
	})), Pt = xe(((r) => {
		var n = $e(), i = n.find, a = n.hasDefaultHTMLNamespace, s = n.hasOwn, c = n.isHTMLMimeType, l = n.isHTMLRawTextElement, d = n.isHTMLVoidElement, g = n.MIME_TYPE, T = n.NAMESPACE, p = Symbol(), y = lt(), m = y.DOMException, E = y.DOMExceptionName, v = Ot();
		function b(e) {
			if (e !== p) throw new TypeError("Illegal constructor");
		}
		function S(e) {
			return e !== "";
		}
		function P(e) {
			return e ? e.split(/[\t\n\f\r ]+/).filter(S) : [];
		}
		function M(e, t) {
			return s(e, t) || (e[t] = !0), e;
		}
		function D(e) {
			if (!e) return [];
			var t = P(e);
			return Object.keys(t.reduce(M, {}));
		}
		function B(e) {
			return function(t) {
				return e && e.indexOf(t) !== -1;
			};
		}
		function W(e) {
			if (!v.QName_exact.test(e)) throw new m(m.INVALID_CHARACTER_ERR, "invalid character in qualified name \"" + e + "\"");
		}
		function Z(e, t) {
			W(t), e = e || null;
			var o = null, u = t;
			if (t.indexOf(":") >= 0) {
				var f = t.split(":");
				o = f[0], u = f[1];
			}
			if (o !== null && e === null) throw new m(m.NAMESPACE_ERR, "prefix is non-null and namespace is null");
			if (o === "xml" && e !== n.NAMESPACE.XML) throw new m(m.NAMESPACE_ERR, "prefix is \"xml\" and namespace is not the XML namespace");
			if ((o === "xmlns" || t === "xmlns") && e !== n.NAMESPACE.XMLNS) throw new m(m.NAMESPACE_ERR, "either qualifiedName or prefix is \"xmlns\" and namespace is not the XMLNS namespace");
			if (e === n.NAMESPACE.XMLNS && o !== "xmlns" && t !== "xmlns") throw new m(m.NAMESPACE_ERR, "namespace is the XMLNS namespace and neither qualifiedName nor prefix is \"xmlns\"");
			return [
				e,
				o,
				u
			];
		}
		function N(e, t) {
			for (var o in e) s(e, o) && (t[o] = e[o]);
		}
		function C(e, t) {
			var o = e.prototype;
			if (!(o instanceof t)) {
				let f = function() {};
				f.prototype = t.prototype, f = new f(), N(o, f), e.prototype = o = f;
			}
			o.constructor != e && (typeof e != "function" && console.error("unknown Class:" + e), o.constructor = e);
		}
		var k = {}, H = k.ELEMENT_NODE = 1, X = k.ATTRIBUTE_NODE = 2, Y = k.TEXT_NODE = 3, de = k.CDATA_SECTION_NODE = 4, ie = k.ENTITY_REFERENCE_NODE = 5, ae = k.ENTITY_NODE = 6, h = k.PROCESSING_INSTRUCTION_NODE = 7, A = k.COMMENT_NODE = 8, R = k.DOCUMENT_NODE = 9, _ = k.DOCUMENT_TYPE_NODE = 10, q = k.DOCUMENT_FRAGMENT_NODE = 11, I = k.NOTATION_NODE = 12, U = n.freeze({
			DOCUMENT_POSITION_DISCONNECTED: 1,
			DOCUMENT_POSITION_PRECEDING: 2,
			DOCUMENT_POSITION_FOLLOWING: 4,
			DOCUMENT_POSITION_CONTAINS: 8,
			DOCUMENT_POSITION_CONTAINED_BY: 16,
			DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: 32
		});
		function $(e, t) {
			if (t.length < e.length) return $(t, e);
			var o = null;
			for (var u in e) {
				if (e[u] !== t[u]) return o;
				o = e[u];
			}
			return o;
		}
		function V(e) {
			return e.guid || (e.guid = Math.random()), e.guid;
		}
		function L() {}
		L.prototype = {
			length: 0,
			item: function(e) {
				return e >= 0 && e < this.length ? this[e] : null;
			},
			toString: function(e) {
				var t;
				typeof e == "function" ? t = {
					requireWellFormed: !1,
					splitCDATASections: !0,
					nodeFilter: e
				} : e ? t = {
					requireWellFormed: !!e.requireWellFormed,
					splitCDATASections: e.splitCDATASections !== !1,
					nodeFilter: e.nodeFilter || null
				} : t = {
					requireWellFormed: !1,
					splitCDATASections: !0,
					nodeFilter: null
				};
				for (var o = [], u = 0; u < this.length; u++) Mt(this[u], o, null, t);
				return o.join("");
			},
			filter: function(e) {
				return Array.prototype.filter.call(this, e);
			},
			indexOf: function(e) {
				return Array.prototype.indexOf.call(this, e);
			}
		}, L.prototype[Symbol.iterator] = function() {
			var e = this, t = 0;
			return {
				next: function() {
					return t < e.length ? {
						value: e[t++],
						done: !1
					} : { done: !0 };
				},
				return: function() {
					return { done: !0 };
				}
			};
		};
		function x(e, t) {
			this._node = e, this._refresh = t, G(this);
		}
		function G(e) {
			var t = e._node._inc || e._node.ownerDocument._inc;
			if (e._inc !== t) {
				var o = e._refresh(e._node);
				if (Zt(e, "length", o.length), !e.$$length || o.length < e.$$length) for (var u = o.length; u in e; u++) s(e, u) && delete e[u];
				N(o, e), e._inc = t;
			}
		}
		x.prototype.item = function(e) {
			return G(this), this[e] || null;
		}, C(x, L);
		function Q() {
			this._nsIndex = Object.create(null), this._noNsIndex = Object.create(null);
		}
		function fe(e, t) {
			for (var o = 0; o < e.length;) {
				if (e[o] === t) return o;
				o++;
			}
		}
		function Te(e, t, o) {
			if (!t) return e._noNsIndex;
			var u = e._nsIndex[t];
			return !u && o && (u = e._nsIndex[t] = Object.create(null)), u;
		}
		function be(e, t, o) {
			var u = Te(e, t, !1);
			return u && u[o] || null;
		}
		function ue(e, t) {
			Te(e, t.namespaceURI, !0)[t.localName] = t;
		}
		function me(e, t) {
			var o = Te(e, t.namespaceURI, !1);
			o && delete o[t.localName];
		}
		function He(e, t, o, u) {
			if (u ? t[fe(t, u)] = o : (t[t.length] = o, t.length++), ue(t, o), e) {
				o.ownerElement = e;
				var f = e.ownerDocument;
				f && (u && qe(f, e, u), nt(f, e, o));
			}
		}
		function Me(e, t, o) {
			var u = fe(t, o);
			if (u >= 0) {
				for (var f = t.length - 1; u <= f;) t[u] = t[++u];
				if (t.length = f, me(t, o), e) {
					var w = e.ownerDocument;
					w && qe(w, e, o), o.ownerElement = null;
				}
			}
		}
		Q.prototype = {
			length: 0,
			item: L.prototype.item,
			getNamedItem: function(e) {
				this._ownerElement && this._ownerElement._isInHTMLDocumentAndNamespace() && (e = e.toLowerCase());
				for (var t = 0; t < this.length;) {
					var o = this[t];
					if (o.nodeName === e) return o;
					t++;
				}
				return null;
			},
			setNamedItem: function(e) {
				var t = e.ownerElement;
				if (t && t !== this._ownerElement) throw new m(m.INUSE_ATTRIBUTE_ERR);
				var o = be(this, e.namespaceURI, e.localName);
				return o === e ? e : (He(this._ownerElement, this, e, o), o);
			},
			setNamedItemNS: function(e) {
				return this.setNamedItem(e);
			},
			removeNamedItem: function(e) {
				var t = this.getNamedItem(e);
				if (!t) throw new m(m.NOT_FOUND_ERR, e);
				return Me(this._ownerElement, this, t), t;
			},
			removeNamedItemNS: function(e, t) {
				var o = this.getNamedItemNS(e, t);
				if (!o) throw new m(m.NOT_FOUND_ERR, e ? e + " : " + t : t);
				return Me(this._ownerElement, this, o), o;
			},
			getNamedItemNS: function(e, t) {
				e || (e = null);
				for (var o = 0; o < this.length;) {
					var u = this[o];
					if (u.localName === t && u.namespaceURI === e) return u;
					o++;
				}
				return null;
			}
		}, Q.prototype[Symbol.iterator] = function() {
			var e = this, t = 0;
			return {
				next: function() {
					return t < e.length ? {
						value: e[t++],
						done: !1
					} : { done: !0 };
				},
				return: function() {
					return { done: !0 };
				}
			};
		};
		function De() {}
		De.prototype = {
			hasFeature: function(e, t) {
				return !0;
			},
			createDocument: function(e, t, o) {
				var u = g.XML_APPLICATION;
				e === T.HTML ? u = g.XML_XHTML_APPLICATION : e === T.SVG && (u = g.XML_SVG_IMAGE);
				var f = new pe(p, { contentType: u });
				if (f.implementation = this, f.childNodes = new L(), f.doctype = o || null, o && f.appendChild(o), t) {
					var w = f.createElementNS(e, t);
					f.appendChild(w);
				}
				return f;
			},
			createDocumentType: function(e, t, o, u) {
				W(e);
				var f = new pt(p);
				return f.name = e, f.nodeName = e, f.publicId = t || "", f.systemId = o || "", f.internalSubset = u || "", f.childNodes = new L(), f;
			},
			createHTMLDocument: function(e) {
				var t = new pe(p, { contentType: g.HTML });
				if (t.implementation = this, t.childNodes = new L(), e !== !1) {
					t.doctype = this.createDocumentType("html"), t.doctype.ownerDocument = t, t.appendChild(t.doctype);
					var o = t.createElement("html");
					t.appendChild(o);
					var u = t.createElement("head");
					if (o.appendChild(u), typeof e == "string") {
						var f = t.createElement("title");
						f.appendChild(t.createTextNode(e)), u.appendChild(f);
					}
					o.appendChild(t.createElement("body"));
				}
				return t;
			}
		};
		function z(e) {
			b(e);
		}
		z.prototype = {
			firstChild: null,
			lastChild: null,
			previousSibling: null,
			nextSibling: null,
			parentNode: null,
			get parentElement() {
				return this.parentNode && this.parentNode.nodeType === this.ELEMENT_NODE ? this.parentNode : null;
			},
			childNodes: null,
			ownerDocument: null,
			nodeValue: null,
			namespaceURI: null,
			prefix: null,
			localName: null,
			baseURI: "about:blank",
			get isConnected() {
				var e = this.getRootNode();
				return e && e.nodeType === e.DOCUMENT_NODE;
			},
			contains: function(e) {
				if (!e) return !1;
				var t = e;
				do {
					if (this === t) return !0;
					t = t.parentNode;
				} while (t);
				return !1;
			},
			getRootNode: function(e) {
				var t = this;
				do {
					if (!t.parentNode) return t;
					t = t.parentNode;
				} while (t);
			},
			isEqualNode: function(e) {
				if (!e) return !1;
				for (var t = [{
					node: this,
					other: e
				}]; t.length > 0;) {
					var o = t.pop(), u = o.node, f = o.other;
					if (u.nodeType !== f.nodeType) return !1;
					switch (u.nodeType) {
						case u.DOCUMENT_TYPE_NODE:
							if (u.name !== f.name || u.publicId !== f.publicId || u.systemId !== f.systemId) return !1;
							break;
						case u.ELEMENT_NODE:
							if (u.namespaceURI !== f.namespaceURI || u.prefix !== f.prefix || u.localName !== f.localName || u.attributes.length !== f.attributes.length) return !1;
							for (var w = 0; w < u.attributes.length; w++) {
								var F = u.attributes.item(w), te = f.getAttributeNodeNS(F.namespaceURI, F.localName);
								if (!te) return !1;
								t.push({
									node: F,
									other: te
								});
							}
							break;
						case u.ATTRIBUTE_NODE:
							if (u.namespaceURI !== f.namespaceURI || u.localName !== f.localName || u.value !== f.value) return !1;
							break;
						case u.PROCESSING_INSTRUCTION_NODE:
							if (u.target !== f.target || u.data !== f.data) return !1;
							break;
						case u.TEXT_NODE:
						case u.CDATA_SECTION_NODE:
						case u.COMMENT_NODE: if (u.data !== f.data) return !1;
					}
					if (u.childNodes.length !== f.childNodes.length) return !1;
					for (var w = u.childNodes.length - 1; w >= 0; w--) t.push({
						node: u.childNodes[w],
						other: f.childNodes[w]
					});
				}
				return !0;
			},
			isSameNode: function(e) {
				return this === e;
			},
			insertBefore: function(e, t) {
				return Le(this, e, t);
			},
			replaceChild: function(e, t) {
				Le(this, e, t, ze), t && this.removeChild(t);
			},
			removeChild: function(e) {
				return ce(this, e);
			},
			appendChild: function(e) {
				return this.insertBefore(e, null);
			},
			hasChildNodes: function() {
				return this.firstChild != null;
			},
			cloneNode: function(e) {
				return Jt(this.ownerDocument || this, this, e);
			},
			normalize: function() {
				re(this, null, { enter: function(e) {
					for (var t = e.firstChild; t;) {
						var o = t.nextSibling;
						if (o !== null && o.nodeType === Y && t.nodeType === Y) {
							for (var u = [], f = o; f !== null && f.nodeType === Y;) u.push(f.data), f = f.nextSibling;
							for (var w = t.nextSibling; w !== f;) {
								var F = w.nextSibling;
								w.parentNode = null, w.previousSibling = null, w.nextSibling = null, w = F;
							}
							t.nextSibling = f, f !== null ? f.previousSibling = t : e.lastChild = t, t.appendData(u.join("")), ee(e.ownerDocument, e), t = f;
						} else t = o;
					}
					return !0;
				} });
			},
			isSupported: function(e, t) {
				return this.ownerDocument.implementation.hasFeature(e, t);
			},
			lookupPrefix: function(e) {
				for (var t = this; t;) {
					var o = t._nsMap;
					if (o) {
						for (var u in o) if (s(o, u) && o[u] === e) return u;
					}
					t = t.nodeType == X ? t.ownerDocument : t.parentNode;
				}
				return null;
			},
			lookupNamespaceURI: function(e) {
				for (var t = this; t;) {
					var o = t._nsMap;
					if (o && s(o, e)) return o[e];
					t = t.nodeType == X ? t.ownerDocument : t.parentNode;
				}
				return null;
			},
			isDefaultNamespace: function(e) {
				return this.lookupPrefix(e) == null;
			},
			compareDocumentPosition: function(e) {
				if (this === e) return 0;
				var t = e, o = this, u = null, f = null;
				if (t instanceof Xe && (u = t, t = u.ownerElement), o instanceof Xe && (f = o, o = f.ownerElement, u && t && o === t)) for (var w = 0, F; F = o.attributes[w]; w++) {
					if (F === u) return U.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC + U.DOCUMENT_POSITION_PRECEDING;
					if (F === f) return U.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC + U.DOCUMENT_POSITION_FOLLOWING;
				}
				if (!t || !o || o.ownerDocument !== t.ownerDocument) return U.DOCUMENT_POSITION_DISCONNECTED + U.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC + (V(o.ownerDocument) > V(t.ownerDocument) ? U.DOCUMENT_POSITION_FOLLOWING : U.DOCUMENT_POSITION_PRECEDING);
				if (f && t === o) return U.DOCUMENT_POSITION_CONTAINS + U.DOCUMENT_POSITION_PRECEDING;
				if (u && t === o) return U.DOCUMENT_POSITION_CONTAINED_BY + U.DOCUMENT_POSITION_FOLLOWING;
				for (var te = [], O = t.parentNode; O;) {
					if (!f && O === o) return U.DOCUMENT_POSITION_CONTAINED_BY + U.DOCUMENT_POSITION_FOLLOWING;
					te.push(O), O = O.parentNode;
				}
				te.reverse();
				for (var he = [], ge = o.parentNode; ge;) {
					if (!u && ge === t) return U.DOCUMENT_POSITION_CONTAINS + U.DOCUMENT_POSITION_PRECEDING;
					he.push(ge), ge = ge.parentNode;
				}
				he.reverse();
				var Ie = $(te, he);
				for (var et in Ie.childNodes) {
					var Ne = Ie.childNodes[et];
					if (Ne === o) return U.DOCUMENT_POSITION_FOLLOWING;
					if (Ne === t) return U.DOCUMENT_POSITION_PRECEDING;
					if (he.indexOf(Ne) >= 0) return U.DOCUMENT_POSITION_FOLLOWING;
					if (te.indexOf(Ne) >= 0) return U.DOCUMENT_POSITION_PRECEDING;
				}
				return 0;
			}
		};
		function _e(e) {
			return e == "<" && "&lt;" || e == ">" && "&gt;" || e == "&" && "&amp;" || e == "\"" && "&quot;" || "&#" + e.charCodeAt() + ";";
		}
		N(k, z), N(k, z.prototype), N(U, z), N(U, z.prototype);
		function we(e, t) {
			re(e, null, { enter: function(o) {
				return t(o) ? re.STOP : !0;
			} });
		}
		function re(e, t, o) {
			for (var u = [{
				node: e,
				context: t,
				phase: re.ENTER
			}]; u.length > 0;) {
				var f = u.pop();
				if (f.phase === re.ENTER) {
					var w = o.enter(f.node, f.context);
					if (w === re.STOP) return re.STOP;
					if (u.push({
						node: f.node,
						context: w,
						phase: re.EXIT
					}), w == null) continue;
					for (var F = f.node.lastChild; F;) u.push({
						node: F,
						context: w,
						phase: re.ENTER
					}), F = F.previousSibling;
				} else o.exit && o.exit(f.node, f.context);
			}
		}
		re.STOP = Symbol("walkDOM.STOP"), re.ENTER = 0, re.EXIT = 1;
		function pe(e, t) {
			b(e);
			var o = t || {};
			this.ownerDocument = this, this.contentType = o.contentType || g.XML_APPLICATION, this.type = c(this.contentType) ? "html" : "xml";
		}
		function nt(e, t, o) {
			e && e._inc++, o.namespaceURI === T.XMLNS && (t._nsMap[o.prefix ? o.localName : ""] = o.value);
		}
		function qe(e, t, o, u) {
			e && e._inc++, o.namespaceURI === T.XMLNS && delete t._nsMap[o.prefix ? o.localName : ""];
		}
		function ee(e, t, o) {
			if (e && e._inc) {
				e._inc++;
				var u = t.childNodes;
				if (o && !o.nextSibling) u[u.length++] = o;
				else {
					for (var f = t.firstChild, w = 0; f;) u[w++] = f, f = f.nextSibling;
					u.length = w, delete u[u.length];
				}
			}
		}
		function ce(e, t) {
			if (e !== t.parentNode) throw new m(m.NOT_FOUND_ERR, "child's parent is not parent");
			var o = t.previousSibling, u = t.nextSibling;
			return o ? o.nextSibling = u : e.firstChild = u, u ? u.previousSibling = o : e.lastChild = o, ee(e.ownerDocument, e), t.parentNode = null, t.previousSibling = null, t.nextSibling = null, t;
		}
		function oe(e) {
			return e && (e.nodeType === z.DOCUMENT_NODE || e.nodeType === z.DOCUMENT_FRAGMENT_NODE || e.nodeType === z.ELEMENT_NODE);
		}
		function Ue(e) {
			return e && (e.nodeType === z.CDATA_SECTION_NODE || e.nodeType === z.COMMENT_NODE || e.nodeType === z.DOCUMENT_FRAGMENT_NODE || e.nodeType === z.DOCUMENT_TYPE_NODE || e.nodeType === z.ELEMENT_NODE || e.nodeType === z.PROCESSING_INSTRUCTION_NODE || e.nodeType === z.TEXT_NODE);
		}
		function ne(e) {
			return e && e.nodeType === z.DOCUMENT_TYPE_NODE;
		}
		function ye(e) {
			return e && e.nodeType === z.ELEMENT_NODE;
		}
		function mt(e) {
			return e && e.nodeType === z.TEXT_NODE;
		}
		function Je(e, t) {
			var o = e.childNodes || [];
			if (i(o, ye) || ne(t)) return !1;
			var u = i(o, ne);
			return !(t && u && o.indexOf(u) > o.indexOf(t));
		}
		function it(e, t) {
			var o = e.childNodes || [];
			function u(w) {
				return ye(w) && w !== t;
			}
			if (i(o, u)) return !1;
			var f = i(o, ne);
			return !(t && f && o.indexOf(f) > o.indexOf(t));
		}
		function K(e, t, o) {
			if (!oe(e)) throw new m(m.HIERARCHY_REQUEST_ERR, "Unexpected parent node type " + e.nodeType);
			if (o && o.parentNode !== e) throw new m(m.NOT_FOUND_ERR, "child not in parent");
			if (!Ue(t) || ne(t) && e.nodeType !== z.DOCUMENT_NODE) throw new m(m.HIERARCHY_REQUEST_ERR, "Unexpected node type " + t.nodeType + " for parent node type " + e.nodeType);
		}
		function Ee(e, t, o) {
			var u = e.childNodes || [], f = t.childNodes || [];
			if (t.nodeType === z.DOCUMENT_FRAGMENT_NODE) {
				var w = f.filter(ye);
				if (w.length > 1 || i(f, mt)) throw new m(m.HIERARCHY_REQUEST_ERR, "More than one element or text in fragment");
				if (w.length === 1 && !Je(e, o)) throw new m(m.HIERARCHY_REQUEST_ERR, "Element in fragment can not be inserted before doctype");
			}
			if (ye(t) && !Je(e, o)) throw new m(m.HIERARCHY_REQUEST_ERR, "Only one element can be added and only after doctype");
			if (ne(t)) {
				if (i(u, ne)) throw new m(m.HIERARCHY_REQUEST_ERR, "Only one doctype is allowed");
				var F = i(u, ye);
				if (o && u.indexOf(F) < u.indexOf(o)) throw new m(m.HIERARCHY_REQUEST_ERR, "Doctype can only be inserted before an element");
				if (!o && F) throw new m(m.HIERARCHY_REQUEST_ERR, "Doctype can not be appended since element is present");
			}
		}
		function ze(e, t, o) {
			var u = e.childNodes || [], f = t.childNodes || [];
			if (t.nodeType === z.DOCUMENT_FRAGMENT_NODE) {
				var w = f.filter(ye);
				if (w.length > 1 || i(f, mt)) throw new m(m.HIERARCHY_REQUEST_ERR, "More than one element or text in fragment");
				if (w.length === 1 && !it(e, o)) throw new m(m.HIERARCHY_REQUEST_ERR, "Element in fragment can not be inserted before doctype");
			}
			if (ye(t) && !it(e, o)) throw new m(m.HIERARCHY_REQUEST_ERR, "Only one element can be added and only after doctype");
			if (ne(t)) {
				let O = function(he) {
					return ne(he) && he !== o;
				};
				if (i(u, O)) throw new m(m.HIERARCHY_REQUEST_ERR, "Only one doctype is allowed");
				var F = i(u, ye);
				if (o && u.indexOf(F) < u.indexOf(o)) throw new m(m.HIERARCHY_REQUEST_ERR, "Doctype can only be inserted before an element");
			}
		}
		function Le(e, t, o, u) {
			K(e, t, o), e.nodeType === z.DOCUMENT_NODE && (u || Ee)(e, t, o);
			var f = t.parentNode;
			if (f && f.removeChild(t), t.nodeType === q) {
				var w = t.firstChild;
				if (w == null) return t;
				var F = t.lastChild;
			} else w = F = t;
			var te = o ? o.previousSibling : e.lastChild;
			w.previousSibling = te, F.nextSibling = o, te ? te.nextSibling = w : e.firstChild = w, o == null ? e.lastChild = F : o.previousSibling = F;
			do
				w.parentNode = e;
			while (w !== F && (w = w.nextSibling));
			return ee(e.ownerDocument || e, e, t), t.nodeType == q && (t.firstChild = t.lastChild = null), t;
		}
		pe.prototype = {
			implementation: null,
			nodeName: "#document",
			nodeType: R,
			doctype: null,
			documentElement: null,
			_inc: 1,
			insertBefore: function(e, t) {
				if (e.nodeType === q) {
					for (var o = e.firstChild; o;) {
						var u = o.nextSibling;
						this.insertBefore(o, t), o = u;
					}
					return e;
				}
				return Le(this, e, t), e.ownerDocument = this, this.documentElement === null && e.nodeType === H && (this.documentElement = e), e;
			},
			removeChild: function(e) {
				var t = ce(this, e);
				return t === this.documentElement && (this.documentElement = null), t;
			},
			replaceChild: function(e, t) {
				Le(this, e, t, ze), e.ownerDocument = this, t && this.removeChild(t), ye(e) && (this.documentElement = e);
			},
			importNode: function(e, t) {
				return Xr(this, e, t);
			},
			getElementById: function(e) {
				var t = null;
				return we(this.documentElement, function(o) {
					if (o.nodeType == H && o.getAttribute("id") == e) return t = o, !0;
				}), t;
			},
			createElement: function(e) {
				var t = new Re(p);
				t.ownerDocument = this, this.type === "html" && (e = e.toLowerCase()), a(this.contentType) && (t.namespaceURI = T.HTML), t.nodeName = e, t.tagName = e, t.localName = e, t.childNodes = new L();
				var o = t.attributes = new Q();
				return o._ownerElement = t, t;
			},
			createDocumentFragment: function() {
				var e = new Ze(p);
				return e.ownerDocument = this, e.childNodes = new L(), e;
			},
			createTextNode: function(e) {
				var t = new at(p);
				return t.ownerDocument = this, t.childNodes = new L(), t.appendData(e), t;
			},
			createComment: function(e) {
				var t = new ft(p);
				return t.ownerDocument = this, t.childNodes = new L(), t.appendData(e), t;
			},
			createCDATASection: function(e) {
				if (e.indexOf("]]>") !== -1) throw new m(m.INVALID_CHARACTER_ERR, "data contains \"]]>\"");
				var t = new dt(p);
				return t.ownerDocument = this, t.childNodes = new L(), t.appendData(e), t;
			},
			createProcessingInstruction: function(e, t) {
				var o = new gt(p);
				return o.ownerDocument = this, o.childNodes = new L(), o.nodeName = o.target = e, o.nodeValue = o.data = t, o;
			},
			createAttribute: function(e) {
				if (!v.QName_exact.test(e)) throw new m(m.INVALID_CHARACTER_ERR, "invalid character in name \"" + e + "\"");
				return this.type === "html" && (e = e.toLowerCase()), this._createAttribute(e);
			},
			_createAttribute: function(e) {
				var t = new Xe(p);
				return t.ownerDocument = this, t.childNodes = new L(), t.name = e, t.nodeName = e, t.localName = e, t.specified = !0, t;
			},
			createEntityReference: function(e) {
				if (!v.Name_exact.test(e)) throw new m(m.INVALID_CHARACTER_ERR, "not a valid xml name \"" + e + "\"");
				if (this.type === "html") throw new m("document is an html document", E.NotSupportedError);
				var t = new ht(p);
				return t.ownerDocument = this, t.childNodes = new L(), t.nodeName = e, t;
			},
			createElementNS: function(e, t) {
				var o = Z(e, t), u = new Re(p), f = u.attributes = new Q();
				return u.childNodes = new L(), u.ownerDocument = this, u.nodeName = t, u.tagName = t, u.namespaceURI = o[0], u.prefix = o[1], u.localName = o[2], f._ownerElement = u, u;
			},
			createAttributeNS: function(e, t) {
				var o = Z(e, t), u = new Xe(p);
				return u.ownerDocument = this, u.childNodes = new L(), u.nodeName = t, u.name = t, u.specified = !0, u.namespaceURI = o[0], u.prefix = o[1], u.localName = o[2], u;
			}
		}, C(pe, z);
		function Re(e) {
			b(e), this._nsMap = Object.create(null);
		}
		Re.prototype = {
			nodeType: H,
			attributes: null,
			getQualifiedName: function() {
				return this.prefix ? this.prefix + ":" + this.localName : this.localName;
			},
			_isInHTMLDocumentAndNamespace: function() {
				return this.ownerDocument.type === "html" && this.namespaceURI === T.HTML;
			},
			hasAttributes: function() {
				return !!(this.attributes && this.attributes.length);
			},
			hasAttribute: function(e) {
				return !!this.getAttributeNode(e);
			},
			getAttribute: function(e) {
				var t = this.getAttributeNode(e);
				return t ? t.value : null;
			},
			getAttributeNode: function(e) {
				return this._isInHTMLDocumentAndNamespace() && (e = e.toLowerCase()), this.attributes.getNamedItem(e);
			},
			setAttribute: function(e, t) {
				this._isInHTMLDocumentAndNamespace() && (e = e.toLowerCase());
				var o = this.getAttributeNode(e);
				o ? o.value = o.nodeValue = "" + t : (o = this.ownerDocument._createAttribute(e), o.value = o.nodeValue = "" + t, this.setAttributeNode(o));
			},
			removeAttribute: function(e) {
				var t = this.getAttributeNode(e);
				t && this.removeAttributeNode(t);
			},
			setAttributeNode: function(e) {
				return this.attributes.setNamedItem(e);
			},
			setAttributeNodeNS: function(e) {
				return this.attributes.setNamedItemNS(e);
			},
			removeAttributeNode: function(e) {
				return this.attributes.removeNamedItem(e.nodeName);
			},
			removeAttributeNS: function(e, t) {
				var o = this.getAttributeNodeNS(e, t);
				o && this.removeAttributeNode(o);
			},
			hasAttributeNS: function(e, t) {
				return this.getAttributeNodeNS(e, t) != null;
			},
			getAttributeNS: function(e, t) {
				var o = this.getAttributeNodeNS(e, t);
				return o ? o.value : null;
			},
			setAttributeNS: function(e, t, o) {
				var u = Z(e, t)[2], f = this.getAttributeNodeNS(e, u);
				f ? f.value = f.nodeValue = "" + o : (f = this.ownerDocument.createAttributeNS(e, t), f.value = f.nodeValue = "" + o, this.setAttributeNode(f));
			},
			getAttributeNodeNS: function(e, t) {
				return this.attributes.getNamedItemNS(e, t);
			},
			getElementsByClassName: function(e) {
				var t = D(e);
				return new x(this, function(o) {
					var u = [];
					return t.length > 0 && we(o, function(f) {
						if (f !== o && f.nodeType === H) {
							var w = f.getAttribute("class");
							if (w) {
								var F = e === w;
								if (!F) {
									var te = D(w);
									F = t.every(B(te));
								}
								F && u.push(f);
							}
						}
					}), u;
				});
			},
			getElementsByTagName: function(e) {
				var t = (this.nodeType === R ? this : this.ownerDocument).type === "html", o = e.toLowerCase();
				return new x(this, function(u) {
					var f = [];
					return we(u, function(w) {
						w === u || w.nodeType !== H || (e === "*" || w.getQualifiedName() === (t && w.namespaceURI === T.HTML ? o : e)) && f.push(w);
					}), f;
				});
			},
			getElementsByTagNameNS: function(e, t) {
				return new x(this, function(o) {
					var u = [];
					return we(o, function(f) {
						f !== o && f.nodeType === H && (e === "*" || f.namespaceURI === e) && (t === "*" || f.localName == t) && u.push(f);
					}), u;
				});
			}
		}, pe.prototype.getElementsByClassName = Re.prototype.getElementsByClassName, pe.prototype.getElementsByTagName = Re.prototype.getElementsByTagName, pe.prototype.getElementsByTagNameNS = Re.prototype.getElementsByTagNameNS, C(Re, z);
		function Xe(e) {
			b(e), this.namespaceURI = null, this.prefix = null, this.ownerElement = null;
		}
		Xe.prototype.nodeType = X, C(Xe, z);
		function Ve(e) {
			b(e);
		}
		Ve.prototype = {
			data: "",
			substringData: function(e, t) {
				return this.data.substring(e, e + t);
			},
			appendData: function(e) {
				e = this.data + e, this.nodeValue = this.data = e, this.length = e.length;
			},
			insertData: function(e, t) {
				this.replaceData(e, 0, t);
			},
			deleteData: function(e, t) {
				this.replaceData(e, t, "");
			},
			replaceData: function(e, t, o) {
				var u = this.data.substring(0, e), f = this.data.substring(e + t);
				o = u + o + f, this.nodeValue = this.data = o, this.length = o.length;
			}
		}, C(Ve, z);
		function at(e) {
			b(e);
		}
		at.prototype = {
			nodeName: "#text",
			nodeType: Y,
			splitText: function(e) {
				var t = this.data, o = t.substring(e);
				t = t.substring(0, e), this.data = this.nodeValue = t, this.length = t.length;
				var u = this.ownerDocument.createTextNode(o);
				return this.parentNode && this.parentNode.insertBefore(u, this.nextSibling), u;
			}
		}, C(at, Ve);
		function ft(e) {
			b(e);
		}
		ft.prototype = {
			nodeName: "#comment",
			nodeType: A
		}, C(ft, Ve);
		function dt(e) {
			b(e);
		}
		dt.prototype = {
			nodeName: "#cdata-section",
			nodeType: de
		}, C(dt, at);
		function pt(e) {
			b(e);
		}
		pt.prototype.nodeType = _, C(pt, z);
		function Dt(e) {
			b(e);
		}
		Dt.prototype.nodeType = I, C(Dt, z);
		function St(e) {
			b(e);
		}
		St.prototype.nodeType = ae, C(St, z);
		function ht(e) {
			b(e);
		}
		ht.prototype.nodeType = ie, C(ht, z);
		function Ze(e) {
			b(e);
		}
		Ze.prototype.nodeName = "#document-fragment", Ze.prototype.nodeType = q, C(Ze, z);
		function gt(e) {
			b(e);
		}
		gt.prototype.nodeType = h, C(gt, Ve);
		function Qt() {}
		Qt.prototype.serializeToString = function(e, t) {
			return $t.call(e, t);
		}, z.prototype.toString = $t;
		function $t(e) {
			var t;
			typeof e == "function" ? t = {
				requireWellFormed: !1,
				splitCDATASections: !0,
				nodeFilter: e
			} : e != null ? t = {
				requireWellFormed: !!e.requireWellFormed,
				splitCDATASections: e.splitCDATASections !== !1,
				nodeFilter: e.nodeFilter || null
			} : t = {
				requireWellFormed: !1,
				splitCDATASections: !0,
				nodeFilter: null
			};
			var o = [], u = this.nodeType === R && this.documentElement || this, f = u.prefix, w = u.namespaceURI;
			if (w && f == null) {
				var f = u.lookupPrefix(w);
				if (f == null) var F = [{
					namespace: w,
					prefix: null
				}];
			}
			return Mt(this, o, F, t), o.join("");
		}
		function Kt(e, t, o) {
			var u = e.prefix || "", f = e.namespaceURI;
			if (!f || u === "xml" && f === T.XML || f === T.XMLNS) return !1;
			for (var w = o.length; w--;) {
				var F = o[w];
				if (F.prefix === u) return F.namespace !== f;
			}
			return !0;
		}
		function Tt(e, t, o, u) {
			if (u && !v.QName_exact.test(t)) throw new m("The attribute name \"" + t + "\" is not a valid XML QName", E.InvalidStateError);
			e.push(" ", t, "=\"", o.replace(/[<>&"\t\n\r]/g, _e), "\"");
		}
		function Mt(e, t, o, u) {
			o || (o = []);
			var f = u.nodeFilter, w = u.requireWellFormed, F = u.splitCDATASections, te = (e.nodeType === R ? e : e.ownerDocument).type === "html";
			re(e, { ns: o }, {
				enter: function(O, he) {
					var ge = he.ns;
					if (f) if (O = f(O), O) {
						if (typeof O == "string") return t.push(O), null;
					} else return null;
					switch (O.nodeType) {
						case H:
							var Ie = O.attributes, et = Ie.length, Ne = O.tagName, We = Ne;
							if (!te && !O.prefix && O.namespaceURI) {
								for (var Et, Nt = 0; Nt < Ie.length; Nt++) if (Ie.item(Nt).name === "xmlns") {
									Et = Ie.item(Nt).value;
									break;
								}
								if (!Et) for (var Ye = ge.length - 1; Ye >= 0; Ye--) {
									var je = ge[Ye];
									if (je.prefix === "" && je.namespace === O.namespaceURI) {
										Et = je.namespace;
										break;
									}
								}
								if (Et !== O.namespaceURI) for (var Ye = ge.length - 1; Ye >= 0; Ye--) {
									var je = ge[Ye];
									if (je.namespace === O.namespaceURI) {
										je.prefix && (We = je.prefix + ":" + Ne);
										break;
									}
								}
							}
							if (w && !v.QName_exact.test(We)) throw new m("The element name \"" + We + "\" is not a valid XML QName", E.InvalidStateError);
							t.push("<", We);
							for (var Fe = ge.slice(), Qe = 0; Qe < et; Qe++) {
								var Ae = Ie.item(Qe);
								Ae.prefix == "xmlns" ? Fe.push({
									prefix: Ae.localName,
									namespace: Ae.value
								}) : Ae.nodeName == "xmlns" && Fe.push({
									prefix: "",
									namespace: Ae.value
								});
							}
							for (var Qe = 0; Qe < et; Qe++) {
								var Ae = Ie.item(Qe);
								if (Kt(Ae, te, Fe)) {
									var Lt = Ae.prefix || "", ot = Ae.namespaceURI;
									Tt(t, Lt ? "xmlns:" + Lt : "xmlns", ot, w), Fe.push({
										prefix: Lt,
										namespace: ot
									});
								}
								var st = f ? f(Ae) : Ae;
								st && (typeof st == "string" ? t.push(st) : Tt(t, st.name, st.value, w));
							}
							if (Ne === We && Kt(O, te, Fe)) {
								var Rt = O.prefix || "", ot = O.namespaceURI;
								Tt(t, Rt ? "xmlns:" + Rt : "xmlns", ot, w), Fe.push({
									prefix: Rt,
									namespace: ot
								});
							}
							var Ct = !O.firstChild;
							if (Ct && (te || O.namespaceURI === T.HTML) && (Ct = d(Ne)), Ct) return t.push("/>"), null;
							if (t.push(">"), te && l(Ne)) {
								for (var tt = O.firstChild; tt;) tt.data ? t.push(tt.data) : Mt(tt, t, Fe.slice(), u), tt = tt.nextSibling;
								return t.push("</", We, ">"), null;
							}
							return {
								ns: Fe,
								tag: We
							};
						case R:
						case q:
							if (w && O.nodeType === R && O.documentElement == null) throw new m("The Document has no documentElement", E.InvalidStateError);
							return { ns: ge };
						case X: return Tt(t, O.name, O.value, w), null;
						case Y:
							if (w && v.InvalidChar.test(O.data)) throw new m("The Text node data contains characters outside the XML Char production", E.InvalidStateError);
							return t.push(O.data.replace(/[<&>]/g, _e)), null;
						case de:
							if (w && O.data.indexOf("]]>") !== -1) throw new m("The CDATASection data contains \"]]>\"", E.InvalidStateError);
							return F ? t.push(v.CDATA_START, O.data.replace(/]]>/g, "]]]]><![CDATA[>"), v.CDATA_END) : t.push(v.CDATA_START, O.data, v.CDATA_END), null;
						case A:
							if (w) {
								if (v.InvalidChar.test(O.data)) throw new m("The comment node data contains characters outside the XML Char production", E.InvalidStateError);
								if (O.data.indexOf("--") !== -1 || O.data[O.data.length - 1] === "-") throw new m("The comment node data contains \"--\" or ends with \"-\"", E.InvalidStateError);
							}
							return t.push(v.COMMENT_START, O.data, v.COMMENT_END), null;
						case _:
							var vt = O.publicId, Ce = O.systemId;
							if (w) {
								if (!v.Name_exact.test(O.name)) throw new m("The doctype name \"" + O.name + "\" is not a valid XML Name", E.InvalidStateError);
								if (vt && !v.PubidLiteral_match.test(vt)) throw new m("DocumentType publicId is not a valid PubidLiteral", E.InvalidStateError);
								if (Ce && Ce !== "." && !v.SystemLiteral_match.test(Ce)) throw new m("DocumentType systemId is not a valid SystemLiteral", E.InvalidStateError);
								if (O.internalSubset && O.internalSubset.indexOf("]>") !== -1) throw new m("DocumentType internalSubset contains \"]>\"", E.InvalidStateError);
							}
							return t.push(v.DOCTYPE_DECL_START, " ", O.name), vt ? (t.push(" ", v.PUBLIC, " ", vt), Ce && Ce !== "." && t.push(" ", Ce)) : Ce && Ce !== "." && t.push(" ", v.SYSTEM, " ", Ce), O.internalSubset && t.push(" [", O.internalSubset, "]"), t.push(">"), null;
						case h:
							if (w) {
								if (!v.NCName_exact.test(O.target) || O.target.toLowerCase() === "xml") throw new m("The processing instruction target \"" + O.target + "\" is not a valid XML NCName or is reserved", E.InvalidStateError);
								if (v.InvalidChar.test(O.data)) throw new m("The ProcessingInstruction data contains characters outside the XML Char production", E.InvalidStateError);
								if (O.data.indexOf("?>") !== -1) throw new m("The ProcessingInstruction data contains \"?>\"", E.InvalidStateError);
							}
							return t.push("<?", O.target, " ", O.data, "?>"), null;
						case ie:
							if (w && !v.Name_exact.test(O.nodeName)) throw new m("The entity reference name \"" + O.nodeName + "\" is not a valid XML Name", E.InvalidStateError);
							return t.push("&", O.nodeName, ";"), null;
						default: return t.push("??", O.nodeName), null;
					}
				},
				exit: function(O, he) {
					he && he.tag && t.push("</", he.tag, ">");
				}
			});
		}
		function Xr(e, t, o) {
			var u;
			return re(t, null, { enter: function(f, w) {
				var F = f.cloneNode(!1);
				return F.ownerDocument = e, F.parentNode = null, w === null ? u = F : w.appendChild(F), f.nodeType === X || o ? F : null;
			} }), u;
		}
		function Jt(e, t, o) {
			var u;
			return re(t, null, { enter: function(f, w) {
				var F = new f.constructor(p);
				for (var te in f) if (s(f, te)) {
					var O = f[te];
					typeof O != "object" && O != F[te] && (F[te] = O);
				}
				f.childNodes && (F.childNodes = new L()), F.ownerDocument = e;
				var he = o;
				switch (F.nodeType) {
					case H:
						var ge = f.attributes, Ie = F.attributes = new Q(), et = ge.length;
						Ie._ownerElement = F;
						for (var Ne = 0; Ne < et; Ne++) F.setAttributeNode(Jt(e, ge.item(Ne), !0));
						break;
					case X: he = !0;
				}
				return w !== null ? w.appendChild(F) : u = F, he ? F : null;
			} }), u;
		}
		function Zt(e, t, o) {
			e[t] = o;
		}
		function _t(e) {
			for (var t = [], o = e.firstChild; o;) o.nodeType === H && t.push(o), o = o.nextSibling;
			return t;
		}
		try {
			Object.defineProperty && (Object.defineProperty(x.prototype, "length", { get: function() {
				return G(this), this.$$length;
			} }), Object.defineProperty(z.prototype, "textContent", {
				get: function() {
					if (this.nodeType === H || this.nodeType === q) {
						var e = [];
						return re(this, null, { enter: function(t) {
							if (t.nodeType === H || t.nodeType === q) return !0;
							if (t.nodeType === h || t.nodeType === A) return null;
							e.push(t.nodeValue);
						} }), e.join("");
					}
					return this.nodeValue;
				},
				set: function(e) {
					switch (this.nodeType) {
						case H:
						case q:
							for (; this.firstChild;) this.removeChild(this.firstChild);
							(e || String(e)) && this.appendChild(this.ownerDocument.createTextNode(e));
							break;
						default: this.data = e, this.value = e, this.nodeValue = e;
					}
				}
			}), Object.defineProperty(Ve.prototype, "data", {
				get: function() {
					return this._data != null ? this._data : "";
				},
				set: function(e) {
					this._data = e, this.length = typeof e == "string" ? e.length : 0;
				}
			}), Object.defineProperty(Ve.prototype, "nodeValue", {
				get: function() {
					return this.data;
				},
				set: function(e) {
					this.data = e;
				},
				enumerable: !0,
				configurable: !0
			}), Object.defineProperty(Re.prototype, "children", { get: function() {
				return new x(this, _t);
			} }), Object.defineProperty(pe.prototype, "children", { get: function() {
				return new x(this, _t);
			} }), Object.defineProperty(Ze.prototype, "children", { get: function() {
				return new x(this, _t);
			} }), Zt = function(e, t, o) {
				e["$$" + t] = o;
			});
		} catch {}
		r._updateLiveList = G, r.Attr = Xe, r.CDATASection = dt, r.CharacterData = Ve, r.Comment = ft, r.Document = pe, r.DocumentFragment = Ze, r.DocumentType = pt, r.DOMImplementation = De, r.Element = Re, r.Entity = St, r.EntityReference = ht, r.LiveNodeList = x, r.NamedNodeMap = Q, r.Node = z, r.NodeList = L, r.Notation = Dt, r.Text = at, r.ProcessingInstruction = gt, r.walkDOM = re, r.XMLSerializer = Qt;
	})), mr = xe(((r) => {
		var n = $e().freeze;
		r.XML_ENTITIES = n({
			amp: "&",
			apos: "'",
			gt: ">",
			lt: "<",
			quot: "\""
		}), r.HTML_ENTITIES = n({
			Aacute: "Á",
			aacute: "á",
			Abreve: "Ă",
			abreve: "ă",
			ac: "∾",
			acd: "∿",
			acE: "∾̳",
			Acirc: "Â",
			acirc: "â",
			acute: "´",
			Acy: "А",
			acy: "а",
			AElig: "Æ",
			aelig: "æ",
			af: "⁡",
			Afr: "𝔄",
			afr: "𝔞",
			Agrave: "À",
			agrave: "à",
			alefsym: "ℵ",
			aleph: "ℵ",
			Alpha: "Α",
			alpha: "α",
			Amacr: "Ā",
			amacr: "ā",
			amalg: "⨿",
			AMP: "&",
			amp: "&",
			And: "⩓",
			and: "∧",
			andand: "⩕",
			andd: "⩜",
			andslope: "⩘",
			andv: "⩚",
			ang: "∠",
			ange: "⦤",
			angle: "∠",
			angmsd: "∡",
			angmsdaa: "⦨",
			angmsdab: "⦩",
			angmsdac: "⦪",
			angmsdad: "⦫",
			angmsdae: "⦬",
			angmsdaf: "⦭",
			angmsdag: "⦮",
			angmsdah: "⦯",
			angrt: "∟",
			angrtvb: "⊾",
			angrtvbd: "⦝",
			angsph: "∢",
			angst: "Å",
			angzarr: "⍼",
			Aogon: "Ą",
			aogon: "ą",
			Aopf: "𝔸",
			aopf: "𝕒",
			ap: "≈",
			apacir: "⩯",
			apE: "⩰",
			ape: "≊",
			apid: "≋",
			apos: "'",
			ApplyFunction: "⁡",
			approx: "≈",
			approxeq: "≊",
			Aring: "Å",
			aring: "å",
			Ascr: "𝒜",
			ascr: "𝒶",
			Assign: "≔",
			ast: "*",
			asymp: "≈",
			asympeq: "≍",
			Atilde: "Ã",
			atilde: "ã",
			Auml: "Ä",
			auml: "ä",
			awconint: "∳",
			awint: "⨑",
			backcong: "≌",
			backepsilon: "϶",
			backprime: "‵",
			backsim: "∽",
			backsimeq: "⋍",
			Backslash: "∖",
			Barv: "⫧",
			barvee: "⊽",
			Barwed: "⌆",
			barwed: "⌅",
			barwedge: "⌅",
			bbrk: "⎵",
			bbrktbrk: "⎶",
			bcong: "≌",
			Bcy: "Б",
			bcy: "б",
			bdquo: "„",
			becaus: "∵",
			Because: "∵",
			because: "∵",
			bemptyv: "⦰",
			bepsi: "϶",
			bernou: "ℬ",
			Bernoullis: "ℬ",
			Beta: "Β",
			beta: "β",
			beth: "ℶ",
			between: "≬",
			Bfr: "𝔅",
			bfr: "𝔟",
			bigcap: "⋂",
			bigcirc: "◯",
			bigcup: "⋃",
			bigodot: "⨀",
			bigoplus: "⨁",
			bigotimes: "⨂",
			bigsqcup: "⨆",
			bigstar: "★",
			bigtriangledown: "▽",
			bigtriangleup: "△",
			biguplus: "⨄",
			bigvee: "⋁",
			bigwedge: "⋀",
			bkarow: "⤍",
			blacklozenge: "⧫",
			blacksquare: "▪",
			blacktriangle: "▴",
			blacktriangledown: "▾",
			blacktriangleleft: "◂",
			blacktriangleright: "▸",
			blank: "␣",
			blk12: "▒",
			blk14: "░",
			blk34: "▓",
			block: "█",
			bne: "=⃥",
			bnequiv: "≡⃥",
			bNot: "⫭",
			bnot: "⌐",
			Bopf: "𝔹",
			bopf: "𝕓",
			bot: "⊥",
			bottom: "⊥",
			bowtie: "⋈",
			boxbox: "⧉",
			boxDL: "╗",
			boxDl: "╖",
			boxdL: "╕",
			boxdl: "┐",
			boxDR: "╔",
			boxDr: "╓",
			boxdR: "╒",
			boxdr: "┌",
			boxH: "═",
			boxh: "─",
			boxHD: "╦",
			boxHd: "╤",
			boxhD: "╥",
			boxhd: "┬",
			boxHU: "╩",
			boxHu: "╧",
			boxhU: "╨",
			boxhu: "┴",
			boxminus: "⊟",
			boxplus: "⊞",
			boxtimes: "⊠",
			boxUL: "╝",
			boxUl: "╜",
			boxuL: "╛",
			boxul: "┘",
			boxUR: "╚",
			boxUr: "╙",
			boxuR: "╘",
			boxur: "└",
			boxV: "║",
			boxv: "│",
			boxVH: "╬",
			boxVh: "╫",
			boxvH: "╪",
			boxvh: "┼",
			boxVL: "╣",
			boxVl: "╢",
			boxvL: "╡",
			boxvl: "┤",
			boxVR: "╠",
			boxVr: "╟",
			boxvR: "╞",
			boxvr: "├",
			bprime: "‵",
			Breve: "˘",
			breve: "˘",
			brvbar: "¦",
			Bscr: "ℬ",
			bscr: "𝒷",
			bsemi: "⁏",
			bsim: "∽",
			bsime: "⋍",
			bsol: "\\",
			bsolb: "⧅",
			bsolhsub: "⟈",
			bull: "•",
			bullet: "•",
			bump: "≎",
			bumpE: "⪮",
			bumpe: "≏",
			Bumpeq: "≎",
			bumpeq: "≏",
			Cacute: "Ć",
			cacute: "ć",
			Cap: "⋒",
			cap: "∩",
			capand: "⩄",
			capbrcup: "⩉",
			capcap: "⩋",
			capcup: "⩇",
			capdot: "⩀",
			CapitalDifferentialD: "ⅅ",
			caps: "∩︀",
			caret: "⁁",
			caron: "ˇ",
			Cayleys: "ℭ",
			ccaps: "⩍",
			Ccaron: "Č",
			ccaron: "č",
			Ccedil: "Ç",
			ccedil: "ç",
			Ccirc: "Ĉ",
			ccirc: "ĉ",
			Cconint: "∰",
			ccups: "⩌",
			ccupssm: "⩐",
			Cdot: "Ċ",
			cdot: "ċ",
			cedil: "¸",
			Cedilla: "¸",
			cemptyv: "⦲",
			cent: "¢",
			CenterDot: "·",
			centerdot: "·",
			Cfr: "ℭ",
			cfr: "𝔠",
			CHcy: "Ч",
			chcy: "ч",
			check: "✓",
			checkmark: "✓",
			Chi: "Χ",
			chi: "χ",
			cir: "○",
			circ: "ˆ",
			circeq: "≗",
			circlearrowleft: "↺",
			circlearrowright: "↻",
			circledast: "⊛",
			circledcirc: "⊚",
			circleddash: "⊝",
			CircleDot: "⊙",
			circledR: "®",
			circledS: "Ⓢ",
			CircleMinus: "⊖",
			CirclePlus: "⊕",
			CircleTimes: "⊗",
			cirE: "⧃",
			cire: "≗",
			cirfnint: "⨐",
			cirmid: "⫯",
			cirscir: "⧂",
			ClockwiseContourIntegral: "∲",
			CloseCurlyDoubleQuote: "”",
			CloseCurlyQuote: "’",
			clubs: "♣",
			clubsuit: "♣",
			Colon: "∷",
			colon: ":",
			Colone: "⩴",
			colone: "≔",
			coloneq: "≔",
			comma: ",",
			commat: "@",
			comp: "∁",
			compfn: "∘",
			complement: "∁",
			complexes: "ℂ",
			cong: "≅",
			congdot: "⩭",
			Congruent: "≡",
			Conint: "∯",
			conint: "∮",
			ContourIntegral: "∮",
			Copf: "ℂ",
			copf: "𝕔",
			coprod: "∐",
			Coproduct: "∐",
			COPY: "©",
			copy: "©",
			copysr: "℗",
			CounterClockwiseContourIntegral: "∳",
			crarr: "↵",
			Cross: "⨯",
			cross: "✗",
			Cscr: "𝒞",
			cscr: "𝒸",
			csub: "⫏",
			csube: "⫑",
			csup: "⫐",
			csupe: "⫒",
			ctdot: "⋯",
			cudarrl: "⤸",
			cudarrr: "⤵",
			cuepr: "⋞",
			cuesc: "⋟",
			cularr: "↶",
			cularrp: "⤽",
			Cup: "⋓",
			cup: "∪",
			cupbrcap: "⩈",
			CupCap: "≍",
			cupcap: "⩆",
			cupcup: "⩊",
			cupdot: "⊍",
			cupor: "⩅",
			cups: "∪︀",
			curarr: "↷",
			curarrm: "⤼",
			curlyeqprec: "⋞",
			curlyeqsucc: "⋟",
			curlyvee: "⋎",
			curlywedge: "⋏",
			curren: "¤",
			curvearrowleft: "↶",
			curvearrowright: "↷",
			cuvee: "⋎",
			cuwed: "⋏",
			cwconint: "∲",
			cwint: "∱",
			cylcty: "⌭",
			Dagger: "‡",
			dagger: "†",
			daleth: "ℸ",
			Darr: "↡",
			dArr: "⇓",
			darr: "↓",
			dash: "‐",
			Dashv: "⫤",
			dashv: "⊣",
			dbkarow: "⤏",
			dblac: "˝",
			Dcaron: "Ď",
			dcaron: "ď",
			Dcy: "Д",
			dcy: "д",
			DD: "ⅅ",
			dd: "ⅆ",
			ddagger: "‡",
			ddarr: "⇊",
			DDotrahd: "⤑",
			ddotseq: "⩷",
			deg: "°",
			Del: "∇",
			Delta: "Δ",
			delta: "δ",
			demptyv: "⦱",
			dfisht: "⥿",
			Dfr: "𝔇",
			dfr: "𝔡",
			dHar: "⥥",
			dharl: "⇃",
			dharr: "⇂",
			DiacriticalAcute: "´",
			DiacriticalDot: "˙",
			DiacriticalDoubleAcute: "˝",
			DiacriticalGrave: "`",
			DiacriticalTilde: "˜",
			diam: "⋄",
			Diamond: "⋄",
			diamond: "⋄",
			diamondsuit: "♦",
			diams: "♦",
			die: "¨",
			DifferentialD: "ⅆ",
			digamma: "ϝ",
			disin: "⋲",
			div: "÷",
			divide: "÷",
			divideontimes: "⋇",
			divonx: "⋇",
			DJcy: "Ђ",
			djcy: "ђ",
			dlcorn: "⌞",
			dlcrop: "⌍",
			dollar: "$",
			Dopf: "𝔻",
			dopf: "𝕕",
			Dot: "¨",
			dot: "˙",
			DotDot: "⃜",
			doteq: "≐",
			doteqdot: "≑",
			DotEqual: "≐",
			dotminus: "∸",
			dotplus: "∔",
			dotsquare: "⊡",
			doublebarwedge: "⌆",
			DoubleContourIntegral: "∯",
			DoubleDot: "¨",
			DoubleDownArrow: "⇓",
			DoubleLeftArrow: "⇐",
			DoubleLeftRightArrow: "⇔",
			DoubleLeftTee: "⫤",
			DoubleLongLeftArrow: "⟸",
			DoubleLongLeftRightArrow: "⟺",
			DoubleLongRightArrow: "⟹",
			DoubleRightArrow: "⇒",
			DoubleRightTee: "⊨",
			DoubleUpArrow: "⇑",
			DoubleUpDownArrow: "⇕",
			DoubleVerticalBar: "∥",
			DownArrow: "↓",
			Downarrow: "⇓",
			downarrow: "↓",
			DownArrowBar: "⤓",
			DownArrowUpArrow: "⇵",
			DownBreve: "̑",
			downdownarrows: "⇊",
			downharpoonleft: "⇃",
			downharpoonright: "⇂",
			DownLeftRightVector: "⥐",
			DownLeftTeeVector: "⥞",
			DownLeftVector: "↽",
			DownLeftVectorBar: "⥖",
			DownRightTeeVector: "⥟",
			DownRightVector: "⇁",
			DownRightVectorBar: "⥗",
			DownTee: "⊤",
			DownTeeArrow: "↧",
			drbkarow: "⤐",
			drcorn: "⌟",
			drcrop: "⌌",
			Dscr: "𝒟",
			dscr: "𝒹",
			DScy: "Ѕ",
			dscy: "ѕ",
			dsol: "⧶",
			Dstrok: "Đ",
			dstrok: "đ",
			dtdot: "⋱",
			dtri: "▿",
			dtrif: "▾",
			duarr: "⇵",
			duhar: "⥯",
			dwangle: "⦦",
			DZcy: "Џ",
			dzcy: "џ",
			dzigrarr: "⟿",
			Eacute: "É",
			eacute: "é",
			easter: "⩮",
			Ecaron: "Ě",
			ecaron: "ě",
			ecir: "≖",
			Ecirc: "Ê",
			ecirc: "ê",
			ecolon: "≕",
			Ecy: "Э",
			ecy: "э",
			eDDot: "⩷",
			Edot: "Ė",
			eDot: "≑",
			edot: "ė",
			ee: "ⅇ",
			efDot: "≒",
			Efr: "𝔈",
			efr: "𝔢",
			eg: "⪚",
			Egrave: "È",
			egrave: "è",
			egs: "⪖",
			egsdot: "⪘",
			el: "⪙",
			Element: "∈",
			elinters: "⏧",
			ell: "ℓ",
			els: "⪕",
			elsdot: "⪗",
			Emacr: "Ē",
			emacr: "ē",
			empty: "∅",
			emptyset: "∅",
			EmptySmallSquare: "◻",
			emptyv: "∅",
			EmptyVerySmallSquare: "▫",
			emsp: " ",
			emsp13: " ",
			emsp14: " ",
			ENG: "Ŋ",
			eng: "ŋ",
			ensp: " ",
			Eogon: "Ę",
			eogon: "ę",
			Eopf: "𝔼",
			eopf: "𝕖",
			epar: "⋕",
			eparsl: "⧣",
			eplus: "⩱",
			epsi: "ε",
			Epsilon: "Ε",
			epsilon: "ε",
			epsiv: "ϵ",
			eqcirc: "≖",
			eqcolon: "≕",
			eqsim: "≂",
			eqslantgtr: "⪖",
			eqslantless: "⪕",
			Equal: "⩵",
			equals: "=",
			EqualTilde: "≂",
			equest: "≟",
			Equilibrium: "⇌",
			equiv: "≡",
			equivDD: "⩸",
			eqvparsl: "⧥",
			erarr: "⥱",
			erDot: "≓",
			Escr: "ℰ",
			escr: "ℯ",
			esdot: "≐",
			Esim: "⩳",
			esim: "≂",
			Eta: "Η",
			eta: "η",
			ETH: "Ð",
			eth: "ð",
			Euml: "Ë",
			euml: "ë",
			euro: "€",
			excl: "!",
			exist: "∃",
			Exists: "∃",
			expectation: "ℰ",
			ExponentialE: "ⅇ",
			exponentiale: "ⅇ",
			fallingdotseq: "≒",
			Fcy: "Ф",
			fcy: "ф",
			female: "♀",
			ffilig: "ﬃ",
			fflig: "ﬀ",
			ffllig: "ﬄ",
			Ffr: "𝔉",
			ffr: "𝔣",
			filig: "ﬁ",
			FilledSmallSquare: "◼",
			FilledVerySmallSquare: "▪",
			fjlig: "fj",
			flat: "♭",
			fllig: "ﬂ",
			fltns: "▱",
			fnof: "ƒ",
			Fopf: "𝔽",
			fopf: "𝕗",
			ForAll: "∀",
			forall: "∀",
			fork: "⋔",
			forkv: "⫙",
			Fouriertrf: "ℱ",
			fpartint: "⨍",
			frac12: "½",
			frac13: "⅓",
			frac14: "¼",
			frac15: "⅕",
			frac16: "⅙",
			frac18: "⅛",
			frac23: "⅔",
			frac25: "⅖",
			frac34: "¾",
			frac35: "⅗",
			frac38: "⅜",
			frac45: "⅘",
			frac56: "⅚",
			frac58: "⅝",
			frac78: "⅞",
			frasl: "⁄",
			frown: "⌢",
			Fscr: "ℱ",
			fscr: "𝒻",
			gacute: "ǵ",
			Gamma: "Γ",
			gamma: "γ",
			Gammad: "Ϝ",
			gammad: "ϝ",
			gap: "⪆",
			Gbreve: "Ğ",
			gbreve: "ğ",
			Gcedil: "Ģ",
			Gcirc: "Ĝ",
			gcirc: "ĝ",
			Gcy: "Г",
			gcy: "г",
			Gdot: "Ġ",
			gdot: "ġ",
			gE: "≧",
			ge: "≥",
			gEl: "⪌",
			gel: "⋛",
			geq: "≥",
			geqq: "≧",
			geqslant: "⩾",
			ges: "⩾",
			gescc: "⪩",
			gesdot: "⪀",
			gesdoto: "⪂",
			gesdotol: "⪄",
			gesl: "⋛︀",
			gesles: "⪔",
			Gfr: "𝔊",
			gfr: "𝔤",
			Gg: "⋙",
			gg: "≫",
			ggg: "⋙",
			gimel: "ℷ",
			GJcy: "Ѓ",
			gjcy: "ѓ",
			gl: "≷",
			gla: "⪥",
			glE: "⪒",
			glj: "⪤",
			gnap: "⪊",
			gnapprox: "⪊",
			gnE: "≩",
			gne: "⪈",
			gneq: "⪈",
			gneqq: "≩",
			gnsim: "⋧",
			Gopf: "𝔾",
			gopf: "𝕘",
			grave: "`",
			GreaterEqual: "≥",
			GreaterEqualLess: "⋛",
			GreaterFullEqual: "≧",
			GreaterGreater: "⪢",
			GreaterLess: "≷",
			GreaterSlantEqual: "⩾",
			GreaterTilde: "≳",
			Gscr: "𝒢",
			gscr: "ℊ",
			gsim: "≳",
			gsime: "⪎",
			gsiml: "⪐",
			Gt: "≫",
			GT: ">",
			gt: ">",
			gtcc: "⪧",
			gtcir: "⩺",
			gtdot: "⋗",
			gtlPar: "⦕",
			gtquest: "⩼",
			gtrapprox: "⪆",
			gtrarr: "⥸",
			gtrdot: "⋗",
			gtreqless: "⋛",
			gtreqqless: "⪌",
			gtrless: "≷",
			gtrsim: "≳",
			gvertneqq: "≩︀",
			gvnE: "≩︀",
			Hacek: "ˇ",
			hairsp: " ",
			half: "½",
			hamilt: "ℋ",
			HARDcy: "Ъ",
			hardcy: "ъ",
			hArr: "⇔",
			harr: "↔",
			harrcir: "⥈",
			harrw: "↭",
			Hat: "^",
			hbar: "ℏ",
			Hcirc: "Ĥ",
			hcirc: "ĥ",
			hearts: "♥",
			heartsuit: "♥",
			hellip: "…",
			hercon: "⊹",
			Hfr: "ℌ",
			hfr: "𝔥",
			HilbertSpace: "ℋ",
			hksearow: "⤥",
			hkswarow: "⤦",
			hoarr: "⇿",
			homtht: "∻",
			hookleftarrow: "↩",
			hookrightarrow: "↪",
			Hopf: "ℍ",
			hopf: "𝕙",
			horbar: "―",
			HorizontalLine: "─",
			Hscr: "ℋ",
			hscr: "𝒽",
			hslash: "ℏ",
			Hstrok: "Ħ",
			hstrok: "ħ",
			HumpDownHump: "≎",
			HumpEqual: "≏",
			hybull: "⁃",
			hyphen: "‐",
			Iacute: "Í",
			iacute: "í",
			ic: "⁣",
			Icirc: "Î",
			icirc: "î",
			Icy: "И",
			icy: "и",
			Idot: "İ",
			IEcy: "Е",
			iecy: "е",
			iexcl: "¡",
			iff: "⇔",
			Ifr: "ℑ",
			ifr: "𝔦",
			Igrave: "Ì",
			igrave: "ì",
			ii: "ⅈ",
			iiiint: "⨌",
			iiint: "∭",
			iinfin: "⧜",
			iiota: "℩",
			IJlig: "Ĳ",
			ijlig: "ĳ",
			Im: "ℑ",
			Imacr: "Ī",
			imacr: "ī",
			image: "ℑ",
			ImaginaryI: "ⅈ",
			imagline: "ℐ",
			imagpart: "ℑ",
			imath: "ı",
			imof: "⊷",
			imped: "Ƶ",
			Implies: "⇒",
			in: "∈",
			incare: "℅",
			infin: "∞",
			infintie: "⧝",
			inodot: "ı",
			Int: "∬",
			int: "∫",
			intcal: "⊺",
			integers: "ℤ",
			Integral: "∫",
			intercal: "⊺",
			Intersection: "⋂",
			intlarhk: "⨗",
			intprod: "⨼",
			InvisibleComma: "⁣",
			InvisibleTimes: "⁢",
			IOcy: "Ё",
			iocy: "ё",
			Iogon: "Į",
			iogon: "į",
			Iopf: "𝕀",
			iopf: "𝕚",
			Iota: "Ι",
			iota: "ι",
			iprod: "⨼",
			iquest: "¿",
			Iscr: "ℐ",
			iscr: "𝒾",
			isin: "∈",
			isindot: "⋵",
			isinE: "⋹",
			isins: "⋴",
			isinsv: "⋳",
			isinv: "∈",
			it: "⁢",
			Itilde: "Ĩ",
			itilde: "ĩ",
			Iukcy: "І",
			iukcy: "і",
			Iuml: "Ï",
			iuml: "ï",
			Jcirc: "Ĵ",
			jcirc: "ĵ",
			Jcy: "Й",
			jcy: "й",
			Jfr: "𝔍",
			jfr: "𝔧",
			jmath: "ȷ",
			Jopf: "𝕁",
			jopf: "𝕛",
			Jscr: "𝒥",
			jscr: "𝒿",
			Jsercy: "Ј",
			jsercy: "ј",
			Jukcy: "Є",
			jukcy: "є",
			Kappa: "Κ",
			kappa: "κ",
			kappav: "ϰ",
			Kcedil: "Ķ",
			kcedil: "ķ",
			Kcy: "К",
			kcy: "к",
			Kfr: "𝔎",
			kfr: "𝔨",
			kgreen: "ĸ",
			KHcy: "Х",
			khcy: "х",
			KJcy: "Ќ",
			kjcy: "ќ",
			Kopf: "𝕂",
			kopf: "𝕜",
			Kscr: "𝒦",
			kscr: "𝓀",
			lAarr: "⇚",
			Lacute: "Ĺ",
			lacute: "ĺ",
			laemptyv: "⦴",
			lagran: "ℒ",
			Lambda: "Λ",
			lambda: "λ",
			Lang: "⟪",
			lang: "⟨",
			langd: "⦑",
			langle: "⟨",
			lap: "⪅",
			Laplacetrf: "ℒ",
			laquo: "«",
			Larr: "↞",
			lArr: "⇐",
			larr: "←",
			larrb: "⇤",
			larrbfs: "⤟",
			larrfs: "⤝",
			larrhk: "↩",
			larrlp: "↫",
			larrpl: "⤹",
			larrsim: "⥳",
			larrtl: "↢",
			lat: "⪫",
			lAtail: "⤛",
			latail: "⤙",
			late: "⪭",
			lates: "⪭︀",
			lBarr: "⤎",
			lbarr: "⤌",
			lbbrk: "❲",
			lbrace: "{",
			lbrack: "[",
			lbrke: "⦋",
			lbrksld: "⦏",
			lbrkslu: "⦍",
			Lcaron: "Ľ",
			lcaron: "ľ",
			Lcedil: "Ļ",
			lcedil: "ļ",
			lceil: "⌈",
			lcub: "{",
			Lcy: "Л",
			lcy: "л",
			ldca: "⤶",
			ldquo: "“",
			ldquor: "„",
			ldrdhar: "⥧",
			ldrushar: "⥋",
			ldsh: "↲",
			lE: "≦",
			le: "≤",
			LeftAngleBracket: "⟨",
			LeftArrow: "←",
			Leftarrow: "⇐",
			leftarrow: "←",
			LeftArrowBar: "⇤",
			LeftArrowRightArrow: "⇆",
			leftarrowtail: "↢",
			LeftCeiling: "⌈",
			LeftDoubleBracket: "⟦",
			LeftDownTeeVector: "⥡",
			LeftDownVector: "⇃",
			LeftDownVectorBar: "⥙",
			LeftFloor: "⌊",
			leftharpoondown: "↽",
			leftharpoonup: "↼",
			leftleftarrows: "⇇",
			LeftRightArrow: "↔",
			Leftrightarrow: "⇔",
			leftrightarrow: "↔",
			leftrightarrows: "⇆",
			leftrightharpoons: "⇋",
			leftrightsquigarrow: "↭",
			LeftRightVector: "⥎",
			LeftTee: "⊣",
			LeftTeeArrow: "↤",
			LeftTeeVector: "⥚",
			leftthreetimes: "⋋",
			LeftTriangle: "⊲",
			LeftTriangleBar: "⧏",
			LeftTriangleEqual: "⊴",
			LeftUpDownVector: "⥑",
			LeftUpTeeVector: "⥠",
			LeftUpVector: "↿",
			LeftUpVectorBar: "⥘",
			LeftVector: "↼",
			LeftVectorBar: "⥒",
			lEg: "⪋",
			leg: "⋚",
			leq: "≤",
			leqq: "≦",
			leqslant: "⩽",
			les: "⩽",
			lescc: "⪨",
			lesdot: "⩿",
			lesdoto: "⪁",
			lesdotor: "⪃",
			lesg: "⋚︀",
			lesges: "⪓",
			lessapprox: "⪅",
			lessdot: "⋖",
			lesseqgtr: "⋚",
			lesseqqgtr: "⪋",
			LessEqualGreater: "⋚",
			LessFullEqual: "≦",
			LessGreater: "≶",
			lessgtr: "≶",
			LessLess: "⪡",
			lesssim: "≲",
			LessSlantEqual: "⩽",
			LessTilde: "≲",
			lfisht: "⥼",
			lfloor: "⌊",
			Lfr: "𝔏",
			lfr: "𝔩",
			lg: "≶",
			lgE: "⪑",
			lHar: "⥢",
			lhard: "↽",
			lharu: "↼",
			lharul: "⥪",
			lhblk: "▄",
			LJcy: "Љ",
			ljcy: "љ",
			Ll: "⋘",
			ll: "≪",
			llarr: "⇇",
			llcorner: "⌞",
			Lleftarrow: "⇚",
			llhard: "⥫",
			lltri: "◺",
			Lmidot: "Ŀ",
			lmidot: "ŀ",
			lmoust: "⎰",
			lmoustache: "⎰",
			lnap: "⪉",
			lnapprox: "⪉",
			lnE: "≨",
			lne: "⪇",
			lneq: "⪇",
			lneqq: "≨",
			lnsim: "⋦",
			loang: "⟬",
			loarr: "⇽",
			lobrk: "⟦",
			LongLeftArrow: "⟵",
			Longleftarrow: "⟸",
			longleftarrow: "⟵",
			LongLeftRightArrow: "⟷",
			Longleftrightarrow: "⟺",
			longleftrightarrow: "⟷",
			longmapsto: "⟼",
			LongRightArrow: "⟶",
			Longrightarrow: "⟹",
			longrightarrow: "⟶",
			looparrowleft: "↫",
			looparrowright: "↬",
			lopar: "⦅",
			Lopf: "𝕃",
			lopf: "𝕝",
			loplus: "⨭",
			lotimes: "⨴",
			lowast: "∗",
			lowbar: "_",
			LowerLeftArrow: "↙",
			LowerRightArrow: "↘",
			loz: "◊",
			lozenge: "◊",
			lozf: "⧫",
			lpar: "(",
			lparlt: "⦓",
			lrarr: "⇆",
			lrcorner: "⌟",
			lrhar: "⇋",
			lrhard: "⥭",
			lrm: "‎",
			lrtri: "⊿",
			lsaquo: "‹",
			Lscr: "ℒ",
			lscr: "𝓁",
			Lsh: "↰",
			lsh: "↰",
			lsim: "≲",
			lsime: "⪍",
			lsimg: "⪏",
			lsqb: "[",
			lsquo: "‘",
			lsquor: "‚",
			Lstrok: "Ł",
			lstrok: "ł",
			Lt: "≪",
			LT: "<",
			lt: "<",
			ltcc: "⪦",
			ltcir: "⩹",
			ltdot: "⋖",
			lthree: "⋋",
			ltimes: "⋉",
			ltlarr: "⥶",
			ltquest: "⩻",
			ltri: "◃",
			ltrie: "⊴",
			ltrif: "◂",
			ltrPar: "⦖",
			lurdshar: "⥊",
			luruhar: "⥦",
			lvertneqq: "≨︀",
			lvnE: "≨︀",
			macr: "¯",
			male: "♂",
			malt: "✠",
			maltese: "✠",
			Map: "⤅",
			map: "↦",
			mapsto: "↦",
			mapstodown: "↧",
			mapstoleft: "↤",
			mapstoup: "↥",
			marker: "▮",
			mcomma: "⨩",
			Mcy: "М",
			mcy: "м",
			mdash: "—",
			mDDot: "∺",
			measuredangle: "∡",
			MediumSpace: " ",
			Mellintrf: "ℳ",
			Mfr: "𝔐",
			mfr: "𝔪",
			mho: "℧",
			micro: "µ",
			mid: "∣",
			midast: "*",
			midcir: "⫰",
			middot: "·",
			minus: "−",
			minusb: "⊟",
			minusd: "∸",
			minusdu: "⨪",
			MinusPlus: "∓",
			mlcp: "⫛",
			mldr: "…",
			mnplus: "∓",
			models: "⊧",
			Mopf: "𝕄",
			mopf: "𝕞",
			mp: "∓",
			Mscr: "ℳ",
			mscr: "𝓂",
			mstpos: "∾",
			Mu: "Μ",
			mu: "μ",
			multimap: "⊸",
			mumap: "⊸",
			nabla: "∇",
			Nacute: "Ń",
			nacute: "ń",
			nang: "∠⃒",
			nap: "≉",
			napE: "⩰̸",
			napid: "≋̸",
			napos: "ŉ",
			napprox: "≉",
			natur: "♮",
			natural: "♮",
			naturals: "ℕ",
			nbsp: "\xA0",
			nbump: "≎̸",
			nbumpe: "≏̸",
			ncap: "⩃",
			Ncaron: "Ň",
			ncaron: "ň",
			Ncedil: "Ņ",
			ncedil: "ņ",
			ncong: "≇",
			ncongdot: "⩭̸",
			ncup: "⩂",
			Ncy: "Н",
			ncy: "н",
			ndash: "–",
			ne: "≠",
			nearhk: "⤤",
			neArr: "⇗",
			nearr: "↗",
			nearrow: "↗",
			nedot: "≐̸",
			NegativeMediumSpace: "​",
			NegativeThickSpace: "​",
			NegativeThinSpace: "​",
			NegativeVeryThinSpace: "​",
			nequiv: "≢",
			nesear: "⤨",
			nesim: "≂̸",
			NestedGreaterGreater: "≫",
			NestedLessLess: "≪",
			NewLine: `
`,
			nexist: "∄",
			nexists: "∄",
			Nfr: "𝔑",
			nfr: "𝔫",
			ngE: "≧̸",
			nge: "≱",
			ngeq: "≱",
			ngeqq: "≧̸",
			ngeqslant: "⩾̸",
			nges: "⩾̸",
			nGg: "⋙̸",
			ngsim: "≵",
			nGt: "≫⃒",
			ngt: "≯",
			ngtr: "≯",
			nGtv: "≫̸",
			nhArr: "⇎",
			nharr: "↮",
			nhpar: "⫲",
			ni: "∋",
			nis: "⋼",
			nisd: "⋺",
			niv: "∋",
			NJcy: "Њ",
			njcy: "њ",
			nlArr: "⇍",
			nlarr: "↚",
			nldr: "‥",
			nlE: "≦̸",
			nle: "≰",
			nLeftarrow: "⇍",
			nleftarrow: "↚",
			nLeftrightarrow: "⇎",
			nleftrightarrow: "↮",
			nleq: "≰",
			nleqq: "≦̸",
			nleqslant: "⩽̸",
			nles: "⩽̸",
			nless: "≮",
			nLl: "⋘̸",
			nlsim: "≴",
			nLt: "≪⃒",
			nlt: "≮",
			nltri: "⋪",
			nltrie: "⋬",
			nLtv: "≪̸",
			nmid: "∤",
			NoBreak: "⁠",
			NonBreakingSpace: "\xA0",
			Nopf: "ℕ",
			nopf: "𝕟",
			Not: "⫬",
			not: "¬",
			NotCongruent: "≢",
			NotCupCap: "≭",
			NotDoubleVerticalBar: "∦",
			NotElement: "∉",
			NotEqual: "≠",
			NotEqualTilde: "≂̸",
			NotExists: "∄",
			NotGreater: "≯",
			NotGreaterEqual: "≱",
			NotGreaterFullEqual: "≧̸",
			NotGreaterGreater: "≫̸",
			NotGreaterLess: "≹",
			NotGreaterSlantEqual: "⩾̸",
			NotGreaterTilde: "≵",
			NotHumpDownHump: "≎̸",
			NotHumpEqual: "≏̸",
			notin: "∉",
			notindot: "⋵̸",
			notinE: "⋹̸",
			notinva: "∉",
			notinvb: "⋷",
			notinvc: "⋶",
			NotLeftTriangle: "⋪",
			NotLeftTriangleBar: "⧏̸",
			NotLeftTriangleEqual: "⋬",
			NotLess: "≮",
			NotLessEqual: "≰",
			NotLessGreater: "≸",
			NotLessLess: "≪̸",
			NotLessSlantEqual: "⩽̸",
			NotLessTilde: "≴",
			NotNestedGreaterGreater: "⪢̸",
			NotNestedLessLess: "⪡̸",
			notni: "∌",
			notniva: "∌",
			notnivb: "⋾",
			notnivc: "⋽",
			NotPrecedes: "⊀",
			NotPrecedesEqual: "⪯̸",
			NotPrecedesSlantEqual: "⋠",
			NotReverseElement: "∌",
			NotRightTriangle: "⋫",
			NotRightTriangleBar: "⧐̸",
			NotRightTriangleEqual: "⋭",
			NotSquareSubset: "⊏̸",
			NotSquareSubsetEqual: "⋢",
			NotSquareSuperset: "⊐̸",
			NotSquareSupersetEqual: "⋣",
			NotSubset: "⊂⃒",
			NotSubsetEqual: "⊈",
			NotSucceeds: "⊁",
			NotSucceedsEqual: "⪰̸",
			NotSucceedsSlantEqual: "⋡",
			NotSucceedsTilde: "≿̸",
			NotSuperset: "⊃⃒",
			NotSupersetEqual: "⊉",
			NotTilde: "≁",
			NotTildeEqual: "≄",
			NotTildeFullEqual: "≇",
			NotTildeTilde: "≉",
			NotVerticalBar: "∤",
			npar: "∦",
			nparallel: "∦",
			nparsl: "⫽⃥",
			npart: "∂̸",
			npolint: "⨔",
			npr: "⊀",
			nprcue: "⋠",
			npre: "⪯̸",
			nprec: "⊀",
			npreceq: "⪯̸",
			nrArr: "⇏",
			nrarr: "↛",
			nrarrc: "⤳̸",
			nrarrw: "↝̸",
			nRightarrow: "⇏",
			nrightarrow: "↛",
			nrtri: "⋫",
			nrtrie: "⋭",
			nsc: "⊁",
			nsccue: "⋡",
			nsce: "⪰̸",
			Nscr: "𝒩",
			nscr: "𝓃",
			nshortmid: "∤",
			nshortparallel: "∦",
			nsim: "≁",
			nsime: "≄",
			nsimeq: "≄",
			nsmid: "∤",
			nspar: "∦",
			nsqsube: "⋢",
			nsqsupe: "⋣",
			nsub: "⊄",
			nsubE: "⫅̸",
			nsube: "⊈",
			nsubset: "⊂⃒",
			nsubseteq: "⊈",
			nsubseteqq: "⫅̸",
			nsucc: "⊁",
			nsucceq: "⪰̸",
			nsup: "⊅",
			nsupE: "⫆̸",
			nsupe: "⊉",
			nsupset: "⊃⃒",
			nsupseteq: "⊉",
			nsupseteqq: "⫆̸",
			ntgl: "≹",
			Ntilde: "Ñ",
			ntilde: "ñ",
			ntlg: "≸",
			ntriangleleft: "⋪",
			ntrianglelefteq: "⋬",
			ntriangleright: "⋫",
			ntrianglerighteq: "⋭",
			Nu: "Ν",
			nu: "ν",
			num: "#",
			numero: "№",
			numsp: " ",
			nvap: "≍⃒",
			nVDash: "⊯",
			nVdash: "⊮",
			nvDash: "⊭",
			nvdash: "⊬",
			nvge: "≥⃒",
			nvgt: ">⃒",
			nvHarr: "⤄",
			nvinfin: "⧞",
			nvlArr: "⤂",
			nvle: "≤⃒",
			nvlt: "<⃒",
			nvltrie: "⊴⃒",
			nvrArr: "⤃",
			nvrtrie: "⊵⃒",
			nvsim: "∼⃒",
			nwarhk: "⤣",
			nwArr: "⇖",
			nwarr: "↖",
			nwarrow: "↖",
			nwnear: "⤧",
			Oacute: "Ó",
			oacute: "ó",
			oast: "⊛",
			ocir: "⊚",
			Ocirc: "Ô",
			ocirc: "ô",
			Ocy: "О",
			ocy: "о",
			odash: "⊝",
			Odblac: "Ő",
			odblac: "ő",
			odiv: "⨸",
			odot: "⊙",
			odsold: "⦼",
			OElig: "Œ",
			oelig: "œ",
			ofcir: "⦿",
			Ofr: "𝔒",
			ofr: "𝔬",
			ogon: "˛",
			Ograve: "Ò",
			ograve: "ò",
			ogt: "⧁",
			ohbar: "⦵",
			ohm: "Ω",
			oint: "∮",
			olarr: "↺",
			olcir: "⦾",
			olcross: "⦻",
			oline: "‾",
			olt: "⧀",
			Omacr: "Ō",
			omacr: "ō",
			Omega: "Ω",
			omega: "ω",
			Omicron: "Ο",
			omicron: "ο",
			omid: "⦶",
			ominus: "⊖",
			Oopf: "𝕆",
			oopf: "𝕠",
			opar: "⦷",
			OpenCurlyDoubleQuote: "“",
			OpenCurlyQuote: "‘",
			operp: "⦹",
			oplus: "⊕",
			Or: "⩔",
			or: "∨",
			orarr: "↻",
			ord: "⩝",
			order: "ℴ",
			orderof: "ℴ",
			ordf: "ª",
			ordm: "º",
			origof: "⊶",
			oror: "⩖",
			orslope: "⩗",
			orv: "⩛",
			oS: "Ⓢ",
			Oscr: "𝒪",
			oscr: "ℴ",
			Oslash: "Ø",
			oslash: "ø",
			osol: "⊘",
			Otilde: "Õ",
			otilde: "õ",
			Otimes: "⨷",
			otimes: "⊗",
			otimesas: "⨶",
			Ouml: "Ö",
			ouml: "ö",
			ovbar: "⌽",
			OverBar: "‾",
			OverBrace: "⏞",
			OverBracket: "⎴",
			OverParenthesis: "⏜",
			par: "∥",
			para: "¶",
			parallel: "∥",
			parsim: "⫳",
			parsl: "⫽",
			part: "∂",
			PartialD: "∂",
			Pcy: "П",
			pcy: "п",
			percnt: "%",
			period: ".",
			permil: "‰",
			perp: "⊥",
			pertenk: "‱",
			Pfr: "𝔓",
			pfr: "𝔭",
			Phi: "Φ",
			phi: "φ",
			phiv: "ϕ",
			phmmat: "ℳ",
			phone: "☎",
			Pi: "Π",
			pi: "π",
			pitchfork: "⋔",
			piv: "ϖ",
			planck: "ℏ",
			planckh: "ℎ",
			plankv: "ℏ",
			plus: "+",
			plusacir: "⨣",
			plusb: "⊞",
			pluscir: "⨢",
			plusdo: "∔",
			plusdu: "⨥",
			pluse: "⩲",
			PlusMinus: "±",
			plusmn: "±",
			plussim: "⨦",
			plustwo: "⨧",
			pm: "±",
			Poincareplane: "ℌ",
			pointint: "⨕",
			Popf: "ℙ",
			popf: "𝕡",
			pound: "£",
			Pr: "⪻",
			pr: "≺",
			prap: "⪷",
			prcue: "≼",
			prE: "⪳",
			pre: "⪯",
			prec: "≺",
			precapprox: "⪷",
			preccurlyeq: "≼",
			Precedes: "≺",
			PrecedesEqual: "⪯",
			PrecedesSlantEqual: "≼",
			PrecedesTilde: "≾",
			preceq: "⪯",
			precnapprox: "⪹",
			precneqq: "⪵",
			precnsim: "⋨",
			precsim: "≾",
			Prime: "″",
			prime: "′",
			primes: "ℙ",
			prnap: "⪹",
			prnE: "⪵",
			prnsim: "⋨",
			prod: "∏",
			Product: "∏",
			profalar: "⌮",
			profline: "⌒",
			profsurf: "⌓",
			prop: "∝",
			Proportion: "∷",
			Proportional: "∝",
			propto: "∝",
			prsim: "≾",
			prurel: "⊰",
			Pscr: "𝒫",
			pscr: "𝓅",
			Psi: "Ψ",
			psi: "ψ",
			puncsp: " ",
			Qfr: "𝔔",
			qfr: "𝔮",
			qint: "⨌",
			Qopf: "ℚ",
			qopf: "𝕢",
			qprime: "⁗",
			Qscr: "𝒬",
			qscr: "𝓆",
			quaternions: "ℍ",
			quatint: "⨖",
			quest: "?",
			questeq: "≟",
			QUOT: "\"",
			quot: "\"",
			rAarr: "⇛",
			race: "∽̱",
			Racute: "Ŕ",
			racute: "ŕ",
			radic: "√",
			raemptyv: "⦳",
			Rang: "⟫",
			rang: "⟩",
			rangd: "⦒",
			range: "⦥",
			rangle: "⟩",
			raquo: "»",
			Rarr: "↠",
			rArr: "⇒",
			rarr: "→",
			rarrap: "⥵",
			rarrb: "⇥",
			rarrbfs: "⤠",
			rarrc: "⤳",
			rarrfs: "⤞",
			rarrhk: "↪",
			rarrlp: "↬",
			rarrpl: "⥅",
			rarrsim: "⥴",
			Rarrtl: "⤖",
			rarrtl: "↣",
			rarrw: "↝",
			rAtail: "⤜",
			ratail: "⤚",
			ratio: "∶",
			rationals: "ℚ",
			RBarr: "⤐",
			rBarr: "⤏",
			rbarr: "⤍",
			rbbrk: "❳",
			rbrace: "}",
			rbrack: "]",
			rbrke: "⦌",
			rbrksld: "⦎",
			rbrkslu: "⦐",
			Rcaron: "Ř",
			rcaron: "ř",
			Rcedil: "Ŗ",
			rcedil: "ŗ",
			rceil: "⌉",
			rcub: "}",
			Rcy: "Р",
			rcy: "р",
			rdca: "⤷",
			rdldhar: "⥩",
			rdquo: "”",
			rdquor: "”",
			rdsh: "↳",
			Re: "ℜ",
			real: "ℜ",
			realine: "ℛ",
			realpart: "ℜ",
			reals: "ℝ",
			rect: "▭",
			REG: "®",
			reg: "®",
			ReverseElement: "∋",
			ReverseEquilibrium: "⇋",
			ReverseUpEquilibrium: "⥯",
			rfisht: "⥽",
			rfloor: "⌋",
			Rfr: "ℜ",
			rfr: "𝔯",
			rHar: "⥤",
			rhard: "⇁",
			rharu: "⇀",
			rharul: "⥬",
			Rho: "Ρ",
			rho: "ρ",
			rhov: "ϱ",
			RightAngleBracket: "⟩",
			RightArrow: "→",
			Rightarrow: "⇒",
			rightarrow: "→",
			RightArrowBar: "⇥",
			RightArrowLeftArrow: "⇄",
			rightarrowtail: "↣",
			RightCeiling: "⌉",
			RightDoubleBracket: "⟧",
			RightDownTeeVector: "⥝",
			RightDownVector: "⇂",
			RightDownVectorBar: "⥕",
			RightFloor: "⌋",
			rightharpoondown: "⇁",
			rightharpoonup: "⇀",
			rightleftarrows: "⇄",
			rightleftharpoons: "⇌",
			rightrightarrows: "⇉",
			rightsquigarrow: "↝",
			RightTee: "⊢",
			RightTeeArrow: "↦",
			RightTeeVector: "⥛",
			rightthreetimes: "⋌",
			RightTriangle: "⊳",
			RightTriangleBar: "⧐",
			RightTriangleEqual: "⊵",
			RightUpDownVector: "⥏",
			RightUpTeeVector: "⥜",
			RightUpVector: "↾",
			RightUpVectorBar: "⥔",
			RightVector: "⇀",
			RightVectorBar: "⥓",
			ring: "˚",
			risingdotseq: "≓",
			rlarr: "⇄",
			rlhar: "⇌",
			rlm: "‏",
			rmoust: "⎱",
			rmoustache: "⎱",
			rnmid: "⫮",
			roang: "⟭",
			roarr: "⇾",
			robrk: "⟧",
			ropar: "⦆",
			Ropf: "ℝ",
			ropf: "𝕣",
			roplus: "⨮",
			rotimes: "⨵",
			RoundImplies: "⥰",
			rpar: ")",
			rpargt: "⦔",
			rppolint: "⨒",
			rrarr: "⇉",
			Rrightarrow: "⇛",
			rsaquo: "›",
			Rscr: "ℛ",
			rscr: "𝓇",
			Rsh: "↱",
			rsh: "↱",
			rsqb: "]",
			rsquo: "’",
			rsquor: "’",
			rthree: "⋌",
			rtimes: "⋊",
			rtri: "▹",
			rtrie: "⊵",
			rtrif: "▸",
			rtriltri: "⧎",
			RuleDelayed: "⧴",
			ruluhar: "⥨",
			rx: "℞",
			Sacute: "Ś",
			sacute: "ś",
			sbquo: "‚",
			Sc: "⪼",
			sc: "≻",
			scap: "⪸",
			Scaron: "Š",
			scaron: "š",
			sccue: "≽",
			scE: "⪴",
			sce: "⪰",
			Scedil: "Ş",
			scedil: "ş",
			Scirc: "Ŝ",
			scirc: "ŝ",
			scnap: "⪺",
			scnE: "⪶",
			scnsim: "⋩",
			scpolint: "⨓",
			scsim: "≿",
			Scy: "С",
			scy: "с",
			sdot: "⋅",
			sdotb: "⊡",
			sdote: "⩦",
			searhk: "⤥",
			seArr: "⇘",
			searr: "↘",
			searrow: "↘",
			sect: "§",
			semi: ";",
			seswar: "⤩",
			setminus: "∖",
			setmn: "∖",
			sext: "✶",
			Sfr: "𝔖",
			sfr: "𝔰",
			sfrown: "⌢",
			sharp: "♯",
			SHCHcy: "Щ",
			shchcy: "щ",
			SHcy: "Ш",
			shcy: "ш",
			ShortDownArrow: "↓",
			ShortLeftArrow: "←",
			shortmid: "∣",
			shortparallel: "∥",
			ShortRightArrow: "→",
			ShortUpArrow: "↑",
			shy: "­",
			Sigma: "Σ",
			sigma: "σ",
			sigmaf: "ς",
			sigmav: "ς",
			sim: "∼",
			simdot: "⩪",
			sime: "≃",
			simeq: "≃",
			simg: "⪞",
			simgE: "⪠",
			siml: "⪝",
			simlE: "⪟",
			simne: "≆",
			simplus: "⨤",
			simrarr: "⥲",
			slarr: "←",
			SmallCircle: "∘",
			smallsetminus: "∖",
			smashp: "⨳",
			smeparsl: "⧤",
			smid: "∣",
			smile: "⌣",
			smt: "⪪",
			smte: "⪬",
			smtes: "⪬︀",
			SOFTcy: "Ь",
			softcy: "ь",
			sol: "/",
			solb: "⧄",
			solbar: "⌿",
			Sopf: "𝕊",
			sopf: "𝕤",
			spades: "♠",
			spadesuit: "♠",
			spar: "∥",
			sqcap: "⊓",
			sqcaps: "⊓︀",
			sqcup: "⊔",
			sqcups: "⊔︀",
			Sqrt: "√",
			sqsub: "⊏",
			sqsube: "⊑",
			sqsubset: "⊏",
			sqsubseteq: "⊑",
			sqsup: "⊐",
			sqsupe: "⊒",
			sqsupset: "⊐",
			sqsupseteq: "⊒",
			squ: "□",
			Square: "□",
			square: "□",
			SquareIntersection: "⊓",
			SquareSubset: "⊏",
			SquareSubsetEqual: "⊑",
			SquareSuperset: "⊐",
			SquareSupersetEqual: "⊒",
			SquareUnion: "⊔",
			squarf: "▪",
			squf: "▪",
			srarr: "→",
			Sscr: "𝒮",
			sscr: "𝓈",
			ssetmn: "∖",
			ssmile: "⌣",
			sstarf: "⋆",
			Star: "⋆",
			star: "☆",
			starf: "★",
			straightepsilon: "ϵ",
			straightphi: "ϕ",
			strns: "¯",
			Sub: "⋐",
			sub: "⊂",
			subdot: "⪽",
			subE: "⫅",
			sube: "⊆",
			subedot: "⫃",
			submult: "⫁",
			subnE: "⫋",
			subne: "⊊",
			subplus: "⪿",
			subrarr: "⥹",
			Subset: "⋐",
			subset: "⊂",
			subseteq: "⊆",
			subseteqq: "⫅",
			SubsetEqual: "⊆",
			subsetneq: "⊊",
			subsetneqq: "⫋",
			subsim: "⫇",
			subsub: "⫕",
			subsup: "⫓",
			succ: "≻",
			succapprox: "⪸",
			succcurlyeq: "≽",
			Succeeds: "≻",
			SucceedsEqual: "⪰",
			SucceedsSlantEqual: "≽",
			SucceedsTilde: "≿",
			succeq: "⪰",
			succnapprox: "⪺",
			succneqq: "⪶",
			succnsim: "⋩",
			succsim: "≿",
			SuchThat: "∋",
			Sum: "∑",
			sum: "∑",
			sung: "♪",
			Sup: "⋑",
			sup: "⊃",
			sup1: "¹",
			sup2: "²",
			sup3: "³",
			supdot: "⪾",
			supdsub: "⫘",
			supE: "⫆",
			supe: "⊇",
			supedot: "⫄",
			Superset: "⊃",
			SupersetEqual: "⊇",
			suphsol: "⟉",
			suphsub: "⫗",
			suplarr: "⥻",
			supmult: "⫂",
			supnE: "⫌",
			supne: "⊋",
			supplus: "⫀",
			Supset: "⋑",
			supset: "⊃",
			supseteq: "⊇",
			supseteqq: "⫆",
			supsetneq: "⊋",
			supsetneqq: "⫌",
			supsim: "⫈",
			supsub: "⫔",
			supsup: "⫖",
			swarhk: "⤦",
			swArr: "⇙",
			swarr: "↙",
			swarrow: "↙",
			swnwar: "⤪",
			szlig: "ß",
			Tab: "	",
			target: "⌖",
			Tau: "Τ",
			tau: "τ",
			tbrk: "⎴",
			Tcaron: "Ť",
			tcaron: "ť",
			Tcedil: "Ţ",
			tcedil: "ţ",
			Tcy: "Т",
			tcy: "т",
			tdot: "⃛",
			telrec: "⌕",
			Tfr: "𝔗",
			tfr: "𝔱",
			there4: "∴",
			Therefore: "∴",
			therefore: "∴",
			Theta: "Θ",
			theta: "θ",
			thetasym: "ϑ",
			thetav: "ϑ",
			thickapprox: "≈",
			thicksim: "∼",
			ThickSpace: "  ",
			thinsp: " ",
			ThinSpace: " ",
			thkap: "≈",
			thksim: "∼",
			THORN: "Þ",
			thorn: "þ",
			Tilde: "∼",
			tilde: "˜",
			TildeEqual: "≃",
			TildeFullEqual: "≅",
			TildeTilde: "≈",
			times: "×",
			timesb: "⊠",
			timesbar: "⨱",
			timesd: "⨰",
			tint: "∭",
			toea: "⤨",
			top: "⊤",
			topbot: "⌶",
			topcir: "⫱",
			Topf: "𝕋",
			topf: "𝕥",
			topfork: "⫚",
			tosa: "⤩",
			tprime: "‴",
			TRADE: "™",
			trade: "™",
			triangle: "▵",
			triangledown: "▿",
			triangleleft: "◃",
			trianglelefteq: "⊴",
			triangleq: "≜",
			triangleright: "▹",
			trianglerighteq: "⊵",
			tridot: "◬",
			trie: "≜",
			triminus: "⨺",
			TripleDot: "⃛",
			triplus: "⨹",
			trisb: "⧍",
			tritime: "⨻",
			trpezium: "⏢",
			Tscr: "𝒯",
			tscr: "𝓉",
			TScy: "Ц",
			tscy: "ц",
			TSHcy: "Ћ",
			tshcy: "ћ",
			Tstrok: "Ŧ",
			tstrok: "ŧ",
			twixt: "≬",
			twoheadleftarrow: "↞",
			twoheadrightarrow: "↠",
			Uacute: "Ú",
			uacute: "ú",
			Uarr: "↟",
			uArr: "⇑",
			uarr: "↑",
			Uarrocir: "⥉",
			Ubrcy: "Ў",
			ubrcy: "ў",
			Ubreve: "Ŭ",
			ubreve: "ŭ",
			Ucirc: "Û",
			ucirc: "û",
			Ucy: "У",
			ucy: "у",
			udarr: "⇅",
			Udblac: "Ű",
			udblac: "ű",
			udhar: "⥮",
			ufisht: "⥾",
			Ufr: "𝔘",
			ufr: "𝔲",
			Ugrave: "Ù",
			ugrave: "ù",
			uHar: "⥣",
			uharl: "↿",
			uharr: "↾",
			uhblk: "▀",
			ulcorn: "⌜",
			ulcorner: "⌜",
			ulcrop: "⌏",
			ultri: "◸",
			Umacr: "Ū",
			umacr: "ū",
			uml: "¨",
			UnderBar: "_",
			UnderBrace: "⏟",
			UnderBracket: "⎵",
			UnderParenthesis: "⏝",
			Union: "⋃",
			UnionPlus: "⊎",
			Uogon: "Ų",
			uogon: "ų",
			Uopf: "𝕌",
			uopf: "𝕦",
			UpArrow: "↑",
			Uparrow: "⇑",
			uparrow: "↑",
			UpArrowBar: "⤒",
			UpArrowDownArrow: "⇅",
			UpDownArrow: "↕",
			Updownarrow: "⇕",
			updownarrow: "↕",
			UpEquilibrium: "⥮",
			upharpoonleft: "↿",
			upharpoonright: "↾",
			uplus: "⊎",
			UpperLeftArrow: "↖",
			UpperRightArrow: "↗",
			Upsi: "ϒ",
			upsi: "υ",
			upsih: "ϒ",
			Upsilon: "Υ",
			upsilon: "υ",
			UpTee: "⊥",
			UpTeeArrow: "↥",
			upuparrows: "⇈",
			urcorn: "⌝",
			urcorner: "⌝",
			urcrop: "⌎",
			Uring: "Ů",
			uring: "ů",
			urtri: "◹",
			Uscr: "𝒰",
			uscr: "𝓊",
			utdot: "⋰",
			Utilde: "Ũ",
			utilde: "ũ",
			utri: "▵",
			utrif: "▴",
			uuarr: "⇈",
			Uuml: "Ü",
			uuml: "ü",
			uwangle: "⦧",
			vangrt: "⦜",
			varepsilon: "ϵ",
			varkappa: "ϰ",
			varnothing: "∅",
			varphi: "ϕ",
			varpi: "ϖ",
			varpropto: "∝",
			vArr: "⇕",
			varr: "↕",
			varrho: "ϱ",
			varsigma: "ς",
			varsubsetneq: "⊊︀",
			varsubsetneqq: "⫋︀",
			varsupsetneq: "⊋︀",
			varsupsetneqq: "⫌︀",
			vartheta: "ϑ",
			vartriangleleft: "⊲",
			vartriangleright: "⊳",
			Vbar: "⫫",
			vBar: "⫨",
			vBarv: "⫩",
			Vcy: "В",
			vcy: "в",
			VDash: "⊫",
			Vdash: "⊩",
			vDash: "⊨",
			vdash: "⊢",
			Vdashl: "⫦",
			Vee: "⋁",
			vee: "∨",
			veebar: "⊻",
			veeeq: "≚",
			vellip: "⋮",
			Verbar: "‖",
			verbar: "|",
			Vert: "‖",
			vert: "|",
			VerticalBar: "∣",
			VerticalLine: "|",
			VerticalSeparator: "❘",
			VerticalTilde: "≀",
			VeryThinSpace: " ",
			Vfr: "𝔙",
			vfr: "𝔳",
			vltri: "⊲",
			vnsub: "⊂⃒",
			vnsup: "⊃⃒",
			Vopf: "𝕍",
			vopf: "𝕧",
			vprop: "∝",
			vrtri: "⊳",
			Vscr: "𝒱",
			vscr: "𝓋",
			vsubnE: "⫋︀",
			vsubne: "⊊︀",
			vsupnE: "⫌︀",
			vsupne: "⊋︀",
			Vvdash: "⊪",
			vzigzag: "⦚",
			Wcirc: "Ŵ",
			wcirc: "ŵ",
			wedbar: "⩟",
			Wedge: "⋀",
			wedge: "∧",
			wedgeq: "≙",
			weierp: "℘",
			Wfr: "𝔚",
			wfr: "𝔴",
			Wopf: "𝕎",
			wopf: "𝕨",
			wp: "℘",
			wr: "≀",
			wreath: "≀",
			Wscr: "𝒲",
			wscr: "𝓌",
			xcap: "⋂",
			xcirc: "◯",
			xcup: "⋃",
			xdtri: "▽",
			Xfr: "𝔛",
			xfr: "𝔵",
			xhArr: "⟺",
			xharr: "⟷",
			Xi: "Ξ",
			xi: "ξ",
			xlArr: "⟸",
			xlarr: "⟵",
			xmap: "⟼",
			xnis: "⋻",
			xodot: "⨀",
			Xopf: "𝕏",
			xopf: "𝕩",
			xoplus: "⨁",
			xotime: "⨂",
			xrArr: "⟹",
			xrarr: "⟶",
			Xscr: "𝒳",
			xscr: "𝓍",
			xsqcup: "⨆",
			xuplus: "⨄",
			xutri: "△",
			xvee: "⋁",
			xwedge: "⋀",
			Yacute: "Ý",
			yacute: "ý",
			YAcy: "Я",
			yacy: "я",
			Ycirc: "Ŷ",
			ycirc: "ŷ",
			Ycy: "Ы",
			ycy: "ы",
			yen: "¥",
			Yfr: "𝔜",
			yfr: "𝔶",
			YIcy: "Ї",
			yicy: "ї",
			Yopf: "𝕐",
			yopf: "𝕪",
			Yscr: "𝒴",
			yscr: "𝓎",
			YUcy: "Ю",
			yucy: "ю",
			Yuml: "Ÿ",
			yuml: "ÿ",
			Zacute: "Ź",
			zacute: "ź",
			Zcaron: "Ž",
			zcaron: "ž",
			Zcy: "З",
			zcy: "з",
			Zdot: "Ż",
			zdot: "ż",
			zeetrf: "ℨ",
			ZeroWidthSpace: "​",
			Zeta: "Ζ",
			zeta: "ζ",
			Zfr: "ℨ",
			zfr: "𝔷",
			ZHcy: "Ж",
			zhcy: "ж",
			zigrarr: "⇝",
			Zopf: "ℤ",
			zopf: "𝕫",
			Zscr: "𝒵",
			zscr: "𝓏",
			zwj: "‍",
			zwnj: "‌"
		}), r.entityMap = r.HTML_ENTITIES;
	})), fr = xe(((r) => {
		var n = $e(), i = Ot(), a = lt(), s = n.isHTMLEscapableRawTextElement, c = n.isHTMLMimeType, l = n.isHTMLRawTextElement, d = n.hasOwn, g = n.NAMESPACE, T = a.ParseError, p = a.DOMException, y = 0, m = 1, E = 2, v = 3, b = 4, S = 5, P = 6, M = 7;
		function D() {}
		D.prototype = { parse: function(h, A, R) {
			var _ = this.domBuilder;
			_.startDocument(), H(A, A = Object.create(null)), W(h, A, R, _, this.errorHandler), _.endDocument();
		} };
		var B = /&#?\w+;?/g;
		function W(h, A, R, _, q) {
			var I = c(_.mimeType);
			h.indexOf(i.UNICODE_REPLACEMENT_CHARACTER) >= 0 && q.warning("Unicode replacement character detected, source encoding issues?");
			function U(K) {
				if (K > 65535) {
					K -= 65536;
					var Ee = 55296 + (K >> 10), ze = 56320 + (K & 1023);
					return String.fromCharCode(Ee, ze);
				} else return String.fromCharCode(K);
			}
			function $(K) {
				var Ee = K[K.length - 1] === ";" ? K : K + ";";
				if (!I && Ee !== K) return q.error("EntityRef: expecting ;"), K;
				var ze = i.Reference.exec(Ee);
				if (!ze || ze[0].length !== Ee.length) return q.error("entity not matching Reference production: " + K), K;
				var Le = Ee.slice(1, -1);
				return d(R, Le) ? R[Le] : Le.charAt(0) === "#" ? U(parseInt(Le.substring(1).replace("x", "0x"))) : (q.error("entity not found:" + K), K);
			}
			function V(K) {
				if (K > ue) {
					var Ee = h.substring(ue, K).replace(B, $);
					Q && fe(ue), _.characters(Ee, 0, K - ue), ue = K;
				}
			}
			var L = 0, x = 0, G = /\r\n?|\n|$/g, Q = _.locator;
			function fe(K, Ee) {
				for (; K >= x && (Ee = G.exec(h));) L = x, x = Ee.index + Ee[0].length, Q.lineNumber++;
				Q.columnNumber = K - L + 1;
			}
			for (var Te = [{ currentNSMap: A }], be = [], ue = 0;;) {
				try {
					var me = h.indexOf("<", ue);
					if (me < 0) {
						if (!I && be.length > 0) return q.fatalError("unclosed xml tag(s): " + be.join(", "));
						if (!h.substring(ue).match(/^\s*$/)) {
							var He = _.doc, Me = He.createTextNode(h.substring(ue));
							if (He.documentElement) return q.error("Extra content at the end of the document");
							He.appendChild(Me), _.currentElement = Me;
						}
						return;
					}
					if (me > ue) {
						var De = h.substring(ue, me);
						!I && be.length === 0 && (De = De.replace(new RegExp(i.S_OPT.source, "g"), ""), De && q.error("Unexpected content outside root element: '" + De + "'")), V(me);
					}
					switch (h.charAt(me + 1)) {
						case "/":
							var ne = h.indexOf(">", me + 2), z = h.substring(me + 2, ne > 0 ? ne : void 0);
							if (!z) return q.fatalError("end tag name missing");
							var _e = i.reg("^", i.QName_group, i.S_OPT, "$"), we = ne > 0 && _e.exec(z);
							if (!we) {
								var re = ne > 0 && i.reg("^", i.QName_group).exec(z);
								if (I && re) q.warning("end tag name contains invalid trailing characters: \"" + z + "\""), we = re;
								else if (re && new RegExp(_e.source, _e.flags + "m").test(z)) q.error("end tag name is followed by a line break and trailing content: \"" + z + "\""), we = re;
								else return q.fatalError("end tag name contains invalid characters: \"" + z + "\"");
							}
							if (!_.currentElement && !_.doc.documentElement) return;
							var pe = be[be.length - 1] || _.currentElement.tagName || _.doc.documentElement.tagName || "";
							if (pe !== we[1]) {
								var nt = we[1].toLowerCase();
								if (!I || pe.toLowerCase() !== nt) return q.fatalError("Opening and ending tag mismatch: \"" + pe + "\" != \"" + z + "\"");
							}
							var qe = Te.pop();
							be.pop();
							var ee = qe.localNSMap;
							if (_.endElement(qe.uri, qe.localName, pe), ee) for (var ce in ee) d(ee, ce) && _.endPrefixMapping(ce);
							ne++;
							break;
						case "?":
							Q && fe(me), ne = ie(h, me, _, q);
							break;
						case "!":
							Q && fe(me), ne = de(h, me, _, q, I);
							break;
						default:
							Q && fe(me);
							var oe = new ae(), Ue = Te[Te.length - 1].currentNSMap, ne = N(h, me, oe, Ue, $, q, I), ye = oe.length;
							if (oe.closed || (I && n.isHTMLVoidElement(oe.tagName) ? oe.closed = !0 : be.push(oe.tagName)), Q && ye) {
								for (var mt = Z(Q, {}), Je = 0; Je < ye; Je++) {
									var it = oe[Je];
									fe(it.offset), it.locator = Z(Q, {});
								}
								_.locator = mt, C(oe, _, Ue) && Te.push(oe), _.locator = Q;
							} else C(oe, _, Ue) && Te.push(oe);
							I && !oe.closed ? ne = k(h, ne, oe.tagName, $, _) : ne++;
					}
				} catch (K) {
					if (K instanceof T) throw K;
					if (K instanceof p) return q.fatalError("Error constructing the DOM: " + K.name + ": " + K.message, K);
					q.error("element parse error: " + K), ne = -1;
				}
				ne > ue ? ue = ne : V(Math.max(me, ue) + 1);
			}
		}
		function Z(h, A) {
			return A.lineNumber = h.lineNumber, A.columnNumber = h.columnNumber, A;
		}
		function N(h, A, R, _, q, I, U) {
			function $(fe, Te, be) {
				if (d(R.attributeNames, fe)) return I.fatalError("Attribute " + fe + " redefined");
				if (!U && Te.indexOf("<") >= 0) return I.fatalError("Unescaped '<' not allowed in attributes values");
				R.addValue(fe, Te.replace(/[\t\n\r]/g, " ").replace(B, q), be);
			}
			for (var V, L, x = ++A, G = y;;) {
				var Q = h.charAt(x);
				if (G === y && Q === "<") throw new Error("unexpected < in tag name: " + h.slice(A, x));
				switch (Q) {
					case "=":
						if (G === m) V = h.slice(A, x), G = v;
						else if (G === E) G = v;
						else throw new Error("attribute equal must after attrName");
						break;
					case "'":
					case "\"":
						if (G === v || G === m) if (G === m && (I.warning("attribute value must after \"=\""), V = h.slice(A, x)), A = x + 1, x = h.indexOf(Q, A), x > 0) L = h.slice(A, x), $(V, L, A - 1), G = S;
						else throw new Error("attribute value no end '" + Q + "' match");
						else if (G == b) L = h.slice(A, x), $(V, L, A), I.warning("attribute \"" + V + "\" missed start quot(" + Q + ")!!"), A = x + 1, G = S;
						else throw new Error("attribute value must after \"=\"");
						break;
					case "/":
						switch (G) {
							case y: R.setTagName(h.slice(A, x));
							case S:
							case P:
							case M: G = M, R.closed = !0;
							case b:
							case m: break;
							case E:
								R.closed = !0;
								break;
							default: throw new Error("attribute invalid close char('/')");
						}
						break;
					case "": return I.error("unexpected end of input"), G == y && R.setTagName(h.slice(A, x)), x;
					case ">":
						switch (G) {
							case y: R.setTagName(h.slice(A, x));
							case S:
							case P:
							case M: break;
							case b:
							case m: L = h.slice(A, x), L.slice(-1) === "/" && (R.closed = !0, L = L.slice(0, -1));
							case E:
								G === E && (L = V), G == b ? (I.warning("attribute \"" + L + "\" missed quot(\")!"), $(V, L, A)) : (U || I.warning("attribute \"" + L + "\" missed value!! \"" + L + "\" instead!!"), $(L, L, A));
								break;
							case v: if (!U) return I.fatalError(`AttValue: ' or " expected`);
						}
						return x;
					case "": Q = " ";
					default: if (Q <= " ") switch (G) {
						case y:
							R.setTagName(h.slice(A, x)), G = P;
							break;
						case m:
							V = h.slice(A, x), G = E;
							break;
						case b:
							var L = h.slice(A, x);
							I.warning("attribute \"" + L + "\" missed quot(\")!!"), $(V, L, A);
						case S: G = P;
					}
					else switch (G) {
						case E:
							U || I.warning("attribute \"" + V + "\" missed value!! \"" + V + "\" instead2!!"), $(V, V, A), A = x, G = m;
							break;
						case S: I.warning("attribute space is required\"" + V + "\"!!");
						case P:
							G = m, A = x;
							break;
						case v:
							G = b, A = x;
							break;
						case M: throw new Error("elements closed character '/' and '>' must be connected to");
					}
				}
				x++;
			}
		}
		function C(h, A, R) {
			for (var _ = h.tagName, q = null, G = h.length; G--;) {
				var I = h[G], U = I.qName, $ = I.value, Q = U.indexOf(":");
				if (Q > 0) var V = I.prefix = U.slice(0, Q), L = U.slice(Q + 1), x = V === "xmlns" && L;
				else L = U, V = null, x = U === "xmlns" && "";
				I.localName = L, x !== !1 && (q == null && (q = Object.create(null), R = Object.create(R)), R[x] = q[x] = $, I.uri = g.XMLNS, A.startPrefixMapping(x, $));
			}
			for (var G = h.length; G--;) I = h[G], I.prefix && (I.prefix === "xml" && (I.uri = g.XML), I.prefix !== "xmlns" && (I.uri = R[I.prefix]));
			var Q = _.indexOf(":");
			Q > 0 ? (V = h.prefix = _.slice(0, Q), L = h.localName = _.slice(Q + 1)) : (V = null, L = h.localName = _);
			var fe = h.uri = R[V || ""];
			if (A.startElement(fe, L, _, h), h.closed) {
				if (A.endElement(fe, L, _), q) for (V in q) d(q, V) && A.endPrefixMapping(V);
			} else return h.currentNSMap = R, h.localNSMap = q, !0;
		}
		function k(h, A, R, _, q) {
			var I = s(R);
			if (I || l(R)) {
				var U = new RegExp("</" + R.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ">", "ig");
				U.lastIndex = A;
				var $ = U.exec(h), V = $ ? $.index : -1;
				if (V < 0) return A + 1;
				var L = h.substring(A + 1, V);
				return I && (L = L.replace(B, _)), q.characters(L, 0, L.length), V;
			}
			return A + 1;
		}
		function H(h, A) {
			for (var R in h) d(h, R) && (A[R] = h[R]);
		}
		function X(h, A) {
			var R = A;
			function _(x) {
				return x = x || 0, h.charAt(R + x);
			}
			function q(x) {
				x = x || 1, R += x;
			}
			function I() {
				for (var x = 0; R < h.length;) {
					var G = _();
					if (G !== " " && G !== `
` && G !== "	" && G !== "\r") return x;
					x++, q();
				}
				return -1;
			}
			function U() {
				return h.substring(R);
			}
			function $(x) {
				return h.substring(R, R + x.length) === x;
			}
			function V(x) {
				return h.substring(R, R + x.length).toUpperCase() === x.toUpperCase();
			}
			function L(x) {
				var G = i.reg("^", x).exec(U());
				return G ? (q(G[0].length), G[0]) : null;
			}
			return {
				char: _,
				getIndex: function() {
					return R;
				},
				getMatch: L,
				getSource: function() {
					return h;
				},
				skip: q,
				skipBlanks: I,
				substringFromIndex: U,
				substringStartsWith: $,
				substringStartsWithCaseInsensitive: V
			};
		}
		function Y(h, A) {
			function R($, V) {
				var L = i.PI.exec($.substringFromIndex());
				return L ? L[1].toLowerCase() === "xml" ? V.fatalError("xml declaration is only allowed at the start of the document, but found at position " + $.getIndex()) : ($.skip(L[0].length), L[0]) : V.fatalError("processing instruction is not well-formed at position " + $.getIndex());
			}
			var _ = h.getSource();
			if (h.char() === "[") {
				h.skip(1);
				for (var q = h.getIndex(); h.getIndex() < _.length;) {
					if (h.skipBlanks(), h.char() === "]") {
						var I = _.substring(q, h.getIndex());
						return h.skip(1), I;
					}
					var U = null;
					if (h.char() === "<" && h.char(1) === "!") switch (h.char(2)) {
						case "E":
							h.char(3) === "L" ? U = h.getMatch(i.elementdecl) : h.char(3) === "N" && (U = h.getMatch(i.EntityDecl));
							break;
						case "A":
							U = h.getMatch(i.AttlistDecl);
							break;
						case "N":
							U = h.getMatch(i.NotationDecl);
							break;
						case "-": U = h.getMatch(i.Comment);
					}
					else if (h.char() === "<" && h.char(1) === "?") U = R(h, A);
					else if (h.char() === "%") U = h.getMatch(i.PEReference);
					else return A.fatalError("Error detected in Markup declaration");
					if (!U) return A.fatalError("Error in internal subset at position " + h.getIndex());
				}
				return A.fatalError("doctype internal subset is not well-formed, missing ]");
			}
		}
		function de(h, A, R, _, q) {
			var I = X(h, A);
			switch (q ? I.char(2).toUpperCase() : I.char(2)) {
				case "-":
					var U = I.getMatch(i.Comment);
					return U ? (R.comment(U, i.COMMENT_START.length, U.length - i.COMMENT_START.length - i.COMMENT_END.length), I.getIndex()) : _.fatalError("comment is not well-formed at position " + I.getIndex());
				case "[":
					var $ = I.getMatch(i.CDSect);
					return $ ? !q && !R.currentElement ? _.fatalError("CDATA outside of element") : (R.startCDATA(), R.characters($, i.CDATA_START.length, $.length - i.CDATA_START.length - i.CDATA_END.length), R.endCDATA(), I.getIndex()) : _.fatalError("Invalid CDATA starting at position " + A);
				case "D":
					if (R.doc && R.doc.documentElement) return _.fatalError("Doctype not allowed inside or after documentElement at position " + I.getIndex());
					if (q ? !I.substringStartsWithCaseInsensitive(i.DOCTYPE_DECL_START) : !I.substringStartsWith(i.DOCTYPE_DECL_START)) return _.fatalError("Expected " + i.DOCTYPE_DECL_START + " at position " + I.getIndex());
					if (I.skip(i.DOCTYPE_DECL_START.length), I.skipBlanks() < 1) return _.fatalError("Expected whitespace after " + i.DOCTYPE_DECL_START + " at position " + I.getIndex());
					var V = {
						name: void 0,
						publicId: void 0,
						systemId: void 0,
						internalSubset: void 0
					};
					if (V.name = I.getMatch(i.Name), !V.name) return _.fatalError("doctype name missing or contains unexpected characters at position " + I.getIndex());
					if (q && V.name.toLowerCase() !== "html" && _.warning("Unexpected DOCTYPE in HTML document at position " + I.getIndex()), I.skipBlanks(), I.substringStartsWith(i.PUBLIC) || I.substringStartsWith(i.SYSTEM)) {
						var L = i.ExternalID_match.exec(I.substringFromIndex());
						if (!L) return _.fatalError("doctype external id is not well-formed at position " + I.getIndex());
						L.groups.SystemLiteralOnly !== void 0 ? V.systemId = L.groups.SystemLiteralOnly : (V.systemId = L.groups.SystemLiteral, V.publicId = L.groups.PubidLiteral), I.skip(L[0].length);
					} else if (q && I.substringStartsWithCaseInsensitive(i.SYSTEM)) {
						if (I.skip(i.SYSTEM.length), I.skipBlanks() < 1) return _.fatalError("Expected whitespace after " + i.SYSTEM + " at position " + I.getIndex());
						if (V.systemId = I.getMatch(i.ABOUT_LEGACY_COMPAT_SystemLiteral), !V.systemId) return _.fatalError("Expected " + i.ABOUT_LEGACY_COMPAT + " in single or double quotes after " + i.SYSTEM + " at position " + I.getIndex());
					}
					return q && V.systemId && !i.ABOUT_LEGACY_COMPAT_SystemLiteral.test(V.systemId) && _.warning("Unexpected doctype.systemId in HTML document at position " + I.getIndex()), q || (I.skipBlanks(), V.internalSubset = Y(I, _)), I.skipBlanks(), I.char() !== ">" ? _.fatalError("doctype not terminated with > at position " + I.getIndex()) : (I.skip(1), R.startDTD(V.name, V.publicId, V.systemId, V.internalSubset), R.endDTD(), I.getIndex());
				default: return _.fatalError("Not well-formed XML starting with \"<!\" at position " + A);
			}
		}
		function ie(h, A, R, _) {
			var q = h.substring(A).match(i.PI);
			if (!q) return _.fatalError("Invalid processing instruction starting at position " + A);
			if (q[1].toLowerCase() === "xml") {
				if (A > 0) return _.fatalError("processing instruction at position " + A + " is an xml declaration which is only at the start of the document");
				if (!i.XMLDecl.test(h.substring(A))) return _.fatalError("xml declaration is not well-formed");
			}
			return R.processingInstruction(q[1], q[2]), A + q[0].length;
		}
		function ae() {
			this.attributeNames = Object.create(null);
		}
		ae.prototype = {
			setTagName: function(h) {
				if (!i.QName_exact.test(h)) throw new Error("invalid tagName:" + h);
				this.tagName = h;
			},
			addValue: function(h, A, R) {
				if (!i.QName_exact.test(h)) throw new Error("invalid attribute:" + h);
				this.attributeNames[h] = this.length, this[this.length++] = {
					qName: h,
					value: A,
					offset: R
				};
			},
			length: 0,
			getLocalName: function(h) {
				return this[h].localName;
			},
			getLocator: function(h) {
				return this[h].locator;
			},
			getQName: function(h) {
				return this[h].qName;
			},
			getURI: function(h) {
				return this[h].uri;
			},
			getValue: function(h) {
				return this[h].value;
			}
		}, r.XMLReader = D, r.parseUtils = X, r.parseDoctypeCommentOrCData = de;
	})), dr = xe(((r) => {
		var n = $e(), i = Pt(), a = lt(), s = mr(), c = fr(), l = i.DOMImplementation, d = n.hasDefaultHTMLNamespace, g = n.isHTMLMimeType, T = n.isValidMimeType, p = n.MIME_TYPE, y = n.NAMESPACE, m = a.ParseError, E = c.XMLReader;
		function v(N) {
			return N.replace(/\r[\n\u0085]/g, `
`).replace(/[\r\u0085\u2028\u2029]/g, `
`);
		}
		function b(N) {
			if (N = N || {}, N.locator === void 0 && (N.locator = !0), this.assign = N.assign || n.assign, this.domHandler = N.domHandler || S, this.onError = N.onError || N.errorHandler, N.errorHandler && typeof N.errorHandler != "function") throw new TypeError("errorHandler object is no longer supported, switch to onError!");
			N.errorHandler && N.errorHandler("warning", "The `errorHandler` option has been deprecated, use `onError` instead!", this), this.normalizeLineEndings = N.normalizeLineEndings || v, this.locator = !!N.locator, this.xmlns = this.assign(Object.create(null), N.xmlns);
		}
		b.prototype.parseFromString = function(N, C) {
			if (!T(C)) throw new TypeError("DOMParser.parseFromString: the provided mimeType \"" + C + "\" is not valid.");
			var k = this.assign(Object.create(null), this.xmlns), H = s.XML_ENTITIES, X = k[""] || null;
			d(C) ? (H = s.HTML_ENTITIES, X = y.HTML) : C === p.XML_SVG_IMAGE && (X = y.SVG), k[""] = X, k.xml = k.xml || y.XML;
			var Y = new this.domHandler({
				mimeType: C,
				defaultNamespace: X,
				onError: this.onError
			}), de = this.locator ? {} : void 0;
			this.locator && Y.setDocumentLocator(de);
			var ie = new E();
			return ie.errorHandler = Y, ie.domBuilder = Y, !n.isHTMLMimeType(C) && typeof N != "string" && ie.errorHandler.fatalError("source is not a string"), ie.parse(this.normalizeLineEndings(String(N)), k, H), Y.doc.documentElement || ie.errorHandler.fatalError("missing root element"), Y.doc;
		};
		function S(N) {
			var C = N || {};
			this.mimeType = C.mimeType || p.XML_APPLICATION, this.defaultNamespace = C.defaultNamespace || null, this.cdata = !1, this.currentElement = void 0, this.doc = void 0, this.locator = void 0, this.onError = C.onError;
		}
		function P(N, C) {
			C.lineNumber = N.lineNumber, C.columnNumber = N.columnNumber;
		}
		S.prototype = {
			startDocument: function() {
				var N = new l();
				this.doc = g(this.mimeType) ? N.createHTMLDocument(!1) : N.createDocument(this.defaultNamespace, "");
			},
			startElement: function(N, C, k, H) {
				var X = this.doc, Y = X.createElementNS(N, k || C), de = H.length;
				B(this, Y), this.currentElement = Y, this.locator && P(this.locator, Y);
				for (var ie = 0; ie < de; ie++) {
					var N = H.getURI(ie), ae = H.getValue(ie), k = H.getQName(ie), h = X.createAttributeNS(N, k);
					this.locator && P(H.getLocator(ie), h), h.value = h.nodeValue = ae, Y.setAttributeNode(h);
				}
			},
			endElement: function(N, C, k) {
				this.currentElement = this.currentElement.parentNode;
			},
			startPrefixMapping: function(N, C) {},
			endPrefixMapping: function(N) {},
			processingInstruction: function(N, C) {
				var k = this.doc.createProcessingInstruction(N, C);
				this.locator && P(this.locator, k), B(this, k);
			},
			ignorableWhitespace: function(N, C, k) {},
			characters: function(N, C, k) {
				if (N = D.apply(this, arguments), N) {
					if (this.cdata) var H = this.doc.createCDATASection(N);
					else var H = this.doc.createTextNode(N);
					this.currentElement ? this.currentElement.appendChild(H) : /^\s*$/.test(N) && this.doc.appendChild(H), this.locator && P(this.locator, H);
				}
			},
			skippedEntity: function(N) {},
			endDocument: function() {
				this.doc.normalize();
			},
			setDocumentLocator: function(N) {
				N && (N.lineNumber = 0), this.locator = N;
			},
			comment: function(N, C, k) {
				N = D.apply(this, arguments);
				var H = this.doc.createComment(N);
				this.locator && P(this.locator, H), B(this, H);
			},
			startCDATA: function() {
				this.cdata = !0;
			},
			endCDATA: function() {
				this.cdata = !1;
			},
			startDTD: function(N, C, k, H) {
				var X = this.doc.implementation;
				if (X && X.createDocumentType) {
					var Y = X.createDocumentType(N, C, k, H);
					this.locator && P(this.locator, Y), B(this, Y), this.doc.doctype = Y;
				}
			},
			reportError: function(N, C) {
				if (typeof this.onError == "function") try {
					this.onError(N, C, this);
				} catch (k) {
					throw new m("Reporting " + N + " \"" + C + "\" caused " + k, this.locator);
				}
				else console.error("[xmldom " + N + "]	" + C, M(this.locator));
			},
			warning: function(N) {
				this.reportError("warning", N);
			},
			error: function(N) {
				this.reportError("error", N);
			},
			fatalError: function(N, C) {
				throw this.reportError("fatalError", N), new m(N, this.locator, C);
			}
		};
		function M(N) {
			if (N) return `
@#[line:` + N.lineNumber + ",col:" + N.columnNumber + "]";
		}
		function D(N, C, k) {
			return typeof N == "string" ? N.substr(C, k) : N.length >= C + k || C ? new java.lang.String(N, C, k) + "" : N;
		}
		"endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g, function(N) {
			S.prototype[N] = function() {
				return null;
			};
		});
		function B(N, C) {
			N.currentElement ? N.currentElement.appendChild(C) : N.doc.appendChild(C);
		}
		function W(N) {
			if (N === "error") throw "onErrorStopParsing";
		}
		function Z() {
			throw "onWarningStopParsing";
		}
		r.__DOMHandler = S, r.DOMParser = b, r.normalizeLineEndings = v, r.onErrorStopParsing = W, r.onWarningStopParsing = Z;
	})), hr = xe(((r) => {
		var n = $e();
		r.assign = n.assign, r.hasDefaultHTMLNamespace = n.hasDefaultHTMLNamespace, r.isHTMLMimeType = n.isHTMLMimeType, r.isValidMimeType = n.isValidMimeType, r.MIME_TYPE = n.MIME_TYPE, r.NAMESPACE = n.NAMESPACE;
		var i = lt();
		r.DOMException = i.DOMException, r.DOMExceptionName = i.DOMExceptionName, r.ExceptionCode = i.ExceptionCode, r.ParseError = i.ParseError;
		var a = Pt();
		r.Attr = a.Attr, r.CDATASection = a.CDATASection, r.CharacterData = a.CharacterData, r.Comment = a.Comment, r.Document = a.Document, r.DocumentFragment = a.DocumentFragment, r.DocumentType = a.DocumentType, r.DOMImplementation = a.DOMImplementation, r.Element = a.Element, r.Entity = a.Entity, r.EntityReference = a.EntityReference, r.LiveNodeList = a.LiveNodeList, r.NamedNodeMap = a.NamedNodeMap, r.Node = a.Node, r.NodeList = a.NodeList, r.Notation = a.Notation, r.ProcessingInstruction = a.ProcessingInstruction, r.Text = a.Text, r.XMLSerializer = a.XMLSerializer;
		var s = dr();
		r.DOMParser = s.DOMParser, r.normalizeLineEndings = s.normalizeLineEndings, r.onErrorStopParsing = s.onErrorStopParsing, r.onWarningStopParsing = s.onWarningStopParsing;
	}))();
	const gr = /[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/u, Tr = /[\p{Script=Latin}\p{N}'’`-]/u, Oe = (r) => Math.max((r ?? 0) / 1e3, 0), kt = (r) => {
		const n = r.trim();
		return n.length > 0 && !gr.test(n) && Tr.test(n);
	}, Er = (r) => {
		if (r?.length) return r.map((n) => ({
			text: n.text,
			startTime: Oe(n.startTime),
			endTime: Oe(n.endTime)
		}));
	}, qt = (r) => ({
		text: r.text,
		startTime: Oe(r.startTime),
		endTime: Oe(r.endTime),
		...r.endsWithSpace ? { endsWithSpace: !0 } : {},
		...r.obscene ? { obscene: !0 } : {},
		...typeof r.emptyBeat == "number" ? { emptyBeat: r.emptyBeat } : {},
		...r.ruby?.length ? { ruby: Er(r.ruby) } : {}
	}), Ut = (r, n, i, a, s) => {
		if (!r?.length) return n.trim().length > 0 ? s(n, i, a) : [];
		const c = r.map(qt), l = [];
		let d = [];
		const g = () => {
			if (d.length === 0) return;
			const T = d.map((p) => p.text).join("");
			T.length > 0 && l.push({
				text: T,
				startTime: d[0].startTime,
				endTime: d[d.length - 1].endTime,
				syllables: d
			}), d = [];
		};
		for (let T = 0; T < c.length; T += 1) {
			const p = c[T], y = c[T + 1];
			d.push(p), y && !p.endsWithSpace && kt(p.text) && kt(y.text) || g();
		}
		return l;
	}, ct = (r, n) => n?.length ? n.filter((i) => i.text.trim().length > 0).map((i) => ({
		role: r,
		...i.language ? { language: i.language } : {},
		text: i.text,
		...i.words?.length ? { syllables: i.words.map(qt) } : {}
	})) : [], Pe = (r) => r?.find((n) => n.text.trim().length > 0)?.text, Nr = (r) => r?.trim().toLowerCase() === "chorus", vr = (r, n) => {
		if (!r || !r.text.trim()) return;
		const i = Oe(r.startTime), a = Oe(r.endTime), s = [...ct("translation", r.translations), ...ct("romanization", r.romanizations)];
		return {
			text: r.text,
			startTime: i,
			endTime: a,
			words: Ut(r.words, r.text, i, a, n),
			...Pe(r.translations) ? { translation: Pe(r.translations) } : {},
			...Pe(r.romanizations) ? { romanization: Pe(r.romanizations) } : {},
			...s.length > 0 ? { alternateTexts: s } : {}
		};
	}, br = (r, n) => {
		const i = Oe(r.startTime), a = Oe(r.endTime), s = [...ct("translation", r.translations), ...ct("romanization", r.romanizations)], c = vr(r.backgroundVocal, n);
		return {
			words: Ut(r.words, r.text, i, a, n),
			startTime: i,
			endTime: a,
			fullText: r.text,
			...Pe(r.translations) ? { translation: Pe(r.translations) } : {},
			...r.id ? { id: r.id } : {},
			...r.agentId ? { agentId: r.agentId } : {},
			...r.songPart ? { songPart: r.songPart } : {},
			...Nr(r.songPart) ? { isChorus: !0 } : {},
			...typeof r.blockIndex == "number" ? { blockIndex: r.blockIndex } : {},
			...Pe(r.romanizations) ? { romanization: Pe(r.romanizations) } : {},
			...s.length > 0 ? { alternateTexts: s } : {},
			...c ? {
				backgroundVocal: c,
				backgroundVocals: [c]
			} : {}
		};
	}, wr = (r) => ({
		text: r.fullText,
		startTime: r.startTime,
		endTime: r.endTime,
		words: r.words,
		...r.agentId ? { agentId: r.agentId } : {},
		...r.translation ? { translation: r.translation } : {},
		...r.romanization ? { romanization: r.romanization } : {},
		...r.alternateTexts?.length ? { alternateTexts: r.alternateTexts } : {}
	}), yr = (r, n) => r.blockIndex === void 0 || n.blockIndex === void 0 || r.blockIndex === n.blockIndex, Ir = (r, n) => !!(r.agentId && n.agentId && r.agentId !== n.agentId && n.startTime < r.endTime && n.endTime > r.startTime && yr(r, n)), Ar = (r) => {
		const n = [];
		for (const i of r) {
			const a = [...n].reverse().find((l) => Ir(l, i));
			if (!a) {
				n.push(i);
				continue;
			}
			const s = [wr(i), ...i.backgroundVocals ?? (i.backgroundVocal ? [i.backgroundVocal] : [])], c = [...a.backgroundVocals ?? (a.backgroundVocal ? [a.backgroundVocal] : []), ...s];
			a.backgroundVocals = c, a.backgroundVocal = c[0];
		}
		return n;
	}, Dr = (r) => {
		const n = Object.entries(r ?? {});
		if (n.length !== 0) return { agents: Object.fromEntries(n.map(([i, a]) => [i, {
			id: a.id || i,
			...a.name ? { name: a.name } : {},
			...a.type ? { type: a.type } : {}
		}])) };
	}, Sr = (r, n) => {
		const i = Dr(r.metadata.agents)?.agents, a = Ar(r.lines.map((c) => br(c, n))), s = {
			...r.metadata.timingMode ? { timingMode: r.metadata.timingMode } : {},
			...i ? { agents: i } : {}
		};
		return {
			lines: a,
			isWordByWord: r.metadata.timingMode === "Word",
			...Object.keys(s).length > 0 ? { ttml: s } : {}
		};
	}, Vt = /\[(\d{2}):(\d{2})[.:](\d{2,3})\]/g, Ft = /<(\d{2}):(\d{2})[.:](\d{2,3})>/g, bt = /^\[(\d{2}):(\d{2})[.:](\d{2,3})\]/, Mr = /^((?:\[(?:\d{2}):(?:\d{2})[.:](?:\d{2,3})\])+)(.*)$/, _r = /^\[(ti|ar):([^\]]*)\]$/i, Bt = /^\[(\d{1,3}(?::\d{1,3}){0,2})\.(\d{1,3})\](.*)$/, Gt = /<(\d+),(\d+)(?:,\d+)?>([^<]*)/g, Lr = "......", rt = (r, n, i) => {
		const a = Math.max(i - n, .1), s = r.split(/\s+/).filter((p) => p), c = [], l = [];
		let d = 0;
		for (const p of s) if (/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/.test(p)) p.split("").forEach((y) => {
			const m = /[，。！？、：；"'）]/.test(y) ? 0 : 1;
			l.push({
				text: y,
				weight: m
			}), d += m;
		});
		else {
			const y = 1 + p.length * .15;
			l.push({
				text: p,
				weight: y
			}), d += y;
		}
		d === 0 && (d = 1);
		const g = a * .9 / d;
		let T = n;
		if (l.forEach((p) => {
			const y = p.weight * g, m = Math.max(y, .05);
			c.push({
				text: p.text,
				startTime: T,
				endTime: T + m
			}), p.weight > 0 ? T += y : T += .05;
		}), c.length > 0) {
			const p = c[c.length - 1];
			if (p.endTime > i) {
				const y = (i - n) / (p.endTime - n);
				c.forEach((m) => {
					m.startTime = n + (m.startTime - n) * y, m.endTime = n + (m.endTime - n) * y;
				});
			}
		}
		return c;
	}, Rr = (r) => {
		const n = [], i = (a, s) => {
			const c = s - a, l = [], d = c / 6;
			for (let g = 0; g < 6; g += 1) l.push({
				text: ".",
				startTime: a + g * d,
				endTime: a + (g + 1) * d
			});
			return {
				startTime: a,
				endTime: s,
				fullText: Lr,
				words: l
			};
		};
		r.length > 0 && r[0].startTime > 3 && n.push(i(.5, r[0].startTime - .5));
		for (let a = 0; a < r.length; a += 1) {
			const s = r[a];
			n.push(s);
			const c = r[a + 1];
			c && c.startTime - s.endTime > 3 && n.push(i(s.endTime + .05, c.startTime - .05));
		}
		return n;
	}, ke = (r, n = {}) => {
		const i = n.includeInterludes === !1 ? r : Rr(r);
		return cr(i);
	}, Ke = (r, n) => n ? r : [...r].sort((i, a) => i.startTime - a.startTime), wt = 1, Cr = (r, n) => {
		let i = 0, a = r.length;
		for (; i < a;) {
			const s = i + a >> 1;
			r[s].startTime < n ? i = s + 1 : a = s;
		}
		return i;
	}, ve = (r, n) => {
		const i = r.map(() => {});
		if (r.length === 0 || n.length === 0) return i;
		const a = [];
		r.forEach((l, d) => {
			for (let g = Cr(n, l - wt); g < n.length && n[g].startTime < l + wt; g += 1) {
				const T = Math.abs(n[g].startTime - l);
				T < wt && a.push({
					line: d,
					entry: g,
					diff: T
				});
			}
		}), a.sort((l, d) => l.diff - d.diff || l.line - d.line || l.entry - d.entry);
		const s = new Array(r.length).fill(!1), c = new Array(n.length).fill(!1);
		for (const l of a) s[l.line] || c[l.entry] || (s[l.line] = !0, c[l.entry] = !0, i[l.line] = n[l.entry].text);
		return i;
	}, Ht = (r, n, i) => {
		const a = parseInt(r, 10), s = parseInt(n, 10), c = parseFloat(`0.${i}`);
		return a * 60 + s + c;
	}, xr = (r, n) => {
		const i = new RegExp(n.source, "g");
		return Array.from(r.matchAll(i)).map((a) => {
			const s = a.index ?? 0;
			return {
				time: Ht(a[1], a[2], a[3]),
				index: s,
				endIndex: s + a[0].length
			};
		});
	}, yt = (r, n) => {
		const i = r.match(_r);
		if (!i) return !1;
		const a = i[1].toLowerCase(), s = i[2].trim();
		return a === "ti" && s ? n.title = s : a === "ar" && s && (n.artist = s), !0;
	}, ut = (r, n, i) => {
		if (!i) return null;
		const a = xr(r, n);
		return Or(r, a);
	}, Or = (r, n) => {
		if (n.length < 2) return null;
		const i = [];
		let a = "";
		for (let c = 0; c < n.length - 1; c += 1) {
			const l = n[c], d = n[c + 1], g = r.slice(l.endIndex, d.index).replace(/\r/g, "");
			a += g, g.trim() && i.push({
				text: g,
				startTime: l.time,
				endTime: d.time
			});
		}
		const s = r.slice(n[n.length - 1].endIndex).replace(/\r/g, "");
		return a += s, s.trim() && i.push({
			text: s,
			startTime: n[n.length - 1].time
		}), a.trim() ? {
			words: i,
			startTime: i[0]?.startTime ?? n[0].time,
			endTime: i[i.length - 1]?.endTime,
			fullText: a
		} : null;
	}, It = (r) => {
		const n = r.match(Mr);
		if (!n) return null;
		const i = n[1].match(bt);
		if (!i) return null;
		const a = n[2].trim();
		return a ? {
			startTime: Ht(i[1], i[2], i[3]),
			text: a
		} : null;
	}, Se = (r) => {
		const n = {}, i = [];
		let a = !0, s = Number.NEGATIVE_INFINITY;
		const c = r.replace(/^\uFEFF/, "").split(/\r?\n/);
		for (const l of c) {
			const d = l.trim();
			if (!d || yt(d, n)) continue;
			const g = d.match(bt), T = g ? d.slice(g[0].length) : d, p = ut(T, Ft, T.includes("<")), y = p ? null : ut(d, Vt, d.indexOf("[", 1) !== -1), m = p ? {
				startTime: p.startTime,
				endTime: p.endTime,
				text: p.fullText
			} : y ? {
				startTime: y.startTime,
				endTime: y.endTime,
				text: y.fullText
			} : It(d);
			!m || m.text.length === 0 || (m.startTime < s && (a = !1), s = m.startTime, i.push(m));
		}
		return {
			entries: Ke(i, a),
			isSorted: a
		};
	}, Pr = (r, n = "", i = {}, a = "") => {
		const s = [], c = [];
		let l = !0, d = Number.NEGATIVE_INFINITY;
		for (const E of r.replace(/^\uFEFF/, "").split(/\r?\n/)) {
			const v = It(E);
			!v || v.text.length === 0 || (v.startTime < d && (l = !1), d = v.startTime, c.push(v));
		}
		const g = Ke(c, l), T = Se(n).entries, p = Se(a).entries, y = ve(g.map((E) => E.startTime), T), m = ve(g.map((E) => E.startTime), p);
		for (let E = 0; E < g.length; E += 1) {
			const v = g[E], b = g[E + 1], S = y[E];
			let P = b ? b.startTime - v.startTime : 5;
			const M = v.text.length * .5;
			P > M + 2 && P > 5 && (P = Math.min(P, M + 2));
			const D = v.startTime + P;
			s.push({
				words: rt(v.text, v.startTime, D),
				startTime: v.startTime,
				endTime: D,
				fullText: v.text,
				translation: S,
				romanization: m[E]
			});
		}
		return {
			lines: ke(s, i),
			isWordByWord: !1
		};
	}, kr = (r, n = "", i = {}, a = "") => {
		const s = [], c = Se(n).entries, l = Se(a).entries, d = r.replace(/^\uFEFF/, "").split(/\r?\n/);
		let g = !0, T = Number.NEGATIVE_INFINITY;
		for (const v of d) {
			const b = v.match(/^\[(\d+),(\d+)\](.*)/);
			if (!b) continue;
			const S = parseInt(b[1], 10), P = parseInt(b[2], 10), M = b[3], D = S / 1e3, B = (S + P) / 1e3, W = [];
			let Z = "";
			const N = /\((\d+),(\d+),(\d+)\)([^\(]*)/g;
			let C;
			for (; (C = N.exec(M)) !== null;) {
				const k = parseInt(C[1], 10), H = parseInt(C[2], 10), X = C[4];
				W.push({
					text: X,
					startTime: k / 1e3,
					endTime: (k + H) / 1e3
				}), Z += X;
			}
			W.length > 0 && (D < T && (g = !1), T = D, s.push({
				words: W,
				startTime: D,
				endTime: B,
				fullText: Z
			}));
		}
		const p = Ke(s, g), y = ve(p.map((v) => v.startTime), c), m = ve(p.map((v) => v.startTime), l), E = p.map((v, b) => ({
			...v,
			translation: y[b],
			romanization: m[b]
		}));
		return {
			lines: ke(E, i),
			isWordByWord: !0
		};
	}, zt = (r, n = "", i = {}, a = "") => {
		const s = [], c = (b) => {
			if (!b.trim()) return [];
			const S = zt(b).lines;
			return S.length > 0 ? S.map((P) => ({
				startTime: P.startTime,
				text: P.fullText
			})) : Se(b).entries;
		}, l = c(n), d = c(a), g = r.replace(/^\uFEFF/, "").split(/\r?\n/);
		let T = !0, p = Number.NEGATIVE_INFINITY;
		for (const b of g) {
			const S = b.match(/^\[(\d+),(\d+)\](.*)/);
			if (!S) continue;
			const P = parseInt(S[1], 10), M = parseInt(S[2], 10), D = S[3], B = P / 1e3, W = (P + M) / 1e3, Z = [];
			let N = "";
			const C = /\((\d+),(\d+)(?:,\d+)?\)/g, k = [];
			let H;
			for (; (H = C.exec(D)) !== null;) k.push({
				startMs: parseInt(H[1], 10),
				durationMs: parseInt(H[2], 10),
				tagStart: H.index,
				tagEnd: H.index + H[0].length
			});
			if (k.length === 0) continue;
			const X = [];
			let Y = 0;
			for (const ae of k) X.push(D.slice(Y, ae.tagStart)), Y = ae.tagEnd;
			X.push(D.slice(Y));
			const de = X[0].trim().length > 0 && X[X.length - 1].trim().length === 0, ie = X[0].trim().length === 0 && X[X.length - 1].trim().length > 0;
			for (let ae = 0; ae < k.length; ae += 1) {
				const h = k[ae], A = X[ae] ?? "", R = X[ae + 1] ?? "";
				let _ = "";
				de ? _ = A : ie || R.trim().length > 0 && A.trim().length === 0 ? _ = R : A.trim().length > 0 && R.trim().length === 0 ? _ = A : _ = R.length >= A.length ? R : A, _ && (Z.push({
					text: _,
					startTime: h.startMs / 1e3,
					endTime: (h.startMs + h.durationMs) / 1e3
				}), N += _);
			}
			Z.length > 0 && (B < p && (T = !1), p = B, s.push({
				words: Z,
				startTime: B,
				endTime: W,
				fullText: N
			}));
		}
		const y = Ke(s, T), m = ve(y.map((b) => b.startTime), l), E = ve(y.map((b) => b.startTime), d), v = y.map((b, S) => ({
			...b,
			translation: m[S],
			romanization: E[S]
		}));
		return {
			lines: ke(v, i),
			isWordByWord: !0
		};
	}, Xt = (r) => {
		const n = r.trim().split(":");
		let i = 0, a = 0, s = 0;
		return n.length === 3 ? (i = parseInt(n[0], 10), a = parseInt(n[1], 10), s = parseFloat(n[2])) : n.length === 2 ? (a = parseInt(n[0], 10), s = parseFloat(n[1])) : s = parseFloat(n[0]), i * 3600 + a * 60 + s;
	}, qr = (r) => r.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim(), At = (r) => {
		const n = r.replace(/^\uFEFF/, "").replace(/\r\n/g, `
`).trim();
		if (!n) return [];
		const i = n.split(/\n{2,}/), a = [], s = /^((?:\d{2}:)?\d{2}:\d{2}\.\d{3})\s*-->\s*((?:\d{2}:)?\d{2}:\d{2}\.\d{3})(?:\s+.*)?$/;
		for (const c of i) {
			const l = c.split(`
`).map((p) => p.trim()).filter(Boolean);
			if (l.length === 0 || l[0] === "WEBVTT" || l[0].startsWith("NOTE") || l[0] === "STYLE" || l[0] === "REGION") continue;
			const d = l.findIndex((p) => s.test(p));
			if (d === -1) continue;
			const g = l[d].match(s);
			if (!g) continue;
			const T = qr(l.slice(d + 1).join(" "));
			T && a.push({
				startTime: Xt(g[1]),
				endTime: Xt(g[2]),
				text: T
			});
		}
		return a.sort((c, l) => c.startTime - l.startTime);
	}, Ur = (r, n = "", i = {}, a = "") => {
		const s = At(r), c = At(n), l = At(a), d = ve(s.map((p) => p.startTime), c), g = ve(s.map((p) => p.startTime), l), T = [];
		for (let p = 0; p < s.length; p += 1) {
			const y = s[p], m = s[p + 1], E = m ? m.startTime : y.startTime + 5, v = Math.max(y.endTime || E, y.startTime + .1);
			T.push({
				words: rt(y.text, y.startTime, v),
				startTime: y.startTime,
				endTime: v,
				fullText: y.text,
				translation: d[p],
				romanization: g[p]
			});
		}
		return {
			lines: ke(T, i),
			isWordByWord: !1
		};
	}, Vr = (r, n = "", i = {}, a = "") => {
		const s = ur.parse(r.replace(/^\uFEFF/, ""), { domParser: new hr.DOMParser() }), c = Sr(s, rt), l = {
			...c,
			lines: ke(c.lines, i)
		};
		return console.log("[TTML] Adapted lyric data for visualizers:", l), l;
	}, Fr = (r, n = "", i = {}, a = "") => {
		const s = {}, c = [], l = Se(n).entries, d = Se(a).entries, g = r.replace(/^\uFEFF/, "").split(/\r?\n/);
		let T = !0, p = Number.NEGATIVE_INFINITY;
		for (const b of g) {
			const S = b.trim();
			if (!S || yt(S, s)) continue;
			const P = S.match(bt), M = P ? S.slice(P[0].length) : S, D = ut(M, Ft, M.includes("<"));
			if (D) {
				D.startTime < p && (T = !1), p = D.startTime, c.push(D);
				continue;
			}
			const B = ut(S, Vt, S.indexOf("[", 1) !== -1);
			if (B) {
				B.startTime < p && (T = !1), p = B.startTime, c.push(B);
				continue;
			}
			const W = It(S);
			W && (W.startTime < p && (T = !1), p = W.startTime, c.push({
				words: [],
				startTime: W.startTime,
				fullText: W.text
			}));
		}
		const y = Ke(c, T), m = ve(y.map((b) => b.startTime), l), E = ve(y.map((b) => b.startTime), d), v = y.map((b, S) => {
			let P = Math.max(b.endTime ?? y[S + 1]?.startTime ?? b.startTime + 5, b.startTime + .001);
			const M = b.words.length > 0 ? b.words.map((D, B) => {
				const W = b.words[B + 1]?.startTime ?? P, Z = Math.max(D.endTime ?? W, D.startTime + .001);
				return {
					text: D.text,
					startTime: D.startTime,
					endTime: Z
				};
			}) : rt(b.fullText, b.startTime, P);
			return M.length > 0 && (P = Math.max(P, M[M.length - 1].endTime)), {
				words: M,
				startTime: b.startTime,
				endTime: P,
				fullText: b.fullText,
				translation: m[S],
				romanization: E[S]
			};
		});
		return {
			lines: ke(v, i),
			title: s.title,
			artist: s.artist,
			isWordByWord: y.some((b) => b.words.length > 0)
		};
	}, Br = (r, n = "", i = {}, a = "") => {
		const s = [];
		let c = [], l = [];
		const d = r.match(/\[language:([^\]]*)\]/);
		if (d) try {
			let v = d[1].trim();
			for (; v.length % 4 !== 0;) v += "=";
			const b = typeof Buffer < "u" ? Buffer.from(v, "base64").toString("utf8") : new TextDecoder("utf-8").decode(Uint8Array.from(atob(v), (M) => M.charCodeAt(0))), S = JSON.parse(b), P = (M) => {
				const D = S.content?.find((B) => B.type === M);
				return !D || !Array.isArray(D.lyricContent) ? [] : D.lyricContent.map((B) => Array.isArray(B) ? B.join("").trim() : String(B).trim());
			};
			l = P(0), c = P(1);
		} catch (v) {
			console.error("[Kugou KRC] Failed to decode/parse language tag:", v);
		}
		const g = Se(n).entries, T = Se(a).entries, p = r.replace(/^\uFEFF/, "").split(/\r?\n/);
		let y = !0, m = Number.NEGATIVE_INFINITY;
		for (const v of p) {
			const b = v.match(/^\[(\d+),(\d+)\](.*)/);
			if (!b) continue;
			const S = parseInt(b[1], 10), P = parseInt(b[2], 10), M = b[3], D = S / 1e3, B = (S + P) / 1e3, W = [];
			let Z = "";
			const N = /\<(\d+),(\d+)(?:,\d+)?\>([^\<]*)/g;
			let C;
			for (; (C = N.exec(M)) !== null;) {
				const H = parseInt(C[1], 10), X = parseInt(C[2], 10), Y = C[3], de = S + H;
				W.push({
					text: Y,
					startTime: de / 1e3,
					endTime: (de + X) / 1e3
				}), Z += Y;
			}
			const k = M.trim();
			W.length === 0 && k.length > 0 && !k.startsWith("[") && !k.startsWith("<") && (W.push(...rt(k, D, B)), Z = k), W.length > 0 && (D < m && (y = !1), m = D, s.push({
				words: W,
				startTime: D,
				endTime: B,
				fullText: Z
			}));
		}
		const E = Ke(s, y).map((v, b) => {
			let S = c[b] || void 0, P = l[b] || void 0;
			return !S && g.length > 0 && (S = ve([v.startTime], g)[0] || void 0), !P && T.length > 0 && (P = ve([v.startTime], T)[0] || void 0), {
				...v,
				translation: S,
				romanization: P
			};
		});
		return {
			lines: ke(E, i),
			isWordByWord: !0
		};
	}, Wt = (r, n) => {
		const i = r.split(":").map((l) => parseInt(l, 10));
		for (; i.length < 3;) i.unshift(0);
		const [a, s, c] = i;
		return a * 3600 + s * 60 + c + parseInt(n, 10) / 1e3;
	}, Yt = (r) => {
		const n = [];
		for (const i of r.replace(/^﻿/, "").split(/\r?\n/)) {
			const a = i.trim().match(Bt), s = a?.[3]?.trim();
			!a || !s || n.push({
				startTime: Wt(a[1], a[2]),
				text: s
			});
		}
		return n;
	}, jt = (r, n) => {
		if (n.length === 0) return r.map(() => {});
		const i = /* @__PURE__ */ new Map();
		for (const s of n) {
			const c = Math.round(s.startTime * 1e3);
			i.has(c) || i.set(c, s.text);
		}
		const a = r.map((s) => i.get(Math.round(s * 1e3)));
		return a.some((s) => s !== void 0) ? a : ve(r, n);
	}, Gr = (r, n = "", i = {}, a = "") => {
		const s = {}, c = [];
		for (const p of r.replace(/^﻿/, "").split(/\r?\n/)) {
			const y = p.trim();
			if (!y || yt(y, s)) continue;
			const m = y.match(Bt);
			if (!m) continue;
			const E = Wt(m[1], m[2]), v = [];
			let b = "", S = 0;
			Gt.lastIndex = 0;
			let P;
			for (; (P = Gt.exec(m[3])) !== null;) {
				const M = Math.max(parseInt(P[1], 10), S), D = Math.max(parseInt(P[2], 10), 1);
				v.push({
					text: P[3],
					startTime: E + M / 1e3,
					endTime: E + (M + D) / 1e3
				}), S = M + D, b += P[3];
			}
			v.length === 0 || !b.trim() || c.push({
				words: v,
				startTime: E,
				endTime: E + S / 1e3,
				fullText: b
			});
		}
		c.sort((p, y) => p.startTime - y.startTime);
		const l = c.map((p) => p.startTime), d = jt(l, Yt(n)), g = jt(l, Yt(a)), T = c.map((p, y) => {
			const m = c[y + 1], E = m ? Math.min(p.endTime, m.startTime) : p.endTime;
			return {
				words: p.words,
				startTime: p.startTime,
				endTime: Math.max(E, p.startTime),
				fullText: p.fullText,
				translation: d[y],
				romanization: g[y]
			};
		});
		return {
			lines: ke(T, i),
			title: s.title,
			artist: s.artist,
			isWordByWord: !0
		};
	}, Hr = (r, n, i = "", a = {}, s = "") => {
		switch (r) {
			case "yrc": return kr(n, i, a, s);
			case "qrc": return zt(n, i, a, s);
			case "krc": return Br(n, i, a, s);
			case "awlrc": return Gr(n, i, a, s);
			case "enhanced-lrc": return Fr(n, i, a, s);
			case "vtt": return Ur(n, i, a, s);
			case "ttml": return Vr(n, i, a, s);
			default: return Pr(n, i, a, s);
		}
	}, zr = (r) => r === "yrc" || r === "qrc" || r === "krc" || r === "awlrc" || r === "enhanced-lrc" || r === "vtt" || r === "ttml" ? r : "lrc";
	typeof self < "u" && (self.onmessage = (r) => {
		const { type: n, format: i, content: a, translation: s, romanization: c, options: l, requestId: d } = r.data;
		if (n !== "parse") {
			self.postMessage({
				type: "error",
				message: "Unknown message type",
				requestId: d
			});
			return;
		}
		try {
			const g = Hr(zr(i), a, s || "", l, c || "");
			self.postMessage({
				type: "result",
				data: g,
				requestId: d
			});
		} catch (g) {
			self.postMessage({
				type: "error",
				message: String(g),
				requestId: d
			});
		}
	});
})();
