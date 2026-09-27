import * as React from 'react';
const NAV_RAIL_WIDTH = 48;
const NAV_RAIL_BAR_H = 3;
const NAV_RAIL_BAR_LEN = 14;
const NAV_RAIL_BAR_LEN_NEAR = 26;
const NAV_RAIL_BAR_LEN_CURRENT = 22;
const NAV_RAIL_FISH_EYE_RADIUS = 4;
const NAV_RAIL_FISH_EYE_BOOST = 0.5;
const NAV_RAIL_TURN_SPACING = 12;
const NAV_RAIL_MIN_HEIGHT = 48;
const NAV_RAIL_CAP_H = 16;
const NAV_RAIL_CAP_INDEX = -1;
const HEADER_OFFSET = 64;
const NAV_RAIL_RING_OFFSET = 2;
const NAV_RAIL_RING_BLUR = 4;
const NAV_RAIL_RING_ALPHA_CURRENT = 0.4;
const NAV_RAIL_RING_ALPHA_HOVER = 0.22;
let cssInjected = false;
function ensureRailCss() {
    if (cssInjected || typeof document === 'undefined')
        return;
    cssInjected = true;
    const style = document.createElement('style');
    style.textContent = `
.tidychat-nav-rail { position: fixed; z-index: 40; display: flex; flex-direction: column; align-items: flex-start; padding: 6px 2px; }
.tidychat-nav-canvas { display: block; cursor: pointer; touch-action: none; }
.tidychat-nav-tip.tidychat-nav-tip {
  position: fixed; z-index: 41; pointer-events: none; max-width: 300px;
  background: var(--dsw-alias-bg-layer-3, #fff);
  border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.3));
  border-radius: 8px; box-shadow: 0 6px 18px rgba(0,0,0,0.16); padding: 6px 10px;
  font-size: 12px; line-height: 1.5;
  color: var(--tidychat-nav-tip-text, var(--dsw-alias-label-primary, #222)) !important;
  overflow-wrap: anywhere;
}
.tidychat-nav-tip-head { color: var(--tidychat-nav-tip-head, var(--dsw-alias-label-secondary, #666)) !important; font-size: 11px; margin-bottom: 2px; }
`;
    document.head.appendChild(style);
}
const findScrollContainer = () => document.querySelector('[data-conversation-scroll]');
const scopedRows = (selector) => {
    const container = findScrollContainer();
    return Array.from((container ?? document).querySelectorAll(selector));
};
// DOM 侧用户行：'user' + 'steering' 同视（宿主原生行与阅读视图行同契约）。
// data-reader-key 回退：渲染器替换者丢失原生锚点时的兜底，键公式只做白名单分类。
const railRows = () => {
    const native = scopedRows('[data-chat-anchor-key]').filter((r) => {
        const k = r.getAttribute('data-chat-flow-kind');
        return k === 'user' || k === 'steering';
    });
    if (native.length > 0)
        return native;
    return scopedRows('[data-reader-key]').filter((r) => {
        const key = r.getAttribute('data-reader-key') || '';
        const m = /^(\d+):/.exec(key);
        if (m === null)
            return false;
        const kind = key.slice(m[1].length + 1, m[1].length + 1 + Number(m[1]));
        return kind === 'user' || kind === 'steering';
    });
};
const fallbackSummary = (el) => {
    try {
        const t = el.innerText ?? '';
        return t.replace(/\s+/g, ' ').trim().slice(0, 120);
    }
    catch {
        return String(el.textContent ?? '').trim().slice(0, 120);
    }
};
const hhmm = (ms) => {
    const d = new Date(ms);
    const pad = (n) => (n < 10 ? '0' + n : String(n));
    return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
};
const railHeight = (n) => Math.min(Math.min(window.innerHeight * 0.7, 660), Math.max(NAV_RAIL_MIN_HEIGHT, n * NAV_RAIL_TURN_SPACING));
const roundRectPath = (c, x, y, w, h, r) => {
    const rr = Math.max(0, Math.min(r, w / 2, h / 2));
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
};
const measurePos = (side) => {
    const host = document.querySelector('[data-conversation-scroll]');
    if (host === null)
        return null;
    const r = host.getBoundingClientRect();
    if (r.width < 10 || r.height < 10)
        return null;
    const composer = scopedRows('[data-composer-card]')[0];
    const chatRows = scopedRows('[data-chat-anchor-key]');
    const candidates = [composer, chatRows[0], chatRows[chatRows.length - 1]].filter((x) => x !== null && x !== undefined);
    const rects = candidates.map((el) => el.getBoundingClientRect());
    if (side === 'right') {
        const maxRight = rects.length > 0 ? Math.max(...rects.map((e) => e.right)) : r.right;
        const gutter = Math.max(0, r.right - maxRight);
        return { left: r.right - (NAV_RAIL_WIDTH - 4), top: r.top + r.height * 0.5, gutter };
    }
    const minLeft = rects.length > 0 ? Math.min(...rects.map((e) => e.left)) : r.left;
    const gutterL = Math.max(0, minLeft - r.left);
    return { left: r.left, top: r.top + r.height * 0.5, gutter: gutterL };
};
export function RailView({ enabled, side, style: railStyle, ring, hasMore, loadOlder }) {
    ensureRailCss();
    const [pos, setPos] = React.useState(null);
    const [tip, setTip] = React.useState(null);
    const [hover, setHover] = React.useState(null);
    const [current, setCurrent] = React.useState(null);
    const canvasRef = React.useRef(null);
    const moveRafRef = React.useRef(0);
    const moveLastRef = React.useRef(null);
    const rowCacheRef = React.useRef({ rows: [], tops: [], count: -1, scrollH: -1 });
    const scrollAnimRef = React.useRef(0);
    const cancelScrollAnim = () => {
        if (scrollAnimRef.current !== 0) {
            cancelAnimationFrame(scrollAnimRef.current);
            scrollAnimRef.current = 0;
        }
    };
    const smoothScrollTo = (container, top) => {
        cancelScrollAnim();
        const el = container;
        const maxTop = Math.max(0, el.scrollHeight - el.clientHeight);
        const target = Math.max(0, Math.min(maxTop, top));
        const start = el.scrollTop;
        const delta = target - start;
        if (Math.abs(delta) < 1)
            return;
        let reduce = false;
        try {
            reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
        }
        catch { /* ignore */ }
        if (reduce) {
            el.scrollTop = target;
            return;
        }
        const duration = Math.min(700, Math.max(260, Math.abs(delta) * 0.45));
        const t0 = performance.now();
        const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
        const step = (now) => {
            const p = Math.min(1, (now - t0) / duration);
            el.scrollTop = start + delta * ease(p);
            scrollAnimRef.current = p < 1 ? requestAnimationFrame(step) : 0;
        };
        scrollAnimRef.current = requestAnimationFrame(step);
    };
    const turns = railRows().map((el) => ({ el, summary: fallbackSummary(el), time: null }));
    const capOffset = hasMore ? NAV_RAIL_CAP_H : 0;
    const rebuildRowCache = (count, scrollH) => {
        const rows = railRows();
        const container = findScrollContainer();
        if (container === null) {
            rowCacheRef.current = { rows: [], tops: [], count, scrollH };
            return;
        }
        const cRect = container.getBoundingClientRect();
        const tops = rows.map((r) => r.getBoundingClientRect().top - cRect.top + container.scrollTop);
        rowCacheRef.current = { rows, tops, count, scrollH };
    };
    const detectCurrent = () => {
        const container = findScrollContainer();
        const tops = rowCacheRef.current.tops;
        if (container === null || tops.length === 0)
            return;
        const target = container.scrollTop + HEADER_OFFSET;
        let lo = 0;
        let hi = tops.length - 1;
        let ans = -1;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (tops[mid] <= target) {
                ans = mid;
                lo = mid + 1;
            }
            else
                hi = mid - 1;
        }
        const cur = ans === -1 ? 0 : ans;
        setCurrent((p) => (p === cur ? p : cur));
    };
    const layoutPositions = (n, hoverIdx, H) => {
        const weights = [];
        for (let i = 0; i < n; i++) {
            let w = 1;
            if (hoverIdx !== null) {
                const d = Math.abs(i - hoverIdx);
                if (d <= NAV_RAIL_FISH_EYE_RADIUS)
                    w = 1 + (NAV_RAIL_FISH_EYE_RADIUS - d + 1) * NAV_RAIL_FISH_EYE_BOOST;
            }
            weights.push(w);
        }
        const total = weights.reduce((a, b) => a + b, 0);
        const usable = Math.max(H - NAV_RAIL_BAR_H, 1);
        const pos = [];
        let acc = 0;
        for (let i = 0; i < n; i++) {
            acc += weights[i];
            pos.push(((acc - weights[i] / 2) / total) * usable + NAV_RAIL_BAR_H / 2);
        }
        return pos;
    };
    const indexFromY = (y, positions) => {
        if (positions.length === 0)
            return 0;
        let lo = 0;
        let hi = positions.length - 1;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (positions[mid] < y)
                lo = mid + 1;
            else
                hi = mid;
        }
        const cur = positions[lo];
        const prev = lo > 0 ? positions[lo - 1] : -Infinity;
        const candidate = Math.abs(cur - y) <= Math.abs(prev - y) ? lo : lo - 1;
        return Math.max(0, Math.min(positions.length - 1, candidate));
    };
    const marksHeight = () => (turns.length === 0 ? 0 : railHeight(turns.length));
    const positionsAt = (hv) => layoutPositions(turns.length, hv, marksHeight()).map((y) => y + capOffset);
    // 每轮渲染后：行数或内容高度变化（加载/懒加载）→ 重建行缓存 → 检测当前 turn → 重绘
    React.useEffect(() => {
        const container = findScrollContainer();
        const scrollH = container !== null ? container.scrollHeight : 0;
        if (rowCacheRef.current.count !== turns.length || rowCacheRef.current.scrollH !== scrollH) {
            rebuildRowCache(turns.length, scrollH);
        }
        detectCurrent();
        redraw();
    });
    const jumpTo = (index) => {
        const t = turns[index];
        if (t === undefined)
            return;
        const container = findScrollContainer();
        if (container === null)
            return;
        const cRect = container.getBoundingClientRect();
        const tRect = t.el.getBoundingClientRect();
        smoothScrollTo(container, (tRect.top - cRect.top) + container.scrollTop - HEADER_OFFSET);
    };
    const inCap = (localY) => capOffset > 0 && localY < capOffset;
    const markY = (i, hv) => positionsAt(hv)[i] ?? 0;
    const indexAt = (localY) => {
        let idx = indexFromY(localY, positionsAt(null));
        let prev = -1;
        for (let k = 0; k < 4; k++) {
            const next = indexFromY(localY, positionsAt(idx));
            if (next === idx)
                return idx;
            if (next === prev) {
                return Math.abs(markY(idx, idx) - localY) <= Math.abs(markY(next, next) - localY) ? idx : next;
            }
            prev = idx;
            idx = next;
        }
        return idx;
    };
    const handlePointerMove = (ev) => {
        moveLastRef.current = { x: ev.clientX, y: ev.clientY };
        if (moveRafRef.current !== 0)
            return;
        moveRafRef.current = requestAnimationFrame(() => {
            moveRafRef.current = 0;
            const p = moveLastRef.current;
            moveLastRef.current = null;
            if (p === null || canvasRef.current === null)
                return;
            const canvas = canvasRef.current;
            const rect = canvas.getBoundingClientRect();
            const localY = p.y - rect.top;
            const mirror = side === 'right';
            if (inCap(localY)) {
                if (hover !== NAV_RAIL_CAP_INDEX)
                    setHover(NAV_RAIL_CAP_INDEX);
                setTip({
                    x: mirror ? p.x - 18 : p.x + 18,
                    y: p.y - 8,
                    head: '更早历史未加载',
                    num: null,
                    time: '',
                    text: `点击加载更早记录 · 当前轨道仅覆盖已加载的 ${turns.length} 轮`,
                    mirror,
                });
                return;
            }
            const idx = indexAt(localY);
            if (idx !== hover)
                setHover(idx);
            const u = turns[idx];
            if (u === undefined) {
                setTip(null);
                return;
            }
            setTip({ x: mirror ? p.x - 18 : p.x + 18, y: p.y - 8, num: idx + 1, time: u.time !== null ? hhmm(u.time) : '', text: u.summary, mirror });
        });
    };
    const handlePointerLeave = () => {
        if (moveRafRef.current !== 0) {
            cancelAnimationFrame(moveRafRef.current);
            moveRafRef.current = 0;
        }
        moveLastRef.current = null;
        setHover(null);
        setTip(null);
    };
    const handlePointerDown = (ev) => {
        try {
            ev.currentTarget.setPointerCapture(ev.pointerId);
        }
        catch { /* ignore */ }
    };
    const handlePointerUp = (ev) => {
        const canvas = canvasRef.current;
        if (canvas !== null) {
            const rect = canvas.getBoundingClientRect();
            const localY = ev.clientY - rect.top;
            if (inCap(localY))
                void loadOlder();
            else
                jumpTo(indexAt(localY));
        }
        try {
            ev.currentTarget.releasePointerCapture(ev.pointerId);
        }
        catch { /* ignore */ }
        setHover(null);
        setTip(null);
    };
    const redraw = () => {
        const canvas = canvasRef.current;
        if (canvas === null)
            return;
        const n = turns.length;
        if (n === 0 && capOffset === 0)
            return;
        const H = marksHeight() + capOffset;
        const W = NAV_RAIL_WIDTH - 8;
        const dpr = window.devicePixelRatio || 1;
        if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
            canvas.width = Math.round(W * dpr);
            canvas.height = Math.round(H * dpr);
            canvas.style.width = W + 'px';
            canvas.style.height = H + 'px';
        }
        const ctx = canvas.getContext('2d');
        if (ctx === null)
            return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        const cs = getComputedStyle(document.documentElement);
        const barColor = cs.getPropertyValue('--dsw-alias-label-caption').trim() || 'rgba(127,127,127,0.5)';
        const hotColor = cs.getPropertyValue('--dsw-alias-state-business-primary').trim() || '#3b82f6';
        const mirror = side === 'right';
        const dot = railStyle === 'dot';
        const dir = mirror ? -1 : 1;
        const positions = positionsAt(hover);
        const nearest = (i) => hover !== null && hover >= 0 && Math.abs(i - hover) <= 2;
        const boxOf = (i, y, isCurrent, isHover) => {
            if (dot) {
                const rad = isCurrent || isHover ? 4 : (nearest(i) ? 3.2 : 2.5);
                const cx = mirror ? W - NAV_RAIL_BAR_LEN / 2 : NAV_RAIL_BAR_LEN / 2;
                return { x: cx - rad, y: y - rad, w: rad * 2, h: rad * 2, dot: true };
            }
            const len = isHover ? NAV_RAIL_BAR_LEN_NEAR : (isCurrent ? NAV_RAIL_BAR_LEN_CURRENT : (nearest(i) ? NAV_RAIL_BAR_LEN + 4 : NAV_RAIL_BAR_LEN));
            return { x: mirror ? W - len : 0, y: y - NAV_RAIL_BAR_H / 2, w: len, h: NAV_RAIL_BAR_H, dot: false };
        };
        // 外圈（navRing）：白色柔光垫底，先光晕后标记
        if (ring) {
            ctx.save();
            ctx.fillStyle = 'rgba(255,255,255,1)';
            ctx.shadowColor = 'rgba(255,255,255,.9)';
            ctx.shadowBlur = NAV_RAIL_RING_BLUR;
            for (let i = 0; i < n; i++) {
                const isCurrent = current === i;
                const isHover = hover === i;
                if (!isCurrent && !isHover)
                    continue;
                ctx.globalAlpha = isCurrent ? NAV_RAIL_RING_ALPHA_CURRENT : NAV_RAIL_RING_ALPHA_HOVER;
                const b = boxOf(i, positions[i], isCurrent, isHover);
                if (b.dot) {
                    ctx.beginPath();
                    ctx.arc(b.x + b.w / 2, b.y + b.h / 2, b.w / 2 + NAV_RAIL_RING_OFFSET, 0, Math.PI * 2);
                    ctx.fill();
                }
                else {
                    roundRectPath(ctx, b.x - NAV_RAIL_RING_OFFSET, b.y - NAV_RAIL_RING_OFFSET, b.w + NAV_RAIL_RING_OFFSET * 2, b.h + NAV_RAIL_RING_OFFSET * 2, b.h / 2 + NAV_RAIL_RING_OFFSET);
                    ctx.fill();
                }
            }
            ctx.restore();
        }
        for (let i = 0; i < n; i++) {
            const y = positions[i];
            const isCurrent = current === i;
            const isHover = hover === i;
            const color = isCurrent || isHover ? hotColor : barColor;
            ctx.fillStyle = color;
            if (dot) {
                const rad = isCurrent || isHover ? 4 : (nearest(i) ? 3.2 : 2.5);
                const cx = mirror ? W - NAV_RAIL_BAR_LEN / 2 : NAV_RAIL_BAR_LEN / 2;
                ctx.beginPath();
                ctx.arc(cx, y, rad, 0, Math.PI * 2);
                ctx.fill();
            }
            else {
                const len = isHover ? NAV_RAIL_BAR_LEN_NEAR : (isCurrent ? NAV_RAIL_BAR_LEN_CURRENT : (nearest(i) ? NAV_RAIL_BAR_LEN + 4 : NAV_RAIL_BAR_LEN));
                ctx.fillRect(mirror ? W - len : 0, y - NAV_RAIL_BAR_H / 2, len, NAV_RAIL_BAR_H);
                if (isCurrent) {
                    const headX = mirror ? W - len - 2 : len + 2;
                    ctx.beginPath();
                    ctx.moveTo(headX, y);
                    ctx.lineTo(headX + dir * 4, y - 3);
                    ctx.lineTo(headX + dir * 4, y + 3);
                    ctx.closePath();
                    ctx.fill();
                }
            }
        }
        // 顶部「更早历史未加载」提示带
        if (capOffset > 0) {
            const capColor = hover === NAV_RAIL_CAP_INDEX ? hotColor : barColor;
            const cx = mirror ? W - NAV_RAIL_BAR_LEN / 2 : NAV_RAIL_BAR_LEN / 2;
            const cy = NAV_RAIL_CAP_H / 2;
            ctx.strokeStyle = capColor;
            ctx.fillStyle = capColor;
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(cx - 3.5, cy + 1.5);
            ctx.lineTo(cx, cy - 2);
            ctx.lineTo(cx + 3.5, cy + 1.5);
            ctx.stroke();
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 3]);
            ctx.beginPath();
            ctx.moveTo(cx, cy + 4);
            if (positions.length > 0)
                ctx.lineTo(cx, Math.max(cy + 4, positions[0] - 4));
            ctx.stroke();
            ctx.setLineDash([]);
        }
    };
    // 度量 + 重排：侧别/开关/样式变化、窗口与容器尺寸变化、滚动
    React.useEffect(() => {
        const refresh = () => { setPos(measurePos(side)); };
        refresh();
        let resizeObs = null;
        const container = findScrollContainer();
        if (container !== null && typeof ResizeObserver !== 'undefined') {
            resizeObs = new ResizeObserver(() => { refresh(); });
            resizeObs.observe(container);
        }
        window.addEventListener('resize', refresh);
        let scrollRaf = 0;
        const onScroll = () => {
            if (scrollRaf !== 0)
                return;
            scrollRaf = requestAnimationFrame(() => {
                scrollRaf = 0;
                const c = findScrollContainer();
                if (c !== null && c.scrollHeight !== rowCacheRef.current.scrollH)
                    rebuildRowCache(turns.length, c.scrollHeight);
                detectCurrent();
            });
        };
        if (container !== null)
            container.addEventListener('scroll', onScroll, { passive: true });
        const onUserTakeOver = () => cancelScrollAnim();
        if (container !== null) {
            container.addEventListener('wheel', onUserTakeOver, { passive: true });
            container.addEventListener('touchstart', onUserTakeOver, { passive: true });
        }
        window.addEventListener('keydown', onUserTakeOver);
        return () => {
            resizeObs?.disconnect();
            window.removeEventListener('resize', refresh);
            if (container !== null) {
                container.removeEventListener('scroll', onScroll);
                container.removeEventListener('wheel', onUserTakeOver);
                container.removeEventListener('touchstart', onUserTakeOver);
            }
            window.removeEventListener('keydown', onUserTakeOver);
            cancelScrollAnim();
            if (scrollRaf !== 0)
                cancelAnimationFrame(scrollRaf);
            if (moveRafRef.current !== 0)
                cancelAnimationFrame(moveRafRef.current);
        };
    }, [side]);
    if (!enabled)
        return null;
    if (pos === null)
        return null;
    if (pos.gutter < NAV_RAIL_WIDTH)
        return null;
    if (turns.length === 0 && !hasMore)
        return null;
    const railEl = React.createElement('div', {
        className: 'tidychat-nav-rail',
        style: { transform: 'translateY(-50%)', left: pos.left + 'px', top: pos.top + 'px' },
        'aria-label': '用户消息定位',
    }, React.createElement('canvas', {
        ref: canvasRef,
        className: 'tidychat-nav-canvas',
        onPointerMove: handlePointerMove,
        onPointerLeave: handlePointerLeave,
        onPointerDown: handlePointerDown,
        onPointerUp: handlePointerUp,
    }));
    const tipEl = tip === null ? null : React.createElement('div', {
        className: 'tidychat-nav-tip',
        style: tip.mirror
            ? { right: Math.max(0, window.innerWidth - tip.x) + 'px', top: tip.y + 'px' }
            : { left: tip.x + 'px', top: tip.y + 'px' },
    }, React.createElement('div', { className: 'tidychat-nav-tip-head' }, tip.head !== undefined && tip.head !== null ? tip.head : '#' + (tip.num ?? '?') + (tip.time !== '' ? ' · ' + tip.time : '')), React.createElement('div', null, tip.text));
    return React.createElement(React.Fragment, null, railEl, tipEl);
}
//# sourceMappingURL=RailView.js.map