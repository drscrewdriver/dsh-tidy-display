# Tasks

## Phase 0: 前置收口（依赖当前会话工作）
- [ ] task_0.1: `refer-dsh-tidy-display` 工作区改动（锚点+思考衬底+模块 id）commit 到 `feat/message-bubbles`；spec/findings/checklist/tasks 四件套一并入库或按用户意愿忽略
- [ ] task_0.2: 确认 tidychat 白色柔光改动 commit 到 `release/0.1.7`（移植源需可检出）

## Phase 1: 项目骨架与身份（约半天）
- [ ] task_1.1: `git clone` 方式初始化 `dsh-tidy-display/`（拷贝 refer-dsh-tidy-display 内容，**排除** node_modules、lib.backup-*、*.md 规划件）；`git init` + 首提交
- [ ] task_1.2: 全局改名 `dsh-tidy-display` → `dsh-tidy-display`：package.json（name `@drscrewdriver/dsh-tidy-display`、version 0.3.3-fork.6 起线）、`src/dsh-tidy-display.ts`（原 dsh-tidy-display.ts）的 `export const name`、tsdown.config.ts 入口名与 config.name 匹配串、cordis.yml/cordis.patch.yml、settings 分区 id 与标题「Tidy Display」
- [ ] task_1.3: `pnpm install`（全新生成 node_modules，禁止拷贝）；typecheck + build 通过
- [ ] task_1.4: 部署 profile 冒烟：宿主激活、设置分区出现、阅读页签正常（模块 id 链无断裂）

## Phase 2: 移植 canvas 消息轨（1-2 天，核心）
- [ ] task_2.1: 从 tidychat `release/0.1.7` 提取 RailView 组件整体（measurePos/layoutPositions/indexAt/jumpTo/detectCurrent/tip/指针 rAF 节流/whiteSheen 柔光外圈/横线圆点分支）→ `src/client/rail/RailView.tsx`，依赖注入化（config、rowsProvider、scrollJump、sessionId 由 props 传入）
- [ ] task_2.2: 提取颜色链（parseRgba/parseRgb/findBackgroundRgb/isDarkBackground/contrastRatio/resolveNavColors/applyNavColors/applyTipContrast）→ `src/client/rail/colors.ts`（保留 DSW token 跟随 + 保守兜底原则）
- [ ] task_2.3: 行事实源对接：阅读视图直接用组件内 DOM 查询（锚点契约已在行上）；`railRows()` 保留 user+steering 同视与 data-reader-key 回退（健壮性）
- [ ] task_2.4: 跳转对接：阅读视图跳转改用 bd `landTurn/scrollerOf`；原生对话视图保留原 `smoothScrollTo`
- [ ] task_2.5: 原生视图挂载点：utilities 槽注册原样保留（RailView 复用）；阅读视图挂载：Reader.tsx 移除 `<TimelineRail>` 挂 `<RailView>`
- [ ] task_2.6: `rail/outline.ts`：移植 bd TimelineRail 的 `mergeTimelineItems(turnNavigationItems, turnOutline, turnsWithDeliverables)` 数据源；派生式对账（占位数 = outline 总数 − DOM 行数；占位点击 → `props.loadThrough(seq)`；实点身份永远以 DOM 行为准）
- [ ] task_2.7: 移除 TimelineRail.tsx 及其 CSS/preview 逻辑；轨布局让位（reader 列右缘 padding 调整）
- [ ] task_2.8: 部署实测：两视图轨渲染、样式矩阵（横线/圆点 × 左/右 × 柔光开关）目检

## Phase 3: 其余 tidychat 功能（约 1 天）
- [ ] task_3.1: `src/client/autoload.ts`：移植 autoLoad Governor（isGovernorBusy/scheduleNext/loadOnePage 软预算时间制），loadOnePage 对接 reader `props.loadOlder()`；设置开关并入声明式 schema
- [ ] task_3.2: `src/client/diagnostics.ts`：移植 detectIssues/buildReport/一键 issue；口径改走统一行采集 helper；现象标签裁剪为「定位条异常/自动加载异常」
- [ ] task_3.3: 声明式配置 schema：navigator/navSide/navStyle/navRing/navColor*/navAccent*/autoLoad 以 `.volatile()` 注册（键名沿用 tidychat 已发布键，老 settings.yaml 零迁移）；与 bd prefs 在设置卡合并分区展示
- [ ] task_3.4: 删除 tidychat 遗留：fold/divider 手术、首次引导（navGuideSeen）、applyOfficialNavTakeover 及接管 CSS 段、legacy settings API 路径

## Phase 4: 验证与发布（约 1 天）
- [ ] task_4.1: checklist.md Must Pass 全量过（两视图 × 样式矩阵 × 明暗 × 玻璃皮肤）
- [ ] task_4.2: 长会话性能三态对比（确认单轨优于双插件）
- [ ] task_4.3: README/README.en/CHANGELOG 新写（新身份、0.1.7 基准、与 tidychat/bd 的关系与致谢）
- [ ] task_4.4: `npm view @drscrewdriver/dsh-tidy-display` 确认名字可用 → version 0.1.0 → tag → GitHub release → `npm publish --access public`
- [ ] task_4.5: tidychat 与 bd fork 的 README 互加「已合并至 dsh-tidy-display」指引；PR #41 保持跟踪（上游合并后可减一条内部差异）
