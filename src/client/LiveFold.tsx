import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FOLD_TIMING } from './fold-choreography.js';
import css from './Reader.module.css';

/** Values are presentation commits, never live network counters. */
export function SubtleNumberRoll({ value, motion }: { value: number; motion: boolean }) {
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const previous = useRef(value);
  useLayoutEffect(() => {
    if (value === previous.current) return;
    const old = previous.current;
    previous.current = value;
    if (!motion) { setOutgoing(null); return; }
    setOutgoing(old);
    const timer = window.setTimeout(() => setOutgoing(null), FOLD_TIMING.count);
    return () => window.clearTimeout(timer);
  }, [value, motion]);
  return <span className={css.numberRollRoot} aria-hidden="true">
    <span className={css.numberRollSizer}>{value}</span>
    {outgoing !== null && <span key={`out-${outgoing}`} className={`${css.numberRollDigit} ${css.numberRollExit}`}>{outgoing}</span>}
    <span key={`cur-${value}`} className={`${css.numberRollDigit} ${outgoing !== null ? css.numberRollEnter : ''}`}>{value}</span>
  </span>;
}

export function FoldSummaryText({ summary, motion }: { summary: string; motion: boolean }) {
  const parts = useMemo(() => {
    const regex = /([^\d]+)(\d+)/g;
    const result: { text: string; number?: number }[] = [];
    let end = 0;
    for (const match of summary.matchAll(regex)) {
      result.push({ text: match[1]!, number: Number(match[2]) });
      end = match.index! + match[0].length;
    }
    if (end < summary.length) result.push({ text: summary.slice(end) });
    return result;
  }, [summary]);
  return <span className={css.foldSummary} data-reader-fold-summary={summary} aria-label={summary}>
    {parts.map(part => <span key={part.text} className={css.foldSummaryPart}>
      <span>{part.text}</span>
      {part.number !== undefined && <SubtleNumberRoll value={part.number} motion={motion} />}
    </span>)}
  </span>;
}
