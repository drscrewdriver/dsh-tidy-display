# Findings

## 架构决策
- **底座选 bd fork 的量化依据**：bd client ~6.5k 行（reader/编排/桥接/流式动效），tidychat 需移植面 ~800 行（RailView + 配色链 + autoLoad + 诊断，且彼此独立可整体搬）。反向合并（bd reader 搬进 tidychat）要动 bd 几乎每个文件的 import 与模块缝，工作量 5-10 倍且每步都在拆散 bd 的内聚结构。
- **单轨融合的数据源分工**：tidychat 轨的「DOM 单一事实源」原则（0.3.1 确立）解决"已加载窗口的精确几何"，bd TimelineRail 的「全会话大纲投影」（turnNavigationItems + turnOutline）解决"未加载轮次的可见性与可达性"。两者恰好互补不重叠：身份/几何 = DOM 行；覆盖范围 = outline；未加载占位点击 = bd `loadThrough(seq)`。融合后_tidychat 0.3.1 的"更早历史提示带"升级为完整占位轨。
- **冲突消除机制（相对双插件方案的构造性差异）**：轨与行渲染同仓库同模块，行数据可直接走 React props/store（bd 的 `useChat` 快照），不必再依赖 DOM 查询做主链路——DOM 锚点降级为「对外兼容面」而非「自己的事实源」。这是缝合比契约修复更彻底的根本原因。
- **drop 首次引导/接管开关的连带简化**：tidychat 的 `applyOfficialNavTakeover`、`navGuideSeen`、官方轨探测（officialRailPresent）全部可删；CSS 里接管规则段删除；`navGuideSeen` 配置键废弃（保留无害，直接不注册）。

## 技术选型
- **轨组件移植方式 = 文件级搬运 + 依赖注入**：RailView 的依赖面是 `railRows()`、`config`、`jumpTo` 的滚动实现、`props.sessionId`。搬进 bd 后：行采集用 bd 已有的锚点契约 DOM 查询（原生视图）/直接 props（阅读视图）；滚动跳转在阅读视图改用 bd 的 `landTurn/scrollerOf`（已处理吸底 composer 的边界），原生视图保留 tidychat 原 `smoothScrollTo`。
- **配置注册**：0.1.7 declarative volatile schema（schemastery `.volatile()`）+ `configForms.get('tidy-display')` 客户端缝，模式照抄 tidychat release/0.1.7 的 ac6dc59 实现（已验证可用）；bd 的 `dsh.reader.v1` store 不动（气泡/玻璃/autoFold 继续走它），两套配置各管各域，设置卡 UI 合并展示。
- **autoLoad Governor**：tidychat 的软预算时间制（isGovernorBusy/scheduleNext/loadOnePage）整体搬，`loadOnePage` 改调 bd reader 的 `props.loadOlder()`；"轨道刷新"通知改为 React state 而非自研 notify。

## 约束与依赖
- `refer-dsh-tidy-display` 工作区有未提交改动（锚点+衬底+模块 id+泡泡基线）——Phase A 第一步是把它 commit 到 `feat/message-bubbles` 或新分支，合并项目的拷贝以该提交为起点
- bd 的 `check-harness-compat` 升级门需要 Harness 源码检出（`~/.config/dshx/harness` 或 `DSHX_HARNESS`）——本机没有，构建时跳过该门（与本次部署同策略），但 CI/发版机需要配
- tidychat 仓库 node_modules 曾因跨机拷贝损坏（软链拍平、ansis 解析失败）——新项目一律 `git clone`/`pnpm install` 全新生成，禁止拷贝 node_modules
- npm 名 `@drscrewdriver/dsh-tidy-display` 未被占用（与本决策相关的生态名可用性已按命名习惯判断，发布前 `npm view` 复核一次）

## 风险识别
- **上游漂移**：aa2246740 的 bd 每个 Harness rc 都在快速迭代（0.3.0→0.3.3 四天）。合并项目以后每个 rc 需自行适配——这是本方案最大的长期成本（用户已知情并选择）。缓解：保持 bd 源文件结构不重排，方便 `git diff` 式跟进上游。
- **outline 占位与 DOM 行的双源一致性**：占位（未加载）与实点（已加载）在同一轨上共存，切换会话/加载后需要精确对账——采用「outline 只提供覆盖范围与 turn 序号，实点身份永远以 DOM 行为准，占位数量 = outline 总数 − DOM 行数」的派生式对账，避免重蹈 0.3.1 前的"双源错位"覆辙（RAIL-ROOT-CAUSE §6/§7）。
- **原生对话视图的轨去留**：合并项目主路径是阅读视图；若保留原生视图可达（宿主切换），轨的双挂载点都要维护。Phase B 完成后实测决定：若原生视图轨维护成本高，可降级为「阅读视图专精」，原生视图不渲染轨（删 utilities 槽注册）。
- **工作量**：Phase B 的 outline 融合是最大不确定点（需要动 useChat 投影层），预留了独立 phase；总体估 3-5 个工作日。
