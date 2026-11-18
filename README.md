# Framework Engine

Framework Engine v0.1 是面向静态网页的独立应用运行时。它为不同领域共用的模块生命周期、状态、事件和本地数据提供接口。应用通过适配器接入，领域代码拥有自己的知识数据、科学模型与页面。

## 运行演示

需要 Node.js 22 或更新版本。演示使用浏览器原生 JavaScript 模块，运行时没有第三方依赖。

```sh
npm start
```

打开 [http://127.0.0.1:8080/](http://127.0.0.1:8080/)。点击「查看下一处」推进原创示例故事，刷新页面验证进度恢复。可用 `PORT=8081 npm start` 更换端口。

## 运行测试

```sh
npm ci --ignore-scripts
npm test
```

浏览器测试另需 Chromium。安装测试浏览器后，在演示运行期间执行 `node tests/story-browser.cjs`。

```sh
npx --no-install playwright install --only-shell chromium
```

## Chemistry Framework 接入

在 FE 仓库旁克隆 [Chemistry Framework](https://github.com/yangzhexi381-dot/Chemistry-Framework)，并保留审查基线 `61575a45e2eac096f5b7ddcbf6c40ae2494b8ef1` 的 Git 对象。在 FE 根目录执行下列命令。准备脚本还需要 Git 和 tar。

```sh
npm run integrate:cf -- ../Chemistry-Framework ./cf-preview
python3 -m http.server 8765 --bind 127.0.0.1 --directory ./cf-preview
```

打开 [验证我的直觉](http://127.0.0.1:8765/#inquire)。分析并保存任意教学问题，刷新后从已保存查询重新打开。CF 页面从同源目录加载 FE，保留原有键 `chemistry-framework-inquiries` 和 JSON 数组格式。预览必须使用新输出目录。脚本从固定 Git 版本取文件，不会带入工作区文件。

在另一终端执行浏览器和 CF 回归测试。若已安装兼容的 Chromium，可通过 `CF_CHROMIUM` 指定其可执行文件。

```sh
CF_TEST_URL=http://127.0.0.1:8765/ node tests/chemistry-browser.cjs
(cd cf-preview && node --test tests/*.test.cjs)
CF_TEST_URL=http://127.0.0.1:8765/ NODE_PATH="$PWD/node_modules" node cf-preview/tests/curriculum-browser.cjs
```

该接入版本在私有 FE 仓库内维护，CF 的公开站点仍使用当前发布版本。详情见 [CF 基线审查](docs/CF_REVIEW.md)、[架构与接口](docs/ARCHITECTURE.md)、[验收记录](docs/TEST_REPORT.md)及[变更记录](CHANGELOG.md)。项目许可证待维护者确认。
