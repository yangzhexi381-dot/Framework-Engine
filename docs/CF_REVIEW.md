# Chemistry Framework 工程审查

审查对象为 [CF main 的 61575a4](https://github.com/yangzhexi381-dot/Chemistry-Framework/commit/61575a45e2eac096f5b7ddcbf6c40ae2494b8ef1)。这是经典脚本和 JSON 构成的静态网站。没有 `package.json` 或应用打包步骤。开发使用静态 HTTP 服务，仓库有 Node 测试和独立的 Playwright 浏览器工作流。

| 实际能力 | 位置 | FE 复用决策 |
| --- | --- | --- |
| 知识数据与图谱视图 | `data/knowledge.json`、`src/graph-views.js`、`src/unified-map.js`、`src/network-graph.js` | 保留在 CF。后续可评估抽取与领域无关的交互和布局逻辑 |
| 科学模型与图形工作台 | `src/models/`、`src/workbench.js`、`src/physical-workbench.js`、`src/structure-studio.js` | 保持现有模型及科学边界。通用计算模块可使用独立适配接口接入 |
| 理论单元与导航 | `data/curriculum/`、`src/curriculum.js` | 保留 CF 的课程模式、深链接与学科数据 |
| 直觉分析与文献查询 | `src/intuition-analysis.js`、`src/intuition-literature.js`、`src/intuition-workbench.js` | 保留图谱推断、Crossref 和界面。迁接查询记录的 JSON 读写 |
| 测试 | `tests/*.test.cjs`、`tests/curriculum-browser.cjs` | 私有集成树重跑既有测试并增加兼容性检查 |

`src/app.js` 的启动流程集中处理数据加载、图谱渲染和页面初始化。查询记录原先由工作台直接调用 `localStorage`。这项接入通过注入记录存储隔离该依赖，只修改 CF 的启动入口和查询控制器。浏览器存储仍按源隔离，若将 CF 从现有站点移动到私有站点，浏览器会使用新站点自己的空间。旧存档兼容性适用于集成前后同一源已有的记录。
