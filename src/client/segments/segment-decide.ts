/**
 * Pure decision helpers for the segmented-rendering mdast hooks — kept free of
 * React/markdown-layer imports so node tests can exercise them directly.
 * The regex semantics port dsh-raw-html-v2's `findVcpOpen` line-start rule.
 */

/** 分段围栏语言归一:小写 + 剥非字母/连字符('dsh-ui>' → 'dshui','HTML:' → 'html')。 */
export function normalizeSegmentLang(lang: string | null | undefined): string {
  return String(lang ?? '').trim().toLowerCase().replace(/[^a-z-]/g, '')
}

/** 归一后的围栏语言是否走 GenUI 卡(dsh-ui 及其容错别名)。 */
export function isDshUiFence(lang: string | null | undefined): boolean {
  const norm = normalizeSegmentLang(lang)
  return norm === 'dsh-ui' || norm === 'dshui'
}

/** 归一后的围栏语言是否走 Mermaid 图(引擎懒加载渲染,失败退源码框)。
 *  与 `resolveFenceKind` 的 mermaid 分支同口径——Reader 的 mdast 分发与原生
 *  DOM 通道必须对同一条围栏同判,否则同一回复在两个视图里一图一源码。 */
export function isMermaidFence(lang: string | null | undefined): boolean {
  return normalizeSegmentLang(lang) === 'mermaid'
}

/** 围栏内容(html 围栏剥壳后)是否以 vcp-root 卡或整页文档开头。 */
const VCP_ROOT_OPEN_RE = /^\s*<div\b[^>]*\bid\s*=\s*["']?vcp-root["']?[^>]*>/i
const PAGE_OPEN_TRIM_RE = /^\s*(?:<!doctype\s+html\b|<html[\s>])/i

export function looksLikeVcpHtmlBlock(value: string): boolean {
  const trimmed = String(value ?? '').trimStart()
  return VCP_ROOT_OPEN_RE.test(trimmed) || PAGE_OPEN_TRIM_RE.test(trimmed)
}

/** mdast 节点是否块级行首(html 块列首,column 1)——行内提及的字样不满足。 */
export function isBlockLevelLineStart(position: { start?: { column?: number } } | null | undefined): boolean {
  return (position?.start?.column ?? 2) === 1
}
