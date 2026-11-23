/**
 * Unified segment protocol teaching — the single systemPrompt section that
 * replaces the two conflicting per-plugin teachings (dsh-raw-html-v2's VCP
 * block + genui's dsh-ui block) once this plugin owns rendering.
 *
 * Drafted per docs/plans/2026-11-22-segmented-rendering/findings.md §8.3:
 *   1. channel router table (new)          — 内容形态 → 通道
 *   2. domain yield (resolves C1/C3)       — 表格/图表/表单让渡 dsh-ui;VCP 收缩为自由视觉容器
 *   3. tool discipline merge (resolves C2) — 三工具按通道调用,其余不调
 *   4. load-bearing rules kept verbatim    — 渲染器实际约束的条款逐条保留
 *   5. aesthetics scoped to VCP (C5)       — 六条底线,不越界
 *   6. interaction semantics split (C6)    — [genui-action] 自动回流 vs input() 回填
 *   7. thinking discipline union (C4)      — 关键词级 + 验证型思考不算税
 *   8. non-load-bearing content external   — 完整美学/组件规范按需读文件
 *   9. degradation chain                   — 开关关 → 摘通道;全关 → DISABLED 文本
 *  10. two tiers                           — 有 skill 工具精简,无工具注入词汇表
 *
 * 原文素材:findings.prompts.md(逐字提取,2026-11-22 克隆)。
 */

/** 三协议教学开关(dock 面板 → POST /tidy-display/protocol-state 持久化)。 */
export interface ProtocolSwitches {
  /** 教模型输出 ```dsh-ui 组件围栏。 */
  dshUi: boolean
  /** 教模型输出 VCP 裸 HTML 视觉卡。 */
  vcp: boolean
}

export const PROTOCOL_DEFAULTS: ProtocolSwitches = { dshUi: true, vcp: true }

const DSH_UI_CHANNEL = `【dsh-ui 组件通道】(结构化数据与交互)
- 正文内 \`\`\`dsh-ui 围栏,内含严格合法 JSON:{"items":[{"type":"…"}]};规模 ≤200 节点、嵌套 ≤8 层(超出被截断)。
- 什么时候用:按共同维度比较 → table/choices;数值趋势/占比 → chart(kind: bars|line|donut, data:[{label,value}])/table;步骤/分支 → steps;需要筛选/输入/计算 → input/select/choices + 结果组件;单个数字无需强行出组件。普通解释和短清单默认正文,无组件数量配额。
- 组件字段以 genui skill 为准(可用时 MUST 先加载);无 skill 工具时用词汇表(括号内即**规范字段名**):text(content)/row(items)/col(items)/grid(cols+items)/card(title+items)/callout(content, tone: info|success|warning|error)/stat(label+value)/badge(label)/progress(value)/list(items)/table(columns+rows)/keyvalue(pairs)/steps(steps)/compare(before+after)/diff(diffs)/json(value)/code(code)/file-tree(items)/button/choices(需带 action)。
- **字段名一律用规范名,严禁别名**:callout 正文是 \`content\`(不是 text/body/desc);text 正文是 \`content\`;table 是 \`columns\`+\`rows\`(不是 headers/data),rows 是**二维数组**不是对象数组;keyvalue 是 \`pairs\`(不是 items);badge 是 \`label\`(不是 text)。别名虽能在阅读视图被自动修正,但原生对话视图的内容识别要求「守卫前后逐字相等」,一旦需要改写即判否——**整条围栏连同同围栏内其他组件一起退回普通代码块**,不做局部降级。
- 最小正确示例(照抄字段名):{"items":[{"type":"callout","tone":"info","content":"结论一句话"},{"type":"table","columns":["包","下载","变化"],"rows":[["dsh-a","1,234","+5.2%"]]}]}
- JSON 严格合法;≥3 节点或含 table 时 MUST 调 validate_dsh_ui,按诊断修改重验,通过后 MUST 逐字复制其 JSON 结果(工具可用时)。
- 交互组件必须带 action;点击后以 [genui-action] name + 数据回流(自动排队发送)。UI 能本地完成的状态变化(排序/判卷/显隐)不回流。
- 围栏只写在回答正文(思考块里不渲染);"panel":true 进会话面板原地更新。
- 不索取密码/API Key/Token/恢复码。`

const VCP_CHANNEL = `【VCP 视觉卡片通道】(仅自由视觉容器:装帧封面/杂志排版/情绪卡片/终端风/数据大屏美化)
- 视觉内容输出为 \`\`\`html 围栏,围栏体内以根容器 <div id="vcp-root"> 开头(id 非 class——渲染层剥壳按 id 作用域化);裸 HTML 直写正文会被宿主原生视图转义成文字,严禁;严禁缩进成代码块;严禁写 .html 文件交付。
- 开标签只放短关键值:背景色/字色/字号,font-family 必须内联在根开标签;长样式(渐变/圆角/布局/行高)全部进 <style> 的 #vcp-root 前缀规则;选择器一律以 #vcp-root 前缀书写。
- 卡内无空行(\\n\\n),<style> 内无空行;无 backdrop-filter;禁 flex-wrap:wrap 与 margin:0 auto(流式防抖);CSS ≤200 行、类选择器 ≤12;入场动画只用 opacity 淡入;SVG 必带 width/height+viewBox;HTML 语境用 <img>,不解析 Markdown;代码展示用 <pre><code> 且尖括号必须转义(&lt; &gt;)。
- 交互仅限 onclick="input('…')"(回填输入框,由用户手动发送,不自动发送);禁 <script>/外链脚本(带脚本的卡会整体转沙箱渲染,主上下文不执行)。
- 主动判断何时上视觉:文学/故事/情感 → 纸质纹理衬线装帧;数理/推导 → KaTeX 公式($$…$$)/Mermaid 流程图;理性/代码/终端 → 极简深底等宽;警告/状态 → 高对比警示色。风格完全自由,铁律只保「不崩」。
- 审美底线(仅约束 VCP 卡):元素对齐 4/8 步长网格;一屏一个视觉焦点;强调色全卡至多一处;主色六成次色三成强调一成、全卡 ≤5 色;分组靠留白不靠边框堆叠;禁 Emoji——要图标用内联 SVG。
- 数学 $$…$$ 与 \`\`\`mermaid 围栏(卡外正文)可直接用。`

const GENERAL_DISCIPLINE = `【通用纪律】
- 回复与 UI 文字一律匹配对话语言,不按示例推断。
- 只呈现一次信息,不重复正文已有内容。
- 思考最小化:关键词级即可,不誊写数据、不默背规则、不把 HTML/CSS 写进思考;为验证 spec 而调用工具不算思考税。
- 内容定稿 → 外壳一次成型:先写正文再包视觉外壳,禁止来回改。`

/** 通道关闭时从路由表摘除对应条目;全关 → 降级文本。 */
export function buildSegmentTeaching(
  switches: ProtocolSwitches,
  options: { hasSkillTool?: boolean } = {},
): string {
  const { dshUi, vcp } = switches
  if (!dshUi && !vcp) {
    return '(交互式界面分段渲染当前全部关闭:请使用普通 Markdown 回复,不要输出 dsh-ui 围栏、<div id="vcp-root"> 等 HTML 容器。)'
  }
  const router: string[] = []
  router.push('- 结构化数据与交互(表格/对比/筛选/表单/quiz/步骤/图表/面板)→ ```dsh-ui JSON 围栏——数据表格一律走这里,不要手写 HTML 表格。')
  if (vcp) router.push('- 自由视觉容器(装帧封面/杂志排版/情绪卡片/终端风/大屏美化)→ ```html 围栏包裹的 VCP 卡(见 VCP 通道)。')
  router.push('- 完整交互应用/原型(复杂 JS 逻辑的多步应用)→ ```mcp-app 围栏(沙箱渲染)。')
  router.push('- 一两句能说清的小事 → 纯 Markdown。就近选择即可;选得不够精确也会被正确渲染,不要为选择写论证。')
  const skillNote = options.hasSkillTool === true
    ? '组件字段 MUST 以 genui skill 为准(先加载 skill 工具)。'
    : ''
  const parts = [
    '## 交互式回复界面协议(分段渲染)',
    '你可把回复中的片段输出为可渲染的「界面段」,渲染器按段分发;普通解释仍是 Markdown。',
    '【通道选择 · 先于动笔】',
    ...router,
  ]
  if (dshUi) parts.push(DSH_UI_CHANNEL)
  if (vcp) parts.push(VCP_CHANNEL)
  parts.push(GENERAL_DISCIPLINE)
  if (dshUi && skillNote) parts.push(skillNote)
  return parts.filter(Boolean).join('\n\n')
}
