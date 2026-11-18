# Story Framework 试点

验证对象是 Story Framework 试点包中 `09_Interactive-Works/Unconditional-Insider/` 目录下的互动小说 v2.1。构建器按原有存档函数及真结局揭示结构判定输入是否兼容。

```sh
npm run integrate:story -- /path/to/source.html /path/to/new-story-fe.html
```

生成的 HTML 内嵌适配器和 JSON 文档实现。直接用浏览器打开即可离线游玩。构建器拒绝覆盖任何已有输出，作者的源文件、剧情、图片和门控规则保留。

| 接入位置 | 行为 |
| --- | --- |
| 自动存档与手动槽位 | 读写原有键和 v1 数据格式，沿用单槽清空操作 |
| 设置与周目记录 | 保持同一存储格式，真结局标记仍随周目记录持久化 |
| 真结局揭示 | Story Framework 判定真结局，FE 保存其结果。构建器保留原有触发规则 |
| 存档范围 | 存档兼容性适用于浏览器可以访问同一存储空间的情况。不同地址或不同文件路径可能使用不同存储空间 |

执行 `npm test` 来验证存档兼容、删除、输入校验和构建。安装 Playwright 和 Chromium 后，`node tests/story-offline.browser.cjs` 用合成作品测试 `file://` 的离线保存、恢复、揭示和清空。真实作品及其资源随作者持有的原包与导出文件交付。
