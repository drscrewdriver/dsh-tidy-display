import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { DiffBlock, diffTotals } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './Reader.module.css';
import { diffBlockLabels } from './primitive-labels.js';
import { FOLD_TIMING } from './fold-choreography.js';
import { foldDiffHunks } from './tool-activity.js';
/**
 * Reveals and withdraws its child by animating real height, in the plugin's own
 * motion language. Height is the animated property rather than transform because
 * the panel pushes the transcript down and the reading scroll measures that
 * growth; the curve and duration are the fold choreography's, so this reads as
 * the same gesture as opening a digest.
 *
 * Closing animates too: the child stays mounted until the shrink finishes, which
 * is why the owner keeps it alive on an `open` flag instead of unmounting it.
 */
function MorphPanel({ open, children, onSettled, onClosed }) {
    const ref = useRef(null);
    useLayoutEffect(() => {
        const element = ref.current;
        if (!element)
            return;
        element.dispatchEvent(new CustomEvent('reader-layout-start', { bubbles: true }));
        let released = false;
        const release = () => { if (!released) {
            released = true;
            element.dispatchEvent(new CustomEvent('reader-layout-end', { bubbles: true }));
        } };
        if (typeof element.animate !== 'function') {
            release();
            if (!open)
                onClosed();
            return;
        }
        const height = element.scrollHeight;
        const frames = open
            ? [{ height: '0px', opacity: 0, transform: 'translateY(-6px)' },
                { height: `${height}px`, opacity: 1, transform: 'translateY(0)' }]
            : [{ height: `${height}px`, opacity: 1 },
                { height: '0px', opacity: 0 }];
        const animation = element.animate(frames, {
            duration: FOLD_TIMING.reveal + FOLD_TIMING.settle,
            easing: 'cubic-bezier(.4,0,.2,1)',
        });
        let settled = false;
        const settle = () => {
            if (settled)
                return;
            settled = true;
            release();
            if (open) {
                element.style.height = 'auto';
                element.style.overflow = 'visible';
                onSettled?.(element);
            }
            else {
                onClosed();
            }
        };
        animation.onfinish = settle;
        const deadline = window.setTimeout(settle, FOLD_TIMING.reveal + FOLD_TIMING.settle + 240);
        return () => { window.clearTimeout(deadline); animation.cancel(); release(); };
    }, [open]);
    return _jsx("div", { ref: ref, className: css.diffOverlay, children: children });
}
/**
 * Keeps a newly opened panel on screen.
 *
 * Opening grows the row downward, so a badge near the fold reveals its card below
 * the viewport and the reader has to chase it. The scroll container is not known
 * here, so the nearest scrollable ancestor is found and the card's head is brought
 * to the top of it — the same thing a jump-to-anchor does.
 */
function revealPanel(element) {
    let port = element.parentElement;
    while (port && port.scrollHeight <= port.clientHeight + 1)
        port = port.parentElement;
    if (!port) {
        element.scrollIntoView({ block: 'nearest' });
        return;
    }
    const gap = element.getBoundingClientRect().top - port.getBoundingClientRect().top;
    // Already fully visible: leave the scroll alone rather than jumping on every open.
    if (gap >= 0 && element.getBoundingClientRect().bottom <= port.getBoundingClientRect().bottom)
        return;
    port.scrollTop += gap - 8;
}
/**
 * Line counts for everything a folded run of steps changed.
 *
 * A run that touched no files renders nothing, so an ordinary process digest is
 * unchanged. Clicking the counts opens the same diff surface the official tool
 * row uses — one file at a time, red removed / green added, expandable.
 */
export function DiffStat({ steps, label }) {
    const hunks = useMemo(() => foldDiffHunks(steps), [steps]);
    const [open, setOpen] = useState(false);
    const [visible, setVisible] = useState(false);
    const totals = useMemo(() => diffTotals(hunks), [hunks]);
    const [active, setActive] = useState(0);
    if (!hunks.length)
        return null;
    const current = hunks[Math.min(active, hunks.length - 1)];
    return _jsxs(_Fragment, { children: [_jsx("span", { className: css.diffStatRoot, children: _jsxs("button", { type: "button", className: css.diffStatButton, "aria-expanded": open, "aria-label": `${label} · 改动 ${totals.added} 行，删除 ${totals.removed} 行`, onClick: event => {
                        event.stopPropagation();
                        if (open) {
                            setOpen(false);
                            return;
                        }
                        setVisible(true);
                        setOpen(true);
                    }, children: [_jsx("span", { className: css.diffCaret, "aria-hidden": true, children: open ? '\u25be' : '\u25b8' }), totals.added > 0 && _jsxs("span", { className: css.diffAdded, children: ["+", totals.added] }), totals.removed > 0 && _jsxs("span", { className: css.diffRemoved, children: ["-", totals.removed] })] }) }), visible && _jsx("div", { className: css.diffOverlayRow, children: _jsxs(MorphPanel, { open: open, onSettled: revealPanel, onClosed: () => setVisible(false), children: [hunks.length > 1 && _jsx("div", { className: css.diffTabs, children: hunks.map((hunk, index) => _jsx("button", { type: "button", className: css.diffTab, "data-active": index === active || undefined, onClick: () => setActive(index), title: hunk.path, children: hunk.path.split(/[/\\]+/).filter(Boolean).slice(-1)[0] ?? hunk.path }, `${hunk.path}:${index}`)) }), _jsx("div", { className: css.diffScrollArea, children: _jsx(DiffBlock, { diffs: [current], maxLines: 36, labels: diffBlockLabels }) })] }) })] });
}
//# sourceMappingURL=DiffPanel.js.map