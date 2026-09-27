import { WaitClock } from './WaitClock.js';
import type { WaitingAnchor } from './waiting-clock.js';
import css from './Reader.module.css';

export function WaitingStatus({ anchor, label }: { anchor: WaitingAnchor; label: string }) {
  // A new input gets its own clock even if the waiting indicator stays mounted;
  // the readout itself is shared with the group status so the two never disagree.
  return <div className={css.turnStatus} role="status" aria-live="polite" data-reader-turn-status
    data-reader-wait-start={anchor.time ?? ''}>
    <span className={css.turnStatusLabel}>{label}</span>
    <WaitClock key={anchor.key} startTime={anchor.time} />
  </div>;
}
