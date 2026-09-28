# Findings

> 上轮（诚实声明 + 规划）的 findings 已随其 spec 进入 git 历史；本文聚焦本轮「三条兼容分支」执行。

## 架构决策
- **分线发布是实证结论，不是偏好**：tidychat `feat/settings-registration-0.1.7` 提交明确「`.volatile()` is 0.1.7-only, so 0.1.6 and 0.1.7 cannot share a build」——0.1.7 移除了 `installSection`/`register`，旧宿主调用 `.volatile()` 即抛错。因此兼容线必须是独立分支/独立构建；旧 Phase L 的「单条 compat/legacy + 运行时双路径」只对「0.1.2+ vs 0.1.1」这一段成立（两个旧式 API 都是命令式、可探测），对 0.1.7 边界不成立——但用户要的就是三条显式分支，与实证拓扑一致，采纳。
- **链式分支（0.1.5 → 0.1.2 → 0.1.1）**：裁剪 + 回移植的全部工作量落在 compat/0.1.5 一个分支上，下游两条线只带 peer/矩阵/开关增量 diff，维护面最小。
- **兼容线挂载不走 utilities 槽位**：`conversation.session.header.utilities` 是 0.1.7 槽位，旧宿主未验证。tidychat 的 rail 是「固定定位 canvas + findScrollContainer」，不依赖任何宿主槽位、全版本验证过。RailView 是 React 组件 → 自建容器 + `createRoot` 挂载即可，无需宿主槽位。
- **旧宿主无需 `data-reader-key` 回退**：0.1.0-rc.7~0.1.6 装不了 bd 阅读视图，消息行永远原生渲染，`data-chat-anchor-key` 天然完整。
- **legacy 线从本项目裁剪而非复用 tidychat 原包**：tidychat 旧维护线停在 0.3.1，缺白色柔光、缺透明度滑杆调色盘的 legacy 形态；裁剪 = 旧宿主直接拿到最新轨能力。

## 技术选型（全部有 tidychat 实证出处）
| 事项 | 选择 | 出处 |
|---|---|---|
| 客户端 inject（旧宿主） | `["@deepseek-ai/dsh-client-store", "@deepseek-ai/dsh-client-ui-settings"]` | tidychat compat/0.1.5 `package.json` `dsh.client.inject`；`export const inject = ['slots','sessions']` |
| 设置注册 | `ctx.inject(['settings'])` → 探测 `installSection` → 回退 `register(ns, Config, { base })` | tidychat compat/0.1.5 `src/index.ts` L83-99（注释明确 0.1.2-rc.1+ / 0.1.0-rc.7 分界） |
| 宿主半 schema | unscoped `schemastery ^3.18.0`，禁用 `.volatile()` | 同上；0.1.7 线的 `@deepseek-ai/schemastery` + `.volatile()` 是 0.1.7 专属 |
| 设置卡 UI | chipRow + colorField（auto/自定义 + 取色器 + HEX/RGB + 透明度滑杆），挂 `settings.plugins.tab` | tidychat `release/0.1.7:src/client/index.ts` L2191-2255（该 UI 在旧宿主形态下长期运行） |
| autoLoad | Smart AutoLoad Governor（时间预算制）+ `findLoadOlderButton`（'加载更早'/'Load earlier'/'Load older'） | tidychat compat/0.1.5 `src/client/index.ts` L556+、L935-958 |
| peer 集 | `@deepseek-ai/dsh-settings` 按线 + `react ^18.2.0`；deps 仅 `schemastery ^3.18.0` | tidychat compat/0.1.5 `package.json`（0.1.5 线 peer `^0.1.5-rc.2`） |
| 发布 | GitHub tag `v0.1.0-dsh0.1.x`；npm 发布后补 dist-tag | `github:repo#tag` 安装一行式已在 tidychat README 验证 |

## 约束与依赖
- **数据链路跨版本稳定**：`session.eventSource.getSnapshot()` 在 0.1.2/0.1.3/0.1.5 返回相同 `{ entries, hasMore, revision, change }`；V3（0.1.5）仅在用户消息事件上新增可选 `surfaceOp`（tidychat VERSION-COMPATIBILITY-ANALYSIS §1-§2.4）。且兼容线 rail 主路径走 DOM 锚点，事件路径只服务 autoLoad 判定。
- **DOM 锚点契约** `data-chat-anchor-key` / `data-chat-flow-kind` 0.1.0-rc.7→0.1.7 稳定。
- **旧宿主可 `require('react')`**：tidychat 设置卡在 0.1.2 上用 `React.createElement` 渲染，实证。
- **工程门每线都要过**：typecheck + eslint + test + build；`check-harness-compat` 本机无 Harness 检出，直跑 `npx tsc && npx tsdown` 绕过。
- **三宿主实测的前置**：本机需有 0.1.5-rc.2 / 0.1.2-rc.1 / 0.1.1 宿主；缺哪条线就降级为「构建门全绿 + README 标注未实测」，不阻塞其它线。

## 风险识别
- **0.1.5 官方轨接管待实测**：TurnNavigator 硬编码于 ChatView，`data-tidychat-hide-official-nav` 的 CSS 选择器在 0.1.5 是否命中未验证（tidychat README 同样标注「待实测」）→ 开关默认值保持开，实测失败则该线默认改关，不阻塞发布。
- **0.1.1 线 schema 表单能力弱**：`register` 的宿主旧表单不支持 chipRow/colorField 这类自定义控件 → 0.1.1 线设置降级为 schema 布尔/枚举（颜色用预设枚举 `auto/gray/black/white/blue/...`，不走取色器），在 LegacySettingsCard 不挂载的情况下仍可用。
- **React 挂载时机**：会话滚动容器在路由切换时重建 → 挂载用 MutationObserver 守护（RailView 内已有 takeover 的观察器模式可复用），容器丢失即重挂。
- **版本漂移**：0.1.3/0.1.4 宿主未列入实测清单（用户只点名 0.1.1/0.1.2/0.1.5）→ compat/0.1.2 的 peer 范围覆盖 `<0.1.5-alpha.1`，README 标注「0.1.3/0.1.4 理论可用、未实测」。
