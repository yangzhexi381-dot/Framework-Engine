# Framework Engine 在线部署

[公开试玩入口](https://yangzhexi381-dot.github.io/framework-engine-demo/) 转到 [Framework Engine GitHub Pages](https://yangzhexi381-dot.github.io/Framework-Engine/)，两处地址访问同一个发布版本。主仓库维护试玩首页、内容和发布流程。演示仓库维护已有网址的跳转。

## 发布与本地检查

1. 用 Node.js 22 或更新版本运行 `npm ci`、`npm run check`、`npm test` 和 `npm run build:static`。
2. 在项目目录运行 `python3 -m http.server 8000 --directory dist` 并访问 <http://127.0.0.1:8000/>。试玩首页按需打开各应用，FE 示例仍位于 `examples/`。
3. 合并至 `main` 后，GitHub Actions 运行 Node、CF 集成和浏览器验收。全部通过后将 `dist/` 上传并发布到 GitHub Pages。检查失败时继续提供最近一次成功部署的版本。

## 验收与存档

浏览器测试使用 Android 手机仿真、触控平板视口和桌面视口。新增试玩覆盖《无条件内鬼》的新游戏和刷新恢复，以及结构化学实验室的量子数、能量与节点联动。原有 Daniell 电池和「灯塔值守」仍验证状态、刷新、选择和 JSON 导入导出。

两个 GitHub Pages 地址共享浏览器存储来源。以前用同一浏览器打开试玩链接保存的进度仍可访问。开发地址和其他设备有各自的存储空间，支持 JSON 的示例可手动导入存档以转移进度。
