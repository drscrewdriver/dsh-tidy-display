/**
 * VCP segment card — assembles one `vcp-root` card (or a full-page document)
 * from the segmentation output. Routing:
 * 1. HTML carries <script> → McpAppFrame sandbox iframe (allow-scripts,
 *    no allow-same-origin; the page context never evaluates model JS);
 * 2. otherwise the ported v1 engine renders it (streaming increments, per-
 *    message scoping, font locking) inside VcpErrorBoundary;
 * 3. engine missing / render failure / user off-switch → degraded fold card
 *    with the source (never a raw dump).
 */
import { memo } from 'react'
import { SegmentCard } from './SegmentCard.js'
import { segmentPrefsSnapshot } from './prefs-gate.js'
import { hasScriptTag } from '../vcp/segmentation.js'
import { isVcpEngineReady } from '../vcp/bootstrap.js'
import { vcpEngineRender, vcpPageRender } from '../vcp/render.js'
import { VcpErrorBoundary } from '../vcp/error-boundary.js'
import { McpAppFrame } from '../McpAppFrame.js'

export interface VcpSegmentCardProps {
  /** Closed card HTML, streaming half (pending), or page document. */
  html: string
  streaming: boolean
  /** Stable per-message-position key — engine settle memo identity. */
  segKey: string
  /** Render as a full-page document frame (scoped CSS, 72vh scroll). */
  page?: boolean
  label?: string
}

export const VcpSegmentCard = memo(function VcpSegmentCard({
  html,
  streaming,
  segKey,
  page = false,
  label,
}: VcpSegmentCardProps) {
  const collapseDefault = segmentPrefsSnapshot().cardCollapseDefault
  const cardLabel = label ?? (page ? '视觉页面' : '视觉卡片')

  // Route 1 — sandbox: card carries <script>; page context never evaluates it.
  if (hasScriptTag(html)) {
    return (
      <SegmentCard label={cardLabel} badge="沙箱">
        <McpAppFrame html={html} title={page ? '独立视觉页面(沙箱)' : '交互式视觉卡片(沙箱)'} />
      </SegmentCard>
    )
  }

  // Route 2a — engine not ready: streaming shows the honest placeholder (the
  // bootstrap retries); settled degrades to the source fold (retries exhausted).
  if (!isVcpEngineReady()) {
    if (streaming) {
      return <SegmentCard label={cardLabel} streaming streamingLabel="卡片渲染中…" />
    }
    return (
      <SegmentCard
        label={cardLabel}
        badge="校验失败"
        badgeTone="error"
        error="渲染引擎未就绪(静态资源路由缺失或加载失败)"
        source={html}
        sourceInitiallyOpen={!collapseDefault}
      />
    )
  }

  // Route 2b — engine render.
  const rendered = page
    ? vcpPageRender(html, streaming, segKey)
    : vcpEngineRender(html, streaming, segKey)
  if (rendered === null || rendered === undefined) {
    return (
      <SegmentCard
        label={cardLabel}
        badge="校验失败"
        badgeTone="error"
        error="渲染产物为空(卡片 HTML 结构可能不完整)"
        source={html}
        sourceInitiallyOpen={!collapseDefault}
      />
    )
  }
  return (
    <VcpErrorBoundary>
      <SegmentCard label={cardLabel} streaming={streaming} streamingLabel="卡片渲染中…">
        {rendered}
      </SegmentCard>
    </VcpErrorBoundary>
  )
})
