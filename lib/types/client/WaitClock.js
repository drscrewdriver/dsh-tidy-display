import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
export function WaitClock({ startTime }) {
    const [mountedAt] = useState(() => Date.now());
    const [now, setNow] = useState(() => Date.now());
    const anchor = startTime ?? mountedAt;
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 250);
        return () => clearInterval(id);
    }, []);
    const waited = Math.max(0, now - anchor);
    const overtime = waited >= WAIT_OVERTIME_MS;
    return _jsxs("span", { className: css.waitClock, "data-reader-wait-clock": true, ...(overtime ? { 'data-overtime': '' } : {}), children: [_jsx("span", { className: css.waitSeconds, children: formatRunDuration(waited) }), overtime && _jsx("span", { className: css.waitOvertime, "data-reader-wait-badge": true, children: "\u6682\u672A\u54CD\u5E94" })] });
}
//# sourceMappingURL=WaitClock.js.map