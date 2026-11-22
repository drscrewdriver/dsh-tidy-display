/**
 * Segment card shell — the folding container every special segment renders
 * into. Three modes:
 * - `streaming`: pulsing placeholder row (nothing collapsible yet);
 * - rendered body (`children`, no `error`): the card shows content directly;
 * - degraded (`error` + `source`): title row with an error badge and the raw
 *   source folded underneath — never a raw dump into the reading flow.
 *
 * Collapse behavior follows the `cardCollapseDefault` pref via the initial
 * open state passed by callers (`defaultCollapsed`); the state is local to
 * the card (the markdown layer has no onRead/owner channels — see plan §2).
 */
import { memo, useState } from 'react'
import type { ReactNode } from 'react'
import css from './SegmentCard.module.css'

export interface SegmentCardProps {
  label: string
  /** Status chip after the label (e.g. 沙箱 / 校验失败). */
  badge?: string | null
  badgeTone?: 'info' | 'error'
  /** Streaming placeholder mode: renders a pulsing row, ignores children. */
  streaming?: boolean
  streamingLabel?: string
  /** Degraded mode: reason line under the title. */
  error?: string | null
  /** Degraded mode: raw source folded under the title. */
  source?: string
  /** Initial source-fold open state; callers pass `!cardCollapseDefault`. */
  sourceInitiallyOpen?: boolean
  /** Rendered content (ok mode). */
  children?: ReactNode
}

const Chevron = ({ open }: { open: boolean }) => (
  <svg className={`${css.chevron} ${open ? css.chevronOpen : ''}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden>
    <path d="m6 4 4 4-4 4" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const SegmentCard = memo(function SegmentCard({
  label,
  badge,
  badgeTone = 'info',
  streaming = false,
  streamingLabel,
  error,
  source,
  sourceInitiallyOpen = false,
  children,
}: SegmentCardProps) {
  const [sourceOpen, setSourceOpen] = useState(sourceInitiallyOpen === true)

  if (streaming && children === undefined) {
    // 流式占位:仅在尚无可渲染内容时显示(引擎就绪的流式卡走 children 实时渲染)
    return (
      <div className={css.root} data-tidy-segment-card data-segment-state="streaming">
        <div className={css.streamingRow}>
          <span className={css.streamingDot} />
          <span>{streamingLabel ?? '卡片渲染中…'}</span>
        </div>
      </div>
    )
  }

  const degraded = Boolean(error) && typeof source === 'string'
  const showHeadButton = degraded || !children

  return (
    <div className={css.root} data-tidy-segment-card data-segment-state={degraded ? 'degraded' : 'rendered'}>
      <div
        className={`${css.head} ${showHeadButton ? '' : css.headStatic}`}
        {...(showHeadButton ? {
          role: 'button' as const,
          tabIndex: 0,
          'aria-expanded': degraded ? sourceOpen : undefined,
          onClick: () => { if (degraded) setSourceOpen(v => !v) },
          onKeyDown: (e: React.KeyboardEvent) => {
            if (degraded && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setSourceOpen(v => !v) }
          },
        } : {})}
      >
        {degraded && <Chevron open={sourceOpen} />}
        <span className={css.label}>{label}</span>
        {badge && <span className={badgeTone === 'error' ? `${css.badge} ${css.badgeError}` : css.badge}>{badge}</span>}
        <span className={css.headSpacer} />
        {!degraded && children === undefined && <Chevron open={false} />}
      </div>
      {error && <p className={css.errorLine}>{error}</p>}
      {degraded && sourceOpen && (
        <div className={css.source}>
          <pre className={css.sourceText}>{source}</pre>
        </div>
      )}
      {children !== undefined && !degraded && (
        <div className={css.body}>{children}</div>
      )}
    </div>
  )
})
