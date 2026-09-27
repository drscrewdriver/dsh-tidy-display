import { jsx as _jsx } from "react/jsx-runtime";
import { useLayoutEffect, useRef } from 'react';
/** Publish real lane geometry; wrapped labels must not collide with statistics. */
export function StickyLane({ kind, className, children }) {
    const ref = useRef(null);
    useLayoutEffect(() => {
        const el = ref.current;
        const scope = el?.closest(kind === 'toolbar' ? '[data-dsh-better-display]' : '[data-reader-turn]');
        if (!el || !scope)
            return;
        const property = kind === 'toolbar' ? '--reader-toolbar-height' : '--reader-status-height';
        const update = () => {
            scope.style.setProperty(property, `${el.getBoundingClientRect().height}px`);
            if (kind !== 'toolbar')
                return;
            // The status lane is sized as calc(100% - --reader-control-width), so this
            // must reserve the WHOLE control group. Measuring only the first button
            // left every later control painted over by the status lane.
            const controls = el.querySelectorAll('button');
            let width = 80;
            if (controls.length > 0) {
                const first = controls[0].getBoundingClientRect();
                const last = controls[controls.length - 1].getBoundingClientRect();
                width = last.right - first.left;
            }
            scope.style.setProperty('--reader-control-width', `${width + 28}px`);
        };
        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        if (kind === 'toolbar')
            for (const control of el.querySelectorAll('button'))
                observer.observe(control);
        return () => { observer.disconnect(); scope.style.removeProperty(property); if (kind === 'toolbar')
            scope.style.removeProperty('--reader-control-width'); };
    }, [kind]);
    return _jsx("div", { ref: ref, className: className, "data-reader-lane": kind, "data-ud-check": kind === 'toolbar' ? 'reader-toolbar' : undefined, children: children });
}
//# sourceMappingURL=StickyLane.js.map