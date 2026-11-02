# README 素材维护清单

这份维护说明使用中文；面向用户的 README 使用英文。
所有截图直接放在 `docs/media/`，不需要另建 `stages/` 文件夹。

## 已采用的素材

| 文件名 | README 用途 |
| --- | --- |
| `overview.png` | 首页整体界面主图 |
| `interface-toolbar.png` | 工具栏与舞台界面，折叠展示 |
| `settings.png` | 设置、字体及背景控制，折叠展示 |
| `segmentation.png` | 歌词分词编辑，折叠展示 |
| `jizura.png` | JIZURA 舞台画廊 |
| `flow.png`、`poster.png`、`cappella.png` | 舞台双列画廊 |
| `claddagh.png`、`monet.png`、`pendolo.png` | 舞台双列画廊 |
| `diorama.png`、`sonnet.png`、`tempera.png` | 舞台双列画廊 |
| `lumiere.png` | 舞台画廊中的折叠大图 |

README 使用 GitHub 视频附件，在页面内直接播放，不再跳转 YouTube。
附件地址：https://github.com/user-attachments/assets/a12d7b34-3b33-405d-839d-d0b2ae0c6e59

视频保存在仓库第 1 条 Issue 的附件中，该 Issue 仅用于文档素材，已关闭，
请勿删除附件。展示版为 H.264/AAC、720p，约 8.1 MB，完整时长约 2 分 5 秒。
原始 `Demo.mp4` 为 8K、约 406 MB，保留在本机，并由 `.gitignore` 排除；
原件和压缩版均不提交进 Git 历史。
本次只有 English Stage 没有专用画廊截图，不影响安装和功能；README
保留模式介绍，不显示缺失图片或占位提示。

## 可选补充

以下不是发布前置条件，后续有素材时再补充即可：

| 建议文件名 | 内容 |
| --- | --- |
| `english.png` | English Stage 的代表性英文歌词构图 |
| `backgrounds.png` | 多种背景效果对比 |
| `jizura-editor.png` | JIZURA 逐行或逐镜头编辑工具 |

## 更新图片

1. 替换同名 PNG，即可沿用 README 的现有链接。
2. 新增素材后再添加引用，不建立空白占位图片。
3. 截图尽量保持一致宽高比，并避免截到加载、错误或动画不可读的瞬间。
4. 公开前检查私人信息、通知、账号名称，以及音乐和歌词的展示授权。
5. Spotify 外层界面的语言由用户设置决定，不需要修改截图来冒充英文宿主。

## 发布与本地文件

- 本地备份放在 `backups/`，不会提交到 GitHub。
- 可选源码快照放在 `github/`，不会提交到 GitHub。
- 正式版本使用 Git 标签和 GitHub Releases，不在源码里复制多套版本目录。
- README 素材随源码提交；安装包只包含 Custom App，不包含这些截图。
- 删除当前源码中的旧截图不会删除 Git 历史中已有的文件；本次不重写历史。
