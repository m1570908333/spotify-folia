# 可行性分析

评估日期：2026-10-15

## 一句话判断

把 Folia 的**歌词舞台体验**迁入 Spotify 是可行项目；把 Folia 的**所有功能原样塞进 Spotify 客户端**不是合理目标。正确做法是以 Spicetify Custom App 为新宿主，抽出 Folia 的歌词模型、主题系统和 Visualizer Runtime，并把原生能力放进可选 Companion。

## 为什么核心链路成立

Spicetify Custom App 可以挂载独立页面。其 `Spicetify.Player` 暴露当前播放状态，并提供 `songchange`、`onplaypause`、`onprogress` 事件以及进度、时长和播放控制。官方内置的 Lyrics Plus 已经证明 Custom App 可以在 Spotify 内获取多来源同步歌词，并支持网易云逐字歌词、Spotify、Musixmatch 与 LRCLIB。

Folia 的 Visualizer 不是直接抓取播放器状态，而是消费统一的 `LyricData`、当前时间、当前行、主题、封面与少量音频特征。这个边界非常适合换宿主：只需实现一个 `SpotifyPlaybackAdapter` 和一个 `LyricsAdapter`，不必重写每种动画。

## 可行性分级

| 目标 | 可行性 | 说明 |
| --- | --- | --- |
| Spotify 内独立 Folia 页面 | 高 | Custom App 原生能力 |
| 当前歌曲、封面、播放进度同步 | 高 | `Spicetify.Player` 直接提供 |
| LRC/逐字歌词驱动舞台 | 高 | 可复用 Lyrics Plus 的 provider 思路；需定义统一歌词模型 |
| Classic/Still/基础 DOM 模式 | 高 | 浏览器能力足够，移植成本可控 |
| PixiJS/Canvas 模式 | 中高 | 可运行，但需处理 bundle、GPU 资源释放和 Spotify 页面切换 |
| Three.js/Diorama | 中 | 性能和依赖体积风险较高 |
| Folia 全主题与调参 | 中高 | 可迁移到 localStorage/IndexedDB；UI 需重做 |
| 节拍/段落驱动 | 高 | `Spicetify.getAudioData()` 可取预分析 beats/sections/segments，但部分歌曲可能缺失 |
| 实时音频频谱驱动 | 低至中 | 预分析数据不能等价替代实时 bass/treble FFT；高级效果需估算信号或 Companion |
| 本地音乐库与文件扫描 | 低 | Custom App 无 Electron 文件系统权限 |
| 视频导出/透明视频 | 低 | 需要原生编码、ffmpeg 或 Companion |
| 壁纸模式、独立窗口、系统托盘 | 不适用 | 属于 Electron/操作系统宿主能力 |
| Folium Node 模组 | 低 | Spotify 页面不能运行可信 Node 入口；只能迁移浏览器沙箱子集 |
| 网易云/QQ/酷狗完整播放器功能 | 不建议 | Spotify 已负责播放；重复实现会扩大合规与维护风险 |

## “保留所有功能”的现实定义

建议把“所有功能”改成三层：

1. **必须保留：** 所有歌词视觉模式、主题、字幕、逐字高亮、偏移校准、全屏、设置导入导出。
2. **等价替代：** Spotify 队列/收藏/播放控制代替 Folia 自有播放器；Spotify 元数据代替在线搜索与播放。
3. **Companion 承载：** 本地歌词导入、跨域代理、AI 主题密钥、音频分析、视频导出、资源包管理。

按这个定义，体验层可以保留约 80% 至 90%；按“每个菜单和后端功能完全一致”的定义，项目会变成重写 Folia，并不适合 Spicetify。

## 主要技术风险

### 1. Spotify 客户端更新

Spicetify 修改桌面客户端，Spotify 更新可能改变内部结构。应只依赖 Spicetify 已公开的 API，避免直接读取 Spotify 私有 React 树或内部模块。

### 2. 歌词版权与来源

歌词 provider 的可用性、跨域策略和服务条款各不相同。项目应允许用户自选 provider，不把歌词数据打包进仓库，不做代理式公开再分发。

### 3. 音频分析边界

Spicetify 的 `getAudioData()` 能返回与 Spotify Audio Analysis 类似的预分析数据，可用于 beats、bars、sections、tempo 和段落强度；官方同时提示并非所有曲目都有数据。Folia 部分背景和 Lumiere 等模式消费的是实时 bass/treble/audioPower，仍不能假设能从受保护音频流接入 `AudioContext`。第一版用预分析数据生成确定性包络；高级版由本地 Companion 从系统环回音频计算实时频谱。

### 4. GPU 与内存

Folia 有 13 个 Visualizer tuning 类别、Pixi 和 Three.js 场景。Spotify 本身已经是重型 Chromium 应用，必须强制执行纹理预算、页面不可见暂停、单实例 renderer 和换歌资源释放。

### 5. 许可证

Folia 是 AGPL-3.0。直接复制 Visualizer、解析器或主题代码会使迁移项目成为派生作品，应公开完整对应源码并保留版权声明。Spicetify CLI 本身是 LGPL-2.1，但使用其 API不会消除 Folia 的 AGPL 义务。

## 工作量估算

以一名熟悉 React/WebGL 的高级开发者计算：

| 阶段 | 范围 | 估算 |
| --- | --- | --- |
| Phase 0 | 播放桥接与 Custom App 壳 | 2-4 天 |
| MVP | 歌词 provider、Classic/Still、主题、偏移 | 3-6 周 |
| Visual Pack 1 | DOM/Canvas 模式 5-7 个 | 6-10 周 |
| Visual Pack 2 | Pixi/Three 高级模式 | 8-16 周 |
| Companion | 本地歌词、音频分析、导出 | 6-12 周 |
| 接近完整体验 | 测试、兼容、安装、升级 | 6-12 个月持续维护 |

## Go / No-Go

**建议 Go，但限定目标。**

Go 条件：

- 项目定位为“Spotify 中的 Folia 舞台”，不是另一个完整音乐播放器。
- 接受 AGPL-3.0 开源。
- 第一版不承诺真实音频频谱、视频导出和 Node 模组。
- 先完成两种视觉模式和两种歌词源，再决定是否迁移全部模式。

No-Go 条件：

- 必须闭源发布。
- 必须完全无 Companion 地保留 Electron 原生功能。
- 必须保证 Spotify 每次更新后永不失效。
