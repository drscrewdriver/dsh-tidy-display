# 移植细节卫星档案(Phase 1-3 执行参考——行号基准 2026-11-22 克隆)

## A. raw-html-v2 → tidy 移植

### A.1 切段器闭包明细(client.js)

```
splitVcpText (2643-2688)
  ├─ findVcpOpen (2513-2526)          ← 每次调用新建正则,无共享状态
  ├─ findPageOpen (2566-2574)         ← 用模块级 PAGE_OPEN_RE (2563),内部重置 lastIndex
  ├─ scanPageEnd (2576-2579)
  ├─ scanVcpDiv (2467-2506)           ← 标签级配平,跳过 RAWTEXT(script/style/textarea/title 内容里的 </div> 不是标签)与注释
  ├─ swallowTrailingRaw (2537-2547)   ← 吞卡尾 <style>/<script>(含流式半截,交给引擎 RAWTEXT 跨帧续接)
  ├─ trimTrailingOpenTag (2630-2642)  ← 剥 md 尾部未完成开标签,防流式起始闪源码帧(F1)
  └─ stripFenceWrapper (2618-2623)    ← 剥 ```html 纯围栏包装
辅助(独立):
  mdEscapeInlineFences (2290-2304) / splitMdFences (2313-2341)
  splitMermaidFence (2595-2612) ← MERMAID_FENCE_RE (2594)
  scopePageCss (2582-2587)            ← 整页 html/body 选择器脱敏 .vcp-page-host
  swallowTrailingStyle (2548-2555)    ← 死代码(仅定义未调用),不搬
protectCodeEntities → 在引擎内(1052-1067),随引擎带走
```
全部纯字符串函数,零外部引用;TS 化保留 PAGE_OPEN_RE 的 lastIndex 复用语义。

### A.2 URL 改点清单(宿主路由改名 `/tidy-display/vendor/`、`/tidy-display/fonts/` 时)

- 引擎 XHR:client.js:2824
- KaTeX 链:539(katex-vd.css)/541(katex.min.js)/542(auto-render.min.js)
- Mermaid:551;色彩引擎:566
- 下载内嵌(可选部件):661/668/690
- 字体:vcpFontUrlCompat 替换目标 2787、@font-face 注入 880/1047、urlRe 637
- 引擎文件本身 **0 处**(:1678 仅注释)

### A.3 引擎防御点与 window 侧写(降级依据)

- 全局缓存:`__vcpFast`(:162 流式状态机 F)/`__vcpTrustedRan`(:144)/`__vcpMsgScripts`(:121-123)/`__mermaidInitialized`(:1414-1417)
- 副本可删:`dsh.rawHtml` 自检写 localStorage(:81-86,6 行)
- 可信开关:isTrusted(:104-109 catch→false)——**tidy 不提供 __vcpTrusted**,script/on* 自动剥离
- 数学:mathPlaceholder(:1264-1269 纯源码层占位)/processMath(:1638-1648 typeof 检查,30×200ms 轮询放弃)/renderMathInContent(:1314-1329 只注册 $$·\[\]·\(\))/convertSafeDollarMath(:1211-1258)/lockKatexStyles(:1336-1363)
- mermaid:mermaidBlockConvert(:1036-1043 源码层转白底框)/warmupMermaid(:1413-1419)/renderMermaidInContent(:1509+,缓存 30)
- 色彩:chromeForProps(:1687-1688 无引擎返回 null 不缓存)/applyColorVars(:1740)
- 核心:scopeVcp(:336-355 uid 替换)/scan(:413-539)/commit(:1003-1009 缓存元素引用跨帧跳 diff)/fullRender(:1017-1028,1134-1142)/fixVcpBlank(:1085-1092)/boostTextImportant(:269-284)/FONT_INHERIT_RULE(:308-317)/parseOpen(:679-716,ref 锁定+setProperty important)/enforceFontChain(:969-1001 六属性锁)/healSvgAnimation(:950-967)/finalizeRoot(:880-897)/guardChildren(:752-800)/closeBracesSmart(:589-619)/applyRootGuard(:732-740)

### A.4 React 侧闭包(client.js,require('react') :37-38)

- `vcpFilterStyle` :2700-2705(滤 position:fixed/z-index≥4位/content)
- `vcpHpShim` :2707-2717(CSS 串→camelCase)
- 白名单 :2718-2719(href `^(https?:|mailto:|/|#)`、src `^(https?:|data:image/|/|#)`)
- `vcpVcShim` :2721-2782(script/object/embed 丢弃;iframe 仅 https|/;on* 剥离,唯一例外 onclick="input('…')" 桥 :2747-2750→`window.__dshInput`;可信时 on* 经 ref 直写 :2768-2775——**tidy 不启用可信,此分支死**)
- `vcpFontUrlCompat` :2786-2788 / `VcpRootFontGuard` :2799-2814(display:contents+每帧幂等 setProperty)
- `vcpEngineState` :2816 / `ensureVcpEngine` :2818-2841(同步 XHR;就绪判据 status===200 且含 __vcpStable :2826;`new Function('vc','hp','f')` :2831;**vcpF={Fragment,jsx:createElement} :2832**;tried>5 放弃 :2820;500ms 重试 :2840;模块加载即调 :2843)
- `vcpSettleMemo` :2852-2853(LRU 16 :2896-2905;key=段 key;F8 泄漏自检 clear :3165/3220)
- `vcpEngineRender` :2856-2908(切段喂引擎/settle memo/VcpRootFontGuard)
- `VcpMdSafe` :2255-2283 / `VcpErrorBoundary` :3327-3349(防单卡崩溃 slot 全局 abdicate;VcpSlotGuard :3351-3353)
- 不搬:`vcpMdComp`/`vcpCodeLabels`(:2242-2249 依赖宿主 primitives)/MyAssistantView 全家(:2972-3319,IO 热窗/分组变体/groupPart)

### A.5 Host 端模板(index.js)

- `/fonts-v2` :624-679(双根 [...extraFonts,fontsRoot,BUILTIN_FONTS] :651;穿越防护 startsWith :655)/FONT_MIME :93-99
- `/vendor-v2` :684-736(单根 BUILTIN_VENDOR :709;`..` 拒绝 :704-708;startsWith :711;MIME 白名单外 403 :717-721;Cache-Control public,max-age=86400 :727)/VENDOR_MIME :102-110
- **坑**:(kind,path) 重复注册抛错(:749-767 注释;0.2.x 官方 connection 曾因 owner 失去 webServer 致 prefix 未挂)
- RPC 双腿(不搬):connection.rpc.handle :1057-1061 + 0.2.x 兜底 POST :1115-1194
- 状态链:浏览器面板 → `rpc('/dsh-raw-html-v2','set-state')`(client.js:500-505)→ index.js:584-588 setState + persistState(`~/.dsh/dsh-raw-html-v2-state.json`)

### A.6 协议注入事实

- `section({name:'raw-html-v2:vcp', order:200, text:()=>...})` :605-622;text() = render ? structural + (aesthetic ? aesthetic+风格锁定 : '') : DISABLED_TEXT(:509)
- structural 素材 = DESIGN.md 路径内联(:190 附绝对路径供 agent 按需读);aesthetic 素材 = styles/ RAG(stylesIndex/_FONTS/_BASELINE)+ EDITORIAL/FRAMING/BREATH 路径
- 教学与渲染解耦先例:关渲染仍注入 DISABLED_TEXT 教模型回退 markdown

## B. genui → tidy 嵌入

### B.1 embed 闭包分组(≈72 client 文件 + 13 module.css)

- 核心 20:GenuiBlock/inline/copy-preview-state/action-context/interaction-store/achievement-store/achievements/spec(1298 行)/conditions/computed/safe-math/date-picker/walk-spec/map-data/submission-registry/file-link/file-link-context/file-address/session-resolver/media-overrides
- i18n 4(index/runtime/en 440 行/zh 435 行);genui-runtime 4(index/limits/schema 490/value-utils)
- 表格 2(table-details/table-export);分派+块组件 22(render-node + basic/charts/forms/checkbox/advanced/image/carousel/image-group/compare/choices/svg/icon/map/blocks/editor/entity-card/popover/date-picker/segmented-control/EChartNode)
- diagram 4;懒加载 8(asset-loader/asset-script/mermaid-lazy/mermaid-safe/echarts-lazy/echarts-engine/map-lazy/map-config);icons 3(icon-data 507/icon-lazy/icon-names-full);primitives 2(primitive-adapter/primitive-labels);PlotBlock/mermaid-zoom
- 宿主专有面:值导入仅 primitive-adapter.ts:1(CodeBlock/DiffBlock/JsonTree/writeClipboard←dsh-client-ui-primitives,tidy external ✓);类型导入 file-link-context.tsx:2、session-resolver.ts:1-2(编译期擦除);`__DSH_BOOT__` 仅 asset-loader.ts:56;localStorage 全 try/catch(隐私模式降级内存)
- npm 运行时依赖:katex(inline.ts 值导入)+react;echarts/mermaid/three/maplibre/shiki/zustand 全在 devDependencies 打进懒资产或 bundle

### B.2 GenuiBlock props(blocks/state.ts:12-37)

- 必需 `{spec}`;可选 onAction?/stateKey?(localStorage 持久键)/animateEntrance?/initialState?/onStateChange?/onStateSnapshot?
- 无条件成就遥测 recordFence/recordInteraction(GenuiBlock.tsx:269/288,写 localStorage,无害)
- 无 Provider 退化:useGenuiAction()→undefined(display-only v1);FileLink→<span>(file-link-context.tsx:94)

### B.3 资产 URL 机制(asset-loader.ts:54-59)

- setGenuiAssetBase(base) → `new URL(file, base)`(未设则默认 document.baseURI,尾强制 `/`);再否则 `/plugins/@changfenhuang/dsh-genui/assets/${file}`
- rev = `window.__DSH_BOOT__.entries.find(e=>e.id==='@changfenhuang/dsh-genui')?.rev` → `?rev=` + immutable 缓存;无 boot → no-cache + ETag 重验证
- 先探测 `window.__GenuiAssets__[camelCase(name)]` 预载内联 bundle(独立 document 加载 mermaid,asset-script.ts)
- 伺服参照 serveGenuiAsset(plugin/index.ts:71-127):flat 文件名白名单 `^[A-Za-z0-9][A-Za-z0-9._-]*\.js$`(防遍历)、sha1 前 20 位 ETag、304 协商、按 ?rev 分级缓存头;缺资产响亮 404(客户端显示 fallback)

### B.4 fence-feedback 5 项宿主服务(本期后置,复刻参考)

1. session 事件流:`ctx.on('session/event'|'session/created'|'session/disposed')`;消费 turn/start、assistant/message、tool/call(validate_dsh_ui=本回合正式 GenUI 信号 :619)、tool/result(render_ui 成功=正式交付 :633)、user/message(source.kind==='plugin:@changfenhuang/dsh-genui' 识别回放纠错);需 session.header.parentSession(子代理豁免)/header.version(v4 source 形态)/snapshotEvents()
2. sessions store:`ctx.inject(['sessions'])` :685,store.list() 启动重放
3. steer 边界:`ctx.on('agent/turn-stopping',({agent,turn,signal})=>...agent.steer(msg))` :694-732;createFeedbackMessage 冻结 user-role notice :193-214(零 dsh-llm 运行时依赖)
4. llm/stream:`ctx.on('llm/stream',…,{global:true})` :687-692 + 动态 import('@deepseek-ai/dsh-llm') 取 EMPTY_RESPONSE_CODE/isAgentLoopRequest(:370)
5. 限额:MAX_CORRECTIONS_PER_TURN=2(:49,render 失败与交付提醒共享);每 fence 指纹 sha256 前 12 位每回合一次;发送前先入账防重入双发(:720-724);pendingRenders 未决保持沉默(:705)

### B.5 裁剪路径(体积超预期时)

- render-node.tsx 静态导入全部 21 块模块(:17-43)——整包不可 tree-shake
- TableNode/ChartNode 从 blocks/charts.tsx **独立可用**(闭包小:css/renderInline/i18n/GENUI_LIMITS/spec 类型/table-details/table-export/primitive-adapter writeClipboard);ChartNode 纯 SVG 零引擎
- stat(:461 起 ~90 行)/list(:549 起 ~20 行)是 render-node **内联 case**,裁剪须复制 case 体(依赖 AnimatedValue+renderInline+css 类名)
- 未知类型 default → err.unknownType 警告 div(:649);可改回退 CodeBlock

### B.6 npm 包形态与构建兼容

- files:`src` 完整 + `lib` 整目录 + 显式 `lib/assets/{mermaid,three,echarts-core,echarts-full,maplibre,icons}.js`(全 IIFE 自注册 __GenuiAssets__)
- `exports['./embed']` = `./src/client/embed.ts`(TS 源,官方预期用法 README:344;全仓 import 带显式 `.ts` 扩展,rolldown/vite 原生支持)
- CSS:同款 lightningcss `cssModules:{pattern:'[hash]_[local]'}` + `<style data-plugin-css>` 注入;tidy client-build.js 按 `.module.css` 后缀**任意来源**拦截(:95-117)→ 13 个 module.css 零改动接管,tagId 带 tidy 插件 id,与 dsh-genui 本体并存不冲突
- react 两边 external(PLATFORM_MODULES)→ 宿主 loader require('react') 单例;peer 差异(^18||^19 vs ^18.2.0)无冲突;**风险仅误把 react bundle 进去**
