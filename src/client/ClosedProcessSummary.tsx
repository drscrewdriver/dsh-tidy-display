import { useRef } from 'react';
import css from './Reader.module.css';
import { Disclosure } from './motion.js';
import { FoldSummaryText } from './LiveFold.js';
import { foldSummary } from './live-turn.js';
import { DiffStat } from './DiffPanel.js';
import type { LiveStep } from './live-turn.js';

/** Keep process counts discoverable after the live-fold presentation retires. */
export function ClosedProcessSummary({ steps, open, onChange, controls }: {
  steps: readonly LiveStep[]; open: boolean; onChange: (value: boolean) => void; controls: string;
}) {
  const button = useRef<HTMLButtonElement>(null);
  if (!steps.length) return null;
  const summary = foldSummary(steps);
  return <div className={css.closedProcessSummary} data-reader-closed-summary={summary}>
    <div className={css.summaryRow}>
      <Disclosure open={open} onChange={onChange} controls={controls} buttonRef={button} ariaLabel="本轮过程详情"
        label={<FoldSummaryText summary={summary} motion={false} />} />
      <DiffStat steps={steps} label={summary} />
    </div>
  </div>;
}
