# HelmsKB 开发说明

## 技术与目录

- `frontend/`：Vue 3、TypeScript、Vite、TDesign；依赖由 `package-lock.json` 固定。
- `cmd/`、`internal/`：Go 后端；版本与依赖以 `go.mod`、`go.sum` 为准。
- `docreader/`：文档解析服务；依赖以该目录中的项目文件和锁文件为准。
- `migrations/`：数据库迁移；升级前单独审查。
- `cli/`、`client/`、`packages/`：客户端与集成；进入子目录前读取适用的 `AGENTS.md`。
- `frontend/public/brand/`：透明 SVG 品牌资源。
- `.github/workflows/frontend-ci.yml`：只读的前端检查和构建。
- `.github/upstream-workflows/`：归档的上游工作流，不会自动执行。

## 前端验证

使用 Node.js 24：

```bash
cd frontend
npm ci --no-audit --no-fund
npm --prefix ../website-docs ci --no-audit --no-fund
npm run check-i18n
npm run check:docs-links
npm run build:with-docs
```

内存较紧时，构建前设置 `NODE_OPTIONS=--max-old-space-size=3072`。前端构建无需模型凭据，也不能证明检索问答可用。修改 Go、解析器或迁移时，需要补充对应模块测试和集成验证。

本地开发服务器需要自行指定本项目后端：设置 `VITE_DEV_PROXY_TARGET`，并通过 Vite 参数指定已分配的空闲前端端口。当前仓库没有已登记的运行端口或后端服务。

## 镜像

文档源码在 `website-docs/`，使用已有 VitePress 目录、锚点和本地搜索。`build:with-docs` 先构建文档到被 Git 忽略的 `frontend/public/docs/`，再构建应用；Vite 会将文档一并复制到 `frontend/dist/docs/`。`npm run build` 保留纯应用构建兼容性；HelmsKB 交付使用联合构建。首次运行开发服务器前，也可执行 `npm --prefix ../website-docs run build:embedded` 生成本地文档。

`frontend/Dockerfile.helmskb` 将已联合构建的 `frontend/dist/` 打包到固定的上游 UI 运行基底，并携带许可材料和支持文档 clean URL 的 Nginx 配置。镜像打包会检查文档入口存在。在仓库根目录可构建开发镜像：

```bash
docker build --pull=false -f frontend/Dockerfile.helmskb -t p006-helmskb-local-ui:0.8.3-brand.6 .
```

此命令只构建前端，不是完整平台部署。发布时使用独立注册表和不可变摘要，并记录源码提交和构建依据。

## 助手后端构建

单项助手移植的运行版本为 `0.8.3-helmskb-assistant.1`。需要 Go 1.26、Rust 1.90 或兼容版本、C/C++ 编译器及与 Debian Bookworm 兼容的构建环境。依赖由 `go.sum` 和 AnyDoc 的 `Cargo.lock` 校验，保留校验服务。Linux amd64 构建示例：

```bash
export GOMAXPROCS=2 GOFLAGS=-p=2 CARGO_BUILD_JOBS=2
bash scripts/build-helmskb-server.sh
docker build --pull=false -f docker/Dockerfile.helmskb-runtime \
  --build-arg SOURCE_COMMIT="$(git rev-parse HEAD)" \
  --build-arg SERVER_SHA256="$(sha256sum build/helmskb/WeKnora | cut -d' ' -f1)" \
  -t p006-helmskb-local-app:0.8.3-assistant.1 .
```

打包基于固定的官方 v0.8.3 运行镜像，保留原有原生依赖、BrowserSkill 与第三方对应源码，只替换完整编译的服务、助手配置及已审阅迁移。生成的 `build/` 不提交；发布必须记录源码提交、二进制 SHA-256、镜像摘要和迁移结果。该命令不自动部署。助手测试与迁移说明见 [移植记录](docs/engineering/assistant-backport.md)。

## 环境隔离

当前多项目工作区登记编号为 **P006**，仅登记 `local`，状态为 `not_deployed`，没有分配运行端口。`test` 与 `production` 尚未接入。

- 本地资源使用 `p006-helmskb-local` 前缀；测试、生产分别规划。
- 不复制其他项目的数据库、卷、服务名、模型 API Key、JWT/AES 密钥或实际 `.env`。
- 仓库中的 Compose、Helm 和示例环境文件来自上游基线。工作区内正式启动前，必须先准备 P006 专用配置、容器名、端口、数据库账号和数据目录，不能直接套用上游默认值。
- 秘密配置放在本项目独立的私有配置位置；仓库只保留模板和凭据位置说明。
- 日志、上传资料、数据库、备份、`node_modules` 和构建产物不提交。

## 研发与发布

从功能分支修改，记录可复现的验证结果。前端 CI 当前不构建后端、不部署、不生成 Release、不发布镜像或包。

上线前至少验证：真实资料解析与完整性、模型连接、检索及引用正确性、拒答、权限与撤权、数据源更新/删除、费用和延迟、备份恢复、升级迁移。代码回退与数据恢复分开设计。没有运行核验时，健康状态保持未知。

上游同步规则见 [UPSTREAM.md](UPSTREAM.md)。
