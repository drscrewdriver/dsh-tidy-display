import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo, useEffect, useRef, useState } from 'react';
import { formatRanFor, formatRunDuration } from './message-chrome.js';
import css from './TurnMetrics.module.css';
function formatTokens(count) {
    if (count >= 1_000_000)
        return `${(count / 1_000_000).toFixed(2)}M tok`;
    if (count >= 1000)
        return `${(count / 1000).toFixed(1)}k tok`;
    return `${count} tok`;
}
export const TurnMetrics = memo(function TurnMetrics({ usage, runMs, tokensPerSecond, ttftMs, }) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);
    useEffect(() => {
        if (!open)
            return;
        const onClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        const onKeyDown = (e) => {
            if (e.key === 'Escape')
                setOpen(false);
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
    if (!hasTiming && !hasTokens)
        return null;
    const cacheHitPercent = usage && usage.cacheReadTokens && usage.totalTokens > usage.outputTokens
        ? Math.round((usage.cacheReadTokens / (usage.totalTokens - usage.outputTokens)) * 100)
        : null;
    return (_jsxs("span", { ref: containerRef, className: css.container, children: [hasTokens && typeof totalTokens === 'number' && (_jsxs("button", { type: "button", className: css.pillButton, "data-active": open, onClick: () => setOpen(v => !v), "aria-expanded": open, title: "\u67E5\u770B\u672C\u8F6E Token \u6D88\u8017", children: [_jsxs("svg", { className: css.pillIcon, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", children: [_jsx("ellipse", { cx: "8", cy: "4.2", rx: "5", ry: "2.2", strokeWidth: "1.2" }), _jsx("path", { d: "M3 4.2v7.6c0 1.2 2.2 2.2 5 2.2s5-1 5-2.2V4.2", strokeWidth: "1.2" }), _jsx("path", { d: "M3 8c0 1.2 2.2 2.2 5 2.2s5-1 5-2.2", strokeWidth: "1.2" })] }), _jsxs("span", { children: ["\u7528\u91CF ", formatTokens(totalTokens)] })] })), hasTiming && typeof runMs === 'number' && (_jsxs("button", { type: "button", className: css.timeButton, "data-active": open, onClick: () => setOpen(v => !v), "aria-expanded": open, "aria-label": formatRanFor(runMs), title: "\u67E5\u770B\u672C\u8F6E\u7528\u65F6\u548C\u901F\u5EA6", children: [_jsxs("svg", { className: css.pillIcon, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", children: [_jsx("circle", { cx: "8", cy: "8", r: "6.5", strokeWidth: "1.2" }), _jsx("path", { d: "M8 4.5v3.8l2.5 1.5", strokeWidth: "1.2", strokeLinecap: "round", strokeLinejoin: "round" })] }), _jsx("span", { children: formatRanFor(runMs) })] })), open && (_jsxs("div", { className: css.metricsPop, role: "dialog", "aria-label": "\u672C\u8F6E\u6982\u51B5", children: [_jsx("div", { className: css.popHeader, children: _jsx("span", { children: "\u672C\u8F6E\u6027\u80FD\u4E0E\u7528\u91CF\u6982\u51B5" }) }), hasTiming && typeof runMs === 'number' && (_jsxs("div", { className: css.popSection, children: [_jsx("div", { className: css.popSectionTitle, children: "\u8017\u65F6\u4E0E\u751F\u6210\u901F\u5EA6" }), _jsxs("div", { className: css.popGrid, children: [_jsx("span", { className: css.popLabel, children: "\u603B\u7528\u65F6" }), _jsx("span", { className: css.popValue, children: formatRunDuration(runMs) }), typeof tokensPerSecond === 'number' && tokensPerSecond > 0 && (_jsxs(_Fragment, { children: [_jsx("span", { className: css.popLabel, children: "\u751F\u6210\u541E\u5410 (TPS)" }), _jsxs("span", { className: css.popValue, children: [tokensPerSecond.toFixed(1), " tok/s"] })] })), typeof ttftMs === 'number' && ttftMs > 0 && (_jsxs(_Fragment, { children: [_jsx("span", { className: css.popLabel, children: "\u9996\u5B57\u5EF6\u8FDF (TTFT)" }), _jsxs("span", { className: css.popValue, children: [(ttftMs / 1000).toFixed(2), "s"] })] }))] })] })), hasTokens && usage && (_jsxs("div", { className: css.popSection, children: [_jsx("div", { className: css.popSectionTitle, children: "Token \u6D88\u8017\u5206\u89E3" }), _jsxs("div", { className: css.popGrid, children: [_jsx("span", { className: css.popLabel, children: "\u603B\u6D88\u8017" }), _jsxs("span", { className: css.popValue, children: [usage.totalTokens.toLocaleString(), " tok"] }), _jsxs("span", { className: css.popLabel, children: ["\u8F93\u5165", cacheHitPercent !== null && (_jsxs("span", { className: css.popBadge, children: ["\u547D\u4E2D ", cacheHitPercent, "%"] }))] }), _jsxs("span", { className: css.popValue, children: [(usage.totalTokens - usage.outputTokens).toLocaleString(), " tok"] }), typeof usage.cacheReadTokens === 'number' && usage.cacheReadTokens > 0 && (_jsxs(_Fragment, { children: [_jsx("span", { className: css.popLabel, children: "\u7F13\u5B58\u8BFB\u53D6" }), _jsxs("span", { className: css.popValue, children: [usage.cacheReadTokens.toLocaleString(), " tok"] })] })), _jsxs("span", { className: css.popLabel, children: ["\u8F93\u51FA", typeof usage.reasoningTokens === 'number' && usage.reasoningTokens > 0 && (_jsxs("span", { className: css.popBadge, children: ["\u601D\u8003 ", usage.reasoningTokens.toLocaleString()] }))] }), _jsxs("span", { className: css.popValue, children: [usage.outputTokens?.toLocaleString() ?? 0, " tok"] })] })] }))] }))] }));
});
//# sourceMappingURL=TurnMetrics.js.map