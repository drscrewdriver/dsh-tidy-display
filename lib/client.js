window.__ModuleLoader__.load({
	id: "@drscrewdriver/dsh-tidy-display",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0rolldown/runtime.js
		var __create = Object.create;
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getProtoOf = Object.getPrototypeOf;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __copyProps = (to, from, except, desc) => {
			if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
			return to;
		};
		var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
			value: mod,
			enumerable: true
		}) : target, mod));
		//#endregion
		let react = require("react");
		react = __toESM(react, 1);
		let react_dom_client = require("react-dom/client");
		let _deepseek_ai_dsh_client_store = require("@deepseek-ai/dsh-client-store");
		//#region src/client/store.ts
		function createRailStore() {
			return (0, _deepseek_ai_dsh_client_store.defineStore)({
				init: () => ({
					railEnabled: true,
					railSide: "left",
					railStyle: "bar",
					railRing: true,
					hideOfficialNav: true,
					railColor: "auto",
					railColorCustom: "",
					railColorLight: "l3",
					railAccent: "auto",
					railAccentCustom: "",
					railAccentLight: "l3",
					autoLoad: true
				}),
				persist: "dsh.reader.v1",
				actions: {
					setRailEnabled: (draft, value) => {
						draft.railEnabled = value;
					},
					setRailSide: (draft, value) => {
						draft.railSide = value;
					},
					setRailStyle: (draft, value) => {
						draft.railStyle = value;
					},
					setRailRing: (draft, value) => {
						draft.railRing = value;
					},
					setHideOfficialNav: (draft, value) => {
						draft.hideOfficialNav = value;
					},
					setRailColor: (draft, value) => {
						draft.railColor = value;
					},
					setRailColorCustom: (draft, value) => {
						draft.railColorCustom = value;
					},
					setRailColorLight: (draft, value) => {
						draft.railColorLight = value;
					},
					setRailAccent: (draft, value) => {
						draft.railAccent = value;
					},
					setRailAccentCustom: (draft, value) => {
						draft.railAccentCustom = value;
					},
					setRailAccentLight: (draft, value) => {
						draft.railAccentLight = value;
					},
					setAutoLoad: (draft, value) => {
						draft.autoLoad = value;
					}
				}
			});
		}
		//#endregion
		//#region src/client/rail/RailView.tsx
		const NAV_RAIL_WIDTH = 48;
		const NAV_RAIL_BAR_H = 3;
		const NAV_RAIL_BAR_LEN = 14;
		const NAV_RAIL_BAR_LEN_NEAR = 26;
		const NAV_RAIL_BAR_LEN_CURRENT = 22;
		const NAV_RAIL_FISH_EYE_RADIUS = 4;
		const NAV_RAIL_FISH_EYE_BOOST = .5;
		const NAV_RAIL_TURN_SPACING = 12;
		const NAV_RAIL_MIN_HEIGHT = 48;
		const NAV_RAIL_CAP_H = 16;
		const NAV_RAIL_CAP_INDEX = -1;
		const HEADER_OFFSET = 64;
		const NAV_RAIL_RING_OFFSET = 2;
		const NAV_RAIL_RING_BLUR = 4;
		const NAV_RAIL_RING_ALPHA_CURRENT = .4;
		const NAV_RAIL_RING_ALPHA_HOVER = .22;
		let cssInjected$1 = false;
		function ensureRailCss() {
			if (cssInjected$1 || typeof document === "undefined") return;
			cssInjected$1 = true;
			const style = document.createElement("style");
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
/* 接管官方消息轨：官方 TurnNavigator 的类名是 CSS Module 产物（hash 随构建变化），
   双重锚定保证跨 hash 稳定；隐藏而非卸载（宿主 React 会还原被删节点）。 */
html[data-tidychat-hide-official-nav] [class*="_slot"]:has(> nav[class*="_frame"]),
html[data-tidychat-hide-official-nav] nav[class*="_frame"]:has([style*="--turn-natural-position"]) {
  display: none !important;
}
`;
			document.head.appendChild(style);
		}
		const findScrollContainer$1 = () => document.querySelector("[data-conversation-scroll]");
		const scopedRows = (selector) => {
			const container = findScrollContainer$1();
			return Array.from((container ?? document).querySelectorAll(selector));
		};
		const railRows = () => {
			const native = scopedRows("[data-chat-anchor-key]").filter((r) => {
				const k = r.getAttribute("data-chat-flow-kind");
				return k === "user" || k === "steering";
			});
			if (native.length > 0) return native;
			return scopedRows("[data-reader-key]").filter((r) => {
				const key = r.getAttribute("data-reader-key") || "";
				const m = /^(\d+):/.exec(key);
				if (m === null) return false;
				const kind = key.slice(m[1].length + 1, m[1].length + 1 + Number(m[1]));
				return kind === "user" || kind === "steering";
			});
		};
		const fallbackSummary = (el) => {
			try {
				return (el.innerText ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
			} catch {
				return String(el.textContent ?? "").trim().slice(0, 120);
			}
		};
		const hhmm = (ms) => {
			const d = new Date(ms);
			const pad = (n) => n < 10 ? "0" + n : String(n);
			return d.getMonth() + 1 + "月" + d.getDate() + "日 " + pad(d.getHours()) + ":" + pad(d.getMinutes());
		};
		const railHeight = (n) => Math.min(Math.min(window.innerHeight * .7, 660), Math.max(NAV_RAIL_MIN_HEIGHT, n * NAV_RAIL_TURN_SPACING));
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
			const host = document.querySelector("[data-conversation-scroll]");
			if (host === null) return null;
			const r = host.getBoundingClientRect();
			if (r.width < 10 || r.height < 10) return null;
			const composer = scopedRows("[data-composer-card]")[0];
			const chatRows = scopedRows("[data-chat-anchor-key]");
			const rects = [
				composer,
				chatRows[0],
				chatRows[chatRows.length - 1]
			].filter((x) => x !== null && x !== void 0).map((el) => el.getBoundingClientRect());
			if (side === "right") {
				const maxRight = rects.length > 0 ? Math.max(...rects.map((e) => e.right)) : r.right;
				const gutter = Math.max(0, r.right - maxRight);
				return {
					left: r.right - 44,
					top: r.top + r.height * .5,
					gutter
				};
			}
			const minLeft = rects.length > 0 ? Math.min(...rects.map((e) => e.left)) : r.left;
			const gutterL = Math.max(0, minLeft - r.left);
			return {
				left: r.left,
				top: r.top + r.height * .5,
				gutter: gutterL
			};
		};
		function RailView({ enabled, side, style: railStyle, ring, hideOfficialNav, hasMore, loadOlder }) {
			ensureRailCss();
			react.useEffect(() => {
				if (hideOfficialNav) document.documentElement.setAttribute("data-tidychat-hide-official-nav", "");
				else document.documentElement.removeAttribute("data-tidychat-hide-official-nav");
				return () => {
					document.documentElement.removeAttribute("data-tidychat-hide-official-nav");
				};
			}, [hideOfficialNav]);
			const [pos, setPos] = react.useState(null);
			const [tip, setTip] = react.useState(null);
			const [hover, setHover] = react.useState(null);
			const [current, setCurrent] = react.useState(null);
			const canvasRef = react.useRef(null);
			const moveRafRef = react.useRef(0);
			const moveLastRef = react.useRef(null);
			const rowCacheRef = react.useRef({
				rows: [],
				tops: [],
				count: -1,
				scrollH: -1
			});
			const scrollAnimRef = react.useRef(0);
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
				if (Math.abs(delta) < 1) return;
				let reduce = false;
				try {
					reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
				} catch {}
				if (reduce) {
					el.scrollTop = target;
					return;
				}
				const duration = Math.min(700, Math.max(260, Math.abs(delta) * .45));
				const t0 = performance.now();
				const ease = (p) => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
				const step = (now) => {
					const p = Math.min(1, (now - t0) / duration);
					el.scrollTop = start + delta * ease(p);
					scrollAnimRef.current = p < 1 ? requestAnimationFrame(step) : 0;
				};
				scrollAnimRef.current = requestAnimationFrame(step);
			};
			const turns = railRows().map((el) => ({
				el,
				summary: fallbackSummary(el),
				time: null
			}));
			const capOffset = hasMore ? NAV_RAIL_CAP_H : 0;
			const rebuildRowCache = (count, scrollH) => {
				const rows = railRows();
				const container = findScrollContainer$1();
				if (container === null) {
					rowCacheRef.current = {
						rows: [],
						tops: [],
						count,
						scrollH
					};
					return;
				}
				const cRect = container.getBoundingClientRect();
				const tops = rows.map((r) => r.getBoundingClientRect().top - cRect.top + container.scrollTop);
				rowCacheRef.current = {
					rows,
					tops,
					count,
					scrollH
				};
			};
			const detectCurrent = () => {
				const container = findScrollContainer$1();
				const tops = rowCacheRef.current.tops;
				if (container === null || tops.length === 0) return;
				const target = container.scrollTop + HEADER_OFFSET;
				let lo = 0;
				let hi = tops.length - 1;
				let ans = -1;
				while (lo <= hi) {
					const mid = lo + hi >> 1;
					if (tops[mid] <= target) {
						ans = mid;
						lo = mid + 1;
					} else hi = mid - 1;
				}
				const cur = ans === -1 ? 0 : ans;
				setCurrent((p) => p === cur ? p : cur);
			};
			const layoutPositions = (n, hoverIdx, H) => {
				const weights = [];
				for (let i = 0; i < n; i++) {
					let w = 1;
					if (hoverIdx !== null) {
						const d = Math.abs(i - hoverIdx);
						if (d <= NAV_RAIL_FISH_EYE_RADIUS) w = 1 + (NAV_RAIL_FISH_EYE_RADIUS - d + 1) * NAV_RAIL_FISH_EYE_BOOST;
					}
					weights.push(w);
				}
				const total = weights.reduce((a, b) => a + b, 0);
				const usable = Math.max(H - NAV_RAIL_BAR_H, 1);
				const pos = [];
				let acc = 0;
				for (let i = 0; i < n; i++) {
					acc += weights[i];
					pos.push((acc - weights[i] / 2) / total * usable + NAV_RAIL_BAR_H / 2);
				}
				return pos;
			};
			const indexFromY = (y, positions) => {
				if (positions.length === 0) return 0;
				let lo = 0;
				let hi = positions.length - 1;
				while (lo < hi) {
					const mid = lo + hi >> 1;
					if (positions[mid] < y) lo = mid + 1;
					else hi = mid;
				}
				const cur = positions[lo];
				const prev = lo > 0 ? positions[lo - 1] : -Infinity;
				const candidate = Math.abs(cur - y) <= Math.abs(prev - y) ? lo : lo - 1;
				return Math.max(0, Math.min(positions.length - 1, candidate));
			};
			const marksHeight = () => turns.length === 0 ? 0 : railHeight(turns.length);
			const positionsAt = (hv) => layoutPositions(turns.length, hv, marksHeight()).map((y) => y + capOffset);
			react.useEffect(() => {
				const container = findScrollContainer$1();
				const scrollH = container !== null ? container.scrollHeight : 0;
				if (rowCacheRef.current.count !== turns.length || rowCacheRef.current.scrollH !== scrollH) rebuildRowCache(turns.length, scrollH);
				detectCurrent();
				redraw();
			});
			const jumpTo = (index) => {
				const t = turns[index];
				if (t === void 0) return;
				const container = findScrollContainer$1();
				if (container === null) return;
				const cRect = container.getBoundingClientRect();
				const tRect = t.el.getBoundingClientRect();
				smoothScrollTo(container, tRect.top - cRect.top + container.scrollTop - HEADER_OFFSET);
			};
			const inCap = (localY) => capOffset > 0 && localY < capOffset;
			const markY = (i, hv) => positionsAt(hv)[i] ?? 0;
			const indexAt = (localY) => {
				let idx = indexFromY(localY, positionsAt(null));
				let prev = -1;
				for (let k = 0; k < 4; k++) {
					const next = indexFromY(localY, positionsAt(idx));
					if (next === idx) return idx;
					if (next === prev) return Math.abs(markY(idx, idx) - localY) <= Math.abs(markY(next, next) - localY) ? idx : next;
					prev = idx;
					idx = next;
				}
				return idx;
			};
			const handlePointerMove = (ev) => {
				moveLastRef.current = {
					x: ev.clientX,
					y: ev.clientY
				};
				if (moveRafRef.current !== 0) return;
				moveRafRef.current = requestAnimationFrame(() => {
					moveRafRef.current = 0;
					const p = moveLastRef.current;
					moveLastRef.current = null;
					if (p === null || canvasRef.current === null) return;
					const rect = canvasRef.current.getBoundingClientRect();
					const localY = p.y - rect.top;
					const mirror = side === "right";
					if (inCap(localY)) {
						if (hover !== NAV_RAIL_CAP_INDEX) setHover(NAV_RAIL_CAP_INDEX);
						setTip({
							x: mirror ? p.x - 18 : p.x + 18,
							y: p.y - 8,
							head: "更早历史未加载",
							num: null,
							time: "",
							text: `点击加载更早记录 · 当前轨道仅覆盖已加载的 ${turns.length} 轮`,
							mirror
						});
						return;
					}
					const idx = indexAt(localY);
					if (idx !== hover) setHover(idx);
					const u = turns[idx];
					if (u === void 0) {
						setTip(null);
						return;
					}
					setTip({
						x: mirror ? p.x - 18 : p.x + 18,
						y: p.y - 8,
						num: idx + 1,
						time: u.time !== null ? hhmm(u.time) : "",
						text: u.summary,
						mirror
					});
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
				} catch {}
			};
			const handlePointerUp = (ev) => {
				const canvas = canvasRef.current;
				if (canvas !== null) {
					const rect = canvas.getBoundingClientRect();
					const localY = ev.clientY - rect.top;
					if (inCap(localY)) loadOlder();
					else jumpTo(indexAt(localY));
				}
				try {
					ev.currentTarget.releasePointerCapture(ev.pointerId);
				} catch {}
				setHover(null);
				setTip(null);
			};
			const redraw = () => {
				const canvas = canvasRef.current;
				if (canvas === null) return;
				const n = turns.length;
				if (n === 0 && capOffset === 0) return;
				const H = marksHeight() + capOffset;
				const W = 40;
				const dpr = window.devicePixelRatio || 1;
				if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
					canvas.width = Math.round(W * dpr);
					canvas.height = Math.round(H * dpr);
					canvas.style.width = "40px";
					canvas.style.height = H + "px";
				}
				const ctx = canvas.getContext("2d");
				if (ctx === null) return;
				ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
				ctx.clearRect(0, 0, W, H);
				const cs = getComputedStyle(document.documentElement);
				const barColor = cs.getPropertyValue("--tidychat-nav-color").trim() || cs.getPropertyValue("--dsw-alias-label-caption").trim() || "rgba(127,127,127,0.5)";
				const hotColor = cs.getPropertyValue("--tidychat-nav-color-hot").trim() || cs.getPropertyValue("--dsw-alias-state-business-primary").trim() || "#3b82f6";
				const mirror = side === "right";
				const dot = railStyle === "dot";
				const dir = mirror ? -1 : 1;
				const positions = positionsAt(hover);
				const nearest = (i) => hover !== null && hover >= 0 && Math.abs(i - hover) <= 2;
				const boxOf = (i, y, isCurrent, isHover) => {
					if (dot) {
						const rad = isCurrent || isHover ? 4 : nearest(i) ? 3.2 : 2.5;
						return {
							x: (mirror ? W - NAV_RAIL_BAR_LEN / 2 : NAV_RAIL_BAR_LEN / 2) - rad,
							y: y - rad,
							w: rad * 2,
							h: rad * 2,
							dot: true
						};
					}
					const len = isHover ? NAV_RAIL_BAR_LEN_NEAR : isCurrent ? NAV_RAIL_BAR_LEN_CURRENT : nearest(i) ? 18 : NAV_RAIL_BAR_LEN;
					return {
						x: mirror ? W - len : 0,
						y: y - NAV_RAIL_BAR_H / 2,
						w: len,
						h: NAV_RAIL_BAR_H,
						dot: false
					};
				};
				if (ring) {
					ctx.save();
					ctx.fillStyle = "rgba(255,255,255,1)";
					ctx.shadowColor = "rgba(255,255,255,.9)";
					ctx.shadowBlur = NAV_RAIL_RING_BLUR;
					for (let i = 0; i < n; i++) {
						const isCurrent = current === i;
						const isHover = hover === i;
						if (!isCurrent && !isHover) continue;
						ctx.globalAlpha = isCurrent ? NAV_RAIL_RING_ALPHA_CURRENT : NAV_RAIL_RING_ALPHA_HOVER;
						const b = boxOf(i, positions[i], isCurrent, isHover);
						if (b.dot) {
							ctx.beginPath();
							ctx.arc(b.x + b.w / 2, b.y + b.h / 2, b.w / 2 + NAV_RAIL_RING_OFFSET, 0, Math.PI * 2);
							ctx.fill();
						} else {
							roundRectPath(ctx, b.x - NAV_RAIL_RING_OFFSET, b.y - NAV_RAIL_RING_OFFSET, b.w + 4, b.h + 4, b.h / 2 + NAV_RAIL_RING_OFFSET);
							ctx.fill();
						}
					}
					ctx.restore();
				}
				for (let i = 0; i < n; i++) {
					const y = positions[i];
					const isCurrent = current === i;
					const isHover = hover === i;
					ctx.fillStyle = isCurrent || isHover ? hotColor : barColor;
					if (dot) {
						const rad = isCurrent || isHover ? 4 : nearest(i) ? 3.2 : 2.5;
						const cx = mirror ? W - NAV_RAIL_BAR_LEN / 2 : NAV_RAIL_BAR_LEN / 2;
						ctx.beginPath();
						ctx.arc(cx, y, rad, 0, Math.PI * 2);
						ctx.fill();
					} else {
						const len = isHover ? NAV_RAIL_BAR_LEN_NEAR : isCurrent ? NAV_RAIL_BAR_LEN_CURRENT : nearest(i) ? 18 : NAV_RAIL_BAR_LEN;
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
				if (capOffset > 0) {
					const capColor = hover === NAV_RAIL_CAP_INDEX ? hotColor : barColor;
					const cx = mirror ? W - NAV_RAIL_BAR_LEN / 2 : NAV_RAIL_BAR_LEN / 2;
					ctx.strokeStyle = capColor;
					ctx.fillStyle = capColor;
					ctx.lineWidth = 1.5;
					ctx.lineCap = "round";
					ctx.beginPath();
					ctx.moveTo(cx - 3.5, 9.5);
					ctx.lineTo(cx, 6);
					ctx.lineTo(cx + 3.5, 9.5);
					ctx.stroke();
					ctx.lineWidth = 1;
					ctx.setLineDash([2, 3]);
					ctx.beginPath();
					ctx.moveTo(cx, 12);
					if (positions.length > 0) ctx.lineTo(cx, Math.max(12, positions[0] - 4));
					ctx.stroke();
					ctx.setLineDash([]);
				}
			};
			react.useEffect(() => {
				const refresh = () => {
					setPos(measurePos(side));
				};
				refresh();
				let resizeObs = null;
				const container = findScrollContainer$1();
				if (container !== null && typeof ResizeObserver !== "undefined") {
					resizeObs = new ResizeObserver(() => {
						refresh();
					});
					resizeObs.observe(container);
				}
				window.addEventListener("resize", refresh);
				let scrollRaf = 0;
				const onScroll = () => {
					if (scrollRaf !== 0) return;
					scrollRaf = requestAnimationFrame(() => {
						scrollRaf = 0;
						const c = findScrollContainer$1();
						if (c !== null && c.scrollHeight !== rowCacheRef.current.scrollH) rebuildRowCache(turns.length, c.scrollHeight);
						detectCurrent();
					});
				};
				if (container !== null) container.addEventListener("scroll", onScroll, { passive: true });
				const onUserTakeOver = () => cancelScrollAnim();
				if (container !== null) {
					container.addEventListener("wheel", onUserTakeOver, { passive: true });
					container.addEventListener("touchstart", onUserTakeOver, { passive: true });
				}
				window.addEventListener("keydown", onUserTakeOver);
				return () => {
					resizeObs?.disconnect();
					window.removeEventListener("resize", refresh);
					if (container !== null) {
						container.removeEventListener("scroll", onScroll);
						container.removeEventListener("wheel", onUserTakeOver);
						container.removeEventListener("touchstart", onUserTakeOver);
					}
					window.removeEventListener("keydown", onUserTakeOver);
					cancelScrollAnim();
					if (scrollRaf !== 0) cancelAnimationFrame(scrollRaf);
					if (moveRafRef.current !== 0) cancelAnimationFrame(moveRafRef.current);
				};
			}, [side]);
			if (!enabled) return null;
			if (pos === null) return null;
			if (pos.gutter < NAV_RAIL_WIDTH) return null;
			if (turns.length === 0 && !hasMore) return null;
			const railEl = react.createElement("div", {
				className: "tidychat-nav-rail",
				style: {
					transform: "translateY(-50%)",
					left: pos.left + "px",
					top: pos.top + "px"
				},
				"aria-label": "用户消息定位"
			}, react.createElement("canvas", {
				ref: canvasRef,
				className: "tidychat-nav-canvas",
				onPointerMove: handlePointerMove,
				onPointerLeave: handlePointerLeave,
				onPointerDown: handlePointerDown,
				onPointerUp: handlePointerUp
			}));
			const tipEl = tip === null ? null : react.createElement("div", {
				className: "tidychat-nav-tip",
				style: tip.mirror ? {
					right: Math.max(0, window.innerWidth - tip.x) + "px",
					top: tip.y + "px"
				} : {
					left: tip.x + "px",
					top: tip.y + "px"
				}
			}, react.createElement("div", { className: "tidychat-nav-tip-head" }, tip.head !== void 0 && tip.head !== null ? tip.head : "#" + (tip.num ?? "?") + (tip.time !== "" ? " · " + tip.time : "")), react.createElement("div", null, tip.text));
			return react.createElement(react.Fragment, null, railEl, tipEl);
		}
		//#endregion
		//#region src/client/rail/colors.ts
		const NAV_HUE_PALETTE = {
			gray: [
				"rgba(225,225,225,0.9)",
				"rgba(190,190,190,0.78)",
				"rgba(128,128,128,0.8)",
				"rgba(70,70,70,0.85)",
				"rgba(20,20,20,0.92)"
			],
			black: [
				"rgba(90,90,90,0.8)",
				"rgba(60,60,60,0.85)",
				"rgba(30,30,30,0.9)",
				"rgba(12,12,12,0.94)",
				"rgba(0,0,0,0.97)"
			],
			white: [
				"rgba(255,255,255,0.95)",
				"rgba(250,250,250,0.9)",
				"rgba(240,240,240,0.85)",
				"rgba(225,225,225,0.8)",
				"rgba(205,205,205,0.75)"
			],
			blue: [
				"#93c5fd",
				"#60a5fa",
				"#3b82f6",
				"#2563eb",
				"#1e40af"
			],
			violet: [
				"#c4b5fd",
				"#a78bfa",
				"#8b5cf6",
				"#7c3aed",
				"#5b21b6"
			],
			cyan: [
				"#67e8f9",
				"#22d3ee",
				"#06b6d4",
				"#0891b2",
				"#155e75"
			],
			green: [
				"#86efac",
				"#4ade80",
				"#22c55e",
				"#16a34a",
				"#166534"
			],
			orange: [
				"#fdba74",
				"#fb923c",
				"#f97316",
				"#ea580c",
				"#9a3412"
			],
			red: [
				"#fca5a5",
				"#f87171",
				"#ef4444",
				"#dc2626",
				"#991b1b"
			]
		};
		const NAV_LIGHT_IDX = {
			l1: 0,
			l2: 1,
			l3: 2,
			l4: 3,
			l5: 4
		};
		const hueColor = (hue, light, fallback) => {
			if (typeof hue === "string") {
				const palette = NAV_HUE_PALETTE[hue];
				if (palette !== void 0) return palette[NAV_LIGHT_IDX[typeof light === "string" ? light : "l3"] ?? 2];
			}
			return fallback;
		};
		const parseRgba = (s) => {
			const t = (s ?? "").trim().toLowerCase();
			if (t === "") return null;
			if (t === "transparent") return [
				0,
				0,
				0,
				0
			];
			const hex = /^#([0-9a-f]{3,8})$/.exec(t);
			if (hex !== null) {
				let h = hex[1];
				if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("");
				if (h.length === 6) h += "ff";
				const n = parseInt(h, 16);
				return [
					n >> 24 & 255,
					n >> 16 & 255,
					n >> 8 & 255,
					Math.round((n & 255) / 255 * 1e3) / 1e3
				];
			}
			const num = (x, base) => {
				const v = x.trim();
				if (v === "") return null;
				const p = v.endsWith("%") ? Number(v.slice(0, -1)) : Number(v);
				if (Number.isNaN(p)) return null;
				if (base === 255 && v.endsWith("%")) return Math.round(p / 100 * 255);
				if (base === 1 && v.endsWith("%")) return p / 100;
				return base === 1 ? p : Math.round(p);
			};
			const comma = /^rgba?\(\s*([\d.]+%?)\s*,\s*([\d.]+%?)\s*,\s*([\d.]+%?)(?:\s*,\s*([\d.]+%?))?\s*\)$/.exec(t);
			if (comma !== null) {
				const r = num(comma[1], 255);
				const g = num(comma[2], 255);
				const b = num(comma[3], 255);
				const a = comma[4] !== void 0 ? num(comma[4], 1) : 1;
				if (r === null || g === null || b === null || a === null) return null;
				return [
					r,
					g,
					b,
					a
				];
			}
			const space = /^rgba?\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+%?)(?:\s*\/\s*([\d.]+%?))?\s*\)$/.exec(t);
			if (space !== null) {
				const r = num(space[1], 255);
				const g = num(space[2], 255);
				const b = num(space[3], 255);
				const a = space[4] !== void 0 ? num(space[4], 1) : 1;
				if (r === null || g === null || b === null || a === null) return null;
				return [
					r,
					g,
					b,
					a
				];
			}
			return null;
		};
		const parseRgb = (s) => {
			const a = parseRgba(s);
			return a === null ? null : [
				a[0],
				a[1],
				a[2]
			];
		};
		const findBackgroundRgb = (start) => {
			try {
				let el = start;
				while (el !== null) {
					const rgba = parseRgba(getComputedStyle(el).backgroundColor);
					if (rgba !== null && rgba[3] > 0) return [
						rgba[0],
						rgba[1],
						rgba[2]
					];
					el = el.parentElement;
				}
			} catch {}
			return null;
		};
		const isDarkBackground = (start) => {
			const rgb = findBackgroundRgb(start);
			if (rgb !== null) return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2] < 128;
			try {
				if (typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches) return true;
			} catch {}
			return false;
		};
		const contrastRatio = (a, b) => {
			const lum = (c) => {
				const f = (v) => {
					const s = v / 255;
					return s <= .03928 ? s / 12.92 : Math.pow((s + .055) / 1.055, 2.4);
				};
				return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]);
			};
			const la = lum(a);
			const lb = lum(b);
			const hi = Math.max(la, lb);
			const lo = Math.min(la, lb);
			return (hi + .05) / (lo + .05);
		};
		const validColor = (raw, fallback) => {
			if (typeof raw !== "string") return fallback;
			const s = raw.trim();
			if (s === "") return fallback;
			return parseRgba(s) !== null ? s : fallback;
		};
		const resolveNavColors = (cfg, start) => {
			const cs = getComputedStyle(document.documentElement);
			const brand = cs.getPropertyValue("--dsw-alias-state-business-primary").trim() || "#3b82f6";
			const caption = cs.getPropertyValue("--dsw-alias-label-caption").trim() || "rgba(127,127,127,0.5)";
			const autoBar = () => {
				const captionRgb = parseRgb(caption);
				const bgRgb = findBackgroundRgb(start);
				if (captionRgb !== null && bgRgb !== null && contrastRatio(captionRgb, bgRgb) >= 3) return caption;
				return isDarkBackground(start) ? "rgba(226,226,226,0.85)" : "rgba(80,80,80,0.78)";
			};
			const colorMode = cfg.navColor ?? "auto";
			const bar = colorMode === "auto" ? autoBar() : colorMode === "custom" ? validColor(cfg.navColorCustom, autoBar()) : hueColor(colorMode, cfg.navColorLight, caption);
			const accentMode = cfg.navAccent ?? "auto";
			return {
				bar,
				hot: accentMode === "auto" ? brand : accentMode === "custom" ? validColor(cfg.navAccentCustom, brand) : hueColor(accentMode, cfg.navAccentLight, brand)
			};
		};
		const applyTipContrast = () => {
			const root = document.documentElement;
			const cs = getComputedStyle(document.body);
			const tipBg = parseRgba(cs.getPropertyValue("--dsw-alias-bg-layer-3").trim());
			const update = (key, token) => {
				if (tipBg === null || tipBg[3] < .85) {
					root.style.removeProperty(key);
					return;
				}
				const rgb = parseRgb(token);
				const corrected = .2126 * tipBg[0] + .7152 * tipBg[1] + .0722 * tipBg[2] < 128 ? "rgba(235,235,235,0.92)" : "rgba(55,55,55,0.92)";
				if (rgb === null || contrastRatio(rgb, [
					tipBg[0],
					tipBg[1],
					tipBg[2]
				]) >= 3) {
					root.style.removeProperty(key);
					return;
				}
				if (root.style.getPropertyValue(key) !== corrected) root.style.setProperty(key, corrected);
			};
			update("--tidychat-nav-tip-text", cs.getPropertyValue("--dsw-alias-label-primary").trim() || "#222");
			update("--tidychat-nav-tip-head", cs.getPropertyValue("--dsw-alias-label-secondary").trim() || "#666");
		};
		const applyNavColors = (cfg, start) => {
			const { bar, hot } = resolveNavColors(cfg, start);
			const root = document.documentElement;
			if (root.style.getPropertyValue("--tidychat-nav-color") !== bar) root.style.setProperty("--tidychat-nav-color", bar);
			if (root.style.getPropertyValue("--tidychat-nav-color-hot") !== hot) root.style.setProperty("--tidychat-nav-color-hot", hot);
			applyTipContrast();
		};
		/**
		* Install the color pipeline once per client: reacts to store changes (the
		* settings card), theme switches (:root class/style/data-theme) and a slow
		* fallback interval (sidebar resize changes the resolved background). Writes
		* are guarded (value-equal) so the theme observer cannot loop.
		*/
		function installRailColors(prefs, getStart) {
			const run = () => applyNavColors(prefs.getSnapshot(), getStart());
			run();
			const unsub = prefs.subscribe(() => run());
			let themeObs = null;
			if (typeof MutationObserver !== "undefined") {
				themeObs = new MutationObserver(() => run());
				themeObs.observe(document.documentElement, {
					attributes: true,
					attributeFilter: [
						"class",
						"style",
						"data-theme"
					]
				});
			}
			const interval = setInterval(run, 5e3);
			return () => {
				try {
					unsub();
				} catch {}
				themeObs?.disconnect();
				clearInterval(interval);
			};
		}
		const CONSECUTIVE_SLOW_LIMIT = 3;
		const SETTLE_QUIET_MS = 300;
		const SETTLE_TIMEOUT_MS = 8e3;
		const IDLE_FALLBACK_MS = 50;
		const NULL_RETRY_LIMIT = 15;
		const NULL_RETRY_DELAY_MS = 2e3;
		const isLoadOlderButton = (b) => {
			const t = (b.textContent || "").trim();
			return t === "加载更早" || t === "Load earlier" || t === "Load older";
		};
		function findLoadOlderButton() {
			for (const b of document.querySelectorAll("button")) if (isLoadOlderButton(b)) return b;
			return null;
		}
		const countAnchors = () => document.querySelectorAll("[data-chat-anchor-key]").length;
		function startAutoLoad(opts) {
			const st = {
				generation: 0,
				status: "idle",
				consecutiveSlow: 0,
				nullStreak: 0
			};
			let root = null;
			let disposed = false;
			const disposers = [];
			const track = (dispose) => {
				disposers.push(dispose);
				return () => {
					const i = disposers.indexOf(dispose);
					if (i >= 0) disposers.splice(i, 1);
				};
			};
			const showPausedHint = () => {
				if (document.querySelector("[data-tidy-display-autoload-hint]") !== null) return;
				const btn = findLoadOlderButton();
				if (btn === null || btn.parentElement === null) return;
				const hint = document.createElement("span");
				hint.setAttribute("data-tidy-display-autoload-hint", "1");
				hint.className = "tidy-display-autoload-hint";
				hint.textContent = "为保持流畅，已暂停自动加载更早历史；可手动继续";
				btn.parentElement.insertBefore(hint, btn.nextSibling);
			};
			const pause = () => {
				st.status = "paused";
				st.generation += 1;
				showPausedHint();
			};
			const measuredSettle = () => {
				const t0 = performance.now();
				try {
					opts.onSettle?.();
				} catch {}
				return performance.now() - t0;
			};
			function scheduleNext() {
				if (disposed || !opts.isEnabled()) return;
				if (st.status !== "idle") return;
				const gen = ++st.generation;
				const run = () => {
					if (disposed || st.generation !== gen || st.status !== "idle") return;
					loadOnePage(gen);
				};
				let off = () => {};
				const w = window;
				if (typeof w.requestIdleCallback === "function") {
					const id = w.requestIdleCallback(() => {
						off();
						run();
					}, { timeout: 2e3 });
					off = track(() => w.cancelIdleCallback?.(id));
				} else {
					const id = setTimeout(() => {
						off();
						run();
					}, IDLE_FALLBACK_MS);
					off = track(() => clearTimeout(id));
				}
			}
			function loadOnePage(gen) {
				if (disposed || !opts.isEnabled()) return;
				if (st.generation !== gen || st.status !== "idle") return;
				const btn = findLoadOlderButton();
				if (btn === null) {
					if (st.nullStreak >= NULL_RETRY_LIMIT) {
						st.status = "done";
						return;
					}
					st.nullStreak += 1;
					st.status = "idle";
					const id = setTimeout(() => {
						scheduleNext();
					}, NULL_RETRY_DELAY_MS);
					track(() => clearTimeout(id));
					return;
				}
				st.nullStreak = 0;
				if (btn.disabled) {
					st.status = "idle";
					const id = setTimeout(() => {
						scheduleNext();
					}, NULL_RETRY_DELAY_MS);
					track(() => clearTimeout(id));
					return;
				}
				st.status = "loading";
				settleThenMeasure(gen, countAnchors());
				try {
					btn.click();
				} catch {}
			}
			function settleThenMeasure(gen, before) {
				st.status = "settling";
				let quietTimer = null;
				let settleTimeout = null;
				let obs = null;
				let finished = false;
				const finish = (isTimeout) => {
					if (finished) return;
					finished = true;
					if (quietTimer !== null) clearTimeout(quietTimer);
					if (settleTimeout !== null) clearTimeout(settleTimeout);
					obs?.disconnect();
					if (disposed) return;
					if (st.generation !== gen || st.status !== "settling") return;
					const grew = countAnchors() > before;
					const stillHasButton = findLoadOlderButton() !== null;
					const scanMs = measuredSettle();
					if (isTimeout || !grew && stillHasButton) {
						pause();
						return;
					}
					if (scanMs >= 50) {
						pause();
						return;
					}
					if (scanMs >= 30) {
						st.consecutiveSlow += 1;
						if (st.consecutiveSlow >= CONSECUTIVE_SLOW_LIMIT) {
							pause();
							return;
						}
					} else st.consecutiveSlow = 0;
					st.status = "idle";
					scheduleNext();
				};
				obs = new MutationObserver(() => {
					if (quietTimer !== null) clearTimeout(quietTimer);
					quietTimer = setTimeout(() => finish(false), SETTLE_QUIET_MS);
				});
				obs.observe(document.body, {
					childList: true,
					subtree: true
				});
				settleTimeout = setTimeout(() => finish(true), SETTLE_TIMEOUT_MS);
			}
			const rootObs = new MutationObserver(() => {
				const cur = opts.getRoot();
				if (cur === root) return;
				root = cur;
				st.generation += 1;
				st.status = "idle";
				st.nullStreak = 0;
				if (root !== null) scheduleNext();
			});
			rootObs.observe(document.body, {
				childList: true,
				subtree: true
			});
			root = opts.getRoot();
			scheduleNext();
			return () => {
				disposed = true;
				st.generation += 1;
				rootObs.disconnect();
				for (const d of disposers.splice(0)) try {
					d();
				} catch {}
			};
		}
		//#endregion
		//#region src/client/settings-copy.ts
		const en = {
			nav: "整洁显示",
			railTitle: "Message rail",
			railDescription: "On by default: a canvas navigation rail at the conversation edge — fish-eye hover with summaries, click to jump, current-turn highlight.",
			railSide: "Rail position",
			railSideLeft: "Left edge",
			railSideRight: "Right edge (mirrored)",
			railStyle: "Rail style",
			railStyleBar: "Lines",
			railStyleDot: "Dots",
			railRingTitle: "Rail sheen",
			railRingDescription: "On by default: a soft white sheen laid beneath the current and hovered marks, keeping them readable over busy wallpapers.",
			takeoverTitle: "Take over the official rail",
			takeoverDescription: "On by default: the official right-edge TurnNavigator is hidden (hidden, not unmounted) so this rail is the only one. Turn off to see both. On DSH 0.1.5 the official rail is hardcoded in ChatView — if hiding fails, turn this off.",
			colorBarTitle: "Mark color",
			colorAccentTitle: "Accent color",
			colorAuto: "Auto",
			colorCustom: "Custom",
			autoLoadTitle: "Smart history loading",
			autoLoadDescription: "On by default: auto-clicks the host \"load earlier\" button under a time budget so long sessions become fully navigable."
		};
		const zh = {
			nav: "整洁显示",
			railTitle: "消息轨",
			railDescription: "默认开启：会话区边缘的 canvas 导航轨——鱼眼悬停看摘要、点击跳转、当前轮高亮。",
			railSide: "显示位置",
			railSideLeft: "左缘",
			railSideRight: "右缘（镜像）",
			railStyle: "显示样式",
			railStyleBar: "横线",
			railStyleDot: "圆点",
			railRingTitle: "外圈柔光",
			railRingDescription: "默认开启：在当前轮与悬停轮的标记底下垫一层白色柔光，复杂壁纸上也能看清标记。",
			takeoverTitle: "接管官方消息轨",
			takeoverDescription: "默认开启：隐藏官方右缘 TurnNavigator（隐藏而非卸载），只保留本轨。关闭后两条轨并存。DSH 0.1.5 的官方轨硬编码在 ChatView 里，若隐藏无效请关闭此开关。",
			colorBarTitle: "标记色",
			colorAccentTitle: "强调色",
			colorAuto: "自动",
			colorCustom: "自定义",
			autoLoadTitle: "智能历史加载",
			autoLoadDescription: "默认开启：按时间预算自动点击宿主的「加载更早」按钮，长会话也能全量纳入定位轨。"
		};
		function settingsLanguage(tag) {
			return (tag ?? "").toLowerCase().startsWith("zh") ? "zh" : "en";
		}
		function settingsCopyFor(tag) {
			return settingsLanguage(tag) === "zh" ? zh : en;
		}
		//#endregion
		//#region src/client/LegacySettingsCard.tsx
		let cssInjected = false;
		function ensureCardCss() {
			if (cssInjected) return;
			cssInjected = true;
			const style = document.createElement("style");
			style.setAttribute("data-tidy-display-card-css", "1");
			style.textContent = [
				".td-card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;list-style:none;transition:border-color .16s,background .16s;}",
				".td-card:hover{border-color:var(--dsw-alias-label-dimmed);}",
				".td-card-open{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed);}",
				".td-card-header{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:transparent;border:0;border-radius:12px;align-items:center;gap:12px;padding:14px 16px;display:flex;}",
				".td-card-headtext{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex;}",
				".td-card-name{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4;}",
				".td-card-desc{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5;}",
				".td-card-chevron{color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .16s;}",
				".td-card-chevron-open{transform:rotate(180deg);}",
				".td-card-body{padding:4px 16px 12px;}",
				".td-field{flex-direction:column;gap:6px;padding:12px 0;display:flex;}",
				".td-field+.td-field{border-top:1px solid var(--dsw-alias-border-l2);}",
				".td-field-head{align-items:center;gap:8px;display:flex;}",
				".td-field-label{min-width:0;color:var(--dsw-alias-label-primary);flex:1;font-size:13px;font-weight:500;line-height:1.5;}",
				".td-field-hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:1.5;}",
				".td-switch{appearance:none;border:none;cursor:pointer;flex:none;width:34px;height:20px;border-radius:999px;padding:0;background:var(--dsw-alias-label-dimmed,rgba(127,127,127,0.4));position:relative;transition:background .16s;}",
				".td-switch::after{content:\"\";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:transform .16s;}",
				".td-switch-on{background:var(--dsw-alias-brand-primary,#3b82f6);}",
				".td-switch-on::after{transform:translateX(14px);}",
				".td-color-sub{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:8px;}",
				".td-color-sub-label{font-size:12px;color:var(--dsw-alias-label-tertiary,#999);flex:none;min-width:30px;}",
				".td-color-chips{display:flex;flex-wrap:wrap;align-items:center;gap:6px;}",
				".td-chip{appearance:none;display:inline-flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,0.4));background:transparent;color:var(--dsw-alias-label-secondary,#666);border-radius:999px;padding:3px 10px;}",
				".td-chip:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,0.1));}",
				".td-chip-on{border-color:var(--dsw-alias-state-business-primary,#3b82f6);color:var(--dsw-alias-label-primary,#222);background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,0.12));}",
				".td-chip-dot{width:11px;height:11px;border-radius:50%;border:1px solid rgba(128,128,128,0.35);flex:none;}",
				".td-picker{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:8px;}",
				".td-color-input{appearance:none;width:34px;height:26px;padding:0;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,0.4));border-radius:6px;background:transparent;cursor:pointer;flex:none;}",
				".td-color-input::-webkit-color-swatch-wrapper{padding:2px;}",
				".td-color-input::-webkit-color-swatch{border:none;border-radius:4px;}",
				".td-hex-input{appearance:none;flex:1 1 140px;min-width:110px;font-size:12px;font-family:var(--ds-font-family-code,monospace);color:var(--dsw-alias-label-primary,#222);background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,0.08));border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,0.4));border-radius:6px;padding:4px 8px;}",
				".td-hex-input:focus{outline:1.5px solid var(--dsw-alias-button-info-fill,#3b82f6);outline-offset:1px;}",
				".td-alpha-input{appearance:none;flex:1 1 90px;min-width:80px;height:4px;border-radius:999px;background:var(--dsw-alias-border-l2,rgba(128,128,128,0.4));cursor:pointer;}",
				".td-alpha-input::-webkit-slider-thumb{appearance:none;width:12px;height:12px;border-radius:50%;background:var(--dsw-alias-state-business-primary,#3b82f6);border:none;}",
				".td-alpha-label{font-size:12px;color:var(--dsw-alias-label-tertiary,#999);min-width:34px;text-align:right;}"
			].join("\n");
			document.head.appendChild(style);
		}
		const hex6Of = (rgb) => "#" + rgb.slice(0, 3).map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0")).join("");
		const cssColor = (rgb, a) => a >= 1 ? hex6Of(rgb) : "rgba(" + Math.round(rgb[0]) + ", " + Math.round(rgb[1]) + ", " + Math.round(rgb[2]) + ", " + Math.round(a * 1e3) / 1e3 + ")";
		const chipRow = (opts, selected, onClick, disabled) => react.createElement("div", { className: "td-color-chips" }, opts.map((o) => react.createElement("button", {
			key: o.key,
			type: "button",
			title: o.label,
			"aria-pressed": selected === o.key,
			className: "td-chip" + (selected === o.key ? " td-chip-on" : ""),
			disabled,
			onClick: () => onClick(o.key)
		}, o.preview !== void 0 ? react.createElement("span", {
			className: "td-chip-dot",
			style: { background: o.preview }
		}) : null, o.label)));
		const colorField = (label, modeField, customField, mode, custom, autoPreview, hint, writable, onSet) => {
			const customOn = mode === "custom";
			const parsed = parseRgba(String(custom ?? ""));
			const rgb = parsed === null ? [
				59,
				130,
				246
			] : [
				parsed[0],
				parsed[1],
				parsed[2]
			];
			const alpha = parsed === null ? 1 : parsed[3];
			const swatch = parsed !== null ? cssColor(rgb, alpha) : "linear-gradient(135deg, #f87171, #60a5fa, #4ade80)";
			return react.createElement("div", {
				key: modeField,
				className: "td-field"
			}, react.createElement("div", { className: "td-field-head" }, react.createElement("span", { className: "td-field-label" }, label)), react.createElement("div", { className: "td-color-sub" }, react.createElement("span", { className: "td-color-sub-label" }, "模式"), chipRow([{
				key: "auto",
				label: "自动",
				preview: autoPreview
			}, {
				key: "custom",
				label: "自定义",
				preview: swatch
			}], customOn ? "custom" : "auto", (k) => onSet(modeField, k), !writable)), customOn ? react.createElement("div", { className: "td-picker" }, react.createElement("input", {
				type: "color",
				className: "td-color-input",
				value: hex6Of(rgb),
				disabled: !writable,
				"aria-label": label + " 取色",
				onChange: (e) => {
					const p = parseRgba(String(e.target.value));
					if (p !== null) onSet(customField, cssColor([
						p[0],
						p[1],
						p[2]
					], alpha));
				}
			}), react.createElement("input", {
				type: "text",
				className: "td-hex-input",
				value: String(custom ?? ""),
				disabled: !writable,
				placeholder: "#3b82f6 / rgb(59,130,246)",
				spellCheck: false,
				"aria-label": label + " 颜色值",
				onChange: (e) => onSet(customField, String(e.target.value))
			}), react.createElement("input", {
				type: "range",
				className: "td-alpha-input",
				min: 0,
				max: 100,
				step: 1,
				value: Math.round(alpha * 100),
				disabled: !writable,
				"aria-label": label + " 透明度",
				onChange: (e) => onSet(customField, cssColor(rgb, Number(e.target.value) / 100))
			}), react.createElement("span", { className: "td-alpha-label" }, Math.round(alpha * 100) + "%")) : null, react.createElement("p", { className: "td-field-hint" }, hint));
		};
		const toggleField = (label, hint, on, disabled, onToggle) => react.createElement("div", { className: "td-field" }, react.createElement("div", { className: "td-field-head" }, react.createElement("span", { className: "td-field-label" }, label), react.createElement("button", {
			type: "button",
			className: "td-switch" + (on ? " td-switch-on" : ""),
			role: "switch",
			"aria-checked": on,
			disabled,
			onClick: onToggle
		})), react.createElement("p", { className: "td-field-hint" }, hint));
		function LegacySettingsCard(props) {
			const { value, writable, hasTakeover, onToggle, onSet, langTag } = props;
			const copy = settingsCopyFor(langTag);
			const [open, setOpen] = react.useState(false);
			const chevron = react.createElement("svg", {
				className: "td-card-chevron" + (open ? " td-card-chevron-open" : ""),
				viewBox: "0 0 14 14",
				width: 14,
				height: 14,
				fill: "none"
			}, react.createElement("path", {
				d: "M3.5 5.5L7 9l3.5-3.5",
				stroke: "currentColor",
				strokeWidth: 1.5,
				strokeLinecap: "round",
				strokeLinejoin: "round"
			}));
			return react.createElement("div", { className: "td-card" + (open ? " td-card-open" : "") }, react.createElement("button", {
				type: "button",
				className: "td-card-header",
				"aria-expanded": open,
				onClick: () => setOpen(!open)
			}, react.createElement("span", { className: "td-card-headtext" }, react.createElement("span", { className: "td-card-name" }, "整洁显示 tidy-display"), react.createElement("span", { className: "td-card-desc" }, copy.railDescription)), chevron), open ? react.createElement("div", { className: "td-card-body" }, toggleField(copy.railTitle, copy.railDescription, value.railEnabled === true, !writable, () => onToggle("railEnabled")), react.createElement("div", { className: "td-field" }, react.createElement("div", { className: "td-field-head" }, react.createElement("span", { className: "td-field-label" }, copy.railSide)), chipRow([{
				key: "left",
				label: copy.railSideLeft
			}, {
				key: "right",
				label: copy.railSideRight
			}], String(value.railSide ?? "left"), (k) => onSet("railSide", k), !writable)), react.createElement("div", { className: "td-field" }, react.createElement("div", { className: "td-field-head" }, react.createElement("span", { className: "td-field-label" }, copy.railStyle)), chipRow([{
				key: "bar",
				label: copy.railStyleBar
			}, {
				key: "dot",
				label: copy.railStyleDot
			}], String(value.railStyle ?? "bar"), (k) => onSet("railStyle", k), !writable)), toggleField(copy.railRingTitle, copy.railRingDescription, value.railRing === true, !writable, () => onToggle("railRing")), hasTakeover ? toggleField(copy.takeoverTitle, copy.takeoverDescription, value.hideOfficialNav === true, !writable, () => onToggle("hideOfficialNav")) : null, colorField(copy.colorBarTitle, "railColor", "railColorCustom", String(value.railColor ?? "auto"), String(value.railColorCustom ?? ""), "currentColor", "自动 = 跟随主题，对比不足自动纠偏；自定义 = 取色器 / HEX·RGB / 透明度。", writable, onSet), colorField(copy.colorAccentTitle, "railAccent", "railAccentCustom", String(value.railAccent ?? "auto"), String(value.railAccentCustom ?? ""), "currentColor", "强调色作用于当前轮与悬停轮的标记。", writable, onSet), toggleField(copy.autoLoadTitle, copy.autoLoadDescription, value.autoLoad === true, !writable, () => onToggle("autoLoad"))) : null);
		}
		//#endregion
		//#region src/client/index.tsx
		/**
		* Legacy (pre-0.1.7) client half: message-rail subset only.
		*
		* - Mounts the canvas rail beside the native conversation column (no host
		*   slots involved — the utilities seat is a 0.1.7 contract).
		* - Rail prefs come from the `tidy-display` settings namespace (bound via the
		*   legacy settings face) and are mirrored into the rail store.
		* - autoLoad runs the tidychat Governor against the host "load earlier"
		*   button; every settled page nudges the rail to re-measure.
		*/
		const name = "dsh-tidy-display-client";
		const inject = ["slots", "sessions"];
		const findScrollContainer = () => document.querySelector("[data-conversation-scroll]");
		function apply(ctx) {
			const prefs = createRailStore().create();
			let settingsScope = null;
			const settingsFace = ctx.get?.("webUiSettings") ?? ctx.get?.("settingsScope");
			if (settingsFace !== void 0 && settingsFace !== null && typeof settingsFace.bind === "function") try {
				settingsScope = settingsFace.bind({ namespace: "tidy-display" });
			} catch {
				settingsScope = null;
			}
			const readConfig = () => {
				try {
					const v = (settingsScope?.getSnapshot?.())?.value;
					if (v === null || v === void 0) return;
					const cur = prefs.getSnapshot();
					const railEnabled = typeof v.railEnabled === "boolean" ? v.railEnabled : true;
					if (cur.railEnabled !== railEnabled) prefs.actions.setRailEnabled(railEnabled);
					const railSide = v.railSide === "right" ? "right" : "left";
					if (cur.railSide !== railSide) prefs.actions.setRailSide(railSide);
					const railStyle = v.railStyle === "dot" ? "dot" : "bar";
					if (cur.railStyle !== railStyle) prefs.actions.setRailStyle(railStyle);
					const railRing = v.railRing !== false;
					if (cur.railRing !== railRing) prefs.actions.setRailRing(railRing);
					const hideOfficialNav = v.hideOfficialNav !== false;
					if (cur.hideOfficialNav !== hideOfficialNav) prefs.actions.setHideOfficialNav(hideOfficialNav);
					const railColor = typeof v.railColor === "string" ? v.railColor : "auto";
					if (cur.railColor !== railColor) prefs.actions.setRailColor(railColor);
					const railColorCustom = typeof v.railColorCustom === "string" ? v.railColorCustom : "";
					if (cur.railColorCustom !== railColorCustom) prefs.actions.setRailColorCustom(railColorCustom);
					const railAccent = typeof v.railAccent === "string" ? v.railAccent : "auto";
					if (cur.railAccent !== railAccent) prefs.actions.setRailAccent(railAccent);
					const railAccentCustom = typeof v.railAccentCustom === "string" ? v.railAccentCustom : "";
					if (cur.railAccentCustom !== railAccentCustom) prefs.actions.setRailAccentCustom(railAccentCustom);
					const autoLoad = v.autoLoad !== false;
					if (cur.autoLoad !== autoLoad) prefs.actions.setAutoLoad(autoLoad);
				} catch {}
			};
			if (settingsScope !== null) {
				try {
					settingsScope.subscribe?.(() => readConfig());
				} catch {}
				readConfig();
			}
			installRailColors({
				subscribe: prefs.subscribe,
				getSnapshot: () => {
					const s = prefs.getSnapshot();
					return {
						navColor: s.railColor,
						navColorCustom: s.railColorCustom,
						navColorLight: s.railColorLight,
						navAccent: s.railAccent,
						navAccentCustom: s.railAccentCustom,
						navAccentLight: s.railAccentLight
					};
				}
			}, findScrollContainer);
			let bumpRail = () => {};
			function RailHost() {
				const snap = react.useSyncExternalStore(prefs.subscribe, () => prefs.getSnapshot());
				const [, setBump] = react.useState(0);
				react.useEffect(() => {
					let raf = 0;
					let lastSig = "";
					const signature = () => {
						const c = findScrollContainer();
						return c === null ? "" : String(c.scrollHeight) + ":" + String(document.querySelectorAll("[data-chat-anchor-key]").length);
					};
					lastSig = signature();
					const obs = new MutationObserver(() => {
						if (raf !== 0) return;
						raf = requestAnimationFrame(() => {
							raf = 0;
							const s = signature();
							if (s !== lastSig) {
								lastSig = s;
								setBump((b) => b + 1);
							}
						});
					});
					obs.observe(document.body, {
						childList: true,
						subtree: true
					});
					bumpRail = () => {
						lastSig = signature();
						setBump((b) => b + 1);
					};
					return () => {
						obs.disconnect();
						if (raf !== 0) cancelAnimationFrame(raf);
					};
				}, []);
				const hasMore = findLoadOlderButton() !== null;
				return react.createElement(RailView, {
					enabled: snap.railEnabled !== false,
					side: snap.railSide === "right" ? "right" : "left",
					style: snap.railStyle === "dot" ? "dot" : "bar",
					ring: snap.railRing === true,
					hideOfficialNav: snap.hideOfficialNav !== false,
					hasMore,
					loadOlder: () => {
						findLoadOlderButton()?.click();
					}
				});
			}
			const disposeRail = mountRail();
			function mountRail() {
				ensureCardCss();
				const host = document.createElement("div");
				host.setAttribute("data-tidy-display-rail-host", "1");
				document.body.appendChild(host);
				const root = (0, react_dom_client.createRoot)(host);
				root.render(react.createElement(RailHost));
				const stopAutoLoad = startAutoLoad({
					getRoot: findScrollContainer,
					isEnabled: () => prefs.getSnapshot().autoLoad !== false,
					onSettle: () => bumpRail()
				});
				return () => {
					stopAutoLoad();
					root.unmount();
					host.remove();
				};
			}
			const slots = ctx.slots;
			if (slots?.inject !== void 0 && slots?.register !== void 0) slots.inject("settings.plugin.item", () => slots.register?.({
				name: "settings.plugin.item",
				key: "tidy-display",
				order: 100,
				inject: () => ({})
			}, function SettingsTab() {
				react.useSyncExternalStore(prefs.subscribe, () => prefs.getSnapshot());
				const snap = prefs.getSnapshot();
				ensureCardCss();
				const value = {
					railEnabled: snap.railEnabled,
					railSide: snap.railSide,
					railStyle: snap.railStyle,
					railRing: snap.railRing,
					hideOfficialNav: snap.hideOfficialNav,
					railColor: snap.railColor,
					railColorCustom: snap.railColorCustom,
					railAccent: snap.railAccent,
					railAccentCustom: snap.railAccentCustom,
					autoLoad: snap.autoLoad
				};
				const onToggle = (field) => {
					if (settingsScope?.set === void 0) return;
					Promise.resolve(settingsScope.set(field, value[field] !== true)).catch(() => {});
				};
				const onSet = (field, v) => {
					if (settingsScope?.set === void 0) return;
					Promise.resolve(settingsScope.set(field, v)).catch(() => {});
				};
				const langTag = typeof document !== "undefined" ? document.documentElement.lang : void 0;
				return react.createElement(LegacySettingsCard, {
					value,
					writable: settingsScope !== null,
					hasTakeover: true,
					onToggle,
					onSet,
					langTag
				});
			}));
			ctx.effect(() => () => {
				disposeRail();
			});
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map