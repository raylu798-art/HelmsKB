# HelmsKB 开发与交付

先阅读 AGENTS.md 并核对编号、Git remote 和环境。业务源码与原始文档跟随完整上游；集中品牌配置为 helmskb/branding/brand.json。

1. 固定干净的源码提交，安装 helmskb/build/package-lock.json 的依赖并运行测试。
2. node helmskb/build/prepare.mjs 生成独立的 .helmskb/stages/ 版本化目录和来源清单，未知桥接形态直接失败；使用 run-staged.mjs 在清单对应的目录执行命令。
3. node helmskb/build/build-web.mjs 按锁文件串行验证与构建文档、前端。文档复制到暂存前端 /docs/；用 helmskb/build/Dockerfile.frontend 打包。
4. 同一暂存树构建 Go、AnyDoc、BrowserSkill、DocReader 及迁移；保留上游运行依赖和许可材料。可复用缓存，不能复用旧应用实现。
5. 记录来源、镜像摘要、迁移版本和验收；按同一镜像摘要晋级。

Go 版本遵循 go.mod；Python 遵循 docreader/uv.lock；AnyDoc 遵循 Cargo.lock 并保留 anydoc 构建标签。重型构建串行，Go/Cargo 并发 2，Node heap 3072 MiB，适配约 8 GiB Docker 内存。网络镜像通过交付参数配置，不关闭证书或依赖校验。

source-manifest.json 记录上游/源码 SHA、品牌配置哈希、迁移及桥接前后哈希。镜像摘要与环境证据另行记录；不得写入凭据。

node helmskb/build/boundary.mjs 检查原始树差异；允许范围由 ownership.json 控制，暂存转换有独立清单。业务 API、数据库表名、Go 模块路径、资源 ID 和迁移编号不变。

测试覆盖文案与兼容标识、文档锚点和代码块、YAML 结构、未知桥接失败、双父连接后的整版本合并。保留上游测试；构建成功不能代替实际模型上下文、工具调用和引用验收。

扩展优先使用 API、MCP、连接器和适配器。必要核心桥接单独登记位置、原因、测试和移除条件。本阶段不开发行业能力。

P006/test 绑定 127.0.0.1:8096，使用独立网络、卷、数据库用户、Redis 和密钥。实际配置与备份在项目私有运行目录；不得复制 P005 凭据或资料，不修改全局 Ollama 默认上下文。模型配置需记录实际加载参数。

完整启动、升级和恢复见 [运行手册](helmskb/build/RUNBOOK.md)。

## 当前候选的运行层装配

候选核心产物来源为 5f9912f01a912a2f6c5e5e387879f80a5c8b1f7e；后续构建工具和验证记录可以继续提交，不能把新的源码 HEAD 冒充已部署来源。镜像额外记录 packaging revision。

Dockerfile.app-shared-runtime 可复用本次从锁定上游源码完整构建的 DocReader OS/依赖层，补齐 Node24、数据库客户端、gosu、FFmpeg 和 qpdf。构建前必须核对 DOCREADER_IMAGE 的上游 SHA 与 upstream.lock.json 一致。该方式共用当前版本的底层依赖层，避免重复下载；不允许输入旧版应用镜像。Dockerfile.app-runtime 保留独立 Debian 运行层的构建方式。

原始 DocReader 先按 docker/Dockerfile.docreader 和 docreader/uv.lock 构建，再使用 Dockerfile.docreader-metadata 添加发行来源清单。前端、Go、迁移和两种运行层均按同一上游 SHA 校验。

本机完整 service 单元套件因大量 SQLite 临时库触发默认 10 分钟总超时；同源 GitHub CI 已通过。Python venv 环境缺失已补齐并复测失败用例，不得把本机超时记为通过。后续在构建容器中可把测试临时目录置于可执行 tmpfs，并令 GOTMPDIR 使用独立磁盘目录，避免编译中间文件占满 tmpfs。
