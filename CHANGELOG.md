# Changelog

## 0.6.1 (2026-11-25)

- feat(guide): 「重新查看引导」入口（`data-tidy-display-guide-restart`）从分节底部移到顶部、`GuidePanel` 之前，并改为恒定渲染（原为收起后才出现）。跳过标记与三步正文逐字未动（`dsh.guide.tidy-display.skipped`）。

## 0.6.0 (2026-11-24)

- **新增首次使用引导（3 步）**：设置分节顶部三步——阅读视图入口（视图切换选「阅读」）、过程折叠（工具栏「自动折叠开/关」与设置里「自动折叠过程」是同一份状态）、围栏渲染（dsh-ui / mermaid / mcp-app / vcp-root 按段分发，渲染失败折叠为标题栏可看源码）。底部恒定重开入口；Skip 与「开始使用」都写 `dsh.guide.tidy-display.skipped`。
- **引导十语外壳**：七个外壳词自带 zh·en·ja·ko·fr·de·it·ru·es·pt，按 `<html lang>` 取词、认不出落 en；步骤正文 zh/en，其余语种回退 en。
- **附带语言守卫棘轮**：硬编码 CJK 计数只降不升（当前 C-ui 485 为既有余量，本轮不搬），引导两文件按设计登记白名单。
- **行尾清理**：`Blocks.tsx` 工作树曾是纯 CRLF 翻转（相对 HEAD 零真实改动），已归位 LF——该文件因此不再出现在本次 diff 里。
- **全量**：213 tests / 213 pass。

## 0.5.6 — 2026-11-23(main)

- **补齐:` ```mermaid ` 围栏此前只是死代码,两个视图都渲染成普通代码块(用户活体截图实证)**。`vcp/segmentation.ts` 里的 `splitMermaidFence` 导出了、也有测试,但**没有任何调用方**——它本该在 VCP 引擎接线时被调用,移植时漏接,于是 `graph LR` 这类围栏在阅读视图和原生对话视图都退回「代码块」;而协议教学(`VCP_CHANNEL`)一直写着「` ```mermaid ` 围栏可直接用」,教学与渲染事实脱节。
  - 新增 `segments/MermaidCard.tsx`:围栏正文拼成单节点 spec(`{items:[{type:'mermaid',code}]}`)走官方 embed 入口 `processGenuiSpec` → `<GenuiBlock>`(即 genui 的 `MermaidNode`)。不自研渲染是因为它已覆盖整条契约——懒加载 IIFE(经本插件 `/tidy-display/assets/genui/` 路由)、视口门控渲染、主题令牌变更重绘、图类型白名单、`assertSafeSvg` 消毒、放大弹层、10 语本地化;一条围栏与 dsh-ui 卡因此共用同一渲染路径与外观,主包零引擎内联。
  - 退化链三层,永不空框:守卫拒绝(空/超长正文)→ 源码 `<pre>`;引擎资产缺失/404/图类型不在白名单 → genui 自带的源码框 + 提示;组件抛错 → 与 `DshUiCard` 同一个 `ErrorBoundary`。
  - **阅读视图**:`markdown/render.tsx` 的 `renderCode` 在 dsh-ui / vcp 之后加第三条分发,`segmentCards` 总闸同步管辖;流式期不换图(引擎每帧重渲 SVG 既贵又抖),settle 才出图。
  - **原生对话视图**:`resolveFenceKind` 新增 `mermaid` kind(横幅为 `mermaid`,大小写与尾部标点容错),通道 `renderMount` 挂 `MermaidCard`(`channel: 'native'` 分键交互状态)。**关键坑**:宿主对不支持高亮的语言把横幅换成通用词(`supportsHighlighting` 为假的 mermaid 显示「代码块」,原始 lang 不进 DOM),标签路径认不出来——所以补 `looksLikeMermaidSource` 内容识别,只对 generic/无标签且 settle 的块生效。判定锚在图类型声明(第一行 `graph TD`/`flowchart LR`/`sequenceDiagram`/`erDiagram`…,允许前置 frontmatter 与 `%%{init}%%`),不是启发式猜词:`graph` 单独出现必须带方向才算,短于 12 字符不算。
  - **不影响既有判定**:known 真语言(`python`/`js`/`json`/`sh`…)在 `resolveFenceKind` 里早已短路,永不因图源形状被劫持;mermaid 图源与 dsh-ui 的 JSON 形状、vcp 的 `<div id="vcp-root">` 前缀三者互斥,判定顺序改动对 dsh-ui/vcp 通道零影响(原 202 例断言全绿)。
  - 教学:路由表新增常驻条目「流程/时序/类/状态/排期等结构关系 → 正文 ` ```mermaid ` 围栏,首行必须是图类型声明;图只在卡外正文,卡内用 dsh-ui 的 `diagram` 组件」。该条**不随 dshUi/vcp 开关消失**——渲染走 markdown 围栏与引擎,与两条卡片通道的开关无关;此前它只写在 `VCP_CHANNEL` 里,关掉 VCP 后模型就不知道该出图了。
- 工程:新增 `tests/mermaid-fence.test.ts`(8 例)锁住两套判定——各图类型首行、frontmatter/init 剥离、普通代码与碎片不误判、known 语言永不劫持、与 dsh-ui JSON 形状互斥、流式期让位源码块;`tests/protocol-teaching-fields.test.ts` 加 1 例断言 mermaid 路由条目在三种开关组合下都在。全量门禁 211 例全绿(typecheck + eslint + test)。

## 0.5.5 — 2026-11-23(main)

- **修复:教学词汇表只写 `steps(steps)`,模型把 steps 写成字符串数组后整条围栏退回代码块(0.5.4 遗留)**。活体事故(用户截图):一条 `callout`+`table`+`steps` 的围栏仍是「代码块」——callout 已用 `content`、table 已用二维数组,唯一的错在 `"steps":["Phase 0…","Phase 1…"]`:genui 的 `steps` 规范是**对象数组** `[{title,desc}]`,守卫 `repairSteps` 丢弃所有字符串项 → `steps:[]` → `canonicalJson(守卫结果) !== canonicalJson(原文)` → `contentRecognized` 判否 → 整条围栏(连同同围栏 callout/table)一起退回代码块。与 0.5.4 的 callout 别名同类根因,只是这次缺的是**结构**而非字段名。
  - 词汇表 `steps(steps)` → `steps(steps:[{title,desc}])`,给出对象结构。
  - 别名禁令条款补一句:steps 的 `steps` 是对象数组 `[{title,desc}]`,每阶段必须是带 title 的对象,**不是字符串数组**;说明错误结构同样触发「守卫丢弃→逐字不等→整条围栏退回」。
  - 最小正确示例追加一个规范 steps 节点(`[{"title":"第一步","desc":"说明"},{"title":"第二步"}]`),可直接照抄。
  - 实测:按修正后教学重写该围栏 → `processGenuiSpec` 零错误零告警、内容识别逐字相等、3 节点全部可渲染。
- 工程:`tests/protocol-teaching-fields.test.ts` 加 2 组断言——示例中的 steps 每项必须是带字符串 title 的对象;教学文案必须明令 steps 用对象数组、点名禁止字符串数组。全量门禁 202 例全绿。

## 0.5.4 — 2026-11-23(main)

- **修复:协议教学词汇表缺正文字段名,导致模型写别名后整条围栏退回代码块**。`protocol-teaching.ts` 的 dsh-ui 词汇表只给了 `callout(tone: …)`——正文字段名完全没写,模型只能凭直觉填 `text`。而 genui 的 `text`/`body`/`desc` 是 `content` 的**别名**,守卫会把它们改名;原生对话视图的 `contentRecognized` 要求 `canonicalJson(守卫结果) === canonicalJson(原文)`,任何改写即判否 → `resolveFenceKind` 返回 `skip` → **整条围栏连同同围栏内的表格一起退回普通代码块**(不做局部降级)。活体事故:一条 `callout` 用了 `text`,同围栏 16 行表格一并变成「代码块」。
  - 词汇表改为**括号内即规范字段名**:`callout(content, tone: …)`、`text(content)`、`badge(label)`、`steps(steps)`、`diff(diffs)`、`keyvalue(pairs)`、`table(columns+rows)` 等,与 `@changfenhuang/dsh-genui` 的 `schema.ts` 逐项对齐。
  - 新增**别名禁令**条款,点名 `callout` 用 `content`(不是 text/body/desc)、`table` 用 `columns`+`rows`(不是 headers/data,rows 是二维数组不是对象数组)、`keyvalue` 用 `pairs`(不是 items)、`badge` 用 `label`(不是 text),并写明后果。
  - 新增**最小正确示例**(callout + table),可直接照抄字段名。
- 工程:新增 `tests/protocol-teaching-fields.test.ts`(5 例)把教学文案锁在规范字段名上——示例段会真正 `JSON.parse` 并逐节点校验;谁把 `content` 改回 `text` 立刻红。

## 0.5.3 — 2026-11-23(main)

- **修复:转义文本容错的目标选择(0.5.1/0.5.2 活体实测,转义卡零接管的根因)**。宿主把裸 HTML 转义后与尾随段落**混在同一个 markdown 根容器**(DIV 内裸文本节点 + `<p>` 兄弟并存)——0.5.2 的 text-only 结构门要求容器无块级后代,被自己的 `<p>` 兄弟否决;`<p>` 们又不含 vcp 前缀——两头落空零接管。现改为**最内层前缀命中容器**目标:挂载走 `VcpHtmlSegments`,`splitVcpText` 把「卡 + 尾随 markdown」从同一容器的 textContent 分段渲染(内容零丢失);内层过滤丢弃包含其他命中者的祖先容器(防吞整个滚动区)。text-only 结构门移除(其防误伤职责由「代码语境排除 + 内最过滤 + drain 前缀复验」接管)。

## 0.5.2 — 2026-11-23(main)

- **修复:本地化通用横幅词让原生通道全军覆没(0.5.1 实测,marked=0 的根因)**。宿主 0.2.2-rc.5 对不认识的语言(dsh-ui/html 围栏、裸 HTML 转义块)渲染本地化横幅「代码块」——判定链把非空横幅一律当真语言走标签路径,`代码块` 既非 dsh-ui 亦非 html → 12 个候选全部 skip,原生视图 dsh-ui 与 VCP 一起停止接管(genui #258 同款,移植时带了判定集却没接进决策链)。现 `resolveFenceKind` 内置横幅裁决:generic 词(代码块/Code/«Код»…)落回内容识别(vcp 前缀 / JSON 严格识别),known 真语言照旧短路且绝不嗅探;contentRecognized 兜底同步收紧为仅 generic/无标签横幅可进(`​```json` 块不被劫持)。宿主横幅词是无界集合,白名单反转判定是唯一稳态。

## 0.5.1 — 2026-11-23(main)

- **原生「对话」视图 VCP 卡覆盖(补齐 0.5.0 的文档化边界)**。0.5.0 的分段渲染在原生视图只接管了 dsh-ui 围栏;裸 HTML 的 vcp-root 卡在原生视图被宿主渲染器转义成可见文本(无卡 DOM 可接管)。三条路补齐:①**协议教学翻转**——VCP 通道改为 ` ```html ` 围栏交付(围栏体内以 `<div id="vcp-root">` 开头;裸 HTML 直写正文会被原生视图转义成文字,严禁),承重铁律逐字保留;Reader 对裸 HTML 直出与围栏两种形态双向容错,历史裸卡零回归。②**原生通道 VCP 分支**——html 标签围栏(剥壳后 vcp 前缀)与无标签围栏的 vcp 前缀兜底,挂载复用 Reader 同一份 `VcpHtmlSegments`(多卡/页面/流式 pending 分段与 Reader 同代码);dsh-ui/vcp 在同一行共享 ordinal 空间,交互身份不冲突。③**转义文本容错**——模型漏围栏直出裸 HTML 时,宿主转义文本的块级宿主(text-only 结构门 + 非代码语境)以 textContent 逐字重建出卡;失败即维持文本,绝不空藏(issue #19 同款守卫)。判定抽纯 `resolveFenceKind`(discover),判定表 + 通道契约测试入列。

## 0.5.0 — 2026-11-22(feature/segmented-rendering 分支)

- **修复:原生视图内容识别的键序敏感误拒(0.5.0-rc.3;「第一次出卡第二次不出」的根因)**。守卫归一化会按自己的规范序重排对象键(实测:`{type,tone,content}` 的 callout 归一化后变 `{type,content,tone}`),rc.2 的严格相等用裸 `JSON.stringify` 对比——模型写入键序与规范序不同(语义完全等价)即被判否,通道让位回代码块。表现正是同一会话里一张卡渲染、下一张退回代码块。现改 `canonicalJson`(递归键排序)语义比较:键序不敏感,数组顺序保持语义;需真实修复才合法的正文(别名改写/缺省填充/未知字段剥除)依然拒绝,防劫持口径不变。
- **原生「对话」视图 dsh-ui 围栏接管通道(0.5.0-rc.2)**。rc.1 的分段渲染只覆盖阅读视图(mdast 分发);宿主原生渲染器没有官方 code-block 注入点,原生对话里 ` ```dsh-ui ` 围栏只能裸落代码块——genui/raw-html-v2 禁用后此缺口成为双视图回退。现移植 dsh-genui 的 DOM 接管通道(MIT,见 THIRD_PARTY_NOTICES)并精简:`MutationObserver`(body subtree + characterData)+ 1s 兜底轮询 + 行轮转网;发现走宿主稳定类 `.md-code-block` + `label+pre` 结构兜底;**先挂后藏**(issue #19 守卫,挂载失败绝不遮答案)+ 观察器微任务修复手术(容器重挂/隐藏重置/被清容器重建);身份 `dom:<anchor-key>:<ordinal>` 经 `native:` 前缀分键交互状态。渲染统一走自有 `DshUiCard`(SegmentCard 外观/校验失败折叠/折叠偏好与阅读视图同款)。无标签围栏在 settle 期经 embed 守卫**严格内容识别**(归一化前后不等即拒绝——普通 json 永不被劫持,genui #258 口径);流式期 spec 形状即换占位卡(与 Reader streaming 契约一致;不移植部分组件解析,单渲染路径,精简偏离记录在案)。`segmentCards` 为同一总闸,翻转即全量卸载并恢复原代码块;Reader 子树与 genui 自有通道(`data-genui-rendered`)共存让位。VCP 卡仍为阅读视图专属(原生视图宿主对裸 HTML 消毒,无 DOM 可接管,后置另立项)。
- dock 共存提示文案随接管生效修订;`DshUiCard` stateKey 前缀参数化(`reader:`/`native:`);genui-plate CSS 扩展覆盖 `.tidy-dom-fence`。
- 工程测试:discover 纯函数 6 例(含键序语义比较)+ 通道契约 4 例(先挂后藏顺序/共存排除/状态分键/总闸接线)。

- **分段分发渲染层(吸收 dsh-genui 与 dsh-raw-html-v2 的核心能力,本仓原生实现)**。此前两协议在同一份回复流里互相打架:raw-html-v2 开启时 dsh-ui 围栏以 JSON 花括号裸奔、关闭时 vcp-root 裸 HTML 标签乱撒。现阅读视图按段分发:md 走原管线、` ```dsh-ui ` 围栏走 GenUI 渲染、行首 `<div id="vcp-root">` 裸 HTML 与 ` ```html ` 围栏包裹卡走 VCP 引擎,`mcp-app` 通道不变。不可渲染段(解析失败/引擎缺失)一律折叠为标题卡+源码,绝不裸撒。
- **GenUI 组件经官方 embed 入口真渲染**。`@changfenhuang/dsh-genui` 以依赖引入,`processGenuiSpec`(别名归一+修复+校验,与 genui 插件同源守卫)→ `<GenuiBlock stateKey="reader:<段位置>">`(交互状态按消息位置持久化);失败带诊断降级折叠。重引擎(echarts/mermaid/three/maplibre)保持 genui 的懒加载 IIFE 设计,经本插件 `/tidy-display/assets/genui/` 路由伺服,主包零引擎内联。体积:client.js 1.51MB → 2.52MB(闭包 72 文件)。
- **VCP 引擎整体移植(vcp-engine-v1.js 零改动拷贝,删 v1 localStorage 自检块)**。切段器(行首判定/标签配平/RAWTEXT 跳过/卡尾 style·script 吞并/流式半截 pending)、vc/hp shims、引擎引导(同步 XHR `/tidy-display/vendor/`,5×500ms 重试)、渲染核心(settle memo 零闪+根字体 DOM 锁权)与错误边界尽数 TS 化移植。特化:①**不移植可信模式 eval**——含 `<script>` 的卡自动改走 McpAppFrame 沙箱 iframe,主上下文永不执行模型 JS;②`onclick="input(…)"` 桥接 Reader 的 `ComposerFillContext`(回填输入框,不自动发送);③字体路由归一 `/tidy-display/fonts/`。
- **统一协议教学(单一 systemPrompt 段)**。node 半 `inject` 扩为 `['webServer','systemPrompt']`,注入 `dsh-tidy-display:segments` 段:通道路由表(结构化数据→dsh-ui/自由视觉容器→VCP/复杂应用→mcp-app)+ 承重铁律精编 + 美学六底线(仅约束 VCP 卡)——按 findings §8.3 十条改造清单合成,消解两套原教学在表格归属(C1)/工具纪律(C2)/交付全称(C3)等六域的矛盾。教学开关经 `POST /tidy-display/protocol-state` 持久化(`~/.dsh/dsh-tidy-display-protocol.json`),关闭某协议 = 不再教新卡、历史卡照常渲染(教学端/渲染端解耦);全关注入降级文本。
- **右下角浮动控制簇(dock)**。`position:fixed;right:14px;bottom:14px` 胶囊簇(渲染模式/分段/折叠直切)+ ⚙ 展开面板(协议教学开关 + 共存检测提示),body 直挂双视图常驻,不向 composer 注入任何节点;raw-html-v2 可信徽章同坐标时自动上移让位。
- **渲染模式开关与共存策略**。新增设置 `segmentCards`(默认开)/`cardCollapseDefault`(默认开)/`renderMode`(native 默认/delegate);`delegate` 恢复 0.4.4 的整节点委托现行为,`native` 下阅读视图不再吃外部 shadow 接管(isShadowWinner 检测保留)。设置面板与 dock 提供共存检测提示(`__DSH_BOOT__.entries`):原生模式下建议禁用 raw-html-v2/genui(教学统一、免双引擎);委托模式标注 raw-html-v2 依赖。
- **工程**:tsconfig 切 `emitDeclarationOnly`+`allowImportingTsExtensions`(genui 以 TS 源发布 embed 入口),lib/types 下 150 个无消费方 .js/.js.map 附带产物移除;`chat-flow-hook` 测试改读真交付包 cordis overrides 钉回 4.0.4 稳定线;36 项新单测(切段 12/挂点判定 7/原套件全量回归)。计划与调研四件套见 `docs/plans/2026-11-22-segmented-rendering/`。

0.4.5: host enumeration addendum for DSH 0.2.1-rc.3 (declaration-only bump; contract plane zero diff).


## 0.4.4 — 2026-10-22

- **阅读视图放行 `render_ui`（与 dsh-genui 的硬冲突 B）**。`ResultView` 的绕过条件此前把 `render_ui` 与 `show_widget` 一起短路到通用结果行,GenUI 在阅读视图里永远只显示 JSON。现只保留 `show_widget` 绕过（它的 `html` 参数走 McpAppFrame,是 tidy 自有渲染）,`render_ui` 交给官方 `tool.call.toolview` 镜像座位：装了 GenUI 时其注册胜出、卡片正常出现;未装 GenUI 或带 `html` 参数的 `render_ui` 仍由座位 fallback 落回原通用行,默认终态零变化。
- **阅读视图委托 `assistant-step` 影子接管（与 dsh-raw-html-v2 的硬冲突 A）**。新增单判据 `isShadowWinner`（`priority < 0`;宿主官方注册不写 priority）与 `acceptOfficialNode`：官方基线 `assistant-step` 仍被过滤、由 Reader 自渲染,而外部影子接管（如 raw-html-v2 开启渲染开关）会镜像进 `official.nodes` 座位,Reader 经 `AssistantStepDelegation` 委托其渲染;无影子时不挂载委托,默认路径 DOM 逐帧零漂移。开关关闭即不注册,行为与 0.4.3 完全一致。
- i18n: add Portuguese (pt-BR) locale — runtime dictionary, package metadata and README/CHANGELOG mirrors.

## 0.4.3 — 2026-10-21

- **对话轨「更早载入」箭头改为可连续点击**。原生「对话」视图的消息轨顶部箭头此前只能触发一次：嗅探宿主的 `加载更早` 按钮时,① 正则不认载入态文案（正在加载更早 / Loading earlier）,箭头在加载瞬间塌掉;② `hasMore` 只在 prefs 变更时重算,宿主重新放出按钮后组件不重渲染,箭头再不回来——须切视图/改设置才能续点。改为：匹配同时覆盖空闲与载入态文案,并用 rAF 节流的 MutationObserver（作用域 `[data-conversation-scroll]`）驱动响应式重算;`loadOlder` 只点未禁用的按钮,载入中点击为无害 no-op。阅读视图轨本就走 `useSession(hasMore)` + `session().loadOlder()`,不受影响。
- **气泡底板防塌补强（皮肤清零场景）**。无皮肤的干净环境下 `.answer` 底板本就在,真正裸文本的是只有左竖线、无底板的 `.processCommentary`——现补上 `.answer` 同款三层配方底板（bg-base 76% 洗色 scrim + 常驻中性 tint + layer-1,皮肤把 `--dsw-alias-bg-layer-1` 清零也塌不掉),半径/内距收窄让过程评论读起来比最终答复轻。`.answer` 自身同步升级为该三层防塌配方。
- **阅读视图入口与标签栏三项调整**。① 对话标签置最左：阅读视图 `conversation.view` 的 `order` 由 `-5`（落在对话左侧）改为 `1`,落在原生对话（`order:0`）右、轨迹左,标签栏读序变为 对话 · 阅读 · …。② 默认落对话：入口策略不再无条件强制 reader,仅 `?reader=1`（或 0.1.0-trial.N）显式请求时才进阅读视图,否则保持宿主默认对话。③ 阅读态隐藏输入框区：阅读器激活时经注入的全局 CSS 以 `html[data-tidychat-reader]` 作用域隐藏宿主 `[data-composer-seat]/[data-composer-card]`,并把阅读根节点的 `--dsh-composer-height / …-side-clearance` 归零回收原先为 composer 预留的内边距、jumpDock 底偏与推理卡滚动余量;引用计数守门,reader↔chat 切换不误伤另一处轨实例。

## 0.4.2 — 2026-10-18

- **半透明毛玻璃底板改革：单旋钮关联开关**。此前 glass 分支里工具卡内容面（`.toolDetails/.notice/.unknown/.toolRaw/.systemPrompt/.compactionSummaryBox/.attention/.imageFrame/.imageDialog`）只设了「透」没补底板，文字直接糊在壁纸上；现统一挂 `--reader-plate-wash: 35%` 旋钮（主题自适应 bg-base 洗色 + 常驻中性洗色 background-image 防皮肤清零 token + blur 12px），输入泡 `.user` 与新增的过程评论 `.processCommentary` 同走该旋钮。开关关闭时玻璃分支整体不生效，回落不透明宿主原生底，默认外观零改动。修复方向源自 `findings/glass-mode-opacity-fix.md`（其 55%/45% 起点经实机目测收敛为统一 35%）。
- **支持表追加 0.2.1-rc.2**：hosts.mjs 枚举 16→17 项，engines.dsh + 12 个 dsh-* peers + 七语 README 管理块同串下发；存在域逐一 npm 实测（12/12 包 rc.2 在版），semver 双向验证：命中 0.2.1-rc.2/0.2.1-rc.1，拒绝 0.3.0-rc.1/0.2.2。注：本项为声明面支持，rc.2 断裂面未做整矩阵实机。

## 0.4.1 — 2026-10-17

- **适配 DSH 0.2.1-rc.1（七仓缺口补票批次，守卫项：代码面与清单同一 release）**：① 终端卡标签补齐 rc.1 必填的 `commandLine(line)`（可访问名，文案与官方 zh 同串「命令第 N 行」）；② 官方图槽随宿主改名：`conversation.message.images` → `conversation.chat.message.images`（`OFFICIAL_SLOTS`/`OFFICIAL_SEATS`/SlotMap 声明键与浏览器 fixture 同步；注入旧槽是静默失效，grep 旧名=0 双向核验；旧线宿主仍收 `renderMessageImages`/`openSkill` 两字段，经 cast 逃逸对 rc.1 类型面保持绿色）；③ 新增 `compat/harness-0.2.1-rc.1.json` 基线（对 rc.1 tag 检出 worktree 记录，`--path-separator=/` 防 Windows 假 removed）并接管 build 默认基线。装载判据：hosts.mjs 追加 `0.2.1-rc.1`，engines.dsh + 12 个 dsh-* peers + 七语 README 管理块同串精确枚举（16 项，禁区间/caret）；semver 双向验证：命中 0.2.1-rc.1 / 拒绝 0.3.0-rc.1。devDeps 宿主面钉 0.2.1-rc.1（验证盲区①：node_modules 实装=目标线），typecheck/build/155 单测全绿。

## 0.4.0 — 2026-10-15

- **新增「思考卡始终贴底」开关（默认关）**：折叠态思考卡持续滚到内容末尾、展示最新一行；流式进行中的卡同样贴底（绕过原有的 840ms/500ms 跟随节拍）。用户 wheel 上滚 / 选中文本 / 点击卡内时让位——卡停在用户位置，不被拉回。落点全局偏好 `dsh.reader.v1` 的 `pinReasoningBottom`；设置面板新增 `role="switch"` 开关（`data-tidy-display-pin-bottom`），9 语本地化。
- **修复：开关写入全局 prefs 而阅读器读 scoped store 导致不生效**：读取顺序改为「全局 `prefsSnap` 优先、scoped store 回落」，与 `autoFold` 同范式；`openPrefs.getSnapshot` 内联类型同步补字段；构建戳 `data-reader-build` 重新对齐本版本。

## 0.3.1 — 2026-10-10

- **Fixed: tool-call rows had no bubble background — text floated over skinned wallpapers.** The message-bubbles plate only covered answers and reasoning cards; collapsed tool-call rows (and their expanded detail box) sat flat on the page, so under a skin their summary text hovered directly over the wallpaper. Under `data-reader-bubbles=on` the top-level tool row now gets the same plate as the answer (row + expanded detail in one card; sub-calls stay flat inside the parent plate, no nested bubbles).
- **Bubble plates are now three layers deep.** Wallpaper skins may publish `--dsw-alias-bg-layer-1` as fully transparent, which left every bubble a border around nothing. Each plate now lays an always-on neutral tint, and the tool-call plate additionally carries a 76% page-base-color scrim (`color-mix` on `--dsw-alias-bg-base`, theme-aware), so frame ⟹ floor holds regardless of what the skin zeroes. The expanded detail box got its own light tint for the bubbles-off path.
- **Turn-metrics and fold-summary counts are legible in both themes.** The token-usage / elapsed-time pills and the 「思考×N · 工具×N」 digest moved from the faintest label tiers to `--dsw-alias-label-primary` (inverts with the theme), and on light canvases (`body:not([data-ds-dark-theme])`) they render full black.

## 0.2.4-beta.5 — 2026-10-05

- **修复 0.1.2/0.1.5 整页砖化与阅读视图空白（跨代兼容三连）**：① client 金丝雀对 `conversation.chat.turnTail` 的契约校验只认 0.1.7+ 代的 `list/session`，而 0.1.2–0.1.5 宿主声明 `chain/session` → throw 杀死 client entry → web-boot 门禁整页拒绝启动；改为按代白名单并绑定宿主实时 spec，镜像注入处第二处金丝雀同样降级为告警。② `pendingInteraction` 的 `useSessionStatus` 是 0.1.7+ 改名，0.1.2–0.1.5 叫 `useSessionPendingInteraction`——Reader 双代探测、缺席 fail-open。③ tail 座位按实测代际分发渲染器（chain 槽必须 `renderSlotChain`）；老投影附加的 `input-message` 节点阅读页不再镜像渲染（崩 React #130）。已知残留：0.1.2 阅读页用户消息下偶现一张 React #130 优雅降级卡（正文/轨道不受影响）。

## 0.2.3 — 2026-10-03

- **设计裁定：轮次内的行不再悬浮。** 「用时 ×分×秒」状态行与「思考×…」折叠摘要行是内容的一部分，不是工具栏——`position: sticky`、吸顶偏移、`z-index`、`--dsw-alias-bg-base` 底板和 `-14px` 补缝阴影全部撤掉，随内容滚动。只有顶部工具栏（自动折叠开关）保留吸顶。0.2.3-beta.1 只修了吸顶几何，但用户反馈的「折叠内容滚动时异常固定位置」本意就是这些行不该固定；宿主主题里 token 半透明时底板遮不住内容、文字叠文字的问题也随之消失（不再有底板）。
- `footer-precedence` 守卫测试反转为新契约：轮次内行不得声明 `position: sticky/fixed` 与 `top`；`liveFoldContainer`（死规则）维持 z<7 存在性断言，待后续清理。

- 修复折叠吸顶车道错位（滚动时「用时 ×分×秒」与「思考×…」两行之间夹进回答内容、摘要行被状态行盖住）：`.turnProcessSticky` 的 `top` 不再 `max()` 进它自身的实测高度——状态行换行变高后会把自己钉得更低，工具栏下方露出一条滚动内容的缝（`-14px` 阴影补板盖不住的部分）；`.flowCell[data-flow-summary]` / `.closedProcessSummary` 的吸顶偏移改为 `工具栏实测高度 + 状态行实测高度`，不再依赖从未被赋值、永远走 40px 兜底的 `--reader-sticky-lane`——状态行只要不是恰好 40px（长状态文字换行、`pointer: coarse` 的 44px 按钮），摘要行就钉在状态行底板之下被埋住。真实组件浏览器 fixture 全程逐 40px 滚动回归：换行到 56.8px 的状态下三车道 0 缝隙、0 重叠。`data-reader-build` 戳与 package 版本重新对齐。自 0.1.7 线（ccd338e）移植。
- `eslint` 忽略 `.delivery/**`（fixture 构建产物）。
- 新增复现 fixture `tests/browser-fold-scroll-issue.tsx`（闭合轮 + 双吸顶车道 + 长回答表格），`node scripts/build-motion-fixture.mjs tests/browser-fold-scroll-issue.tsx` 构建。

## Unreleased

- Package renamed to the unscoped **`dsh-tidy-display`** and republished: `package.json` name, `src/dsh-tidy-display.ts` module id, tsdown bundle id, and the `cordis.patch.yml` insert row all move together (the module-id-equals-package-name invariant is unchanged, just re-pinned to the new name). The earlier scoped publish `@drscrewdriver/dsh-tidy-display@0.1.0` remains on npm but is superseded — install by the bare name (`dsh plugin --profile web add dsh-tidy-display`). dist-tags: `dsh-0.1.7` and `latest`, both → 0.1.0.

- Documented the mutual exclusion with `dsh-better-display` / `@bananasoldier01/dsh-tidychat` (README install sections): all three register a `reader` view (same id, same priority 0) in the `conversation.view` list slot, and the host's slot registry rejects the duplicate at activation — the client reports `1 entry did not activate: failed` and the page sticks on the plugin-load failure screen. Diagnosed live on a web profile where better-display was still enabled alongside the tidy-display npm install; nothing is wrong with the package itself. Disable or uninstall better-display / tidychat before enabling this plugin.

- `check-harness-compat` gate: pass `--path-separator=/` to ripgrep. Windows ripgrep 15 prints backslash paths, so the `/src/client/` path filter skipped every file, silently emptied the official-registration scan, and failed the baseline comparison with a wall of phantom `removedRegistrations` — on the very checkout the baseline was recorded against.

- Legacy backport shipped: three compat branches carry the message-rail subset to pre-0.1.7 hosts — `compat/0.1.5` (0.1.5-alpha.1~0.1.6, tag `v0.1.0-dsh0.1.5`), `compat/0.1.2` (0.1.2-alpha.2~0.1.4.x, tag `v0.1.0-dsh0.1.2`), `compat/0.1.1` (0.1.0-rc.7~0.1.2-alpha.1, tag `v0.1.0-dsh0.1.1`). The host compatibility matrix above now links the tags.

- Module id pinned in source (fork-local build correction): `src/dsh-tidy-display.ts` now exports `name = '@drscrewdriver/dsh-tidy-display'` (with the package name and tsdown entry aligned to the scoped id). The upstream tree carries the unscoped `dsh-tidy-display`; building it unmodified and deploying under the scoped profile entry makes the host unable to mount the client bundle, and the whole plugin silently fails to activate (no 阅读 tab, native view only) — the same failure fork.4 fixed in the published artifact, now pinned at the source level for fork builds.
- Reader rows restore the host ChatView anchor contract: user / steering / assistant answer / turn-error / unknown rows now carry `data-chat-anchor-key={node.key}` and `data-chat-flow-kind={node.kind}` alongside the reader attributes, matching what `OfficialNode` already did for fallback nodes. Ecosystem plugins that read the native anchors as their DOM source of truth (e.g. dsh-tidychat's message rail) stopped finding any rows under the reader and silently rendered nothing; the native contract is stable across 0.1.0-rc.7 → 0.1.7-rc.2 and is passed through verbatim.
- Reasoning transcript gets the answer bubble's translucent plate (same `--dsw-alias-bg-layer-1` token, 16px radius, frosted blur in glass mode) under the same 消息气泡 / Message bubbles switch, in every state — the card's base style was the opaque module-platform layer and its flat state ([data-overflow=false][data-expanded=false]) dropped the plate entirely, both of which put the transcript straight onto skinned wallpapers. Flat-state paddings are restored on the plate via higher-specificity rules; bubbles off keeps the previous flat/opaque behavior.
- Message bubbles: each final answer renders in a rounded bubble separating it from the page background, so text no longer sits directly on skinned hosts' wallpapers. Glass mode mixes the same tokens translucently, mirroring the user bubble's frosted treatment. A new 消息气泡 / Message bubbles switch in settings restores the flat layout when off (persisted as `bubbles` on `dsh.reader.v1`, default on).

## 0.3.3 — 2026-09-24

- Accept Harness `0.1.7-rc.2` (`dsh-v0.1.7-rc.2`, `477b4f420553e8a52c2fbccc464d7561b239c443`). Peer range stays `>=0.1.7-rc.1 <0.1.8`.
- `conversation.chat.turnTail` stays a list slot. The new `schedule-created` tail entry and `schedule_update` tool view are additional official registrations, mirrored through the existing seats.
- Developer tool-change context (`tool-addition` / `tool-removal`) uses the official title and count copy instead of a generic injection row.
- Local Markdown images accept the Desktop file route `dsh-app://app/api/file`.

## 0.3.2 — 2026-09-24

- 补齐 0.1.7-rc.1 官方桥接的运行时契约：工具视图传入 `phase`/`useDisclosure`/`hookContext{callId}`，聊天节点改用 `{turnData, disclosureReset}` 快照 store；修复真实宿主里官方工具视图静默落到 fallback 的问题。
- 折叠区吸顶车道的绘制缝隙：车道只给自己的框刷实心底色，`.turn` 14px gap、前一 cell 16px padding、status 车道右侧 `--reader-control-width` 保留区三条缝滚动时透出内容；改用同色 `box-shadow` 向上/向右补漆连成连续色带。

## 0.3.1 — 2026-09-24

- Accept Harness `0.1.7-rc.1`. Peer range is `>=0.1.7-rc.1 <0.1.8`.
- `conversation.chat.turnTail` is a list slot. The old chain expectation threw during client boot and left the page on “Failed to load plugins”.
- Icon imports use the rc.1 weight names (`IconBrowseOutlineRegular` and the rest). Size stays a prop.
- Pending confirmation now reads `useSessionStatus` (`pendingInteraction`). The removed `useSessionPendingInteraction` hook threw as soon as the reader painted.
- Code and terminal labels include the rc.1 toolbar fields (`codeLabel`, wrap, and `noExitCode`).

## 0.3.0 — 2026-09-21

- 修复关闭自动折叠、查看过程详情后，再开启仍无法折叠的问题；重新开启会恢复自动折叠规则，仍保留文本选择保护和之后的手动展开。
- 在现有阅读布局中接入官方反馈、工具详情、显式产物卡片、命令和未知节点渲染；官方渲染器负责注入、翻译、store 和子插槽。
- 移除直接调用工具组件及模拟点击展开的逻辑，保留现有摘要、折叠、动效和文件快捷操作。
- 接入官方文件链接服务，传递工具文件行号，补齐 RC2 本地 Markdown 图片及加载失败降级。
- 修复滚动跟随拉回底部的问题，统一阅读列轨道和吸顶区域的位置。
- 代码解释器结果按终端输出展示，上下文行兼容 `provenance` 和 `producer`。
- 增加可重放的官方组件集成测试、自动折叠交互回归和 Harness 升级兼容检查，依赖对齐 Harness `0.1.5-rc.2`。
- 设计范围、接口边界和待收敛模块见 `docs/official-rendering-bridge.md`。

## 0.2.1 — 2026-09-20

### Fixed

- Pinned reader lanes no longer paint over the composer. The live status row
  (`执行过程` / `正在使用工具`) pinned at the scrollport top with `z-index: 8`,
  while the host's sticky composer seat owns `z-index: 7` and nothing between
  the reader and `<body>` creates a stacking context. A scrolling reader clamps
  every turn-level sticky lane down into the footer band — the lane stops at its
  containing block's bottom, which passes behind the input card — so the reader
  painted its own opaque plate over the composer.
  - The live status lane now owns the measured lane under the toolbar, exactly
    like the closed summary rows, instead of sharing the toolbar's lane.
  - Lanes a scroll can clamp into the footer band stay below the composer seat
    (`z-index` 6); only the top toolbar lane keeps 7, which also keeps it above
    the host's code-block banners.
  - Skin mode no longer carries a second lane ladder of its own.
  - `tests/footer-precedence.test.ts` guards the ladder in the source sheet and
    in the committed bundle.

## 0.2.0 — 2026-09-30（宿主 0.2.0 线适配）

- 12 项 `@deepseek-ai/dsh-*` peer 换代到 `>=0.2.0-rc.1 <0.2.1-0`；devDependencies 换代到 0.2.0-rc.2；`pnpm-lock.yaml` 移除（npm 为唯一包管理器，`package-lock.json` 入库）。
- 门禁基线换代：`compat/harness-020rc2.json`（宿主 0.2.0-rc.2；74 项官方注册零增删，18 个锚点文件 14 个逐字节未变）。
- 宿主 0.2.0 漂移评审（scoped-slots useMemo 化 / ui-tool contract 纯新增 userQuestionPanels / MessageItem TextShimmer / TurnProcessNodeView 移除 live 时钟）：插件对四处均为 caller 语义，**零源码改动**。
- fixture 服务器补 `/favicon.ico` 204 路由并记录未匹配请求（本机首个 headless fixture 基线建立）。

## 0.2.0 — 2026-09-18

### Diff review and tool presentation

- Re-engineered diff review panel: line addition/deletion statistics (`+A -R`) are pushed
  flush to the right margin, perfectly aligned on the same 32px baseline as the summary text.
- Diff overlay expands cleanly within the reading column (0px horizontal overflow) with
  independent vertical scrolling (`max-height: 420px; overscroll-behavior: contain`),
  preventing mouse-wheel events from leaking into the conversation stream.
- Multi-file tabs scroll horizontally with adaptive content height on file switches.
- PR #12 custom tool cards: delegate tool view rendering to `tool.call.toolview` slot with
  error boundary isolation and auto-expand capabilities.

### Translucent frosted glass and skin mode

- Translucent frosted glass mode is an opt-in toggle in Settings.
- When enabled, all card backgrounds, tool detail frames, and code blocks become translucent
  with backdrop blur, eliminating opaque white patches and seamlessly adapting to third-party
  wallpaper and window skins.

### Refined folding and liveness

- Reverted to a single, intuitive auto-fold toggle (**自动折叠开 / 关**) on the reading toolbar
  and in Settings, removing complex multi-level rules while keeping reasoning and tools
  completely unfolded when turned off.
- Fixed line-wrapping bug so digest rows stay strictly single-line when space permits.
- Real-time wait clocks (`WaitClock`), execution time tracking, and token throughput
  metrics (`TurnMetrics`) fully preserved and active.
- Animated disclosures include fallback timeouts to prevent rendering stalls.

### Tidy Display settings

- Glass, auto-fold, and deliverable open-mode share the root `dsh.reader.v1` store so
  Settings and the reading view stay in sync across refresh.
- Deliverable open-mode: default system app, optional Sidebar. Folder/reveal stay OS.
- Generative-mcpapps skill installation detection and status reporting.

### Compatibility and liveness

- A wait now restarts when a tool returns. The handover set named kinds from the
  conversation contract (`tool-result`) while the reader matches against the chat
  layer's kinds, where a returned tool is the `tool-call` row whose `data.root`
  carries a result. No node ever had the old name, so the branch was dead and a
  returned tool never restarted the clock. The set and every kind it reasons about
  are now typed against the host's own kind union, so a wrong name fails `tsc`
  instead of failing silently at runtime, and a tool that is still running is
  explicitly not a wait.
- The fold choreography can no longer stall. Each phase advances on animation
  promises and rendered frames, and a cancelled animation rejects while a hidden
  tab delivers no frames — either one used to leave the machine in a non-idle
  phase forever, which holds the frame source at the shown snapshot and pauses the
  text reveal, so the turn looked stuck until the view remounted. Every phase now
  also has a wall-clock deadline that forces the next phase.
- While the choreography holds the reveal, the stream buffer keeps absorbing the
  source instead of returning early, so text never resumes from a stale target
  once the fold settles.
- Status shows how many sub-agents the turn dispatched, read from the host's own
  turn-process row instead of being counted again here.
- Drop the `command-input` render branch: that string is not a chat node kind in
  any released host, so it only made the file look like it handled a case that
  cannot occur.
- Give every animated disclosure a wall-clock deadline as well. `fill: 'both'`
  pins the opening keyframe, so a Web Animation that never reaches `onfinish`
  (cancelled, unmounted, or skipped by the compositor) left the row in the DOM at
  zero height and zero opacity — clicking it looked like nothing happened.
- Add a Tidy Display settings section: deliverables still open in the system app
  by default, with an optional right-Sidebar preview, plus generative-mcpapps
  skill-root detection and install guidance.
- Guard pending-submission image echoes so a text-only send cannot crash
  `conversation.view` (`images` / `attachments` may be missing).
- Install guidance names only conventional relative roots (`.dsh/skills`,
  `.agents/skills`) and never prints host home or plugin pack absolutes.

### Reading and folding

- A later reasoning step folds only the finished process run it follows. The run
  that is still streaming stays fully expanded, so a long turn reads as
  alternating digests and prose instead of collapsing mid-thought.
- Fold intensity 2 (`过程摘要`) is PR #14's process-only mode: prose is never
  folded; each finished run of reasoning / tool / record steps collapses into
  one digest that names what the tools actually did (`读取 Reader.tsx`,
  `运行 pnpm test`), read from the same tool identity the tool cards use. It is
  not the default — standard fold (level 1) keeps current-main choreography.
- A finished process-only turn folds its trailing run too, and skips the
  duplicate closed-turn counter row it no longer needs.

### Reading surface

- When frosted glass is on, sticky lanes use the same liquid glass as the
  dsh-auto-memory pane: translucent `bg-layer-2` wash, `blur(28px)`, hairline
  border, 16px radius and a soft lift. Detail chips stay transparent until
  hovered or focused. When the toggle is off, chrome matches current main.
- The toolbar reserves the width of its whole control group. Measuring only the
  first button let the status lane paint over every later control.
- A compaction divider now arrives instead of simply appearing: the rule sweeps
  out from its centre, the pill settles in, and the dial turns once. Gated by
  `data-motion=off` and `prefers-reduced-motion` like every other transition.

### Diff review

- Read the changed line counts from the tool result the host already attaches
  (`meta.diffs`, `{ path, oldText, newText }`), and fall back to the call's own
  arguments for `write` / `edit` / `str_replace_editor` when a host build does
  not send them. The name whitelist matters: several unrelated tools take a
  field called `content`, and counting those invented additions for calls that
  changed no file.
- Fold a parent call's child calls into its own counts. A `run_code` that writes
  files reports what its children changed rather than what its own arguments
  contain, so a run whose edits live one level down no longer loses its counts.
  Each child contributes through its own arguments, read from either the landed
  result or the pending call.
- `+N -M` sits at the end of the row in green/red and opens a panel listing one
  entry per changed file — the file tabs, the removed lines on a red wash and
  the added lines on a green one, using the same `DiffBlock` primitive the
  official tool row renders. The panel is in flow, never a floating popup, so
  the flow cell's `overflow: clip` cannot cut it off.
- Opening and closing the panel animate real height in the plugin's own motion
  language, and the card is brought back into view when it opens below the
  fold; an open panel keeps its caret lit.

### Waiting and timing

- Show how long the model has been given the turn, next to 「深度求索中」and the
  in-flow wait indicator. The clock is anchored to the last event that handed
  control to the model — a returned tool, an injected context, a run command,
  the user's own message — never to the start of the turn, so a wait that has
  just begun does not inherit the minutes the tools already spent.
- Past ten seconds the readout adds a「暂未响应」badge, and the moment the model
  produces its first block the whole indicator is withdrawn. A tool that is
  still running is not a wait: the tool is the one working.
- A command that ran long keeps its duration after it returns (warning colour
  past ten seconds); a fast one shows nothing once it is done. Running steps
  show a live seconds readout and a shimmering summary while they work.

### Scroll

- Tail-follow only detaches on a real upward move by the reader. Content growth
  and the follow easing itself also move `scrollTop`, and reading that as "the
  user left the bottom" froze following mid-turn.
- Disable browser scroll anchoring on the conversation scroller while the reader
  is mounted: it moved the viewport on its own as the transcript grew.
- Only a focused text field suspends following, and only inside the reader.
  Focusing the composer used to stop the transcript from advancing.
- Stream at the source's own rate: add a feed-forward term estimated from the
  arrival rate on top of the proportional controller. A purely proportional
  reveal settles at a constant `catchUpMs` of lag regardless of model speed,
  which read as 「慢」 while the backlog grew with faster models; the feed-forward
  term drains the backlog and the proportional term absorbs transport jitter.
- Reveal a batch of words on one clock instead of one word per fixed gap.
  Per-word spacing pinned the rate near 16 words/second, so a fast model still
  arrived one word at a time; a batch now lands inside one short window while a
  lone new word keeps the original typing cadence.
- The reasoning pane's own follow steps with the backlog rather than at a fixed
  step-and-hold: it used to advance two lines every ~1.3 seconds no matter how
  fast the text arrived, which is what made the pane look like it was lagging
  behind a fast model.
### Host DOM hooks

- Keep ChatView's `data-chat-flow=""` hook on the Reader column so skins that hide `[data-composer-seat]` when the scrollport has no chat-flow (maid-atelier, phoebe-atelier, and others) still show the composer in reading view.

## 0.1.1 — 2026-09-16

The accepted reading-view integration, including the work consolidated from PRs #2, #5 and #8. Earlier `0.2.0` / `0.2.1` headings were unpublished development notes; those changes ship in this release, not as separate published versions.

### Reading and folding

- A later reasoning step can fold earlier steps in its chain into a compact count summary. Body/tool updates alone do not trigger folding; user/steering input resets the chain. The auto-fold control can disable this presentation.
- Stable keyed rows shrink before counters update, pause briefly, then reveal buffered output. Preserve source order, selected text, reduced-motion behavior, and the visible final answer.
- Keep process statistics after turn completion. Empty hidden steps no longer accumulate 16px gaps in long completed turns.
- Give the auto-fold control a full-width, seamless lane without divider lines or replacement shadows. Statistics remain in normal flow until reaching the top, then stick below the measured status lane, whether expanded or collapsed.
- Short status labels remain readable instead of truncating. Waiting time resets to the latest user/steering submission rather than inheriting the turn's original start time.

### Navigation and native parity

- Keep the newer TimelineRail, including incremental history loading, per-turn metrics, fork support, and composer-safe landing. Scroll the conversation container rather than unrelated ancestor boxes.
- Skip host-synthetic `turn-process` JSON cards; render `/goal` command input as labeled text; give system-prompt details their own scrollport.
- Use the compact back-to-bottom chevron at the native near-bottom threshold and coalesce scroll-anchor capture.
- Show user-message time/copy controls and turn-end duration; defer produced-file rows until the turn closes.

### Interactive content

- Render generative MCP Apps from supported code fences, custom blocks, and tool results through an isolated iframe (`sandbox="allow-scripts allow-forms"`, no `allow-same-origin`).
- Support SEP-1865 JSON-RPC initialization, sizing, context updates, and prompt feedback into the composer, with light/dark synchronization and bounded auto-height.
- Include the generative-mcpapps skill pack, examples, and bilingual documentation.

### Distribution and verification

- Target DeepSeek Harness 0.1.5-rc.2 through public plugin/client extension points. No Agent, SDK, provider, credential, or Harness-core changes.
- Ship the stock-install bundle patch and rebuilt committed `lib/`, including declarations; git/tarball installation does not require `prepare`.
- Add fold-order/timing and steering-clock unit regressions, plus real-component browser fixtures for motion, 500 hidden rows, sticky/wrapped statistics, and waiting-clock resets.

## 0.1.0

First public release of the accepted reading-view plugin, published as `dsh-tidy-display`.

- Native context and tool details with source-ordered, unmodified reasoning.
- Bounded long-reasoning cards with two-line following, expanded follow and manual pause/resume.
- Successful-turn process folding with a separate final answer.
- Source-ordered text reveal and quiet busy-state shimmer.
- Stable status typography and compact disclosure spacing.
- Native content fallbacks and a trusted-plugin block extension slot.
- 42 regression tests; no changes to DSH Agent, SDK, providers or core.
