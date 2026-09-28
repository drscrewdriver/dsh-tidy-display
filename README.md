# dsh-tidy-display（legacy 0.1.1 线）

[English](./README.en.md)

**整洁显示 · 消息轨子集**，面向 DeepSeek Harness（DSH）**0.1.0-rc.7 ～ 0.1.2-alpha.1** 的社区插件分支。把会话区边缘的 canvas 定位轨带到旧宿主：长会话可扫读、可跳转、可自动加载全量历史。

> 这是 [@drscrewdriver/dsh-tidy-display](https://github.com/drscrewdriver/dsh-tidy-display)（0.1.7 线）的兼容分支，**只包含消息轨能力**。0.1.7-rc.1+ 用户请安装 main 线；0.1.2-alpha.2～0.1.4.x 用 [`compat/0.1.2`](https://github.com/drscrewdriver/dsh-tidy-display/tree/compat/0.1.2) 线（tag `v0.1.0-dsh0.1.2`）；0.1.5-alpha.1～0.1.6 用 `compat/0.1.5` 线（tag `v0.1.0-dsh0.1.5`）。
> 消息轨移植自 [dsh-tidychat](https://github.com/BananaSoldier01/dsh-tidychat)（canvas 轨、鱼眼悬停、配色链、智能加载均为其成果，白色柔光与调色盘滑杆来自本项目 compat 增强），并向其作者致谢。

## 功能

- 会话区边缘的 canvas 定位轨：鱼眼悬停 + 摘要卡、点击跳转、当前轮高亮
- 样式**横线 / 圆点**，位置**左缘 / 右缘（镜像）**
- **白色柔光外圈**：当前轮与悬停轮标记底下垫一层柔光，复杂壁纸上也清晰
- **配色**：标记色 / 强调色各自「自动（跟随主题，对比不足自动纠偏）/ 自定义（取色器 + HEX/RGB 文本 + 透明度滑杆）」
- **智能历史加载**：按时间预算自动点击宿主「加载更早」按钮，检测到性能压力自动暂停
- 只在原生「对话」视图工作；**不含阅读页**（该能力绑定 0.1.7 宿主槽位契约，无法下放）

## 安装

### DSH Studio 桌面 App

打开 **设置 → 插件 → 添加插件**，输入：

```text
github:drscrewdriver/dsh-tidy-display#v0.1.0-dsh0.1.1
```

### Web CLI

```sh
dsh plugin --profile web add github:drscrewdriver/dsh-tidy-display#v0.1.0-dsh0.1.1
```

npm 发布后可用 dist-tag：`dsh plugin --profile web add @drscrewdriver/dsh-tidy-display`（见 `dsh-0.1.1` tag）。安装后重开一次 Host 并硬刷新网页（bundle 在开机时读取）。

## 设置

**设置 → 插件 → 整洁显示**（`settings.plugin.item` 配置卡片）：消息轨开关 / 显示位置 / 显示样式 / 外圈柔光 / 标记色 / 强调色 / 智能加载（该区间宿主没有官方定位轨，无「接管」开关）。配置写入 `tidy-display` 命名空间，即时生效。

## 兼容性说明

- 面向 **0.1.0-rc.7 ～ 0.1.2-alpha.1**
- 0.1.0-rc.6 及更早不在范围（请用 dsh-tidychat 0.1.0）
- 只改展示层，不改 Agent 执行、SDK 或凭据；Node.js `^22.19.0 || >=24`

## 开发

```sh
pnpm install
npm run typecheck
npm run lint
npm test
npm run build      # 产物 lib/ 入库
```

工程门：typecheck + eslint + test（rail 子集）+ build，全部通过后打 tag 发布。

## 许可

本仓库代码 [MIT](LICENSE)。消息轨算法与观感来自 dsh-tidychat（MIT），致谢其作者。
