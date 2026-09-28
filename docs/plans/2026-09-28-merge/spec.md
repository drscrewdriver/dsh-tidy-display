# Spec: dsh-tidy-display —— tidychat × tidy-display 合并项目（DSH 0.1.7 基准）

## 需求

以 **DSH 0.1.7-rc.2** 为唯一目标宿主，把 `dsh-tidychat` 与 `dsh-tidy-display`（fork）缝合为一个插件 **`dsh-tidy-display`**（npm: `@drscrewdriver/dsh-tidy-display`），整合双方 UI 优点，构造性消除两插件的 DOM 契约冲突。

**保留的功能（合并后全量）**：
- 来自 tidy-display（主体）：阅读视图（过程/思考/最终回答渲染）、自动折叠与过程编排、消息气泡（半透明底）+ 玻璃模式、推理思考衬底（本轮新增）、交付物行、官方桥接（工具/反馈/turnTail）、设置分区、mcp-app、等待时钟等全部现有能力
- 来自 tidychat（移植）：canvas 消息轨（鱼眼悬停、拖动预览、点击跳转、当前轮高亮、摘要卡）、白色柔光外圈（navRing）、横线/圆点样式、左/右贴边镜像、配色链（自动/调色盘）、智能加载更早历史（autoLoad Governor）、诊断报告
- 锚点契约修复（PR aa2246740/dsh-tidy-display#41 的等价改动）作为内部事实随合并携带

**明确丢弃（及理由）**：
- tidychat 折叠 / 分隔线手术 → bd auto-fold 已覆盖且更优；两套 DOM 手术必然打架
- 首次引导（双轨二选一向导）→ 单插件无双轨困惑
- 「接管官方消息轨」开关 → 阅读视图不渲染官方 TurnNavigator，接管语义自然消失；原生对话视图兼容问题随之不存在（合并后只走阅读视图一条渲染路径）
- tidychat 的 0.1.2~0.1.6 兼容层（installSettingsSection 双路径、legacy 线）→ 锁定 0.1.7

## 技术方案

### 底座与代码起点
- **底座 = tidy-display fork**（`refer-dsh-tidy-display` @ `feat/message-bubbles`，含锚点修复、思考衬底、模块 id 钉死）。理由：reader 6.5k 行是复杂度主体且持续跟 rc 演化；tidychat 需要移植的只有 ~800 行（轨组件+配色链+autoLoad+诊断）
- tidychat 侧以 `release/0.1.7`（b38c26e + 白色柔光改动）为移植源

### 架构
```
dsh-tidy-display/
├─ src/dsh-tidy-display.ts          # host 半（bd 原 host 半 + 声明式 volatile schema 并入轨配置）
├─ src/client/
│  ├─ index.tsx                      # bd 客户端入口（原样）
│  ├─ Reader.tsx / Blocks / ...      # 阅读视图全家（原样，含锚点契约行）
│  ├─ TimelineRail.tsx               # 【移除】——由移植的 canvas 轨接替（见下）
│  ├─ rail/                          # 【新】tidychat 轨移植包
│  │  ├─ RailView.tsx                # canvas 轨组件（鱼眼/命中/跳转/tip/柔光外圈）
│  │  ├─ colors.ts                   # 配色链（parseRgba/contrastRatio/resolveNavColors/applyNavColors）
│  │  └─ outline.ts                  # 【新】bd 大纲数据 → 轨数据源适配（含未加载轮占位）
│  ├─ autoload.ts                    # autoLoad Governor（对接 reader 的 loadOlder/loadThrough）
│  └─ diagnostics.ts                 # 诊断报告（口径统一走行采集 helper）
└─ ...
```

### 关键设计
1. **单轨融合**：tidychat canvas 轨为唯一轨渲染器；吸收 bd `TimelineRail` 的数据源 `mergeTimelineItems(turnNavigationItems, turnOutline, turnsWithDeliverables)`——已加载窗口用 DOM 行（DOM 单一事实源，精确几何/跳转），未加载轮次用 outline 占位标记（点击走 `loadThrough` 加载后落位）。bd TimelineRail 组件移除。
2. **双视图下轨都可用**：阅读视图内轨挂 reader 内部（替代 TimelineRail 位）；保留原生对话视图路径时轨继续走 `conversation.session.header.utilities` 槽（现有代码原样）。
3. **配置合并**：轨配置（navigator/navSide/navStyle/navRing/配色五项/autoLoad）以声明式 volatile schema 并入（0.1.7 configForms 自动成表），与 bd 的 `dsh.reader.v1` prefs 并存但统一进一张「Tidy Display」设置卡；键名沿用 tidychat 已发布键，老用户 settings.yaml 迁移零成本。
4. **锚点契约**：行级 `data-chat-anchor-key`/`data-chat-flow-kind` 内部自带（本会话已改）；对外仍保留——将来第三方插件同样受益。

## 决策记录
| 选项 | 选择 | 理由 |
|---|---|---|
| 底座 bd vs tidychat | bd fork | reader 是复杂度主体（6.5k vs 2k）且需持续跟宿主 rc；tidychat 移植面小且功能独立（轨/配色/自动加载可整体搬） |
| 单轨 vs 双轨 | 单轨融合 | 合并的初衷就是消冲突；canvas 轨渲染能力（鱼眼/命中/柔光）+ bd 大纲数据（全会话覆盖含未加载）互补，TimelineRail 无存在必要 |
| tidychat 折叠/分隔线 | 丢弃 | bd auto-fold 覆盖；双手术必打架（会话内已论证） |
| 0.1.7 以下兼容 | 丢弃 | 用户明确以 0.1.7 为基准；砍掉双 API 注册/legacy 线减一半维护面 |
| 与 PR #41 的关系 | 不阻塞 | 上游合并→fork 基更干净；不合并→合并项目内部已自带修复，无影响 |

## 约束
- 禁止硬编码 CSS Module hash 类名（两边共同的设计红线）
- 模块 id / bundle id / 包名三处必须一致为 `@drscrewdriver/dsh-tidy-display`（本轮部署踩过的坑，源码钉死）
- peer range 锁 `>=0.1.7-rc.1 <0.1.8`；`compat/harness-rc2.json` 升级门保留
- 主题颜色只跟随 DSW 语义 token + 保守兜底原则（tidychat HANDOVER 原则 1）继续有效
- lib/ 产物照旧入库（bd 既有约定）
