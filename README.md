# Framework Engine v0.2.0

Framework Engine（FE）是跨领域应用的轻量运行时。注册模块、管理依赖和状态、交换事件、保存 JSON 数据由 FE 提供。知识、科学模型和叙事规则由各领域应用维护。

## 在线使用

[打开 Framework Engine](https://framework-engine-yzx.curvedfrond8.chatgpt.site/) 可体验 Daniell 电池与「灯塔值守」。站点仅供项目所有者登录访问。在线版由浏览器直接运行，可使用手机、平板和电脑。

状态保存在当前浏览器的 `localStorage`。使用同一浏览器、同一站点地址刷新会恢复示例状态。首次打开 HTTPS 在线版会使用独立于本地开发地址的存档空间。换设备或浏览器时，先导出 JSON，再在另一端打开同一示例并导入。应用没有跨设备自动同步。

## 运行

需要 Node.js 22 或更新版本，无运行时第三方依赖。

```sh
npm ci
npm start
```

打开 <http://127.0.0.1:8000/>。可以调整 Daniell 电池参数，或切换到「灯塔值守」推进剧情。两项示例共享 FE 的状态管理和事件总线，各自的进度可以在这个浏览器恢复，也可以导出和导入 JSON。使用相同的地址和端口才能访问同一浏览器存档。

## 开发与测试

```sh
npm run check
npm test
git clone --no-checkout https://github.com/yangzhexi381-dot/Chemistry-Framework.git ../Chemistry-Framework
npm run test:cf -- ../Chemistry-Framework
```

前两项检查引擎、适配器和演示入口。最后一项从已审查的 CF 提交重建独立树，测试真实查询控制器和 CF 现有回归。CI 另用 Chromium 运行演示与 CF 浏览器交互。

`npm run build:static` 将现有应用及其浏览器模块打包至 `dist/`。GitHub Actions 在 `main` 上通过测试和浏览器验收后自动生成对应提交的静态制品。更新在线站点的步骤见[部署说明](docs/DEPLOYMENT.md)。

| 路径 | 职责 |
| --- | --- |
| `src/core/` | 应用适配入口和事件总线 |
| `src/modules/` | 模块注册、依赖加载和卸载 |
| `src/data/` | JSON 文档、状态更新和持久化 |
| `src/adapters/` | 领域应用与 CF 查询记录适配器 |
| `src/models/` 和 `src/ui/` | 演示计算和通用界面辅助 |
| `examples/` | 实际调用 FE 的两个浏览器示例 |
| `integrations/chemistry/` | CF 补丁、私有测试树构建和集成测试 |
| `integrations/story/` | 将现有 Story Framework 试点接入 FE，并生成单文件离线版本 |

详见 [架构与约定](docs/ARCHITECTURE.md)、[CF 代码审查](docs/CF_REVIEW.md)、[验收记录](docs/VALIDATION.md)、[CF 接入复现](integrations/chemistry/README.md)和 [版本记录](CHANGELOG.md)。

本仓库为私有开发仓库，许可证和公开发布由维护者后续确认。

## Story Framework 离线接入

从 Story Framework 原包取出 v2.1 互动小说 HTML，在 FE 根目录运行：

```sh
npm run integrate:story -- ./source.html ./story-fe.html
```

使用浏览器直接打开生成的 `story-fe.html`。输出须是新文件。故事原有的存档键、分支和设计理念揭示条件沿用。真实作品由作者另行保管，GitHub 仓库中的测试使用合成数据。[接入与测试说明](integrations/story/README.md)
