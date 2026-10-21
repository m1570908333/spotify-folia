# 推荐架构

## 总览

```text
Spotify Desktop
  -> Spicetify Custom App: folia-stage
       -> SpotifyPlaybackAdapter
       -> SpotifyAudioAnalysisAdapter
       -> LyricsOrchestrator
            -> Spotify lyrics adapter
            -> LRCLIB adapter
            -> NetEase adapter
            -> Local/Companion adapter
       -> Folia Core
            -> normalized LyricData
            -> timeline clock
            -> theme/tuning stores
       -> Visualizer Host
            -> DOM / Canvas / Pixi / Three renderers
       -> optional localhost Companion
            -> local lyrics
            -> CORS-safe proxy
            -> system audio FFT
            -> ffmpeg export
```

## 包边界

建议使用 monorepo：

```text
apps/spicetify-app       Spotify 内的 Custom App
apps/companion           可选本地服务
packages/playback        Spotify 播放状态适配
packages/lyrics          provider、解析器、缓存与匹配
packages/folia-core      与宿主无关的歌词/主题/时间轴契约
packages/visualizers     从 Folia 迁移的视觉模式
packages/settings        可迁移设置 schema 与 codec
```

## 播放时钟

不要在每个 `onprogress` 事件上触发 React 全树渲染。适配器保存锚点：

```text
baseProgressMs = Spicetify.Player.getProgress()
anchoredAt = performance.now()
displayTime = paused ? baseProgressMs : baseProgressMs + now - anchoredAt
```

收到 `songchange`、`onplaypause`、`onprogress` 时校正锚点。Visualizer 使用 MotionValue/ref 或自己的 RAF 读取时间。

## 歌词模型

内部继续使用 Folia 的 `LyricData -> Line -> Word` 思路：

- 行级同步歌词转换为单 word 行，或按 grapheme 均分作为视觉降级。
- 逐字歌词保留每个 word 的 start/end。
- 翻译、罗马音和背景人声使用独立轨道，不拼进正文字符串。
- 缓存键优先使用 Spotify track URI，匹配键使用标准化 title/artist/album/duration。

## 歌词来源优先级

建议默认：

1. 用户本地覆盖
2. Spotify 内部歌词（如果当前客户端可用）
3. LRCLIB
4. 网易云逐字/同步歌词
5. Musixmatch（用户自行配置凭据）
6. 无歌词状态

来源应可排序、关闭和按歌曲覆盖。不要让 Visualizer 知道具体 provider。

## 音频特征

`Spicetify.getAudioData(trackUri)` 作为第一层，读取 beats/bars/sections/segments，并预编译成随时间查询的 `AudioBands` 近似值。对缺少分析数据的歌曲使用歌词重音和固定包络降级。只有要求真实实时频谱的模式才连接 Companion 的系统环回 FFT。

## Visualizer 迁移策略

### 第一批

- `still`
- `classic`
- `partita`
- `fume`

这些模式主要依赖 DOM/React/共享歌词工具，可优先证明契约。

### 第二批

- `cadenza`
- `cappella`
- `tilt`
- `claddagh`
- `monet`
- `pendolo`

需要迁移资源存储、Canvas 与复杂布局。

### 第三批

- `sonnet`
- `tempera`
- `lumiere`
- `diorama`

这些模式依赖 Pixi/Three、纹理池、场景缓存与更严格的 GPU 生命周期，应在性能预算稳定后再做。

## Companion 协议

仅监听 `127.0.0.1`，默认随机 token。建议接口：

```text
GET  /health
GET  /lyrics/lookup?trackUri=...
POST /lyrics/import
WS   /audio/features
POST /export/video
```

Custom App 必须能在 Companion 不存在时正常工作，只是隐藏高级能力。

## 性能预算

- 页面不可见时停止 RAF 和 GPU 渲染。
- 只有一个 Visualizer runtime 存活。
- 换歌后释放 Pixi texture、WebGL framebuffer 和 Three geometry/material。
- 默认渲染比例限制在 `min(devicePixelRatio, 1.5)`。
- 高级模式提供 balanced/low 档。
- 目标：Spotify 客户端额外常驻内存小于 250 MB，普通模式帧时间小于 12 ms。
