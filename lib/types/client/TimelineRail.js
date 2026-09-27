import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo, useEffect, useId, useRef, useState, } from 'react';
import css from './TimelineRail.module.css';
const TURN_SPACING_PX = 12;
const RAIL_INSET_PX = 6;
const FADE_PX = 24;
function itemPosition(index) {
    return { '--turn-natural-position': `${index * TURN_SPACING_PX}px` };
}
function frameStyle(count, scrollTop) {
    return {
        '--turn-natural-height': `${(count - 1) * TURN_SPACING_PX + 2 * RAIL_INSET_PX}px`,
        '--turn-rail-inset': `${RAIL_INSET_PX}px`,
        '--turn-scroll-top': `${scrollTop}px`,
    };
}
function itemIndexAtPointer(items, frame, scrollTop, clientY) {
    const rect = frame.getBoundingClientRect();
    const offset = clientY - rect.top + scrollTop - RAIL_INSET_PX;
    return Math.max(0, Math.min(items.length - 1, Math.round(offset / TURN_SPACING_PX)));
}
const RAIL_AT_REST = { top: 0, canScrollUp: false, canScrollDown: false };
function railScrollState(scroller) {
    const top = scroller.scrollTop;
    return {
        top,
        canScrollUp: top > 1,
        canScrollDown: top < scroller.scrollHeight - scroller.clientHeight - 1,
    };
}
export const TimelineRail = memo(function TimelineRail({ items, activeTurn, busyTurn, onNavigate, }) {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [scrollState, setScrollState] = useState(RAIL_AT_REST);
    const scrollerRef = useRef(null);
    const pointerInsideRef = useRef(false);
    const previewId = useId();
    const syncScrollState = () => {
        const scroller = scrollerRef.current;
        if (!scroller)
            return;
        const next = railScrollState(scroller);
        setScrollState(cur => (cur.top === next.top && cur.canScrollUp === next.canScrollUp && cur.canScrollDown === next.canScrollDown ? cur : next));
    };
    useEffect(() => {
        const scroller = scrollerRef.current;
        if (!scroller || typeof ResizeObserver === 'undefined')
            return;
        const observer = new ResizeObserver(syncScrollState);
        observer.observe(scroller);
        return () => observer.disconnect();
    }, []);
    useEffect(syncScrollState, [items.length]);
    // Keep active mark visible
    useEffect(() => {
        const scroller = scrollerRef.current;
        const index = items.findIndex(item => item.turn === activeTurn);
        if (!scroller || index < 0 || pointerInsideRef.current)
            return;
        const markTop = index * TURN_SPACING_PX + RAIL_INSET_PX;
        const viewTop = scroller.scrollTop;
        const viewHeight = scroller.clientHeight;
        if (viewHeight <= 0 || (markTop >= viewTop + FADE_PX && markTop <= viewTop + viewHeight - FADE_PX))
            return;
        const target = Math.max(0, markTop - viewHeight / 2);
        if (typeof scroller.scrollTo === 'function') {
            scroller.scrollTo({ top: target, behavior: 'smooth' });
        }
        else {
            scroller.scrollTop = target;
        }
        syncScrollState();
    }, [activeTurn, items]);
    if (items.length < 2)
        return null;
    const preview = hoveredIndex !== null && hoveredIndex >= 0 ? items[hoveredIndex] : undefined;
    const previewPosition = hoveredIndex !== null && hoveredIndex >= 0 ? itemPosition(hoveredIndex) : undefined;
    const onPointerMove = (event) => {
        const scroller = scrollerRef.current;
        const scrollTop = scroller?.scrollTop ?? 0;
        const idx = itemIndexAtPointer(items, event.currentTarget, scrollTop, event.clientY);
        setHoveredIndex(idx);
    };
    const onPointerLeave = () => {
        pointerInsideRef.current = false;
        setHoveredIndex(null);
    };
    const navigateAtPointer = (event) => {
        const scroller = scrollerRef.current;
        const scrollTop = scroller?.scrollTop ?? 0;
        const idx = itemIndexAtPointer(items, event.currentTarget, scrollTop, event.clientY);
        const item = items[idx];
        if (item !== undefined)
            onNavigate(item);
    };
    const fadeClasses = [css.scroller];
    if (scrollState.canScrollUp)
        fadeClasses.push(css.fadeTop);
    if (scrollState.canScrollDown)
        fadeClasses.push(css.fadeBottom);
    return (_jsx("div", { className: css.slot, children: _jsxs("nav", { className: css.frame, style: frameStyle(items.length, scrollState.top), "aria-label": "\u8F6E\u6B21\u5BFC\u822A\u65F6\u95F4\u8F74", onClick: navigateAtPointer, onPointerMove: onPointerMove, onPointerEnter: () => { pointerInsideRef.current = true; }, onPointerLeave: onPointerLeave, onMouseDown: event => { event.preventDefault(); }, children: [_jsx("div", { ref: scrollerRef, className: fadeClasses.join(' '), onScroll: syncScrollState, children: _jsx("div", { className: css.marks, children: items.map((item, index) => {
                            const isBusy = busyTurn === item.turn;
                            const isActive = activeTurn === item.turn;
                            const isUnloaded = item.anchor.kind === 'unloaded';
                            // Wave calculation: peak at cursor, smoothly tapering off in width and height
                            let width = isUnloaded ? 6 : 8;
                            let height = 2;
                            let opacity = isUnloaded ? 0.3 : 0.45;
                            let background = 'var(--dsw-alias-label-tertiary)';
                            if (hoveredIndex !== null) {
                                const diff = Math.abs(index - hoveredIndex);
                                if (diff === 0) {
                                    // Cursor peak (最长最高)
                                    width = 26;
                                    height = 2.8;
                                    opacity = 1.0;
                                    background = 'var(--dsw-alias-label-primary)';
                                }
                                else if (diff === 1) {
                                    // 旁边第 1 阶 (次长次高)
                                    width = 18;
                                    height = 2.2;
                                    opacity = 0.8;
                                    background = 'var(--dsw-alias-label-primary)';
                                }
                                else if (diff === 2) {
                                    // 旁边第 2 阶 (继续变矮变短)
                                    width = 13;
                                    height = 1.8;
                                    opacity = 0.6;
                                    background = 'var(--dsw-alias-label-secondary)';
                                }
                                else if (diff === 3) {
                                    // 旁边第 3 阶 (平缓过渡)
                                    width = 9;
                                    height = 1.6;
                                    opacity = 0.45;
                                    background = 'var(--dsw-alias-label-tertiary)';
                                }
                                else {
                                    // 远离光标的基线
                                    width = 8;
                                    height = 2;
                                    opacity = 0.35;
                                    background = 'var(--dsw-alias-label-tertiary)';
                                }
                            }
                            else if (isActive) {
                                width = 20;
                                height = 2.4;
                                opacity = 0.95;
                                background = 'var(--dsw-alias-label-primary)';
                            }
                            const tickStyle = {
                                width: `${width}px`,
                                height: `${height}px`,
                                opacity,
                                backgroundColor: background,
                            };
                            const markClasses = [css.mark];
                            if (isBusy)
                                markClasses.push(css.markBusy);
                            return (_jsx("div", { className: css.markPosition, style: itemPosition(index), children: _jsx("button", { type: "button", className: markClasses.join(' '), "aria-label": `第 ${item.turn + 1} 轮`, "aria-current": isActive ? 'true' : undefined, "aria-busy": isBusy ? 'true' : undefined, "aria-describedby": hoveredIndex === index ? previewId : undefined, onMouseDown: event => { event.preventDefault(); }, onClick: (e) => {
                                        e.stopPropagation();
                                        onNavigate(item);
                                    }, onFocus: () => setHoveredIndex(index), onBlur: () => setHoveredIndex(null), children: _jsx("span", { className: css.tick, style: tickStyle }) }) }, item.turn));
                        }) }) }), preview !== undefined && previewPosition !== undefined && (_jsxs("div", { id: previewId, role: "tooltip", className: css.preview, style: previewPosition, children: [_jsx("div", { className: css.previewPrompt, children: preview.prompt || `第 ${preview.turn + 1} 轮` }), preview.response !== '' && (_jsx("div", { className: css.previewResponse, children: preview.response }))] }))] }) }));
});
//# sourceMappingURL=TimelineRail.js.map