import { memo, useEffect, useRef, useState } from 'react';
import type { TurnTailChatData } from '@deepseek-ai/dsh-client-ui-chat/client';
import { formatRanFor, formatRunDuration } from './message-chrome.js';
import { t } from './locales.js';
import css from './TurnMetrics.module.css';

type TurnTokenUsage = NonNullable<TurnTailChatData['tokenUsage']>;

export interface TurnMetricsProps {
  usage?: TurnTokenUsage;
  runMs?: number;
  tokensPerSecond?: number;
  ttftMs?: number;
}

function formatTokens(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(2)}M tok`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k tok`;
  return `${count} tok`;
}

export const TurnMetrics = memo(function TurnMetrics({
  usage,
  runMs,
  tokensPerSecond,
  ttftMs,
}: TurnMetricsProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const totalTokens = usage?.totalTokens;
  const hasTiming = typeof runMs === 'number' && runMs > 0;
  const hasTokens = typeof totalTokens === 'number' && totalTokens > 0;
  if (!hasTiming && !hasTokens) return null;

  const cacheHitPercent = usage && usage.cacheReadTokens && usage.totalTokens > usage.outputTokens
    ? Math.round((usage.cacheReadTokens / (usage.totalTokens - usage.outputTokens)) * 100)
    : null;

  return (
    <span ref={containerRef} className={css.container}>
      {hasTokens && typeof totalTokens === 'number' && (
        <button
          type="button"
          className={css.pillButton}
          data-active={open}
          onClick={() => setOpen(v => !v)}
          aria-expanded={open}
          title={t('metrics.tokensTitle')}
        >
          <svg className={css.pillIcon} viewBox="0 0 16 16" fill="none" stroke="currentColor">
            <ellipse cx="8" cy="4.2" rx="5" ry="2.2" strokeWidth="1.2" />
            <path d="M3 4.2v7.6c0 1.2 2.2 2.2 5 2.2s5-1 5-2.2V4.2" strokeWidth="1.2" />
            <path d="M3 8c0 1.2 2.2 2.2 5 2.2s5-1 5-2.2" strokeWidth="1.2" />
          </svg>
          <span>{t('metrics.usage', { tokens: formatTokens(totalTokens) })}</span>
        </button>
      )}
      {hasTiming && typeof runMs === 'number' && (
        <button
          type="button"
          className={css.timeButton}
          data-active={open}
          onClick={() => setOpen(v => !v)}
          aria-expanded={open}
          aria-label={formatRanFor(runMs)}
          title={t('metrics.timingTitle')}
        >
          <svg className={css.pillIcon} viewBox="0 0 16 16" fill="none" stroke="currentColor">
            <circle cx="8" cy="8" r="6.5" strokeWidth="1.2" />
            <path d="M8 4.5v3.8l2.5 1.5" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{formatRanFor(runMs)}</span>
        </button>
      )}

      {open && (
        <div className={css.metricsPop} role="dialog" aria-label={t('metrics.dialogAria')}>
          <div className={css.popHeader}>
            <span>{t('metrics.header')}</span>
          </div>

          {hasTiming && typeof runMs === 'number' && (
            <div className={css.popSection}>
              <div className={css.popSectionTitle}>{t('metrics.timingSection')}</div>
              <div className={css.popGrid}>
                <span className={css.popLabel}>{t('metrics.totalTime')}</span>
                <span className={css.popValue}>{formatRunDuration(runMs)}</span>

                {typeof tokensPerSecond === 'number' && tokensPerSecond > 0 && (
                  <>
                    <span className={css.popLabel}>{t('metrics.tps')}</span>
                    <span className={css.popValue}>{tokensPerSecond.toFixed(1)} tok/s</span>
                  </>
                )}

                {typeof ttftMs === 'number' && ttftMs > 0 && (
                  <>
                    <span className={css.popLabel}>{t('metrics.ttft')}</span>
                    <span className={css.popValue}>{(ttftMs / 1000).toFixed(2)}s</span>
                  </>
                )}
              </div>
            </div>
          )}

          {hasTokens && usage && (
            <div className={css.popSection}>
              <div className={css.popSectionTitle}>{t('metrics.tokenSection')}</div>
              <div className={css.popGrid}>
                <span className={css.popLabel}>{t('metrics.total')}</span>
                <span className={css.popValue}>{usage.totalTokens.toLocaleString()} tok</span>

                <span className={css.popLabel}>
                  {t('metrics.input')}
                  {cacheHitPercent !== null && (
                    <span className={css.popBadge}>{t('metrics.cacheHit', { pct: cacheHitPercent })}</span>
                  )}
                </span>
                <span className={css.popValue}>{(usage.totalTokens - usage.outputTokens).toLocaleString()} tok</span>

                {typeof usage.cacheReadTokens === 'number' && usage.cacheReadTokens > 0 && (
                  <>
                    <span className={css.popLabel}>{t('metrics.cacheRead')}</span>
                    <span className={css.popValue}>{usage.cacheReadTokens.toLocaleString()} tok</span>
                  </>
                )}

                <span className={css.popLabel}>
                  {t('metrics.output')}
                  {typeof usage.reasoningTokens === 'number' && usage.reasoningTokens > 0 && (
                    <span className={css.popBadge}>{t('metrics.thinkingTokens', { n: usage.reasoningTokens.toLocaleString() })}</span>
                  )}
                </span>
                <span className={css.popValue}>{usage.outputTokens?.toLocaleString() ?? 0} tok</span>
              </div>
            </div>
          )}
        </div>
      )}
    </span>
  );
});
