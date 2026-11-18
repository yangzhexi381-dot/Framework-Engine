# v0.1.0 架构与接口

## 应用接入

在应用入口导入 `FrameworkEngine`，调用 `register` 提供以下字段，再用 `load(id)` 获取初始快照。每个引擎实例同时持有一个活动应用，切换应用会按各自 ID 恢复进度。

| 字段 | 约定 |
| --- | --- |
| `manifest.id` | 稳定的应用标识，用于注册和隔离存档 |
| `initialState()` | 生成默认 JSON 状态 |
| `validateState(state)` | 纯函数，成功返回 `true`，失败返回说明或 `false` |
| `reduce(state, action)` | 根据动作返回新的 JSON 状态 |

`dispatch`、`reset` 和 `importData` 会先校验并写入存储，再更新内存状态并发布事件。失败时调用方能显示错误，已提交状态保留。快照与事件对象来自状态的副本。默认使用浏览器 `localStorage`，无浏览器存储对象的环境中使用实例内存。也可以注入 `getStorage` 或满足 `getItem`、`setItem` 的存储实例。

演示保留原型的 `fe-v01:<id>` 键以及 `framework-engine-state` v1 导出信封。旧值和损坏值在载入时只读取。缺失或损坏时使用默认状态，下一次成功保存才会写入。

## 通用模块

`engine.modules.register({ id, dependencies, load, unload })` 注册模块。加载会预先检查缺失项和依赖环，依赖按顺序启动，重复加载返回已加载的公开值。若启动中途失败，引擎回滚本次已成功启动的模块。模块需要自行清理其失败的 `load` 回调产生的资源。显式卸载某个模块时，如果还有依赖方在运行，引擎会拒绝卸载。模块的生命周期回调应保持同步。单次状态更新和存储写入按同步执行处理，多个标签页的竞争仍遵循本地存储的最后写入语义。

`load` 接收 `{ events, dependencies }`，其中 `dependencies` 是直接依赖公开值的映射。模块可以用 `events.subscribe` 和 `events.publish` 订阅或发布领域事件，卸载时调用订阅返回的取消函数。引擎发布 `framework:loaded`、`framework:unloaded` 和 `state:changed`。异步计算和未来 AI 服务可作为模块公开的异步方法，领域应用决定调用与授权策略。

## Chemistry Framework

部署形态为独立的私有静态集成树。CF 页面加载原有知识数据，再给现有查询控制器注入 FE 适配器。适配器通过 `createJsonDocument` 管理原记录键。CF 继续负责查询的分析、渲染以及用户主动发起的文献检索。存档在当前浏览器，不会因接入适配器而发起新的请求。
