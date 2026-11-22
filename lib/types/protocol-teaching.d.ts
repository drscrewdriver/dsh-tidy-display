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
    dshUi: boolean;
    /** 教模型输出 VCP 裸 HTML 视觉卡。 */
    vcp: boolean;
}
export declare const PROTOCOL_DEFAULTS: ProtocolSwitches;
/** 通道关闭时从路由表摘除对应条目;全关 → 降级文本。 */
export declare function buildSegmentTeaching(switches: ProtocolSwitches, options?: {
    hasSkillTool?: boolean;
}): string;
//# sourceMappingURL=protocol-teaching.d.ts.map