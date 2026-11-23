/**
 * Pure decision helpers for the segmented-rendering mdast hooks — kept free of
 * React/markdown-layer imports so node tests can exercise them directly.
 * The regex semantics port dsh-raw-html-v2's `findVcpOpen` line-start rule.
 */
/** 分段围栏语言归一:小写 + 剥非字母/连字符('dsh-ui>' → 'dshui','HTML:' → 'html')。 */
export declare function normalizeSegmentLang(lang: string | null | undefined): string;
/** 归一后的围栏语言是否走 GenUI 卡(dsh-ui 及其容错别名)。 */
export declare function isDshUiFence(lang: string | null | undefined): boolean;
/** 归一后的围栏语言是否走 Mermaid 图(引擎懒加载渲染,失败退源码框)。
 *  与 `resolveFenceKind` 的 mermaid 分支同口径——Reader 的 mdast 分发与原生
 *  DOM 通道必须对同一条围栏同判,否则同一回复在两个视图里一图一源码。 */
export declare function isMermaidFence(lang: string | null | undefined): boolean;
export declare function looksLikeVcpHtmlBlock(value: string): boolean;
/** mdast 节点是否块级行首(html 块列首,column 1)——行内提及的字样不满足。 */
export declare function isBlockLevelLineStart(position: {
    start?: {
        column?: number;
    };
} | null | undefined): boolean;
//# sourceMappingURL=segment-decide.d.ts.map