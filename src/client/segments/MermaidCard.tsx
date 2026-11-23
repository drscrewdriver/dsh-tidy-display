/**
 * Mermaid segment — a ```mermaid fence rendered as a diagram through the
 * official GenUI embed entry as a single `mermaid` node.
 *
 * Why route it through the spec pipeline instead of calling the engine here:
 * genui's `MermaidNode` already owns the whole contract this plugin would
 * otherwise re-implement — lazy IIFE load from this plugin's own asset route
 * (`setGenuiAssetBase`), viewport-gated rendering, theme-token invalidation,
 * the whitelisted diagram kinds, `assertSafeSvg` sanitization, the zoom
 * dialog and the i18n strings. `processGenuiSpec` accepts a one-node spec
 * (verified against the shipped guard), so a bare fence becomes exactly the
 * same node a ```dsh-ui card would carry — one render path, one chrome.
 *
 * Degradation chain (never a blank frame, never a raw JS dump):
 * - guard rejects the node (empty/oversized body) → source `<pre>`;
 * - engine asset missing / 404 / kind not whitelisted → genui's own source
 *   frame + hint (its error state), which is also what a Reader stream shows
 *   before settle because the mdast path keeps the CodeBlock while streaming;
 * - React throw inside the block → GenUI ErrorBoundary, same as DshUiCard.
 *
 * No SegmentCard chrome by design: a diagram is self-describing, so a
 * "Mermaid 图" title bar would only add a header over every chart. The source
 * stays one fold away through the engine's own fallback.
 */
import { memo } from 'react'
import { ErrorBoundary as GenuiErrorBoundary, GenuiBlock, processGenuiSpec } from '@changfenhuang/dsh-genui/embed'

export interface MermaidCardProps {
  /** Fence body (mdast code node value / host block text — fences stripped). */
  code: string
  /** Stable per-message-position key; doubles as the GenuiBlock stateKey. */
  segKey: string
  /** Render surface owning the mount (`reader:` / `native:`) — namespaced so
   * the two views never share persisted interaction state. */
  channel?: string
}

/** Source fallback: the guard refused the node, so nothing can render it. */
function MermaidSource({ code }: { code: string }) {
  return (
    <pre data-tidy-mermaid-source="">
      <code className="language-mermaid">{code}</code>
    </pre>
  )
}

export const MermaidCard = memo(function MermaidCard({ code, segKey, channel = 'reader' }: MermaidCardProps) {
  const source = String(code ?? '')
  if (source.trim() === '') return null
  const built = processGenuiSpec({ items: [{ type: 'mermaid', code: source }] })
  if (!built.spec) return <MermaidSource code={source} />
  return (
    <div data-tidy-mermaid="" data-tidy-mermaid-channel={channel}>
      <GenuiErrorBoundary>
        <GenuiBlock spec={built.spec} stateKey={`${channel}:${segKey}`} />
      </GenuiErrorBoundary>
    </div>
  )
})
