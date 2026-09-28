# Spec: dsh-tidy-display · 诚实来源声明 + 旧宿主（0.1.5/0.1.2/0.1.1）反向适配规划

> 上一轮「合并项目」规划已归档于 `docs/plans/2026-09-28-merge/`（执行完毕：骨架/轨/配色/调色盘/起子设置/发版 v0.1.0）。

## 需求

### R1 README「来源与不足」诚实声明（双语，功能清单之前的显著位置）
如实说明（所有断言可被 git 历史 / PR 链接互证）：

**实时显示（流式阅读）的来源**：better-display 阅读视图——上游 `aa2246740/dsh-better-display`（流式渲染、过程编排、官方桥接），经 `drscrewdriver` fork 增强。本项目未重写其流式/折叠/动效链路。

**消息轨的来源**：dsh-tidychat——上游 `BananaSoldier01/dsh-tidychat`（canvas 轨、鱼眼、配色链、智能加载），经 `drscrewdriver` compat 线增强（白色柔光、steering 同视、DOM 单一事实源）。移植时依赖注入化改造，算法与观感保持原样。

**原版 better-display 的不足（本 fork / 合并修复的动机）**：
1. **消息与思考没有底框**：最终回答与思考文字直接铺在页面背景上，换肤 / 壁纸 / 深色主题下可读性差 → fork 增加消息气泡（官方 `--dsw-alias-bg-layer-1` 半透明底）与思考卡同款衬底（fork 提交 `94d59c7`、`fa3a795`）
2. **阅读视图丢弃宿主行级锚点**（`data-chat-anchor-key` / `data-chat-flow-kind`）：以该契约为事实源的第三方插件在阅读视图下解析出 0 行、静默失效——与 tidychat 同装时消息轨不渲染（修复 PR：aa2246740/dsh-better-display#41）
3. 自带 TimelineRail 仅有官方大纲一轨，无鱼眼摘要、无点击跳转、无配色能力

**原版 tidychat 的不足（合并动机，公平陈述）**：
1. 折叠 / 分隔线是 DOM 手术，与宿主 0.1.2+ 原生折叠重叠，需用户手动二选一
2. v0.2.10 及更早在 0.1.2 宿主上消息轨取数路径读错快照——解析出 0 轮、实际从未渲染（v0.3.0 修复，见其仓库 RAIL-ROOT-CAUSE-ANALYSIS）
3. 与 bd 阅读视图天然冲突（其 DOM 手术作用不到阅读视图的行；阅读视图又丢锚点反过来废掉消息轨）

### R2 旧宿主反向适配规划（0.1.5 / 0.1.2 / 0.1.1）

**能力矩阵（依据 = tidychat README 兼容表 + bd changelog 实证）**：

| 宿主 | 阅读视图 | 消息轨 | 智能加载 | 设置面 |
|---|---|---|---|---|
| 0.1.7-rc.1+（当前线） | ✅ | ✅ 双视图 | ✅（待移植） | 声明式 + family tab |
| 0.1.2-alpha.2 ~ 0.1.6（含 0.1.5） | ❌ | ✅ 原生视图 | ✅ | `installSection` |
| 0.1.0-rc.7 ~ 0.1.2-alpha.1（含 0.1.1） | ❌ | ✅ 原生视图 | ✅ | `register`（keyed 槽） |

**为什么阅读视图不能下放**：bd 的 reader 绑定 0.1.7 槽位契约（`turnTail` list 化、`configForms`、0.1.7-rc.1/rc.2 之间都曾互不兼容），下放 = 重写 bd，成本远超价值。旧宿主线 = **rail-only 子集**（消息轨 + 柔光 + 配色 + 智能加载），这恰好是 tidychat 旧维护线已验证可用的全部能力。

**技术方案：分线发布（沿用 tidychat 已验证模式）**：
- tidychat README 明确结论：0.1.7 声明式 `.volatile()` 与旧宿主 `installSection`/`register` 无法共存于一份产物（旧宿主调用 `.volatile()` 即抛错、加载失败）→ 不做单包运行时探测
- `compat/legacy` 分支：从本项目裁出 rail-only 变体——删除 Reader 及 bd 全部模块，保留 `rail/RailView.tsx` + `rail/colors.ts` + autoLoad（从 tidychat 回移植 Governor）+ 双 API 设置层（回移植 tidychat `installSection`/`register` 路径）
- 旧宿主只有原生渲染，锚点契约天然完整 → 无需 `data-reader-key` 回退，`railRows()` 的原生路径即全部
- 接管开关保留（0.1.2+ 有官方轨）；0.1.1 无官方轨，开关自动无效（无害）
- 包命名：`@drscrewdriver/dsh-tidy-display` 用 dist-tag（`dsh-0.1.5` / `dsh-0.1.2` / `dsh-0.1.1`，同 tidychat 的 `dsh-0.1.2` 惯例），不加 `-legacy` 后缀（README 指引按宿主版本装对应 tag）

### R3 交付物（本轮）
- README.md / README.en.md：新增「来源与致谢」「宿主兼容性」两节（含上方全部声明 + 能力矩阵）
- 本规划四件套
- legacy 线**只规划不实施**：等 0.1.7 线稳定 + 有真实旧宿主用户反馈再开工

## 决策记录
| 选项 | 选择 | 理由 |
|---|---|---|
| 单包运行时探测 vs 分线发布 | 分线发布（compat/legacy 分支 + dist-tag） | tidychat 实证单份产物无法两线兼容；社区已验证模式，且本机就有分线维护经验（tidychat release/0.1.7、legacy/0.1.2） |
| legacy 线基座 | 本仓库裁剪（非继续用 tidychat 原包） | 继承白色柔光/调色盘/steering 同视/单一事实源等新修复；tidychat 上游已停更 |
| legacy 阅读视图 | 明确不支持 | 成本 = 重写 bd；旧宿主用户核心诉求是消息轨与可读性 |
| R1 声明口吻 | 事实 + 可查证链接，不贬低上游 | 上游是社区作品；fork 增强均有 PR/commit 链 |
| 现在是否实施 legacy | 否 | YAGNI：0.1.7 线刚闭环；规划落盘随时可开工 |

## 约束
- README 断言与 git 历史/PR 可互证；不写无出处的贬损
- legacy 线 peer range 按 tidychat 旧表（0.1.0-rc.7+；≤0.1.0-rc.6 用户指向 tidychat 0.1.0）
- 本轮只改 README 与规划文档，不动 src/
