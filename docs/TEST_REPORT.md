# v0.1 验收记录

审查基线为 CF `61575a45e2eac096f5b7ddcbf6c40ae2494b8ef1`，集成开发分支为 `feat/framework-engine-inquiries`。GitHub Actions 在 PR 上运行 FE、CF 与 Chromium 的回归检查。

| 检查 | 本地结果 |
| --- | --- |
| `npm ci --ignore-scripts`、`npm test`、`node --check` | 安装及语法检查通过。13 项测试通过，覆盖模块依赖、生命周期失败恢复、状态、事件、数据、适配器与演示逻辑。 |
| CF 基线与集成预览 `node --test tests/*.test.cjs` | 各 76 项通过。 |
| CF 预览准备 | 固定基线生成成功，实际补丁已应用，可在 FE 工作树内外准备预览。 |
| `node tests/story-browser.cjs` | Chromium 通过。覆盖推进、刷新恢复、重置和三种视口。 |
| `node tests/chemistry-browser.cjs` | Chromium 通过。覆盖实际 FE 模块加载、旧记录重开、原 ID 更新、刷新恢复和写入失败。 |
| CF `tests/curriculum-browser.cjs` | 基线与集成预览均在 Chromium 通过，覆盖图谱、触控事件、课程深链接、查询及科学工作台。 |
| CF `tests/browser-harness.html` | 集成预览在 390、768、1280 px 通过，覆盖 N₂O₄ 计算、无效输入和重置、H₂⁺ 态选择及标签导航。 |

GitHub Actions 的浏览器验收使用 Chromium。真机浏览器、跨设备同步和实际 Crossref 服务可用性属于后续验证范围。下一版可优先让第二个真实领域模块验证适配接口，并确定 FE 源码发布授权、许可证和 CF 的生产部署方式。
