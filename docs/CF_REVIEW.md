# Chemistry Framework 基线审查

审查仓库为 `yangzhexi381-dot/Chemistry-Framework`，默认分支 `main`，基线 `61575a45e2eac096f5b7ddcbf6c40ae2494b8ef1`。静态站点以 `index.html`、原生 JavaScript 和 CSS 运行，页面由静态 HTTP 服务提供。应用没有 npm 构建步骤或运行时依赖。GitHub Actions 执行 Node 测试与 Playwright 浏览器验收。

| 现有能力 | 源码与复用判断 |
| --- | --- |
| 知识图谱与课程数据 | `data/knowledge.json` 描述 67 个节点和 54 条关系，`data/curriculum/` 含课程索引和动力学单元。知识数据、图谱关系与领域解释由 CF 负责。 |
| 图谱与可视化 | `app.js` 管理图谱交互和深链接，`network-graph.js`、`unified-map.js`、`graph-views.js` 管理布局和视角。通用路由或图谱基础设施可以等出现第二个实际用户后提取。 |
| 科学模型 | `src/models/` 中的 H₂⁺、N₂O₄、铅酸电池、电化学和结构化学模型可在独立计算接口上测试。科学参数、方程和边界属于 CF。 |
| 直觉与文献 | `intuition-analysis.js` 查询当前图谱，`intuition-literature.js` 在用户触发后查询 Crossref。两者与保存接口可独立演进。 |
| 查询历史 | `intuition-workbench.js` 原先直接读写 localStorage。FE 接管通用 JSON 存储，CF 定义记录格式、重开历史时的分析及界面。 |

当前维护成本主要集中在脚本标签对加载顺序的依赖、部分界面控制器同时负责 DOM 与数据状态，以及跨标签页保存缺少冲突处理。接入补丁仅调整直觉工作台及其脚本缓存版本。基线和集成版各自的测试状态见 [验收记录](TEST_REPORT.md)。
