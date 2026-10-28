# 上游来源与持续同步

上游：https://github.com/Tencent/WeKnora 。发行来源由 helmskb/build/upstream.lock.json 锁定，首个候选为 dacb9c2643bdfe7b3f95e0d96e1584513b27f3a2。完整提交、标签和历史均保留，不把上游 main 的候选提交称为稳定标签。

旧 main d9fdd61cc977f99e0a26a7ddb364d92550a6d3c4 永久归档为 legacy/helmskb-v0.8.3-assistant.1。最初快照 5e0c70efea836c2e8f229b4989823b639abc6156 的源码树 c08fc19e07c6da4fe6d4120418ef5b776a20ad48 与上游 v0.8.3 的 3e22822c1d2397be730c458c7539d0eb8c113a24 完全一致。

新品牌候选从完整上游提交建立；一次双父合并连接旧 main 和候选分支，合并结果的源码树必须与候选一致。旧历史保留，后续采用普通整版本合并，不强推、不改写、不 squash。旧助手摘补由完整上游实现接管。

upstream/main 是原项目远端跟踪引用；sync/weknora-<SHA> 是候选；main 只接收验收后的发行源码。

```sh
git remote add upstream https://github.com/Tencent/WeKnora.git # 已存在时不用重复添加
node helmskb/build/sync-upstream.mjs <已审阅的40位上游SHA>
```

脚本要求干净 checkout，验证目标属于已获取的上游 main，然后创建候选、全量合并、归档上游工作流、更新锁定和迁移版本、检查差异边界、提交并生成暂存源码。可加 --push 推送候选。任何业务冲突或无法识别的品牌桥接都会失败并留在候选中，不能自动晋级 main。

每次审阅新增目录、依赖、配置、API、迁移、许可和功能开关；执行完整构建、迁移/恢复与真实链路验证。未知桥接须补充明确规则，不能以全局替换绕过。同步 PR 必须保留 merge 历史。

上游工作流归档保持字节级原样；手动工作流只创建候选分支，不自动合并或部署。工作流产生的候选仍需触发验证与环境验收。
