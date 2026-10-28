# 上游来源与导入记录

## 基线

- 上游仓库：`https://github.com/Tencent/WeKnora.git`
- 发布标签：`v0.8.3`
- 原始提交：`3e22822c1d2397be730c458c7539d0eb8c113a24`
- 原始树：`c08fc19e07c6da4fe6d4120418ef5b776a20ad48`
- 文件数：4,950，含 43 个可执行文件；没有 submodule 或 Git LFS 文件。
- 源码归档 SHA-256：`67a6f198b55599f4c42b81007a07bc3ae40ae8c2a8dd6f4727c2f9fabda4a0c5`
- 本仓库基线导入提交：`5e0c70efea836c2e8f229b4989823b639abc6156`
- 原有仓库初始化提交：`cbc8e22cd4eae7028516c64a5fca26ea444bafb2`，作为父提交保留。

导入使用完整源码快照，逐个比较 Git blob，并验证生成的 Git tree 与上游树一致。上游全部 Git 提交历史没有复制到本仓库；因此这里的导入提交不是上游原始提交，不能按共同历史直接合并上游分支。

## HelmsKB 变更

- 迁入已在相同上游基线上完成的 HelmsKB 品牌修改：登录/注册、导航、六语言文案、图标、HTML 元数据和示例文本。
- 保留 API、存储键、第三方模型供应商、上游 CLI/Skill 等实际兼容标识。
- 前端品牌 Dockerfile 使用本项目的构建身份和源码地址，官方基础镜像仍按摘要固定。
- 新增本项目 README、开发与来源说明、独立工作规则、前端 CI。
- 将上游发布工作流移出活动目录；源文件仍保留在 `.github/upstream-workflows/`，待逐项改好发布身份、注册表目标和秘密配置后再评估启用。

完整差异可使用基线导入提交比较：

```bash
git diff 5e0c70efea836c2e8f229b4989823b639abc6156..HEAD
```

品牌修改来源于先前的演示开发。该演示的运行镜像、端口、数据、账号、模型凭据、备份和验收状态没有迁入成本项目的部署事实。

## 远端与升级

`origin` 指向 `https://github.com/raylu798-art/HelmsKB.git`；`upstream` 指向 Tencent/WeKnora。新的克隆可手动添加：

```bash
git remote add upstream https://github.com/Tencent/WeKnora.git
```

上游升级应指定标签或提交，在单独分支比较源码和迁移差异，逐项迁入并运行回归。由于采用快照导入，不应对上游主分支直接执行无审阅的 `pull` 或合并；每次升级应更新本文件的基线、来源及验证记录。

## 助手单项移植

在 v0.8.3 基线上按依赖顺序迁入至 `450b6ed1b781c36983c53d9d564ffe65a863b3e8` 的独立助手功能，包含必要的持久化操作确认及数据库迁移。未整体合并上游 main；提交清单、适配与验证方法见 [助手移植记录](docs/engineering/assistant-backport.md)。

## 版权与第三方

保留 `LICENSE`、`THIRD_PARTY_NOTICES.md`、`licenses/` 和适用的文件内声明。WeKnora 的 MIT 条款不替代 MPL-2.0、Apache-2.0 等第三方组件的要求；现有对应源码打包脚本继续保留。品牌名称和定制不改变代码的历史来源。
