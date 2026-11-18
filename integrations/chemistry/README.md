# Chemistry Framework 接入

从真实 CF 提交 `61575a45e2eac096f5b7ddcbf6c40ae2494b8ef1` 构建私有集成树。补丁将「验证我的直觉」的本地记录读写交给 FE，沿用原来的 `chemistry-framework-inquiries` 键和数组结构。原有记录在同一浏览器源可直接读取。

在 FE 根目录运行以下命令。将参数换成包含上述提交的真实 CF 仓库路径。

```sh
npm run test:cf -- ../Chemistry-Framework
bash integrations/chemistry/stage-chemistry-framework.sh ../Chemistry-Framework /tmp/cf-fe-stage
python3 -m http.server 8765 --bind 127.0.0.1 --directory /tmp/cf-fe-stage
```

访问 <http://127.0.0.1:8765/#inquire>。构建需要一个尚不存在的输出目录。脚本会归档指定提交、校验和应用补丁，再把 FE 运行源码复制到集成树，不修改 CF 检出。仅在私有范围内使用生成的集成树。

Chromium 验收由 FE 的 GitHub Actions 运行。如果本地已安装 Playwright 和 Chromium，可设置 `NODE_PATH` 并运行 `CF_BROWSER=1 npm run test:cf -- ../Chemistry-Framework`。
