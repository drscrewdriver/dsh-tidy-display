# Tasks: 分段分发渲染层(粒度 ≤2-5 分钟/项;行号基准见 findings.md)

## Phase 0: 前置(需用户确认后才执行)

- [ ] t0.1 `git checkout -b feature/segmented-rendering`(main 之上)——交付:新分支就位
- [ ] t0.2 `pnpm add @changfenhuang/dsh-genui` ——交付:package.json dependencies + lockfile 更新
- [ ] t0.3 复制 `D:/tidy-display-ng/dsh-raw-html-v2/assets/vendor/vcp-engine-v1.js` → `dsh-tidy-display/assets/vendor/vcp-engine-v1.js`,删除引擎 :81-86 的 `dsh.rawHtml` 自检 6 行——交付:引擎资产入库

## Phase 1: VCP 移植模块(`src/client/vcp/`)

- [ ] t1.1 建 `src/client/vcp/segmentation.ts`:TS 化 `splitVcpText` 全家(`findVcpOpen`/`findPageOpen`/`scanPageEnd`/`scanVcpDiv`/`swallowTrailingRaw`/`trimTrailingOpenTag`/`stripFenceWrapper`/`PAGE_OPEN_RE`/`MERMAID_FENCE_RE`/`splitMermaidFence`)——交付:纯函数模块 + 导出类型 `VcpSegment`
- [ ] t1.2 建 `src/client/vcp/shims.ts`:`vcpFilterStyle`/`vcpHpShim`/`vcpAllowHref`/`vcpAllowSrc`/`vcpVcShim`/`vcpFontUrlCompat`(URL 正则目标改 `/tidy-display/fonts/`)——交付:shim 模块
- [ ] t1.3 建 `src/client/vcp/bootstrap.ts`:`ensureVcpEngine`(XHR `/tidy-display/vendor/vcp-engine-v1.js`,就绪判据含 `__vcpStable`,5×500ms 重试,`vcpF={Fragment,jsx:createElement}`)——交付:引擎引导单例
- [ ] t1.4 建 `src/client/vcp/render.tsx`:`vcpEngineRender` + `vcpSettleMemo`(LRU 16)+ `VcpRootFontGuard`——交付:React 渲染入口
- [ ] t1.5 建 `src/client/vcp/error-boundary.tsx`:`VcpErrorBoundary`——交付:边界组件
- [ ] t1.6 `segmentation.ts` 加 `hasScriptTag(html)`(RAWTEXT 感知)——交付:script 卡路由判据
- [ ] t1.7 建 `src/client/vcp/input-bridge.ts`:卡挂载时 `window.__dshInput = fillComposer` 接线(经 ComposerFillContext,卸载还原)——交付:交互桥
- [ ] t1.8 写 `tests/vcp-segmentation.test.ts`(流式半截/RAWTEXT/围栏包裹/卡尾 style 吞并/不配平)——交付:切段单测全绿

## Phase 2: mdast 挂点 + 卡壳

- [ ] t2.1 建 `src/client/segments/SegmentCard.tsx`:卡壳(标题栏+`Disclosure`+错误徽章+流式占位+`cardCollapseDefault` 折叠态)——交付:统一卡壳组件
- [ ] t2.2 建 `src/client/segments/VcpSegmentCard.tsx`:组装切段/沙箱路由(script→McpAppFrame)/引擎渲染/错误折叠四路——交付:VCP 段卡
- [ ] t2.3 建 `src/client/segments/DshUiCard.tsx`(先占位版:解析+折叠 JSON,Phase 3 接 GenuiBlock)——交付:dsh-ui 段卡骨架
- [ ] t2.4 `render.tsx` `renderCode`(:338 前)加分支:lang 归一化后 `dsh-ui`(别名容错,复刻 fence-language 语义)→ `DshUiCard`;流式→占位——交付:挂点 A
- [ ] t2.5 `renderCode` 加分支:`lang==='html'` 且 `stripFenceWrapper` 后含行首 vcp-root → `VcpSegmentCard`——交付:挂点 B(围栏容错)
- [ ] t2.6 `render.tsx` `case 'html'`(:283)加分支:行首 vcp-root 检测+`scanVcpDiv` 配平→`VcpSegmentCard`;卡后余文无空行时 nested MarkdownText 二次解析——交付:挂点 C
- [ ] t2.7 写 `tests/segments-render.test.ts`(三挂点识别/别名/流式占位/余文兜底)——交付:挂点单测全绿

## Phase 3: genui embed 接入

- [ ] t3.1 `DshUiCard` 接 `resolveFenceSpec`+`processGenuiSpec`(从 `@changfenhuang/dsh-genui` 包引入 guard 闭包)→ `<GenuiBlock spec stateKey={'reader:'+nodeKey+':'+ordinal}/>`——交付:全量交互渲染
- [ ] t3.2 失败降级:guard 诊断 → 错误徽章 + 折叠源码卡(卡壳)——交付:校验路线闭环
- [ ] t3.3 client 启动时 `setGenuiAssetBase('/tidy-display/assets/genui/')`(常量入 config-bridge 或 env 模块)——交付:资产基址接线
- [ ] t3.4 写 `tests/dshui-card.test.ts`(JSON 修复/无效 spec 降级/stateKey 稳定性)——交付:dsh-ui 单测全绿

## Phase 4: node 半 + 设置

- [ ] t4.1 `dsh-tidy-display.ts` `inject` 扩为 `['webServer','systemPrompt']` + Context 模块声明——交付:服务声明
- [ ] t4.2 加 `kind:'prefix'` 路由 `/tidy-display/vendor/`(MIME 白名单/防穿越/Cache-Control/重复注册防御;伺服 assets/vendor)+ `/tidy-display/assets/genui/`(定位 node_modules `@changfenhuang/dsh-genui/lib/assets`,serveGenuiAsset 式白名单+ETag)——交付:两条静态路由
- [ ] t4.3a 起草统一协议教学文本:素材 = 卫星 [findings.prompts.md](./findings.prompts.md) 逐字全文;按 findings.md §8.3 十条改造清单(通道路由表/领域让渡/工具纪律合并/承重铁律逐条保留/美学作用域限定/交互语义分工/思考纪律统一/非承重外置/降级链/两档制)合成——交付:统一段文本常量 + 六冲突域(C1-C6)消解评审
- [ ] t4.3 加 `systemPrompt.section({name:'dsh-tidy-display:segments'})`:挂载 t4.3a 文本;`text()` 按三协议开关 + 渲染模式 + 分段开关动态拼装(两档制:有 skill 工具→精简版,无→注入组件词汇表),关闭时注入降级文本——交付:协议注入
- [ ] t4.7 加 `kind:'exact'` POST 路由 `/tidy-display/protocol-state`:接收 dock 协议开关状态,落盘 `~/.dsh/` 状态文件,GET 回读;node 半启动时加载——交付:教学端状态同步
- [ ] t4.4 设置三键五处锁步:`segmentCards`/`cardCollapseDefault`/`renderMode`(reader-prefs.ts → config.ts → store.ts → SettingsSection.tsx → types.ts)——交付:设置 UI + 持久化
- [ ] t4.5 `Reader.tsx:164` 委托分支加 `renderMode==='delegate'` 前置;native 下保留 `useAssistantStepShadow` 只读告警——交付:渲染模式开关生效
- [ ] t4.6 `SettingsSection.tsx` 加共存检测提示:读 `window.__DSH_BOOT__.entries` 发现 genui / raw-html-v2 时按模式显示"建议禁用"(native)/"依赖说明"(delegate)——交付:部署指引 UI

## Phase 5: 集成与打磨

- [ ] t5.0a 建 `src/client/dock/RenderDock.tsx`:胶囊簇骨架(`position:fixed;right:14px;bottom:14px`,三快捷开关直调 store actions,复用 SettingsSection 开关语义)——交付:dock 组件
- [ ] t5.0b dock 展开面板(~248px,`--dsw-alias-*` 主题 token,渲染设置行 + 协议编码模式开关(dsh-ui/VCP 教学,POST `/tidy-display/protocol-state` 同步)+ 共存检测提示,ESC/外点关闭)——交付:面板闭环
- [ ] t5.0c 双视图挂载(client entry `apply` 时 createRoot 挂 body)+ 窄屏降级 + `#vcp-trusted-toggle` 冲突偏移——交付:dock 上线
- [ ] t5.1 VcpSegmentCard 的 script 路由接 `McpAppFrame`(`ensureHtmlDocument` 主题包裹 + 高度钳制复用)——交付:沙箱路线闭环
- [ ] t5.2 `input-bridge` 接 `input()` 全链验证(卡内按钮 → fillComposer → composer 草稿)——交付:交互回流
- [ ] t5.3 genui-plate 保留性核查 + 双插件并存手工验证(raw-html-v2/genui 同时安装三种模式组合)——交付:共存矩阵记录
- [ ] t5.4 client bundle 体积前后对比(genui 闭包入库前 vs 后),超预期时评估裁剪——交付:体积记录

## Phase 6: 验证

- [ ] t6.1 `npm run check` 全绿——交付:typecheck+lint+test
- [ ] t6.2 `npm run build` 产物齐全(lib/dsh-tidy-display.js + lib/client.js)——交付:构建产物
- [ ] t6.3 farm 单格复跑 `node scripts/test-host-compat.mjs --only 0.2.1-rc.5 --force`——交付:绿
- [ ] t6.4 farm 全矩阵 21/21(`node scripts/test-host-compat.mjs`)——交付:回归基线保持
- [ ] t6.5 浏览器实测:构造 md + dsh-ui 表格 + vcp 无脚本卡 + vcp script 卡 + 围栏包裹卡 + 损坏 JSON 段的混合回复,逐项核对 checklist.md Must Pass——交付:验收记录
- [ ] t6.6 更新 README 功能段与 CHANGELOG(合并项目惯例)——交付:文档
