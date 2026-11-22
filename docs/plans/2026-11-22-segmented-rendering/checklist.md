# Checklist: 分段分发渲染层

## Must Pass

### 功能正确性
- [ ] `dsh-ui` 围栏段:阅读视图渲染为 GenuiBlock 交互卡(表格可排序/统计卡/图表),不再是 JSON 花括号
- [ ] `vcp-root` 裸 HTML 段:无 `<script>` 卡经移植引擎真渲染(卡片样式/作用域化/字体锁权生效),不再是标签乱撒
- [ ] ```html 围栏包裹的 vcp 卡被容错识别并渲染(识别串增强路线)
- [ ] `dsh-ui` 别名/标点容错:大小写、尾随标点(`dsh-ui>`)、空格规范化后均可识别
- [ ] md 段渲染零变化:现有 markdown/代码块/数学/图片/文件提及回归正常
- [ ] `mcp-app` 围栏通道零回归(照旧沙箱 iframe)
- [ ] 流式:未闭合 vcp 卡显示"卡片渲染中"占位,闭合后升级为真渲染;未闭合 dsh-ui 显示围栏占位
- [ ] 卡后余文:有空行分隔时 md 正常续排;无空行时卡内二次解析兜底,不吞文

### 校验与降级
- [ ] dsh-ui 段 JSON 损坏:错误徽章 + 折叠源码卡,不裸撒、不白屏
- [ ] vcp 段标签不配平:错误徽章 + 折叠源码卡
- [ ] 引擎 XHR 失败(路由缺失/5 次重试耗尽):VCP 卡降级为折叠源码卡,页面不崩
- [ ] KaTeX/mermaid/字体资产缺失:优雅降级(占位/源码框/系统字体),控制台无未捕获异常
- [ ] `segmentCards=false`:全部特殊段回退现有渲染(字面文本/CodeBlock),行为与改造前一致

### 安全
- [ ] 含 `<script>` 的 VCP 卡走 McpAppFrame 沙箱 iframe(allow-scripts allow-forms,**无 allow-same-origin**),主页面上下文零脚本注入
- [ ] 主页面无任何 eval/new Function 执行模型代码(引擎 new Function 仅加载引擎本体文件,不算模型代码执行)
- [ ] `window.__vcpTrusted` 不被 tidy 提供;vc shim 白名单(href/src/on* 剥离)生效
- [ ] GenuiBlock 白名单管线原样:无 innerHTML 渲染模型 JSON(mermaid strict + assertSafeSvg 除外,原版机制)

### 回归
- [ ] `npm run check`(typecheck+lint+test)全绿
- [ ] farm 兼容矩阵 21/21 绿(`node scripts/test-host-compat.mjs`,基线 2026-11-22)
- [ ] 原生"对话"视图零回归(genui DOM 接管照常、genui-plate 补底照常)
- [ ] raw-html-v2 插件同时安装时:`renderMode=delegate` 恢复现行为(整节点委托);`native` 下原生对话视图仍由 raw-html-v2 渲染,互不干扰
- [ ] 消息轨(canvas rail)/折叠编舞/阅读动效零回归(卡片不进入文本动画队列)

## Should Pass

### 右下角浮动控制簇(dock)
- [ ] 阅读视图与原生对话视图均显示 dock;渲染模式切换即时生效且两视图同步
- [ ] dock 不向 composer 工具栏注入任何节点(`[data-composer-card]` 子树零改动)
- [ ] 展开面板主题 token 适配(`--dsw-alias-*`)明暗皮肤;ESC/外点关闭;窄屏降级为单胶囊
- [ ] raw-html-v2 在场时位置冲突处理(`#vcp-trusted-toggle` 检测偏移)或经禁用提示消除

- [ ] client bundle 体积前后对比记录(genui 闭包 ~72 文件 + 13 module.css 进包),超预期时评估裁剪(TableNode 裁剪路径见 findings.md)
- [ ] vcp 卡流式渲染帧率:流式期增量渲染无整卡闪烁(settle memo 命中)
- [ ] `onclick="input('...')"` 桥:点击后文本经 fillComposer 填入输入框(shell.setDraft 优先,DOM 兜底)
- [ ] 设置三键持久化:`dsh.reader.v1` 读回正确,config-bridge 双向同步,旧配置迁移无损
- [ ] node 半 systemPrompt 段:开关关闭/委托模式注入降级文本;与 raw-html-v2/genui 段并存时总长度可接受
- [ ] 协议模式开关(教学端):dock 面板切换 dsh-ui/VCP 教学 → POST `/tidy-display/protocol-state` 落盘 → 下一回合 systemPrompt 反映(教学消失);关闭教学后历史消息既有卡照常渲染(教学端/渲染端解耦)
- [ ] `/tidy-display/vendor/` 路由:防穿越(`..` 拒绝/startsRoot)、MIME 白名单外 403、Cache-Control 生效、(kind,path) 重复注册被防御
- [ ] 明暗主题 × 玻璃皮肤:卡片衬底与 Reader 气泡底一致(`--dsw-alias-bg-layer-1` 系)
- [ ] 共存检测提示:`window.__DSH_BOOT__.entries` 检测到 genui / raw-html-v2 时,设置卡显示"建议禁用"提示(native 模式);delegate 模式提示放宽(需 raw-html-v2)
- [ ] 单元测试覆盖:`splitVcpText`(流式半截/RAWTEXT 跳过/围栏包裹/卡尾 style 吞并)、围栏别名识别、JSON 修复降级、script 检测路由
