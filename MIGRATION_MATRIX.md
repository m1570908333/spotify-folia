# 功能迁移矩阵

| Folia 能力 | Spicetify 内实现 | Companion | 决策 |
| --- | --- | --- | --- |
| 当前曲目/封面/时长 | `Spicetify.Player.data` | 否 | 直接替换 |
| 播放/暂停/上一首/下一首/seek | `Spicetify.Player` | 否 | 直接替换 |
| 播放队列 | Spotify/Spicetify API | 否 | 用 Spotify 原生队列 |
| 全屏歌词舞台 | Custom App 页面 + Fullscreen API/布局 | 否 | 保留 |
| 歌词逐字时间轴 | provider adapter + Folia parser | 可选 | 保留 |
| 歌词偏移 | localStorage | 否 | 保留 |
| 主题与 AI 配色 | 浏览器端或远端 API | 可选 | 保留，凭据优先放 Companion |
| 主题同步 | 现有 Sync Server 或新 schema | 可选 | 后期迁移 |
| 所有 Visualizer | Web runtime | 部分模式可选 | 分批迁移 |
| 图片/头像/表情资源包 | IndexedDB | 本地目录可选 | 保留 |
| 节拍/段落特征 | `Spicetify.getAudioData()` | 否 | 直接使用，允许缺失 |
| 实时音频频谱 | 无可靠原始音频节点 | 系统环回 FFT | 降级或 Companion |
| 本地歌词导入 | 文件选择器能力有限 | 本地索引 | Companion 优先 |
| 本地音乐库 | Spotify local files 信息有限 | 文件系统扫描 | 不作为 MVP |
| 网易/QQ/酷狗播放 | 与 Spotify 播放职责冲突 | 不建议 | 删除 |
| Navidrome 播放 | 与 Spotify 宿主冲突 | 独立应用更合适 | 删除 |
| 视频导出 | 浏览器录制能力有限 | ffmpeg | Companion |
| OBS 浏览器源 | 本地 HTTP 输出 | Companion | 后期保留 |
| 壁纸模式 | Spotify 页面无法提供 | 原生 helper | 不迁移 |
| Discord Presence | Spotify 已有状态生态 | 否 | 删除 |
| Folium 浏览器模组 | 沙箱化 JS 插件 | 否 | 可设计新子集 |
| Folium Node 模组 | 不可直接运行 | Node host | Companion 专属 |
| 在线账号登录与搜索 | Spotify 原生 | 否 | 删除重复功能 |

## 依赖迁移

| 依赖 | 判断 |
| --- | --- |
| React | 使用 `Spicetify.React` 或固定兼容层，避免第二份 React |
| Framer Motion | 可打包，但需确认与 Spotify React 版本兼容 |
| PixiJS | 可打包，按模式懒加载 |
| Three/R3F | 可打包；R3F 对 React 版本敏感，建议先评估原生 Three host |
| Zustand | 可保留，体积较小 |
| Dexie/IndexedDB | 可保留 |
| Electron APIs | 全部抽象并移至 Companion 或删除 |
| Vite `import.meta.glob` | 构建期改成显式生成 registry，避免 Custom App loader 差异 |
