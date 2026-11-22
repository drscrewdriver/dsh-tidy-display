/**
 * dsh-ui segment card — renders a ```dsh-ui JSON fence from the assistant
 * reply. Phase 2 = parse + validate + summary placeholder with the source
 * folded; Phase 3 swaps the body for the genuine GenuiBlock via the official
 * `@changfenhuang/dsh-genui/embed` entry (interactive components, local
 * state persistence, action loop).
 *
 * Validation contract (plan §需求4): the fence JSON must parse AND carry an
 * `items` array — failures degrade to the error fold, never a JSON dump.
 */
import { memo } from 'react'
import { SegmentCard } from './SegmentCard.js'
import { segmentPrefsSnapshot } from './prefs-gate.js'

export interface DshUiCardProps {
  /** Fence body (mdast code node value — fences already stripped by parse). */
  raw: string
  streaming: boolean
  /** Stable per-message-position key. */
  segKey: string
}

interface ParsedSummary {
  ok: boolean
  reason?: string
  itemCount?: number
  types?: string[]
  hasPanel?: boolean
}

function summarize(raw: string): ParsedSummary {
  let spec: unknown
  try {
    spec = JSON.parse(String(raw || '').trim())
  } catch (e) {
    return { ok: false, reason: 'JSON 解析失败:' + ((e as Error)?.message ?? '未知错误') }
  }
  if (spec === null || typeof spec !== 'object' || Array.isArray(spec)) {
    return { ok: false, reason: '顶层必须是 JSON 对象(含 items 数组)' }
  }
  const items = (spec as { items?: unknown }).items
  if (!Array.isArray(items)) {
    return { ok: false, reason: '缺少 items 数组(围栏协议:{"items":[…]})' }
  }
  const types: string[] = []
  for (const item of items) {
    if (item !== null && typeof item === 'object') {
      const t = (item as { type?: unknown }).type
      types.push(typeof t === 'string' ? t : '未知')
    }
  }
  const hasPanel = (spec as { panel?: unknown }).panel === true
  return { ok: true, itemCount: items.length, types, hasPanel }
}

export const DshUiCard = memo(function DshUiCard({ raw, streaming, segKey: _segKey }: DshUiCardProps) {
  const collapseDefault = segmentPrefsSnapshot().cardCollapseDefault

  if (streaming) {
    return <SegmentCard label="GenUI 组件" streaming streamingLabel="组件生成中…" />
  }

  const parsed = summarize(raw)
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

  const typeCounts = new Map<string, number>()
  for (const t of parsed.types ?? []) typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1)
  const summary = [...typeCounts.entries()].map(([t, n]) => (n > 1 ? `${t}×${n}` : t)).join('、')

  // Phase 2 占位体:Phase 3 将此 children 替换为 <GenuiBlock spec={…}/>
  return (
    <SegmentCard label="GenUI 组件" badge="占位">
      <div style={{ fontSize: '12px', lineHeight: 1.7, color: 'var(--dsw-alias-label-secondary,#666)' }}>
        <div>{parsed.itemCount} 个组件:{summary || '(空 items)'}</div>
        {parsed.hasPanel && <div>panel:true — 面板更新围栏</div>}
        <div style={{ marginTop: 4, opacity: .75 }}>完整交互渲染将在 genui embed 集成后提供</div>
      </div>
    </SegmentCard>
  )
})
