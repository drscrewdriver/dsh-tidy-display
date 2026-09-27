import { useEffect, useState } from 'react';
import { formatRunDuration } from './message-chrome.js';
import css from './Reader.module.css';

/** Past this, a wait stops being a pause and reads as the model not answering. */
export const WAIT_OVERTIME_MS = 10_000;

/**
 * How long the model has been given the turn, counted in plain seconds.
 *
 * Just the number and, past ten seconds, a「暂未响应」badge — no bar, because the
 * question the reader has is「how long has this been hanging」, not「how far
 * along」: there is no known total to be a fraction of.
 *
 * The clock restarts whenever the anchor changes, so each wait is timed from the
 * event that started it rather than from the beginning of the turn.
 */
export function WaitClock({ startTime }: { startTime: number | null }) {
  const [mountedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const anchor = startTime ?? mountedAt;
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  const waited = Math.max(0, now - anchor);
  const overtime = waited >= WAIT_OVERTIME_MS;
  return <span className={css.waitClock} data-reader-wait-clock
    {...(overtime ? { 'data-overtime': '' } : {})}>
    <span className={css.waitSeconds}>{formatRunDuration(waited)}</span>
    {overtime && <span className={css.waitOvertime} data-reader-wait-badge>暂未响应</span>}
  </span>;
}
