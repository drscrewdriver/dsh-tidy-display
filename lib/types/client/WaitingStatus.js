import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { WaitClock } from './WaitClock.js';
import css from './Reader.module.css';
export function WaitingStatus({ anchor, label }) {
    // A new input gets its own clock even if the waiting indicator stays mounted;
    // the readout itself is shared with the group status so the two never disagree.
    return _jsxs("div", { className: css.turnStatus, role: "status", "aria-live": "polite", "data-reader-turn-status": true, "data-reader-wait-start": anchor.time ?? '', children: [_jsx("span", { className: css.turnStatusLabel, children: label }), _jsx(WaitClock, { startTime: anchor.time }, anchor.key)] });
}
//# sourceMappingURL=WaitingStatus.js.map