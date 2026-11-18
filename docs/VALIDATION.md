# v0.1.0 验收

| 命令 | 本地结果 |
| --- | --- |
| `npm ci` | 通过，运行时依赖为零 |
| `npm run check` | 通过，检查 JS 语法 |
| `npm test` | 18/18 通过，覆盖引擎、存储、适配器、示例和静态服务器入口 |
| `npm run test:cf -- ../cf-review` | 通过，真实控制器的 3 项集成场景通过，CF 76/76 项既有测试通过 |
| `npm start` | 通过，Node 确认已启动本地服务器 |
| Chromium | CF 集成和既有浏览器回归通过。旧查询按原 ID 更新，刷新后恢复。GitHub Actions 的 Browser 作业同时覆盖 FE 演示和 390/768/1280 px 视口 |

CF 已审查提交为 `61575a45e2eac096f5b7ddcbf6c40ae2494b8ef1`。本地私有工作分支 `feat/framework-engine-inquiries` 的补丁随 FE 交付。CF 现有公开部署继续由其仓库维护。移动端验收使用浏览器视口，不含真机测试。

在 FE 工作树中运行 `TMPDIR="$PWD" CF_BROWSER=1 npm run test:cf -- ../Chemistry-Framework` 也通过。该路径同时覆盖 Git 补丁应用及 CF 原有 CommonJS 测试与 FE ES 模块的隔离。
