import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo, useEffect, useRef, useState } from 'react';
import { formatRanFor, formatRunDuration } from './message-chrome.js';
import { t } from './locales.js';
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
    return (_jsxs("span", { ref: containerRef, className: css.container, children: [hasTokens && typeof totalTokens === 'number' && (_jsxs("button", { type: "button", className: css.pillButton, "data-active": open, onClick: () => setOpen(v => !v), "aria-expanded": open, title: t('metrics.tokensTitle'), children: [_jsxs("svg", { className: css.pillIcon, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", children: [_jsx("ellipse", { cx: "8", cy: "4.2", rx: "5", ry: "2.2", strokeWidth: "1.2" }), _jsx("path", { d: "M3 4.2v7.6c0 1.2 2.2 2.2 5 2.2s5-1 5-2.2V4.2", strokeWidth: "1.2" }), _jsx("path", { d: "M3 8c0 1.2 2.2 2.2 5 2.2s5-1 5-2.2", strokeWidth: "1.2" })] }), _jsx("span", { children: t('metrics.usage', { tokens: formatTokens(totalTokens) }) })] })), hasTiming && typeof runMs === 'number' && (_jsxs("button", { type: "button", className: css.timeButton, "data-active": open, onClick: () => setOpen(v => !v), "aria-expanded": open, "aria-label": formatRanFor(runMs), title: t('metrics.timingTitle'), children: [_jsxs("svg", { className: css.pillIcon, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", children: [_jsx("circle", { cx: "8", cy: "8", r: "6.5", strokeWidth: "1.2" }), _jsx("path", { d: "M8 4.5v3.8l2.5 1.5", strokeWidth: "1.2", strokeLinecap: "round", strokeLinejoin: "round" })] }), _jsx("span", { children: formatRanFor(runMs) })] })), open && (_jsxs("div", { className: css.metricsPop, role: "dialog", "aria-label": t('metrics.dialogAria'), children: [_jsx("div", { className: css.popHeader, children: _jsx("span", { children: t('metrics.header') }) }), hasTiming && typeof runMs === 'number' && (_jsxs("div", { className: css.popSection, children: [_jsx("div", { className: css.popSectionTitle, children: t('metrics.timingSection') }), _jsxs("div", { className: css.popGrid, children: [_jsx("span", { className: css.popLabel, children: t('metrics.totalTime') }), _jsx("span", { className: css.popValue, children: formatRunDuration(runMs) }), typeof tokensPerSecond === 'number' && tokensPerSecond > 0 && (_jsxs(_Fragment, { children: [_jsx("span", { className: css.popLabel, children: t('metrics.tps') }), _jsxs("span", { className: css.popValue, children: [tokensPerSecond.toFixed(1), " tok/s"] })] })), typeof ttftMs === 'number' && ttftMs > 0 && (_jsxs(_Fragment, { children: [_jsx("span", { className: css.popLabel, children: t('metrics.ttft') }), _jsxs("span", { className: css.popValue, children: [(ttftMs / 1000).toFixed(2), "s"] })] }))] })] })), hasTokens && usage && (_jsxs("div", { className: css.popSection, children: [_jsx("div", { className: css.popSectionTitle, children: t('metrics.tokenSection') }), _jsxs("div", { className: css.popGrid, children: [_jsx("span", { className: css.popLabel, children: t('metrics.total') }), _jsxs("span", { className: css.popValue, children: [usage.totalTokens.toLocaleString(), " tok"] }), _jsxs("span", { className: css.popLabel, children: [t('metrics.input'), cacheHitPercent !== null && (_jsx("span", { className: css.popBadge, children: t('metrics.cacheHit', { pct: cacheHitPercent }) }))] }), _jsxs("span", { className: css.popValue, children: [(usage.totalTokens - usage.outputTokens).toLocaleString(), " tok"] }), typeof usage.cacheReadTokens === 'number' && usage.cacheReadTokens > 0 && (_jsxs(_Fragment, { children: [_jsx("span", { className: css.popLabel, children: t('metrics.cacheRead') }), _jsxs("span", { className: css.popValue, children: [usage.cacheReadTokens.toLocaleString(), " tok"] })] })), _jsxs("span", { className: css.popLabel, children: [t('metrics.output'), typeof usage.reasoningTokens === 'number' && usage.reasoningTokens > 0 && (_jsx("span", { className: css.popBadge, children: t('metrics.thinkingTokens', { n: usage.reasoningTokens.toLocaleString() }) }))] }), _jsxs("span", { className: css.popValue, children: [usage.outputTokens?.toLocaleString() ?? 0, " tok"] })] })] }))] }))] }));
});
//# sourceMappingURL=TurnMetrics.js.map