# P006/test 运行、升级与恢复

环境：本机 Docker Desktop；前缀 p006-helmskb-test；入口 127.0.0.1:8096。私有目录 D:\WorkSpace\_project_runtime\P006\test。P005/8095、P006/local 和 production 不切换。

操作前运行中央 Get-ProjectContext.ps1 -Id P006 -Environment test，核对路径、remote、提交、私有配置及端口。先审阅全部迁移和依赖，更新中央运行记录。

在私有目录使用经审阅的 compose.yaml 和独立 .env：

```sh
docker compose -p p006-helmskb-test --env-file .env -f compose.yaml up -d
docker compose -p p006-helmskb-test --env-file .env -f compose.yaml ps
docker compose -p p006-helmskb-test --env-file .env -f compose.yaml stop
```

只暴露前端回环端口，其他服务仅内部网络。启动前锁定镜像 ID，启动后检查实际 image ID、健康、迁移及 /helmskb-build.json。不输出完整环境变量或凭据；源码与部署分别核验。

升级前在独立验证库将 118 和 120 合成资料升级到 134，记录备份、数据计数和恢复。实际 test 升级前另做数据库与上传卷的一致备份。记录旧镜像 ID 和配置，停止写入、迁移、启动、验收。dirty 迁移不得未经调查清除或强制标记成功。

镜像回退：使用记录的上一 image ID 重建 app/frontend，保留卷；仅在数据库仍兼容时采用，并核对实际镜像和健康。

覆盖候选镜像标签前，先执行 `node helmskb/build/retain-images.mjs p006-helmskb-test`，将输出保存在私有运行目录。脚本为当前实际 app/frontend/docreader 镜像建立独立保留标签并核对 ID。只有记录摘要而未保留镜像，不能保证本地 containerd 仍能找到旧清单。发行产物使用不可变标签或仓库摘要；保留标签与备份随验收记录一起管理。

数据库恢复：先停止写入，在独立命名恢复库执行 pg_restore，检查迁移、合成资料和行数；必要时恢复匹配上传卷及配置，再切换镜像。不能以切旧代码代替数据库恢复。

备份、模型设置和测试账号仅保存在私有目录。验收写明环境、时间、来源和实测结果。任务演练后禁用。本阶段不配置自动同步、自动备份或后台巡检。
