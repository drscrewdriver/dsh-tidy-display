/**
 * VCP text segmentation — ported from dsh-raw-html-v2 lib/client.js 2463-2688
 * (which itself is the React-ized port of v1 v6-inject.js balancing logic).
 *
 * Pure string functions with zero external dependencies. `splitVcpText` cuts one
 * assistant text into segments: md prose, closed `vcp-root` card HTML, a streaming
 * `pending` tail (open tag seen, card not closed yet), and full `page` HTML
 * documents (<!DOCTYPE html>…</html>). `splitMermaidFence` additionally lifts
 * ```mermaid fences out of md segments as engine-ready HTML.
 *
 * Port notes (vs upstream):
 * - The two /g regexes (PAGE_OPEN_RE, MERMAID_FENCE_RE) become per-call literals
 *   here. Upstream reused module-level state with manual `lastIndex` resets; fresh
 *   literals keep identical matching semantics without shared mutable state.
 * - `hasScriptTag` is a tidy-display addition: sandbox routing for cards whose
 *   HTML carries <script> (we never eval in the page — see bootstrap/plan §5).
 */
export type VcpSegment = {
    type: 'md';
    text: string;
} | {
    type: 'vcp';
    html: string;
} | {
    type: 'pending';
    text: string;
} | {
    type: 'page';
    html?: string;
    text?: string;
} | {
    type: 'mermaid';
    html: string;
};
/** 页面样式脱敏:style 内独立 html/body 选择器 → .vcp-page-host(防全局污染)。 */
export declare function scopePageCss(html: string): string;
/** md 段里的 ```mermaid 围栏 → 转 <pre><code class="language-mermaid"> 喂引擎
 *  (code 带 class——引擎 pre>code 分支为实测成功路径)。 */
export declare function splitMermaidFence(md: string): Array<{
    type: 'md';
    text: string;
} | {
    type: 'mermaid';
    html: string;
}>;
/** 剥离 v1 锚点对齐的「纯围栏包装」:```html\n <卡> \n``` 时围栏行不进 md。 */
export declare function stripFenceWrapper(md: string): string;
/** F1:剥掉 md 尾部「未完成开标签」(<div id="vcp-r…),防流式起始闪一帧源码;
 *  仅剥字母开头的未闭合标签样尾巴,不误伤 'a < b';多层半截循环剥,上限 8 层。 */
export declare function trimTrailingOpenTag(s: string): string;
/** 把一条 assistant text 切成段:vcp=闭合卡;pending=已开未闭合(流式);
 *  page=整页 HTML(未闭合则 text 存半截);md 段顺带剥围栏包装与未完成开标签。 */
export declare function splitVcpText(text: string): VcpSegment[];
/** tidy-display 新增:卡 HTML 是否携带 <script>(含流式未闭合)——此类卡改走
 *  McpAppFrame 沙箱 iframe,永不进主页面执行(计划 §决策「沙箱 iframe 承接」)。
 *  转义后的 &lt;script 不会命中;裸 <script(含未闭合半截)即判真。 */
export declare function hasScriptTag(html: string): boolean;
//# sourceMappingURL=segmentation.d.ts.map