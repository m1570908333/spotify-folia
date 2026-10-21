# 上游更新检查

在 Folia Stage 设置的“上游更新”中点击“检查上游更新”。也可启用“每天检查并提醒”：
默认关闭，仅舞台打开且页面可见时检查，成功结果缓存 24 小时，失败结果 5 分钟后可重试；
舞台持续打开时每小时判断一次是否到期。同一组上游版本只提醒一次。

- Folia：对比 v0.7.19 对应提交 `607771d593e5b50e39defcb964928672b48310cb`
  与默认分支最新提交，并检查最新正式发布。
- JIZURA：从内置引擎的来源元数据读取提交和版本，比较默认分支最新提交。
  JIZURA 无须创建 GitHub Release，只提交源码也能被检测。
- 每轮最多三个 GitHub 公共 API 请求，无令牌、无 Spotify 凭据；单请求超时 12 秒，
  并发点击合并，限流、断网、无效响应分别显示失败，不会误报“已是最新”。
- 这不是自动升级器。不会拉取远程脚本或覆盖适配代码，也不检查用户未来 GitHub 仓库的发布。

在终端中手动检查（任何当前目录均可，用完整路径）：

```powershell
node D:\项目\spotify-cli-folia\tools\check-upstream-updates.cjs
```

## 2026-10-20 核对记录

GitHub 官方接口：

- `https://api.github.com/repos/chthollyphile/folia-major/releases/latest`
  返回 `v0.7.21`，发布时间 `2026-10-18T07:05:19Z`。
- `https://api.github.com/repos/chthollyphile/folia-major/commits?per_page=1`
  返回 `f33f9eae108a70155a94b25fd95f2d39ab1cd968`，日期 `2026-10-20T08:12:07Z`。
- `https://api.github.com/repos/852wa/JIZURA/commits?per_page=1`
  返回 `fc16bfe43ea4a6c25a21f1caf04d17326de14f00`，日期 `2026-10-01T07:46:25Z`。

网页宿主和终端工具均已实测返回上述结果。本记录是时间快照，以再次检查的结果为准。

## 后续迁移流程

1. 比较固定提交到新提交的源码差异，先审查舞台、设置及播放输入契约的变动。
2. 更新 vendor 固定快照和许可证记录，重新生成 bundle；不要改已生成文件代替更新源。
3. 检查适配层的依赖，并运行语法、冒烟、浏览器视觉/暂停/跳转/画幅回归。
4. 安装后在 Spotify 实测，再更新迁移基线。仅检查到新版本时绝不能提前修改基线。
