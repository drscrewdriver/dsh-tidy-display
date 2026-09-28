# dsh-tidy-display

[English](./README.en.md)

**整洁显示** —— DeepSeek Harness（DSH）**0.1.7** 的一个社区插件：把「阅读视图」与「消息轨」缝合成一个插件，长会话可扫读、可定位、可续聊。

> 本项目由两个广受欢迎的 DSH 插件合并而来：
> [dsh-better-display](https://github.com/aa2246740/dsh-better-display)（阅读视图，经 fork 维护）×
> [dsh-tidychat](https://github.com/BananaSoldier01/dsh-tidychat)（消息轨 / 智能加载）。
> 合并消除了两者因 DOM 契约产生的冲突，并向两者致敬。

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

```sh
dsh plugin --profile web add @drscrewdriver/dsh-tidy-display
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

- 阅读视图部分基于 [aa2246740/dsh-better-display](https://github.com/aa2246740/dsh-better-display)（MIT）与 drscrewdriver fork 的增强（行级宿主锚点契约、思考衬底、消息气泡）
- 消息轨 / 配色 / 智能加载部分移植自 [BananaSoldier01/dsh-tidychat](https://github.com/BananaSoldier01/dsh-tidychat)（MIT）
- 两个上游的后续改进若与本项目不冲突，会择机跟进

## 许可

展示与 Markdown 部分来自 DeepSeek Harness（MIT）。动效参考 [Transitions.dev](https://transitions.dev/)。本仓库代码 [MIT](LICENSE)。
