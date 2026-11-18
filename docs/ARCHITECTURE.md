# 架构与接口

`src/index.js` 是运行时入口。模块与应用适配器使用同一组 `state`、`events` 和 `data` 服务。CF 通过 `src/adapters/chemistry.js` 连接数据服务，故事示例通过独立适配器连接状态和事件。

| 位置 | 职责 |
| --- | --- |
| `src/modules/registry.js` | 注册模块、解析依赖、调用启动与清理钩子 |
| `src/core/state.js` 与 `events.js` | 按快照更新应用状态、订阅状态和发布同步事件 |
| `src/data/json-store.js` | 读写、更新和序列化 JSON，通过存储接口持久化 |
| `src/adapters/chemistry.js` | CF 既有查询记录与 FE 数据接口的转换 |
| `src/ui/bind-text.js` | 将状态字段绑定到普通 DOM 节点 |
| `examples/story/` | 由两个 FE 模块驱动的跨领域运行示例 |

## 应用约定

- `createEngine({initialState, storage})` 创建独立实例。存储实现提供 `getItem(key)` 和 `setItem(key, value)`，可使用 `localStorage` 或内存实现。
- `modules.register({id, requires, start})` 注册模块。 `start(services)` 可返回同步或异步清理函数。 `load(id)` 先校验完整依赖图，再按顺序启动。失败时清理本次启动的模块。清理失败可重试，依赖按活跃关系保留。启动失败的模块负责撤销钩子内部已发生的副作用。
- `state.get()` 返回独立 JSON 快照。 `state.update(transform)` 先提交状态，然后通知订阅者，返回 `{value, errors}`。订阅者同步执行，可调用返回的函数取消订阅。
- `events.on(topic, listener)` 返回取消订阅函数。 `events.emit(topic, payload)` 按同步订阅顺序分发，返回监听器抛出的错误。监听器共享事件载荷，调用方可以传入只读数据。异步任务由监听器自行处理结果和异常。
- `data.read(key, fallback)`、`write(key, value)`、`update(key, transform, fallback)` 使用同一原始 JSON 值。转换函数同步执行，应只计算本次的新值。存储故障由调用方处理。跨标签页的并发写入需要后续的冲突控制。
- `engine.connect({connect(services) {...}})` 让适配器返回领域应用所需的接口。科学计算和未来的 AI 服务可以作为领域模块启动的依赖，由其适配器公开 `run(input, options)` 一类接口。v0.1 的核心功能使用本地浏览器和 Node.js。

## CF 兼容边界

CF 小补丁将现有工作台的读写调用交给 FE。工作台仍负责查询数据、输入字段、图谱关联和 Crossref 检索。适配器以原 JSON 数组读写同一键，旧记录可以直接加载，损坏记录沿用空列表行为，存储写入失败仍由原界面报告。生成的预览使用同源静态模块，无需后端。
