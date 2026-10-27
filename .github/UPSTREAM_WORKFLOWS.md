# 上游工作流归档

`.github/upstream-workflows/` 保留 WeKnora v0.8.3 自带的工作流源码。该目录不属于 GitHub Actions 活动工作流目录，不会触发发布。

上游包含 Docker 镜像、PyPI、npm 和 Release 发布任务，部分任务由 main、标签或定时触发。没有将这些任务原样用于 HelmsKB。启用前需要审阅仓库地址、镜像和包名、权限、签名、OIDC 信任、秘密配置及发布版本。

当前 `.github/workflows/frontend-ci.yml` 仅检查和构建前端，权限为 `contents: read`，不发布或部署。
