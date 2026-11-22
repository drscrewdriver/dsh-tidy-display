/** Normalize a host fence-language label to the GenUI spelling. */
export declare function normalizeFenceLanguage(lang: string): string;
/** True when the normalized label names the dsh-ui fence. */
export declare function isDshUiLanguage(lang: string | null | undefined): boolean;
/**
 * Verdict for a code-block banner label:
 * - `'dsh-ui'`  — takeover by label;
 * - `'known'`   — a real non-GenUI language; never content-sniffed;
 * - `'generic'` — empty or a localized banner word → content recognition decides.
 */
export declare function labelVerdict(label: string): 'dsh-ui' | 'known' | 'generic';
/** Streaming placeholder gate: the body is a dsh-ui spec still arriving.
 * Requires the shape of a spec (an object carrying items/type/title/panel) so
 * a streaming ```json code block never gets taken over. */
export declare function looksLikeGenuiInProgress(raw: string): boolean;
/**
 * Stable source identity for a settled fence — genui's scheme
 * (`dom:<anchor>:<ordinal>`) kept verbatim so identities stay stable if a
 * future version ever needs to reconcile state across channels.
 */
export declare function fenceIdentity(anchorKey: string, ordinal: number): string;
/**
 * Key-order-insensitive JSON serialization for semantic equality. Object keys
 * sort; array order stays semantic. The guard's normalization rebuilds
 * objects in its own canonical key order (e.g. a model-written
 * `{type, tone, content}` callout comes back `{type, content, tone}`), so
 * content recognition MUST compare canonically — a raw `JSON.stringify`
 * equality rejects semantically identical specs whose key order differs
 * (real-world miss: one ranking card rendered, the next fell back to a code
 * block because a callout carried `tone` before `content`).
 */
export declare function canonicalJson(value: unknown): string;
/** 通道接管面——kind 决定挂载组件与流式语义。 */
export type FenceKind = 'ui' | 'vcp' | 'streaming-ui' | 'streaming-vcp' | 'skip';
/**
 * 围栏接管判定——Reader(mdast 分发)与原生 DOM 通道共用同一语义来源。
 *
 * - 标签 `dsh-ui`(含 `dshui` 别名/尾部标点)→ dsh-ui 通道;
 * - 标签 `html` → 围栏体剥壳后以 vcp-root 卡/整页文档开头才接管(普通
 *   ```html 代码块绝不劫持);
 * - 其他已知语言(json/python/…)→ skip:内容嗅探被标签短路(genui #258);
 * - 无标签(宿主隐去未知语言/本地化通用横幅/转义文本容器)→ settle 期认
 *   vcp 前缀,流式期认 vcp 前缀与 dsh-ui JSON 形状;JSON 的严格内容识别
 *   需要守卫(非纯),留在通道层。
 */
export declare function resolveFenceKind(body: string, label: string | null, settled: boolean): FenceKind;
export declare function isTextOnlyContainer(el: Element): boolean;
//# sourceMappingURL=discover.d.ts.map