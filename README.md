# dsh-tidy-display

[English](./README.en.md)

**整洁显示** —— DeepSeek Harness（DSH）**0.1.7** 的一个社区插件：把「阅读视图」与「消息轨」缝合成一个插件，长会话可扫读、可定位、可续聊。

> 本项目由两个广受欢迎的 DSH 插件合并而来：
> [dsh-better-display](https://github.com/aa2246740/dsh-better-display)（阅读视图，经 fork 维护）×
> [dsh-tidychat](https://github.com/BananaSoldier01/dsh-tidychat)（消息轨 / 智能加载）。
> 合并消除了两者因 DOM 契约产生的冲突，并向两者致敬。

## 来源与致谢（如实说明）

**实时显示（流式阅读）** 来自 [dsh-better-display](https://github.com/aa2246740/dsh-better-display) 阅读视图：上游 aa2246740 的流式渲染、过程折叠编排、官方桥接，经 drscrewdriver fork 增强。本项目未重写其渲染与动效链路。

**消息轨** 来自 [dsh-tidychat](https://github.com/BananaSoldier01/dsh-tidychat)：canvas 轨、鱼眼悬停、配色链、智能加载均为移植，经 drscrewdriver compat 线增强（白色柔光、steering 同视、DOM 单一事实源）。

### 原版 better-display 的不足，与本项目 / fork 的修复

1. **消息与思考没有底框**——最终回答与思考文字直接铺在页面背景上，换肤、壁纸、深色主题下可读性差。→ fork 为回答加上了官方 `--dsw-alias-bg-layer-1` 半透明气泡底，思考卡加同款衬底（fork 提交 `fa3a795`、`94d59c7`）。
2. **阅读视图丢弃宿主行级锚点**——`data-chat-anchor-key` / `data-chat-flow-kind` 不随消息行输出，以该契约为事实源的第三方插件（如 tidychat 消息轨）在阅读视图下解析出 0 行、**静默失效**。→ 已向上游提交修复 PR [aa2246740/dsh-better-display#41](https://github.com/aa2246740/dsh-better-display/pull/41)；合并项目内同样自带该修复。
3. 自带 TimelineRail 只有官方大纲一轨——无鱼眼摘要、无点击跳转、无配色能力。

### 原版 dsh-tidychat 的不足，与合并的动机

1. 折叠 / 分隔线是 DOM 手术，与宿主 0.1.2+ 的原生折叠功能重叠，需要用户手动二选一。
2. v0.2.10 及更早版本在 DSH 0.1.2 宿主上消息轨取数路径读错快照——解析出 0 轮、**实际从未渲染**（v0.3.0 修复，见其仓库 `docs/RAIL-ROOT-CAUSE-ANALYSIS.md`）。
3. 与 better-display 阅读视图**双向冲突**：tidychat 的手术作用不到阅读视图的行；阅读视图丢锚点又反过来废掉消息轨——这正是本项目合并的直接动机。

对两个上游与作者（aa2246740、BananaSoldier01）致谢——本项目站在它们肩上；上游后续改进若与本项目不冲突，会择机跟进。

## 宿主兼容性

| DSH 宿主 | 阅读视图 | 消息轨 | 设置入口 |
|---|---|---|---|
| 0.1.7-rc.1+（本线） | ✅ | ✅（双视图） | 起子插件设置 → 整洁显示 |
| 0.1.2-alpha.2 ~ 0.1.6（含 0.1.5） | ❌ | ✅（规划支持） | 插件配置卡片 |
| 0.1.0-rc.7 ~ 0.1.2-alpha.1（含 0.1.1） | ❌ | ✅（规划支持） | 插件配置卡片 |

- 阅读视图绑定 0.1.7 槽位契约（官方 0.1.7-rc.1 → rc.2 之间都有破坏性变更），不下放旧宿主。
- 旧宿主反向适配（消息轨子集：轨 + 柔光 + 配色 + 智能加载）**已规划、暂未实施**，见仓库 `tasks.md` Phase L；发布形态为 dist-tag `dsh-0.1.5` / `dsh-0.1.2` / `dsh-0.1.1`。
- 0.1.0-rc.6 及更早不在支持范围（请使用 dsh-tidychat 0.1.0）。
- 矩阵截至 2026-09-28（tidy-display v0.1.0 / better-display 0.3.3-fork.5 / tidychat 0.3.4 线）。

## 功能

### 阅读视图（来自 better-display）
- 执行过程收拢为可展开的摘要，最终回答以**消息气泡**呈现（半透明底 + 可选毛玻璃，透出皮肤壁纸）
- 思考卡同款半透明衬底；流式思考可跟随滚动、可暂停、可展开全文
- 官方桥接：工具视图、反馈、产物卡片、turnTail 等经官方槽位渲染
- mcp-app 代码块渲染为沙箱交互卡片（`<iframe sandbox="allow-scripts allow-forms">`）；技能包见 [`skills/generative-mcpapps/`](skills/generative-mcpapps/)
- 交付物行、等待时钟、pending 回显；原版「对话 / 轨迹」、输入框、模型选择、工具和审批都还在

### 消息轨（来自 dsh-tidychat）
- 会话区边缘的 canvas 导航轨：鱼眼悬停 + 摘要卡、点击跳转、滚动时当前轮高亮
- 样式**横线 / 圆点**，位置**左缘 / 右缘（镜像）**
- **白色柔光外圈**：当前轮与悬停轮标记底下垫一层柔光，复杂壁纸上也清晰
- **配色**：标记色 / 强调色各自「自动（跟随主题，对比不足自动纠偏）/ 自定义（取色器 + HEX/RGB 文本 + 透明度滑杆）」
- **接管官方消息轨**：隐藏官方右缘 TurnNavigator（隐藏而非卸载），只保留本轨
- 原生「对话」视图与「阅读」视图**双视图都可用**

### 设置
所有设置集中在 **设置 → 起子插件设置 → 整洁显示**：消息轨（开关 / 位置 / 样式 / 外圈柔光 / 接管 / 配色）+ 消息气泡 / 半透明毛玻璃 / 自动折叠 / 产物打开方式。配置持久化在 `dsh.reader.v1`。

## 安装

### DSH Studio 桌面 App（推荐）

打开 **设置 → 插件 → 添加插件**，输入包名或地址（npm 发布后可用）：

```text
@drscrewdriver/dsh-tidy-display
```

### Web CLI

npm 发布前用 GitHub 地址（发布后可直接用上面的包名）：

```sh
dsh plugin --profile web add github:drscrewdriver/dsh-tidy-display
```

本地目录 / tarball（开发 / 本地测试）：

```sh
dsh plugin --profile web add ./dsh-tidy-display
dsh plugin --profile web add ./dsh-tidy-display-0.1.0.tgz
```

`dsh.bundle` 是开机捕获的：**不要**再往 profile 的 `cordis.patch.yml` 手写同一条 insert（会重复挂载）；已装过的卸载用 `dsh plugin --profile web remove dsh-tidy-display`。对已经运行的 Web Host，安装后重开一次 Host 再刷新网页。

## 开发

```sh
pnpm install
npm run typecheck
npm run build      # 产物 lib/（入库；check-harness-compat 门需要 Harness 源码检出）
npm test
```

面向 DeepSeek Harness **0.1.7-rc.1+**（peer `>=0.1.7-rc.1 <0.1.8`）。只改展示，不改 Agent 执行、SDK 或模型凭据。Node.js `^22.19.0 || >=24`。新会话默认进阅读。

## 与原项目的关系

详见顶部「[来源与致谢](#来源与致谢如实说明)」——上游后续改进若与本项目不冲突会择机跟进。

## 许可

展示与 Markdown 部分来自 DeepSeek Harness（MIT）。动效参考 [Transitions.dev](https://transitions.dev/)。本仓库代码 [MIT](LICENSE)。
