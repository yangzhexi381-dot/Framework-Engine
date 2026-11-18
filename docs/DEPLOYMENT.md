# Framework Engine 在线部署

[Framework Engine 在线入口](https://framework-engine-yzx.curvedfrond8.chatgpt.site/) 使用 ChatGPT Sites 的所有者访问权限，应使用站点所有者的 ChatGPT 账号登录。部署源自 GitHub 私有仓库 `main` 中现有的 FE 演示、核心和适配器。站点使用静态资源托管，状态更新、Daniell 电池计算及互动场景由浏览器运行。Node.js 22 或更新版本用于构建和开发测试。

## 更新版本

1. 确认 GitHub 上 `main` 对应的 Node 和浏览器测试通过。
2. 核对选定提交和 `.openai/hosting.json` 的站点 ID。运行 `npm run build:static`，确认 `dist/index.html`、`dist/examples/` 和 `dist/src/` 均存在。
3. 使用已绑定的同一 Sites 站点提交该源码版本和对应构建目录，并部署为所有者可访问的版本。验证线上流程后记录 GitHub 提交与部署结果。保留上一已成功部署的版本作为回退点。

GitHub Actions 在 `main` 上自动打包通过验收的提交。仓库当前没有长效的 Sites 发布凭据，部署在线版本使用站点所有者授权的发布操作。若构建或验收失败，现有在线版本继续使用最近一次成功部署的版本。

## 验收与存档

浏览器测试在 Android 手机仿真、触控平板视口和桌面视口运行完整流程。Daniell 电池测试包含非法输入、结果变化和刷新恢复。「灯塔值守」测试包含选择、结局、JSON 导出、重置、导入和刷新恢复。

浏览器存档按站点来源隔离。在线地址、开发地址和另一台设备各有自己的存储空间，导出的 JSON 可以手动转移。托管目录由演示和 FE 浏览器模块组成。未发布作者的真实互动作品、项目测试文件、环境文件或访问凭据。
