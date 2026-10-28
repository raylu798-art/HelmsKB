<p align="center"><img src="helmskb/branding/assets/helmskb-logo.svg" alt="HelmsKB — Enterprise Knowledge Base" width="440" /></p>

# HelmsKB

HelmsKB 是面向企业私有化交付、基于 [Tencent/WeKnora](https://github.com/Tencent/WeKnora) 持续维护的平台。采用完整上游基线、薄品牌层和独立扩展层，不逐项移植功能。

候选发行号 **0.1.0-rc.1**，上游锁定 **dacb9c2643bdfe7b3f95e0d96e1584513b27f3a2**。上游版本、HelmsKB 版本、源码提交和实际部署分别记录；代码包含某能力不代表其依赖、模型效果或业务验收已完成。

| 范围 | 位置与规则 |
| --- | --- |
| 完整上游 | 原目录中的前后端、DocReader、迁移、SDK、原始技术文档；保留上游名称和实现 |
| 品牌层 | helmskb/branding/：配置、透明标志、黑蓝配色与显示文本适配 |
| 构建与交付 | helmskb/build/：锁定来源、差异边界、隔离暂存、文档构建与手动同步 |
| 自研扩展 | helmskb/extensions/：预留边界，本阶段不实现行业功能 |

```sh
npm ci --prefix helmskb/build --no-audit --no-fund
npm test --prefix helmskb/build
node helmskb/build/prepare.mjs
node helmskb/build/build-web.mjs
```

使用 Node.js 24。发行构建要求干净的已提交源码。品牌转换只写入被忽略的 .helmskb/stages/ 下的版本化目录，位置记录于 .helmskb/source-manifest.json；原始工作区保持不变，旧暂存目录不会被新构建删除。开发中可用 prepare.mjs --allow-dirty；该结果标记 dirty，不能作为验收发行产物。完整前端与本站 /docs/ 从同一份品牌化文档生成，后端也编译这份文档。

业务 API、Go 模块路径、迁移编号、数据库字段与资源 ID 保持兼容。第三方服务名称、代码示例和许可证保持原样。显示品牌不影响用户资料内容。

独立验证环境为 **P006/test，http://127.0.0.1:8096**，资源前缀 p006-helmskb-test。P006/local 和生产不随候选升级；P005/8095 属于原演示项目。实际运行状态以环境验收记录为准。

详见 [来源与同步](UPSTREAM.md)、[开发与交付](DEVELOPMENT.md)、[升级恢复手册](helmskb/build/RUNBOOK.md)、[验收门槛](helmskb/build/ACCEPTANCE.md)。上游工作流原样归档到 .github/upstream-workflows/；只启用 HelmsKB 验证和手动同步，不配置定时同步。

本项目是独立维护的衍生发行版。保留 [LICENSE](LICENSE)、[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)、licenses/ 及上游许可材料打包流程，不将上游实现标记为全部原创。
