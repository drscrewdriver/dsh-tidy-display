import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { formatRunDuration } from './message-chrome.js';
import css from './Reader.module.css';
/** Past this, a wait stops being a pause and becomes worth flagging. */
export const WAIT_OVERTIME_MS = 10_000;
/**
 * The elapsed seconds of a wait, plus a bar that fills toward the ten-second
 * mark. Lives beside the status label rather than in the reader's own footer,
 * because the group status is what the eye is on while the model works — and it
 * is the only indicator that survives the model emitting its first tool call.
 *
 * Before the mark, the bar reads as progress; after it, the badge says the wait
 * has run long while the seconds keep counting.
 */
export function WaitClock({ startTime }) {
    const [mountedAt] = useState(() => Date.now());
    const [now, setNow] = useState(() => Date.now());
    const anchor = startTime ?? mountedAt;
    useEffect(() => {
        // 250ms keeps the bar moving smoothly; only the readout changes after that.
        const id = setInterval(() => setNow(Date.now()), 250);
        return () => clearInterval(id);
    }, []);
    const waited = Math.max(0, now - anchor);
    const overtime = waited >= WAIT_OVERTIME_MS;
    const progress = Math.min(1, waited / WAIT_OVERTIME_MS);
    return _jsxs("span", { className: css.waitClock, "data-reader-wait-clock": true, ...(overtime ? { 'data-overtime': '' } : {}), children: [_jsxs("span", { className: css.waitTrack, "aria-hidden": "true", children: [_jsx("span", { className: css.waitFill, style: { transform: `scaleX(${progress})` } }), _jsx("span", { className: css.waitMark, title: "10 \u79D2" })] }), _jsx("span", { className: css.waitSeconds, children: formatRunDuration(waited) }), overtime && _jsx("span", { className: css.waitOvertime, "data-reader-wait-badge": true, children: "\u6682\u672A\u54CD\u5E94" })] });
}
//# sourceMappingURL=WaitingClock.js.map