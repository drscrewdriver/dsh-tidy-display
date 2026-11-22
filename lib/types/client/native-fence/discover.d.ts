/**
 * Native-fence discovery helpers — pure functions, no DOM, so node tests
 * exercise them directly.
 *
 * Ported (MIT; credited in THIRD_PARTY_NOTICES.md) from
 * `@changfenhuang/dsh-genui` `src/shared/fence-language.ts` and
 * `src/client/dom-fence.tsx`, slimmed to the dsh-ui-only channel this plugin
 * runs in the native conversation view. The DOM-walking half of discovery
 * lives in `channel.ts`; everything whose input is a string or number sits
 * here.
 */
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
//# sourceMappingURL=discover.d.ts.map