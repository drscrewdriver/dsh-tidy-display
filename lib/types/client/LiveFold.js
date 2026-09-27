import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FOLD_TIMING } from './fold-choreography.js';
import css from './Reader.module.css';
/** Values are presentation commits, never live network counters. */
export function SubtleNumberRoll({ value, motion }) {
    const [outgoing, setOutgoing] = useState(null);
    const previous = useRef(value);
    useLayoutEffect(() => {
        if (value === previous.current)
            return;
        const old = previous.current;
        previous.current = value;
        if (!motion) {
            setOutgoing(null);
            return;
        }
        setOutgoing(old);
        const timer = window.setTimeout(() => setOutgoing(null), FOLD_TIMING.count);
        return () => window.clearTimeout(timer);
    }, [value, motion]);
    return _jsxs("span", { className: css.numberRollRoot, "aria-hidden": "true", children: [_jsx("span", { className: css.numberRollSizer, children: value }), outgoing !== null && _jsx("span", { className: `${css.numberRollDigit} ${css.numberRollExit}`, children: outgoing }, `out-${outgoing}`), _jsx("span", { className: `${css.numberRollDigit} ${outgoing !== null ? css.numberRollEnter : ''}`, children: value }, `cur-${value}`)] });
}
export function FoldSummaryText({ summary, motion }) {
    const parts = useMemo(() => {
        const regex = /([^\d]+)(\d+)/g;
        const result = [];
        let end = 0;
        for (const match of summary.matchAll(regex)) {
            result.push({ text: match[1], number: Number(match[2]) });
            end = match.index + match[0].length;
        }
        if (end < summary.length)
            result.push({ text: summary.slice(end) });
        return result;
    }, [summary]);
    return _jsx("span", { className: css.foldSummary, "data-reader-fold-summary": summary, "aria-label": summary, children: parts.map(part => _jsxs("span", { className: css.foldSummaryPart, children: [_jsx("span", { children: part.text }), part.number !== undefined && _jsx(SubtleNumberRoll, { value: part.number, motion: motion })] }, part.text)) });
}
//# sourceMappingURL=LiveFold.js.map