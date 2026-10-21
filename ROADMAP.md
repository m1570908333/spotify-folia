# 路线图

## Phase 0：宿主验证

- [x] 建立 Custom App 原型
- [x] 读取曲目、封面、播放状态、进度
- [x] 加入 `getAudioData()` 可用性探测
- [x] 在真实 Spicetify 环境安装验证
- [ ] 验证页面切换与卸载清理
- [ ] 测量空舞台 CPU/内存

退出条件：连续换歌 30 次无事件重复、无明显内存增长，进度漂移小于 250ms。

## Phase 1：歌词 MVP

- [x] 定义宿主无关 `LyricData` schema
- [x] 接入 Spotify、LRCLIB 与网易歌词
- [x] 本地歌词导入、缓存与歌曲覆盖
- [x] 单曲偏移调节
- [x] 实现 Classic、Flow 和 Poster 舞台
- [x] 基础主题与全屏模式

退出条件：中英日韩样本各 20 首，行级歌词成功率可观测，逐字歌词有明确降级。

## Phase 2：视觉核心

- [x] 建立轻量模式 registry 与共享时间轴输入
- [x] 实现第一批 DOM/Canvas 模式（Still、Cadenza、Cappella、Partita、Fume）
- [x] 设置导入导出
- [x] 基础运行状态与内存数据显示
- [x] 页面隐藏暂停时钟与 Canvas 渲染

## Phase 3：高级视觉

- [x] Pixi runtime host（本地运行时、页面隐藏暂停、卸载释放）
- [x] Sonnet/Tempera/Lumiere 第一版 Spicetify 适配
- [ ] Diorama/Three 性能评估
- [ ] 资源包与 IndexedDB
- [ ] 音频特征降级策略

## Phase 4：Companion

- [x] 本地歌词导入与覆盖（浏览器文件选择；Companion 目录监听待实现）
- [ ] 系统音频 FFT
- [ ] AI 凭据与跨域代理
- [ ] OBS 输出
- [ ] 视频导出

## 首个发布建议

`0.1.0` 只承诺：Spotify 当前曲目、多来源歌词、Classic/Flow/Poster、主题、偏移、本地导入和全屏。不要在首版承诺“全部 Folia 功能”。
