# 调研来源

访问日期：2026-10-15

## Spicetify

- Custom Apps 文档：https://spicetify.app/docs/development/custom-apps/
- API 文档：https://spicetify.app/docs/development/api-wrapper/
- CLI 仓库：https://github.com/spicetify/cli
- CLI 类型定义：https://github.com/spicetify/cli/blob/main/globals.d.ts
- Lyrics Plus：https://github.com/spicetify/cli/tree/main/CustomApps/lyrics-plus
- CLI 许可证（LGPL-2.1）：https://github.com/spicetify/cli/blob/main/LICENSE

## Folia

- 项目仓库：https://github.com/chthollyphile/folia-major
- Visualizer 代码地图：`src/components/visualizer/README.md`
- Visualizer registry：`src/components/visualizer/registry.tsx`
- Visualizer 共享契约：`src/components/visualizer/definition.ts`
- Folia 许可证（AGPL-3.0）：https://github.com/chthollyphile/folia-major/blob/main/LICENSE

## JIZURA

- 项目仓库：https://github.com/852wa/JIZURA
- 固定提交：`fc16bfe43ea4a6c25a21f1caf04d17326de14f00`
- 许可证：MIT，完整文本见 `prototype/folia-stage/JIZURA-LICENSE.txt`
- 本地来源清单和逐模块 SHA-256：`prototype/folia-stage/jizura-source.json`
- 打包包含原版音频分析、离线导出和嵌入的 MP4 muxer；第三方许可见 `prototype/folia-stage/JIZURA-THIRD-PARTY-NOTICES.md`
- 2026-10-21 本地迁移状态见 `JIZURA_STATUS.md`；此日期不代表重新检查了所有上游的最新版本。

## 说明

Spicetify 是非官方客户端定制工具。Spotify 客户端更新可能导致兼容性变化，项目不应宣称得到 Spotify 官方支持。
