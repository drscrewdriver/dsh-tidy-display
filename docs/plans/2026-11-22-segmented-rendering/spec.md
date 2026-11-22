# Spec: dsh-tidy-display 分段分发渲染层(吸收 dsh-genui + dsh-raw-html-v2)

## 背景

三个 DSH web 插件的"生成式 UI"协议在同一份助手回复流里互相打架:

- **raw-html-v2 开启**:它以 `priority:-10` shadow 接管 `conversation.chat.node`/`assistant-step`,其切段器只认 `vcp-root` 裸 HTML;`dsh-ui` 围栏(genui 协议)被当普通 md 段喂给官方 MarkdownText → **数据表格以 JSON 花括号裸奔**。
- **raw-html-v2 关闭**:回复中残留的 VCP 裸 HTML 在阅读视图走 mdast `html` 节点 = 字面文本(`src/client/markdown/render.tsx:283-285`)→ **标签乱撒**。未闭合的行首 `<div id="vcp-root">` 在 CommonMark html 块规则下还会吞掉其后所有行(直到空行/文末),整条消息变成源码文本。
- 根因:现有共存机制(shadow 整节点委托 + `genui-plate.ts` 补底)只解决"整节点渲染归属",没有**内容级分段归属**。

目标:在 tidy-display 内实现**分段分发渲染层**(最终代码全部落在本仓库,实现方式允许与原版不同):对助手文本按 md / `dsh-ui` 围栏 / `vcp-root` 裸 HTML / `mcp-app` 围栏分段,各段交给最优渲染器;不可渲染时卡片化 + 默认折叠;带识别容错与段级格式校验。

## 需求

1. **分段**:助手 `kind:'text'` 块的 markdown 流内识别并拆出三类特殊段:`dsh-ui` 围栏、`vcp-root` 裸 HTML、```html 围栏包裹的 vcp 卡;md 段保持现有渲染管线不变;`mcp-app` 围栏走既有通道不动。
2. **卡片化**:特殊段以卡片展示(VCP 卡走移植引擎真渲染;dsh-ui 段走 genui embed 全量交互渲染);**非渲染情况**(解析失败/引擎缺失/开关关闭)默认折叠展示源码,绝不裸撒标签或 JSON。
3. **识别串增强**:行首 `<div id="vcp-root">` 检测(行内提及不误切);```html 围栏包裹容错(`stripFenceWrapper`);`dsh-ui` 围栏语言别名/标点容错(`normalizeFenceLanguage`);协议约定经 systemPrompt 下发。
4. **段级格式校验**:dsh-ui 段 JSON guard 校验(`processGenuiSpec`);vcp 段标签配平校验(`scanVcpDiv`);校验失败段渲染"错误徽章 + 折叠源码"卡。
5. **安全特化**:**不移植** raw-html-v2 的"可信模式 eval";含 `<script>` 的 VCP 卡自动改走 `McpAppFrame` 沙箱 iframe(`allow-scripts allow-forms`,无 `allow-same-origin`);genui 的无 eval 白名单管线原样保留。
6. **设置**:三个新开关——`segmentCards` 分段渲染总开关(默认开)、`cardCollapseDefault` 不可渲染段默认折叠(默认开)、`renderMode` 渲染模式 `native`(原生分段,默认)/`delegate`(委托外部渲染器,现行为)。
7. **共存**:阅读视图默认原生分段;原生"对话"视图行为不受影响;`genui-plate.ts` 保留(原生视图下 genui 共存仍需要)。
8. **部署指引**:新版以 `native` 模式安装后,客户端检测到 genui / raw-html-v2 在场时,在设置卡显示建议禁用提示(协议教学三重注入污染模型、双引擎重复加载、全局样式副作用、原生视图旧冲突残留);`delegate` 模式依赖 raw-html-v2 在场,提示相应放宽。
9. **右下角浮动控制簇(dock)**:`position:fixed; right:14px; bottom:14px` 的胶囊簇(风格仿 raw-html-v2 可信徽章)——渲染模式 native/delegate、分段开关、卡片折叠默认三个快捷开关直接在簇上切换;点击展开 ~248px 设置面板(仿 raw-html-v2 "VCP 渲染设置"面板:主题 token、ESC/外点关闭),含共存检测提示与完整渲染设置入口。**双视图生效**(阅读 + 原生对话,渲染模式影响两者);**不向 composer 工具栏注入任何按钮**(与 raw-html-v2 的 `</>` 注入方式划清界限);窄屏降级;设置页五处锁步保留为完整入口,dock 只调同一 store actions。
10. **协议编码模式开关(dock 面板,教学端)**:三协议各自独立开关——`dsh-ui 教学` / `VCP 卡教学` / (mcp-app 走既有 skill 不另设);默认全开。**语义 = 教学端开关**:关闭某协议后 systemPrompt 不再教模型输出该类新卡,**历史消息中的既有卡照常渲染**(渲染端与教学端解耦)。开关经 POST `/tidy-display/protocol-state` 同步 node 半落盘,`systemPrompt.section` 的 `text()` 按状态动态反映(下一回合生效)。统一段文本**基于两套原提示全文提取与兼容性合并分析**(findings.md §8:通道路由表 + 领域让渡 + 承重铁律精编 + 美学外置,非两份全文拼接),六处冲突域(C1-C6)逐一给出改造解。

## 技术方案

### 分层架构

```
AssistantNode (Reader.tsx:160)
  ├─ renderMode==='delegate' → AssistantStepDelegation(现行为,设置可回退)
  └─ renderMode==='native'(默认)
       └─ Blocks(:130) → ReadingMarkdown(:85) → MarkdownText → parse(mdast)
            ├─ case 'code' + lang=dsh-ui(别名容错) ──→ DshUiSegmentCard
            │     ├─ streaming → 占位卡(照 StreamingMcpAppPlaceholder:341)
            │     ├─ resolveFenceSpec+processGenuiSpec → <GenuiBlock spec stateKey>
            │     └─ 失败 → 错误徽章 + 折叠 JSON 卡
            ├─ case 'code' + lang=html + 含行首 vcp-root ──→ VcpSegmentCard(围栏容错路线)
            ├─ case 'html' + 行首 vcp-root 开标签 ──→ VcpSegmentCard
            │     ├─ streaming 未闭合 → 占位卡("卡片渲染中")
            │     ├─ 卡内含 <script> → McpAppFrame 沙箱 iframe
            │     ├─ 无脚本 → vcpEngineRender(移植引擎) + VcpErrorBoundary
            │     └─ 失败/关闭 → 错误徽章 + 折叠源码卡
            ├─ case 'code' + mcp-app(已有 :338-345,不动)
            └─ 其余 → 现有渲染不变
```

### 新模块清单

| 模块 | 内容 | 来源 |
|---|---|---|
| `src/client/vcp/segmentation.ts` | `splitVcpText` 全家(~226 行纯字符串函数)+ `splitMermaidFence` + `stripFenceWrapper` | raw-html-v2 client.js 2463-2688 TS 化 |
| `src/client/vcp/shims.ts` | `vcpFilterStyle`/`vcpHpShim`/`vcpVcShim`/href/src 白名单 | client.js 2700-2782 |
| `src/client/vcp/bootstrap.ts` | `ensureVcpEngine`(XHR `/tidy-display/vendor/vcp-engine-v1.js`,5×500ms 重试,`f={Fragment,jsx:createElement}`) | client.js 2816-2843 |
| `src/client/vcp/render.tsx` | `vcpEngineRender` + `vcpSettleMemo` + `VcpRootFontGuard` | client.js 2786-2908 |
| `src/client/vcp/error-boundary.tsx` | `VcpErrorBoundary` | client.js 3327-3349 |
| `src/client/segments/SegmentCard.tsx` | 卡壳:标题栏+`Disclosure`+错误徽章+流式占位+折叠默认 | 复用 motion.tsx:90 / ReasoningCard 套路 |
| `src/client/segments/DshUiCard.tsx` | genui embed 接线卡 | `@changfenhuang/dsh-genui/embed` |
| `assets/vendor/vcp-engine-v1.js` | 引擎本体(零改动拷贝,删 6 行 `dsh.rawHtml` 自检) | raw-html-v2 assets |

### node 半(`src/dsh-tidy-display.ts`)

- `inject` 扩为 `['webServer','systemPrompt']`(systemPrompt 服务宿主已验证可注入,模式照 raw-html-v2 index.js:608-621)。
- 新增 `kind:'prefix'` 路由 `/tidy-display/vendor/`:伺服引擎文件 + `@changfenhuang/dsh-genui/lib/assets/*.js`(经 `require.resolve('@changfenhuang/dsh-genui/package.json')` 定位;MIME 白名单 + 防穿越 + Cache-Control,抄 index.js:685-737;注意 (kind,path) 重复注册抛错)。
- 新增 `kind:'exact'` POST 路由 `/tidy-display/protocol-state`:dock 协议模式开关 → node 半落盘(`~/.dsh/` 状态文件)→ 供 systemPrompt `text()` 读取(POST 先例:`/tidy-display/reveal` 已在 farm 21 格探针验证可用)。
- 新增 `systemPrompt.section({name:'dsh-tidy-display:segments'})`:统一协议教学(dsh-ui JSON 围栏规范 + vcp-root 裸 HTML 规范 + 识别串约定 + 严禁围栏包裹 vcp 卡);`text()` 按三协议开关 + 渲染模式 + 分段开关动态拼装——关闭的协议不再教学、渲染模式为 delegate 或分段关闭时注入降级文本(照 raw-html-v2 DISABLED_TEXT 模式)。

### 设置(照 frostedGlass 五处锁步)

`reader-prefs.ts`(字段+FIELDS+DEFAULTS)→ `config.ts`(schema 行)→ `store.ts`(init+setXxx)→ `SettingsSection.tsx`(switch 行)→ `types.ts`(openPrefs);`config-bridge.ts` 遍历 FIELDS 自动生效。

## 决策记录

| 选项 | 选择 | 理由 |
|---|---|---|
| genui 渲染深度 | 完整嵌入 embed 入口(npm 依赖) | 官方为此设计的公共入口(embed.ts 注释明示);60+ 组件全交互;tidy 与 genui 的 CSS Modules 打包协议同源(lightningcss 同款),零改动接管 |
| VCP 渲染深度 | 完整引擎移植 | 最小移植包 ≈535 行宿主 JS + 104KB 引擎 + 1 条路由;缺失资产全部优雅降级(逐项核实不崩) |
| 卡内 `<script>` | 沙箱 iframe 承接 | 不越过安全边界(主页面永不 eval);动画卡仍可跑;McpAppFrame 设施现成 |
| 与原插件共存 | 阅读视图原生分段优先 + 可切换 | 分段是唯一同时救两种协议的方案;委托模式保留为逃生门 |
| 切段层位 | mdast 层挂点(照 mcp-app 先例) | 不碰流式增量解析器;renderCode 已有 lang 分支先例,风险最低;未闭合 html 块的流式增长已被 incremental.ts 尾区正确处理 |
| 同回合 steer 纠错 | 本期不做(后置可选) | 需 5 项宿主服务(session 事件/sessions store/agent-turn-stopping/llm-stream/dsh-llm);首版以 client 侧段级校验兜底 |
| 渲染设置入口形态 | 右下角胶囊簇 + 展开面板(双视图,不碰 composer) | 用户指定;原型 = raw-html-v2 可信徽章(`right:14px;bottom:14px`)+ "VCP 渲染设置"面板(248px,主题 token);比 composer 注入(`</>` 按钮)干净,不挤占输入框工具栏 |

## 约束

- 不改 `MarkdownRenderContext` 签名;fillComposer 经 `ComposerFillContext`(Blocks.tsx:133 Provider 已存在)。
- react/react-dom/cordis/`dsh-client-ui-primitives` 保持 external(client-build.js PLATFORM_MODULES);严禁把 react bundle 进 client。
- 引擎文件除删 6 行 `dsh.rawHtml` 自检外零改动;开关键换 `dsh.tidyDisplay.*` 命名空间。
- 回归基线:farm 兼容矩阵 **21/21 绿**(2026-11-22 实测,`scripts/test-host-compat.mjs`);`npm run check` 全绿。
- genui 成就遥测写 localStorage(GenuiBlock 无条件行为)——无害保留。
- 分支:实施前 `git checkout -b feature/segmented-rendering`(main 之上)。
