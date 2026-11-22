# Findings: 分段分发渲染层前期调研(2026-11-22,三仓库克隆于 D:/tidy-display-ng/)

> **卫星档案**(同目录,细节在这里,本文件只留决策级结论):
> - [findings.prompts.md](./findings.prompts.md) — 两套提示**逐字全文**(VCP 结构层/美学层/DISABLED_TEXT + genui full/minimal/词汇表/RULES/抽取逻辑)——t4.3a 统一段起草的原始素材
> - [findings.port-details.md](./findings.port-details.md) — 移植细节:切段器闭包逐函数、URL 改点 11 处、引擎防御点全行号、React 闭包、Host 路由模板、fence-feedback 5 服务、genui 72 文件闭包分组、资产 URL 机制、裁剪路径

## 一、tidy-display 挂点(为什么挂 mdast 层)

- 渲染链:`Blocks.tsx:108-140`(kind 分发,text→`ReadingMarkdown`:110)→`word-motion.tsx:70-92`→`MarkdownText.tsx:170-195`→parse/render。AssistantBlock 仅 5 种 kind(宿主 records.d.ts:27-44),特殊内容全在 text 块 md 流里——**分段必须在 markdown 管线内**。
- 先例:mcp-app 围栏识别 `mcp-app.ts:173-190`(`isMcpAppCodeBlock` 多别名),挂点 `render.tsx:338-345`(renderCode 内分支,流式占位 :341)。**dsh-ui/vcp 分支完全同构**。
- `render.tsx:283-285` case 'html' = 字面文本;CommonMark type-6 html 块仅空行终止→未闭合行首 `<div id="vcp-root">` 吞掉后续行(现状"整条消息变源码"根因);VCP 协议"卡内无空行"+卡后空行使 html 节点恰好只含卡体——**mdast 挂点天然成立**,无空行场景卡内二次解析兜底。流式未闭合块落在 incremental.ts 尾区(`UNSTABLE_TAIL_BLOCKS=2` :35)随 chunk 增长,占位卡方案可行。
- 能力传递:`MarkdownRenderContext`(:126-149)无 fillComposer/onRead→不改签名,新卡经 `ComposerFillContext`(McpAppFrame.tsx:19-23,Blocks.tsx:133 Provider)自取 fillComposer(index.tsx:316-330 shell.setDraft+DOM 兜底);renderAtom(:286-289 包裹)免费提供词级动画原子性。
- 配置五处锁步(frostedGlass 模板):reader-prefs.ts:8-67→config.ts:33-50→store.ts:11-136(dsh.reader.v1 :110)→SettingsSection.tsx:218-239→types.ts:42-60;config-bridge.ts:45-118 遍历 FIELDS 自动桥。
- 折叠卡先例:`Disclosure`(motion.tsx:90-102 受控)、`ReasoningCard`(:17 useState,:232-287 高度过渡)。
- node 半现状:`inject=['webServer']`(dsh-tidy-display.ts:27),exact 路由 :46-48/:87-89 在 ctx.effect 内(:109-112 dispose)。prefix 路由照 raw-html-v2 index.js:685-737(MIME/防穿越/Cache-Control;**坑**:(kind,path) 重复注册抛错 :749-767)。systemPrompt 可注入(raw-html-v2 index.js:38/512/608-621 `section({name,order,text:()=>…})`)。

## 二、raw-html-v2 可移植件(最小包 ≈535 行 + 104KB 引擎 + 1 路由)

| 层 | 部件 | 行号(client.js) | 重接线 |
|---|---|---|---|
| L0 | 引擎本体(自包含 IIFE,自由符号仅 vc/hp/f,零 URL) | 整文件 1921 行 | 无 |
| L1 | vc/hp shims + ensureVcpEngine | 2700-2843 | XHR URL(:2824)改 `/tidy-display/vendor/`;`f={Fragment,jsx:createElement}` 必须包(:2827-2831 坑);`__dshInput` 桥 fillComposer |
| L1 | vcpFontUrlCompat/VcpRootFontGuard/vcpSettleMemo/vcpEngineRender | 2786-2908 | 无(纯函数式,LRU 16) |
| L1 | VcpErrorBoundary | 3327-3349 | 无 |
| L2 | 切段树 splitVcpText 全家 + splitMermaidFence | 2463-2688 | **100% 纯字符串函数零依赖**;PAGE_OPEN_RE(:2563)/MERMAID_FENCE_RE(:2594) 随迁,保 lastIndex 语义 |
| L3 可选 | 资产加载器 :520-567(5 处 URL)/整页卡 :2913-2931 | — | — |
| 不搬 | IO 热窗 :2945-3319(DSH 性能优化)/可信模式 eval :90-135 | — | 安全决策:script 卡走沙箱 |

降级矩阵(全部不崩):无 KaTeX→占位(:1264-1269,:1638-1648 轮询放弃);无 mermaid→源码框(:1413,:1511);无 VCPColorEngine→失色板(:1687-1688);无字体→系统链;`__vcpTrusted` 未提供→script/on* 剥离(:104-109,vc shim :2742)。引擎 window 侧写:__vcpFast(:162)/__vcpMsgScripts(:121-123)/reduced-motion(:69-76)/写 localStorage['dsh.rawHtml'](:81-86,副本删 6 行)。键名换 `dsh.tidyDisplay.*` 只改 client 侧三常量(:43-44,:62-64)。

## 三、genui embed(整包嵌入零障碍)

- `src/client/embed.ts` 官方嵌入入口("for hosts that embed GenUI without the DSH plugin runtime"):GenuiBlock/GenuiActionContext/ErrorBoundary/processGenuiSpec/setGenuiAssetBase/artifact。
- GenuiBlock 最小 props `{spec}`(blocks/state.ts:12-37)自足;无 Provider→display-only。宿主值导入仅 primitive-adapter.ts:1(dsh-client-ui-primitives,tidy PLATFORM_MODULES 已 external);`__DSH_BOOT__` 仅 asset-loader.ts:56,setGenuiAssetBase 后不参与。闭包 ≈72 文件+13 module.css+katex(tidy 已有)+react(双方 external 单例)。
- **CSS 协议同源**:genui `dsh-css-modules-inline`(\0dsh-css: 前缀+lightningcss `[hash]_[local]`+`<style data-plugin-css>`)与 tidy client-build.js `dshx-css-modules-inline`(:95-117)同款——13 个 module.css 零改动接管。
- 资产:lib/assets/{mermaid,three,echarts-core,echarts-full,maplibre,icons}.js 全 IIFE 随包发布;`setGenuiAssetBase` 后走嵌入方路由(仿 serveGenuiAsset plugin/index.ts:71-127:文件名白名单/ETag/304/分级缓存);node 半经 `require.resolve('@changfenhuang/dsh-genui/package.json')` 定位。表格路径零引擎。
- 解析/修复闭包:fence-language.ts(31 行)/fence-repair.ts(766 行)零依赖;fence-resolve+guard 闭包 ≈21 纯文件(resolveFence raw,{settled})。

## 四、互操作现状与回归基线

- `official-slots.tsx:88-100` isShadowWinner(priority<0)+`Reader.tsx:164-172` 整节点委托=raw-html-v2 现通路;`renderMode=delegate` 保留。`genui-plate.ts` 保留(原生视图共存);Reader 保留 `.md-code-block` 类(Reader.module.css:671)→原生视图 genui DOM 接管照常。
- farm 基线:2026-11-22 全量 21/21 绿(0.1.0-rc.2~0.2.2-rc.1),`.compat-results/` 证据。

## 五、dock(右下角浮动控制簇)原型与接入面

- 原型:raw-html-v2 可信徽章 `installTrustedToggle`(:100-135)`right:14px;bottom:14px;z-index:900`;`</>` 面板 `createPanel`(:380-447)248px、`--dsw-alias-*` token、ESC/外点关闭(:444-484)。
- composer 注入面不跟随:`</>` 挂 composer 尾部工具栏(client.js:5;`findComposer`=`[data-composer-card]` :141-149)——tidy 走 body 直挂 fixed(DESIGN.md:composer 宿主自有)。
- 挂载:client entry `apply` 时 createRoot 挂 body,双视图常驻;窄屏降级单胶囊;`#vcp-trusted-toggle` 在场时上移偏移。
- 教学端状态同步:**单一 POST exact 路由**(`/tidy-display/reveal` 已 POST 且 farm 21 格全绿);不抄 raw-html 的 RPC+兜底信封双腿(client.js:500-505→index.js:584-588→`~/.dsh/dsh-raw-html-v2-state.json`,兜底 :1115-1194)。

## 六、协议教学来源机制(现状事实)

- **raw-html-v2**:index.js:605-622 `section({name:'raw-html-v2:vcp',order:200})`;文本=`buildStructuralText(DESIGN.md)`(:142-195)+`buildAestheticText`(:200-232);`</>` 面板→RPC set-state→落盘→`text()` 按开关返回完整教学或 DISABLED_TEXT。
- **genui**:plugin/index.ts:191 `inject=['systemPrompt']`;`genui:reference`/`genui:fence`(:313-325,order=`getSectionOrder('STRUCTURED_OUTPUT')`);GENUI_SECTION_TEXT(:134-160)/MINIMAL(:163-170)/QUICK_REFERENCE(:172-178)/REFERENCE_RULES(:180);componentReference 从 SKILL.md 抽 4 章节(:218-239);assemble 钩子按 skill 可见性选档(:326-368);辅助=validate_dsh_ui 工具+bundled skill(rank 600)+fence-feedback steer。
- 推论:两插件在场=两套(部分矛盾)教学并发——表格变 JSON 花括号的协议层根因。

## 七、部署共存(native 模式建议禁用两个原插件)

依据:①教学权收归单一来源(协议层根因);②双引擎重复加载;③全局副作用(raw-html 引擎注入 vcp-anchor-lock 关 overflow-anchor,引擎 :1828-1854);④原生视图旧冲突残留。例外:`delegate` 模式须保留 raw-html-v2;genui 的 steer/validate 工具卸载即失效(本期 steer 后置)。检测面:`window.__DSH_BOOT__.entries`(genui asset-loader 自身依赖)。

## 八、两套提示全文提取与兼容性合并分析(开工前完成项,2026-11-22)

### 8.1 全文提取清单(逐字全文见卫星 [findings.prompts.md](./findings.prompts.md),此处为结构摘要)

| 文本 | 位置 | 规模 | 要点 |
|---|---|---|---|
| VCP 结构层 | raw-html-v2 lib/index.js:142-195 `buildStructuralText` | ~1900 字 | 输出纪律(直出裸 HTML/严禁```html围栏/禁文件交付)、主动判断(场景→形式映射)、心流纪律(思考最小化/内容定稿→装帧一次成型)、落盘清单 15 条(**渲染承重**:根容器 `<div id="vcp-root">` id 非 class/开标签短关键值(font-family 必须内联)/样式 `#vcp-root` 前缀/卡内无空行/无 backdrop-filter/交互仅 `onclick="input('…')"`/无 script/禁 flex-wrap·margin auto/SVG viewBox+width/height/CSS≤200 行·类≤12/img 非 markdown/代码尖括号转义)、能力速览($$/mermaid/details/pre+code)、DESIGN.md 路径引用 |
| VCP 美学层 | :200-232 `buildAestheticText` | ~1100 字 | 审美公约 11 条(对齐成网/一屏一焦点/明度即层级/吝啬即重量/留白分卡/60-30-10/字体三员/图必有义/**禁 Emoji**/数据诚实/字级阶梯)、风格检索 RAG 四步(styles 索引→slug→_FONTS→_BASELINE 兜底)、Lanxi 字体直写、惊艳出口(深底三要求)、`data-vcp-preset` 五预设、三文档路径(EDITORIAL/FRAMING/BREATH) |
| genui full 档 | genui src/plugin/index.ts:134-160 | ~1500 字 | dsh-ui 围栏交付+JSON 示例、`LOAD_GENUI_SKILL`(MUST call skill tool)、RFC2119、何时用组件(比较→table/choices;数值→chart/echart/table;步骤→steps/diagram/mermaid;筛选→input/select+结果组件;**普通解释默认正文,无配额**)、Rules 9 条(LANGUAGE 匹配对话语言/JSON 严格合法+≥3 节点或含 table MUST validate_dsh_ui 后**逐字复制**/规模≤200 节点嵌套≤8/LOCAL-FIRST+action 以 `[genui-action]` 回传/Secrets ban/render_ui 工具通道 vs 正文围栏 vs panel:true/围栏只写正文(思考里不渲染)/panel:true 原地更新 append:true 上限) |
| genui minimal 档 | :163-170 | ~120 字 | 精简版(仍 MUST load skill) |
| genui 词汇表 | :172-178 QUICK_REFERENCE | ~300 字 | 组件 type 全列表+chart/table/callout/stat/keyvalue/steps/file-tree 字段速览+button/choices 需 action |
| genui 抽取 | :218-239 componentReference | 按需 | SKILL.md 四章节(组件词汇/行内富文本/Computed/地图)减去 skill 已加载内容 |

### 8.2 冲突域识别(两套同时注入时的实际矛盾)

| # | 冲突 | VCP 说 | genui 说 | 严重度 |
|---|---|---|---|---|
| C1 | **数据表格/图表归属** | "汇总/列表/对比/排名/进度→卡片、表格、SVG 图表" | "比较→table、数值→chart/echart(dsh-ui)" | **高**——同一内容双指令,表格变 JSON 花括号的直接原因 |
| C2 | **工具调用纪律** | "不调用除 styles/ 美学检索外的任何工具" | "MUST load genui skill;≥3 节点 MUST validate_dsh_ui" | 高——直接互斥 |
| C3 | **视觉交付全称声明** | "**一切**视觉内容必须直出裸 HTML(唯一交付方式)" | 结构化 UI 走 dsh-ui 围栏 | 高 |
| C4 | 思考纪律 | 心流:思考只准 ≤10 词关键词,"不敲代码" | "思考里验证好 spec,正文再输出同一份" | 中 |
| C5 | 美学适用域 | 美学公约对"所有回复"生效(禁 Emoji 等) | callout tone 等组件自有语义 | 低——作用域混淆 |
| C6 | 交互回流语义 | onclick=input() 回填 composer(不自动发) | action→[genui-action] 排队自动发 | 中——模型须知两通道并存 |

### 8.3 兼容改造方式(结论:**可行**——统一段 = 通道路由表 + 领域让渡 + 承重铁律精编)

统一段**不是拼接两份全文**,改造为四层结构:

1. **通道选择路由表**(新增 ~300 字):数据/比较/筛选/交互结构(表格·表单·quiz·面板)→ dsh-ui;自由视觉容器(装帧·海报·杂志·终端风·情绪表达)→ VCP 卡;复杂交互应用/原型 → mcp-app(沙箱);普通解释/短清单 → 纯 markdown。注明"就近选,选错也能渲染"(渲染端兜底,降低模型选择焦虑——tidy 分段层保证两种协议都能渲)。
2. **领域让渡**(解 C1/C3):数据表格/图表/表单/quiz **让渡 dsh-ui**(交互与状态持久是 VCP 缺失的);VCP 的"一切视觉内容"改为"自由视觉容器类";"汇总列表→卡片表格"改写为"汇总列表优先 dsh-ui table,需视觉装帧的数据卡才走 VCP"。
3. **工具纪律合并**(解 C2):"styles/ 检索、genui skill 加载、validate_dsh_ui 按所选通道调用;除此之外不额外调工具"。
4. **承重铁律逐条保留**(渲染器实际约束,源自 8.1 提取):VCP 15 条落盘清单全保(id=vcp-root 是作用域化前提;开标签短关键值是流式空窗前提;#vcp-root 前缀是样式锁前提;onclick=input 桥;无 script 由沙箱兜底但教学仍禁);genui 保 JSON 合法+validate 逐字复制+规模上限+围栏只写正文+panel 语义+secrets+LANGUAGE。
5. **作用域限定**(解 C5):美学公约/风格 RAG/Lanxi 字体仅约束 VCP 卡;dsh-ui 用组件语义+宿主 token。禁 Emoji 等条款随作用域走。
6. **交互语义分工**(解 C6):写明两条回流通道并存及各自行为。
7. **思考纪律统一**(解 C4):取 VCP 关键词级底线,允许验证型思考(validate 调用不算思考税)。
8. **非承重内容外置**:审美公约精简为 6 条底线常驻,完整 11 条+风格库走 styles/ RAG 按需;DESIGN.md/SKILL.md 引用保留(常驻指令小、知识按需大——两原版共同的 RAG 化取向)。
9. **降级链**:dock 关某协议教学→该通道从路由表摘除;全关或 delegate/分段关闭→DISABLED_TEXT(照 raw-html-v2 :509 模式)。
10. **两档制**(沿 genui):有 skill 工具→精简版+文件引用;无 skill 工具→注入 QUICK_REFERENCE 组件词汇表。

### 8.4 落地参数

- section 名 `'dsh-tidy-display:segments'`,order 取 `getSectionOrder('STRUCTURED_OUTPUT')`(genui 同款);状态源=dock 三协议开关+渲染模式+分段开关(POST `/tidy-display/protocol-state` 落盘)。
- 统一段预计常驻体积 ≤ VCP+genui 两份常驻之和的 70%(路由表新增 vs 去重后的纪律合并+美学外置)。
