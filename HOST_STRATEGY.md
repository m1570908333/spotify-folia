# 宿主方案对比

## 结论

如果目标是让 Folia 歌词舞台**直接出现在 Spotify Desktop 内部**，优先选择 Spicetify Custom App。

如果目标是长期稳定、尽量依赖官方接口，则应做独立桌面应用或悬浮窗口，但它不再是真正嵌入 Spotify。

不建议自己从零实现 Spotify 客户端注入插件框架。

## 方案 A：Spicetify Custom App

可行性：高。

优势：

- 已解决 Spotify 客户端资源修改、注入、加载和恢复。
- Custom App 可以在侧边栏提供独立 React 页面。
- Extension 可以添加入口、按钮和启动时逻辑。
- 可读取播放器事件、曲目、进度、控制和 Audio Analysis。
- 已有 Lyrics Plus 可借鉴多歌词源和逐字歌词处理。

代价：

- Spotify 更新后可能需要等待 Spicetify 兼容。
- 依赖 Spicetify 的公开封装和运行生命周期。
- 不属于 Spotify 官方插件体系。

适合：Spotify 内 Folia 舞台的主路线。

## 方案 B：自行注入 Spotify Desktop

可行性：低。

这不是单纯“写一个插件”，而是同时承担：

- 定位并修改 Spotify 客户端资源。
- 注入 JavaScript/CSS。
- 找到播放器内部对象和 React 容器。
- 绕过资源完整性、缓存和更新覆盖。
- 实现安装、备份、恢复、版本检测和故障回滚。
- 每次 Spotify 改版后重新适配。

即使最终成功，本质上也会重新实现一个缩小版 Spicetify。Folia 舞台本身反而只占工作量的一部分。

适合：研究 Spotify 客户端内部机制，不适合作为面向用户的主方案。

## 方案 C：独立应用或悬浮层

可行性：高。

可使用 Spotify Web API、Web Playback SDK、系统媒体会话或本地 Companion 获取播放状态，在独立窗口显示 Folia。

优势：

- 不修改 Spotify 安装文件。
- 可以自由使用 Electron/Tauri、文件系统、ffmpeg、系统音频和多个窗口。
- 更容易保留 Folia 的本地歌词、视频导出、OBS 和音频分析能力。
- Spotify 更新通常不会直接破坏 UI。

不足：

- 不能成为 Spotify 原生侧边栏页面。
- OAuth、Spotify Connect、API 配额和账号能力需要单独处理。
- 窗口体验需要通过置顶、迷你窗或桌面歌词弥补。

适合：追求完整 Folia 功能和长期稳定的产品路线。

## 推荐组合

```text
Spicetify Custom App
  负责 Spotify 内舞台、播放桥接、设置与基础歌词

Local Companion（可选）
  负责本地歌词、实时 FFT、文件资源、视频导出与 OBS

Standalone Folia（保留）
  作为不使用 Spicetify 时的完整体验和回退方案
```

这样既不重复制造注入框架，也不会为了嵌入 Spotify 而放弃 Folia 的高级原生能力。

## 评分

| 指标 | Spicetify | 自行注入 | 独立应用 |
| --- | ---: | ---: | ---: |
| Spotify 内嵌体验 | 9/10 | 9/10 | 3/10 |
| 初始开发成本 | 8/10 | 2/10 | 7/10 |
| Spotify 更新适配 | 6/10 | 2/10 | 9/10 |
| Folia 全功能保留 | 6/10 | 5/10 | 10/10 |
| 发布与维护成本 | 7/10 | 2/10 | 7/10 |
| 综合建议 | 首选 | 不建议 | Companion/稳定版 |
