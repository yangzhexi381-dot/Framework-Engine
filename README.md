# Framework Engine v0.1.0

Framework Engine（FE）是跨领域应用的轻量运行时。注册模块、管理依赖和状态、交换事件、保存 JSON 数据由 FE 提供。知识、科学模型和叙事规则由各领域应用维护。

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

| 路径 | 职责 |
| --- | --- |
| `src/core/` | 应用适配入口和事件总线 |
| `src/modules/` | 模块注册、依赖加载和卸载 |
| `src/data/` | JSON 文档、状态更新和持久化 |
| `src/adapters/` | 领域应用与 CF 查询记录适配器 |
| `src/models/` 和 `src/ui/` | 演示计算和通用界面辅助 |
| `examples/` | 实际调用 FE 的两个浏览器示例 |
| `integrations/chemistry/` | CF 补丁、私有测试树构建和集成测试 |

详见 [架构与约定](docs/ARCHITECTURE.md)、[CF 代码审查](docs/CF_REVIEW.md)、[验收记录](docs/VALIDATION.md)、[CF 接入复现](integrations/chemistry/README.md)和 [版本记录](CHANGELOG.md)。

本仓库为私有开发仓库，许可证和公开发布由维护者后续确认。
