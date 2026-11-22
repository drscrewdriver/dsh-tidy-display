/**
 * Module-level prefs snapshot for the markdown render layer.
 *
 * The mdast render functions (markdown/render.tsx) sit below the Reader
 * component tree and receive no props — threading prefs through
 * `MarkdownRenderContext` would change a pinned public type. Instead the
 * client entry mirrors the three segment prefs here on every store change;
 * cards read the snapshot synchronously. Reactivity comes from the Reader
 * re-render (it subscribes to the same store), which re-runs the render
 * functions and re-reads the snapshot.
 */

export type SegmentRenderMode = 'native' | 'delegate'

export interface SegmentPrefsSnapshot {
  /** 分段分发渲染总开关(false = 特殊段回退现有渲染)。 */
  segmentCards: boolean
  /** 不可渲染段默认折叠(true = 折叠,展开才见源码)。 */
  cardCollapseDefault: boolean
}

let snapshot: SegmentPrefsSnapshot = {
  segmentCards: true,
  cardCollapseDefault: true,
}

export function segmentPrefsSnapshot(): SegmentPrefsSnapshot {
  return snapshot
}

export function setSegmentPrefsSnapshot(next: Partial<SegmentPrefsSnapshot>): void {
  snapshot = { ...snapshot, ...next }
}
