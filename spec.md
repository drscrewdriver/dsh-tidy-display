# Spec: dsh-tidy-display 旧宿主兼容分支（DSH 0.1.5 / 0.1.2 / 0.1.1）

> 上一轮规划（Phase R 诚实声明 + Phase L「单条 compat/legacy + dist-tag」只规划不实施）已被本执行版取代；旧文见 git 历史。
> R1 诚实声明已交付（README 双语，6aeb412），本轮不再变动。

## 需求
- 在 dsh-tidy-display 增加 **三条兼容分支**（每宿主线一条，tidychat 已验证的拓扑）：
  - `compat/0.1.5`：DSH **0.1.5-alpha.1+ ~ 0.1.6**（V3 session，`surfaceOp` 仅可选新增）
  - `compat/0.1.2`：DSH **0.1.2-alpha.2 ~ 0.1.4.x**（V2/V2+ session，`installSection` 可用）
  - `compat/0.1.1`：DSH **0.1.0-rc.7 ~ 0.1.2-alpha.1**（V2 session，仅旧式 `register` 设置）
- 每条线交付 **消息轨子集**：canvas 轨（横线/圆点、左右镜像、白色柔光外圈）、配色链（auto / 自定义取色器 + HEX/RGB + 透明度滑杆）、智能加载（autoLoad Governor）、原生「对话」视图的定位跳转与当前轮高亮。
- **阅读视图不下放**（bd reader 绑定 0.1.7 官方槽位契约，下放 = 重写）；兼容分支只在原生视图工作，`data-reader-key` 回退路径一并删除。
- 设置按宿主能力回退：`installSection`（0.1.2-alpha.2+）→ `register`（0.1.0-rc.7+）；0.1.5/0.1.2 线另有 settings.plugins.tab 设置卡（chipRow + colorField，tidychat 验证过的 UI）。
- **接管官方消息轨开关**：0.1.5 / 0.1.2 线保留（有官方 TurnNavigator；0.1.5 硬编码于 ChatView，隐藏选择器标注「待实测」）；0.1.1 线移除（无官方轨）。
- 每条线打独立 tag 并给出安装一行式，如 `dsh plugin --profile web add github:drscrewdriver/dsh-tidy-display#v0.1.0-dsh0.1.5`；npm 发布后追加同名 dist-tag（`dsh-0.1.5` / `dsh-0.1.2` / `dsh-0.1.1`）。
- 每条分支过与 main 相同的工程门：typecheck + eslint + test（兼容子集）+ build；全部提交推送。

## 技术方案
- **分支拓扑（链式，裁剪只做一次）**：`main` → `compat/0.1.5`（裁剪 + 回移植全量）→ `compat/0.1.2`（peer/矩阵增量）→ `compat/0.1.1`（去接管、register 优先）。
- **裁剪清单**（自 main 删除）：reader 面全部模块（Reader.tsx、ChoreographedFlow、Blocks、ReasoningCard、ClosedProcessSummary、StickyLane、ToolActivity、live-turn、projection、official-slots、entry-policy、entry、McpAppFrame、mcp-app、waiting-clock、WaitClock、WaitingStatus、pending-submission、deliverables、open-file、skill-status、skill-roots、skills/、timeline、word-timeline、word-motion、motion、fold-choreography、fold-intensity、reasoning-follow、streaming、stream-buffer、markdown/、message-chrome、native/、SettingsSection.tsx、settings-slots、settings.tsx、settings.d.ts、types.ts、ChatView 桥接）及对应测试；`tests/` 重建为兼容子集。
- **保留**：`src/client/rail/RailView.tsx`、`src/client/rail/colors.ts`、`src/client/store.ts`（裁成 rail prefs 子集）、`src/client/settings-copy.ts`（裁成 rail 键）。
- **回移植**：Governor + `findLoadOlderButton`（tidychat `compat/0.1.5:src/client/index.ts` L556+ / L935-958）→ 新文件 `src/client/autoload.ts`；设置卡 chipRow/colorField/字段（tidychat `release/0.1.7:src/client/index.ts` L2191-2255）→ `src/client/LegacySettingsCard.tsx`（0.1.5/0.1.2 线挂 `settings.plugins.tab`；0.1.1 线仅 register schema 表单）。
- **客户端 bootstrap**（`src/client/index.tsx` 重写）：`export const inject` 移除 host 服务名，改为 package.json `dsh.client.inject: ["@deepseek-ai/dsh-client-store", "@deepseek-ai/dsh-client-ui-settings"]`（tidychat compat/0.1.5 同款）；RailView 不走 utilities 槽位（旧宿主未验证），改为会话滚动容器旁自建容器 + `createRoot` 常驻挂载（tidychat 固定定位 canvas 的验证位置）；prefs 经 settingsScope 快照读写（`tidy-display` 命名空间）。
- **宿主半**（`src/index.ts` 重写）：unscoped `schemastery ^3.18.0` schema（无 `.volatile()`）+ tidychat compat/0.1.5 L83-99 的探测式注册（`installSection(ctx, ns, Config, entry, hooks)` → `register(ns, Config, { base })` 回退）。
- **package.json**：deps `schemastery ^3.18.0`；peer 收敛为 `@deepseek-ai/dsh-settings`（0.1.5 线 `^0.1.5-rc.2`；0.1.2 线 `>=0.1.2-alpha.2 <0.1.5-alpha.1`；0.1.1 线 `>=0.1.0-rc.7 <0.1.2-alpha.2`）+ `react ^18.2.0`；删除 0.1.7 专属的 14 个 peer；`dsh.bundle.patch` 与 `exports` 结构不变。
- **测试子集**：`tests/stock-install.test.ts`（按线适配断言）、`tests/rail-colors.test.ts`（自 tidychat 327e9d1 移植，同函数）、`tests/rail-store.test.ts`（rail prefs 默认值 + set actions）、`tests/legacy-settings-schema.test.ts`（schemastery schema 可构建、含全部 rail 键、无 `.volatile()`）。

## 决策记录
| 选项 | 选择 | 理由 |
|------|------|------|
| 单条 compat/legacy 双路径探测（旧 Phase L） | **三条版本线分支** | tidychat 实证版本线拓扑；用户明确要求 0.1.1/0.1.2/0.1.5 三条 |
| 兼容线挂载走 utilities 槽位 | 自建容器 + createRoot | 该槽位在旧宿主未验证；tidychat 固定定位 canvas 方案全版本验证过 |
| 阅读视图下放 | 不下放 | bd reader 绑 0.1.7 槽位契约；下放 = 重写 bd |
| 发布形态 | 先 GitHub tag，npm 后补 dist-tag | npm 未发布；`github:repo#tag` 已验证 |
| 三线基座 | 链式（0.1.5 → 0.1.2 → 0.1.1） | 裁剪+回移植只做一次，各线 diff 最小化 |

## 约束
- DOM 锚点契约 `data-chat-anchor-key` + `data-chat-flow-kind` 0.1.0-rc.7→0.1.7 稳定（已验证），是子集可移植的前提。
- `session.eventSource.getSnapshot()` 在 0.1.2/0.1.3/0.1.5 形状一致（tidychat VERSION-COMPATIBILITY-ANALYSIS §1）。
- 旧宿主客户端可 `require('react')`（tidychat 设置卡 0.1.2 实证）。
- 三宿主实测需本机存在对应 DSH 版本；缺失的线降级为「构建门全绿 + README 标注未实测」。
- 本机无 Harness 源码检出 → 构建绕过 `check-harness-compat`，直跑 `npx tsc -p tsconfig.json && npx tsdown`（main 线同款）。
- ≤0.1.0-rc.6 不在范围，README 指向 dsh-tidychat 0.1.0。
