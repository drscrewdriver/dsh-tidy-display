/**
 * dsh-ui segment card — renders a ```dsh-ui JSON fence from the assistant
 * reply through the official GenUI embed entry (`@changfenhuang/dsh-genui/embed`,
 * the public bundler surface for hosts consuming the renderer without the DSH
 * plugin runtime). Pipeline: JSON parse → processGenuiSpec (alias normalize +
 * repair + validate, shared with the genui plugin itself) → <GenuiBlock> with a
 * durable per-position stateKey (interaction state persists via its LRU store).
 *
 * Validation contract (plan §需求4): parse/guard failures degrade to the error
 * fold with diagnostics — never a JSON dump into the reading flow.
 */
import { memo } from 'react'
import { ErrorBoundary as GenuiErrorBoundary, GenuiBlock, processGenuiSpec } from '@changfenhuang/dsh-genui/embed'
import { SegmentCard } from './SegmentCard.js'
import { segmentPrefsSnapshot } from './prefs-gate.js'

export interface DshUiCardProps {
  /** Fence body (mdast code node value — fences already stripped by parse). */
  raw: string
  streaming: boolean
  /** Stable per-message-position key; doubles as the GenuiBlock stateKey. */
  segKey: string
}

function parseFenceJson(raw: string): { ok: true; value: unknown } | { ok: false; reason: string } {
  try {
    const value: unknown = JSON.parse(String(raw || '').trim())
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      return { ok: false, reason: '顶层必须是 JSON 对象(围栏协议:{"items":[…]})' }
    }
    return { ok: true, value }
  } catch (e) {
    return { ok: false, reason: 'JSON 解析失败:' + ((e as Error)?.message ?? '未知错误') }
  }
}

export const DshUiCard = memo(function DshUiCard({ raw, streaming, segKey }: DshUiCardProps) {
  const collapseDefault = segmentPrefsSnapshot().cardCollapseDefault

  if (streaming) {
    return <SegmentCard label="GenUI 组件" streaming streamingLabel="组件生成中…" />
  }

  const parsed = parseFenceJson(raw)
  if (!parsed.ok) {
    return (
      <SegmentCard
        label="GenUI 组件"
        badge="校验失败"
        badgeTone="error"
        error={parsed.reason}
        source={raw}
        sourceInitiallyOpen={!collapseDefault}
      />
    )
  }

  const result = processGenuiSpec(parsed.value)
  if (!result.spec) {
    const reason = result.errors.length > 0 ? result.errors.join('; ') : 'spec 校验未通过(无诊断详情)'
    return (
      <SegmentCard
        label="GenUI 组件"
        badge="校验失败"
        badgeTone="error"
        error={reason}
        source={raw}
        sourceInitiallyOpen={!collapseDefault}
      />
    )
  }

  const items = Array.isArray(result.spec.items) ? result.spec.items.length : 0
  return (
    <SegmentCard label="GenUI 组件" badge={`${items} 组件`}>
      <GenuiErrorBoundary>
        <GenuiBlock spec={result.spec} stateKey={`reader:${segKey}`} />
      </GenuiErrorBoundary>
    </SegmentCard>
  )
})
