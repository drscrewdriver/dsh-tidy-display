import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef } from 'react';
import css from './Reader.module.css';
import { Disclosure } from './motion.js';
import { FoldSummaryText } from './LiveFold.js';
import { foldSummary } from './live-turn.js';
import { DiffStat } from './DiffPanel.js';
/** Keep process counts discoverable after the live-fold presentation retires. */
export function ClosedProcessSummary({ steps, open, onChange, controls }) {
    const button = useRef(null);
    if (!steps.length)
        return null;
    const summary = foldSummary(steps);
    return _jsx("div", { className: css.closedProcessSummary, "data-reader-closed-summary": summary, children: _jsxs("div", { className: css.summaryRow, children: [_jsx(Disclosure, { open: open, onChange: onChange, controls: controls, buttonRef: button, ariaLabel: "\u672C\u8F6E\u8FC7\u7A0B\u8BE6\u60C5", label: _jsx(FoldSummaryText, { summary: summary, motion: false }) }), _jsx(DiffStat, { steps: steps, label: summary })] }) });
}
//# sourceMappingURL=ClosedProcessSummary.js.map