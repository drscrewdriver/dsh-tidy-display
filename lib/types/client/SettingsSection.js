import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { parseRgba } from './rail/colors.js';
import { bubblesOf, frostedGlassOf } from './fold-intensity.js';
import { deliverableOpenModeOf } from './open-file.js';
import { settingsCopyFor } from './settings-copy.js';
import { CONVENTIONAL_SKILL_ROOTS, detectGenerativeMcpappsSkill, shortestInstallCommand } from './skill-status.js';
import css from './SettingsSection.module.css';
function text(props, copy, key) {
    if (typeof props.t === 'function') {
        try {
            const value = props.t(key);
            if (typeof value === 'string' && value.length > 0 && value !== key)
                return value;
        }
        catch {
            // Fall through to the bundled dictionaries.
        }
    }
    return copy[key];
}
function Chip({ on, swatch, onClick, children }) {
    return (_jsxs("button", { type: "button", "aria-pressed": on, className: css.button, style: on ? { outline: '2px solid var(--dsw-alias-state-business-primary)', outlineOffset: 0 } : undefined, onClick: onClick, children: [swatch !== undefined && (_jsx("span", { style: { display: 'inline-block', width: 10, height: 10, borderRadius: 5, background: swatch, marginRight: 6, verticalAlign: 'middle', border: '1px solid rgba(128,128,128,.4)' } })), children] }));
}
function rgbaToHex(value) {
    const rgba = parseRgba(value);
    if (rgba === null)
        return '#3b82f6';
    return '#' + rgba.slice(0, 3).map((v) => v.toString(16).padStart(2, '0')).join('');
}
const cssColor = (rgb, a) => a >= 1
    ? '#' + rgb.slice(0, 3).map((n) => Math.round(n).toString(16).padStart(2, '0')).join('')
    : 'rgba(' + Math.round(rgb[0]) + ', ' + Math.round(rgb[1]) + ', ' + Math.round(rgb[2]) + ', ' + (Math.round(a * 1000) / 1000) + ')';
/**
 * 调色盘（同 tidychat 75743fd 的设计）：自动 / 自定义二选一。
 * 自定义 = 原生取色器（无极调色）+ HEX/RGB 文本 + 透明度滑杆，实时色块预览。
 */
function RailColorPicker(props) {
    const customOn = props.mode === 'custom';
    const parsed = parseRgba(props.custom);
    const rgb = parsed === null ? [59, 130, 246] : [parsed[0], parsed[1], parsed[2]];
    const alpha = parsed === null ? 1 : parsed[3];
    const swatch = parsed !== null ? cssColor(rgb, alpha) : 'linear-gradient(135deg, #f87171, #60a5fa, #4ade80)';
    const inputStyle = { flex: 1, minWidth: 0, textAlign: 'left', color: 'var(--dsw-alias-label-primary, inherit)' };
    return (_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: props.title }), _jsxs("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }, children: [_jsx(Chip, { on: !customOn, onClick: () => props.setMode('auto'), children: props.autoLabel }), _jsx(Chip, { on: customOn, swatch: swatch, onClick: () => props.setMode('custom'), children: props.customLabel })] }), customOn && (_jsxs("div", { style: { display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }, children: [_jsx("input", { type: "color", value: rgbaToHex(props.custom), "aria-label": props.title, style: { width: 34, height: 26, border: 'none', background: 'none', padding: 0, cursor: 'pointer' }, onChange: (event) => {
                            const p = parseRgba(event.target.value);
                            if (p !== null)
                                props.setCustom(cssColor([p[0], p[1], p[2]], alpha));
                        } }), _jsx("input", { type: "text", className: css.button, value: props.custom, placeholder: "#3b82f6 / rgb(59,130,246)", spellCheck: false, style: inputStyle, onChange: (event) => props.setCustom(event.target.value) }), _jsx("input", { type: "range", min: 0, max: 100, step: 1, value: Math.round(alpha * 100), "aria-label": props.title + ' 透明度', style: { width: 90, accentColor: 'var(--dsw-alias-state-business-primary, #3b82f6)' }, onChange: (event) => props.setCustom(cssColor(rgb, Number(event.target.value) / 100)) }), _jsxs("span", { className: css.desc, style: { minWidth: 34, textAlign: 'right' }, children: [Math.round(alpha * 100), "%"] })] }))] }));
}
export function SettingsSection(props) {
    const copy = props.copy ?? settingsCopyFor(props.languageTag);
    const snap = useSyncExternalStore(props.prefs.subscribe, () => props.prefs.getSnapshot() ?? {}, () => ({}));
    const mode = deliverableOpenModeOf(snap.deliverableOpenMode);
    const glass = frostedGlassOf(snap);
    const bubbles = bubblesOf(snap);
    const autoFold = snap.autoFold !== false && snap.foldIntensity !== 0;
    const railOn = snap.railEnabled !== false;
    const railSide = snap.railSide === 'right' ? 'right' : 'left';
    const railStyle = snap.railStyle === 'dot' ? 'dot' : 'bar';
    const railRing = snap.railRing === true;
    const takeover = snap.hideOfficialNav !== false;
    const setMode = (value) => {
        props.prefs.actions.setDeliverableOpenMode(value);
    };
    const on = mode === 'sidebar';
    const [skill, setSkill] = useState();
    const [checking, setChecking] = useState(false);
    const recheck = useCallback(async () => {
        setChecking(true);
        try {
            setSkill(await detectGenerativeMcpappsSkill(props.checkSkill));
        }
        catch {
            setSkill({
                name: 'generative-mcpapps',
                installed: false,
                via: null,
                roots: [],
                hostReached: false,
            });
        }
        finally {
            setChecking(false);
        }
    }, [props.checkSkill]);
    useEffect(() => { void recheck(); }, [recheck]);
    return (_jsxs("div", { className: css.section, "data-tidy-display-settings": true, children: [_jsxs("div", { className: css.row, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: text(props, copy, 'openTitle') }), _jsx("div", { className: css.desc, children: text(props, copy, 'openDescription') })] }), _jsx("button", { type: "button", role: "switch", "aria-checked": on, className: css.switch, "data-on": on || undefined, "data-tidy-display-open-mode": mode, onClick: () => { setMode(on ? 'external' : 'sidebar'); } })] }), _jsxs("div", { className: css.row, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: text(props, copy, 'glassTitle') }), _jsx("div", { className: css.desc, children: text(props, copy, 'glassDescription') })] }), _jsx("button", { type: "button", role: "switch", "aria-checked": glass, className: css.switch, "data-on": glass || undefined, "data-tidy-display-glass": glass ? 'on' : 'off', onClick: () => { props.prefs.actions.setFrostedGlass(!glass); } })] }), _jsxs("div", { className: css.row, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: text(props, copy, 'bubbleTitle') }), _jsx("div", { className: css.desc, children: text(props, copy, 'bubbleDescription') })] }), _jsx("button", { type: "button", role: "switch", "aria-checked": bubbles, className: css.switch, "data-on": bubbles || undefined, "data-tidy-display-bubbles": bubbles ? 'on' : 'off', onClick: () => { props.prefs.actions.setBubbles?.(!bubbles); } })] }), _jsxs("div", { className: css.row, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: text(props, copy, 'foldTitle') }), _jsx("div", { className: css.desc, children: text(props, copy, 'foldDescription') })] }), _jsx("button", { type: "button", role: "switch", "aria-checked": autoFold, className: css.switch, "data-on": autoFold || undefined, "data-tidy-display-auto-fold": autoFold ? 'on' : 'off', onClick: () => {
                            props.prefs.actions.setAutoFold?.(!autoFold);
                            props.prefs.actions.setFoldIntensity?.(!autoFold ? 1 : 0);
                        } })] }), _jsxs("div", { className: css.row, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: text(props, copy, 'railTitle') }), _jsx("div", { className: css.desc, children: text(props, copy, 'railDescription') })] }), _jsx("button", { type: "button", role: "switch", "aria-checked": railOn, className: css.switch, "data-on": railOn || undefined, "data-tidy-display-rail": railOn ? 'on' : 'off', onClick: () => { props.prefs.actions.setRailEnabled?.(!railOn); } })] }), _jsxs("div", { className: css.row, children: [_jsx("div", { className: css.rowText, children: _jsx("div", { className: css.title, children: text(props, copy, 'railSide') }) }), _jsxs("div", { className: css.actions, children: [_jsx("button", { type: "button", className: css.button, "aria-pressed": railSide === 'left', onClick: () => { props.prefs.actions.setRailSide?.('left'); }, children: text(props, copy, 'railSideLeft') }), _jsx("button", { type: "button", className: css.button, "aria-pressed": railSide === 'right', onClick: () => { props.prefs.actions.setRailSide?.('right'); }, children: text(props, copy, 'railSideRight') })] })] }), _jsxs("div", { className: css.row, children: [_jsx("div", { className: css.rowText, children: _jsx("div", { className: css.title, children: text(props, copy, 'railStyle') }) }), _jsxs("div", { className: css.actions, children: [_jsx("button", { type: "button", className: css.button, "aria-pressed": railStyle === 'bar', onClick: () => { props.prefs.actions.setRailStyle?.('bar'); }, children: text(props, copy, 'railStyleBar') }), _jsx("button", { type: "button", className: css.button, "aria-pressed": railStyle === 'dot', onClick: () => { props.prefs.actions.setRailStyle?.('dot'); }, children: text(props, copy, 'railStyleDot') })] })] }), _jsxs("div", { className: css.row, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: text(props, copy, 'railRingTitle') }), _jsx("div", { className: css.desc, children: text(props, copy, 'railRingDescription') })] }), _jsx("button", { type: "button", role: "switch", "aria-checked": railRing, className: css.switch, "data-on": railRing || undefined, "data-tidy-display-rail-ring": railRing ? 'on' : 'off', onClick: () => { props.prefs.actions.setRailRing?.(!railRing); } })] }), _jsx("div", { className: css.row, children: _jsx(RailColorPicker, { title: text(props, copy, 'colorBarTitle'), mode: snap.railColor ?? 'auto', custom: snap.railColorCustom ?? '', autoLabel: text(props, copy, 'colorAuto'), customLabel: text(props, copy, 'colorCustom'), setMode: (v) => props.prefs.actions.setRailColor?.(v), setCustom: (v) => props.prefs.actions.setRailColorCustom?.(v) }) }), _jsx("div", { className: css.row, children: _jsx(RailColorPicker, { title: text(props, copy, 'colorAccentTitle'), mode: snap.railAccent ?? 'auto', custom: snap.railAccentCustom ?? '', autoLabel: text(props, copy, 'colorAuto'), customLabel: text(props, copy, 'colorCustom'), setMode: (v) => props.prefs.actions.setRailAccent?.(v), setCustom: (v) => props.prefs.actions.setRailAccentCustom?.(v) }) }), _jsxs("div", { className: css.row, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: text(props, copy, 'takeoverTitle') }), _jsx("div", { className: css.desc, children: text(props, copy, 'takeoverDescription') })] }), _jsx("button", { type: "button", role: "switch", "aria-checked": takeover, className: css.switch, "data-on": takeover || undefined, "data-tidy-display-takeover": takeover ? 'on' : 'off', onClick: () => { props.prefs.actions.setHideOfficialNav?.(!takeover); } })] }), _jsxs("section", { className: css.block, "data-tidy-display-skill": skill?.installed ? 'installed' : 'missing', children: [_jsx("div", { className: css.title, children: text(props, copy, 'skillTitle') }), _jsx("div", { className: css.status, children: _jsx("span", { className: css.badge, "data-ok": skill?.installed || undefined, children: skill?.installed ? text(props, copy, 'skillInstalled') : text(props, copy, 'skillMissing') }) }), _jsx("p", { className: css.desc, children: text(props, copy, 'skillPurpose') }), _jsx("p", { className: css.desc, children: text(props, copy, 'skillPluginNote') }), skill && !skill.installed ? (_jsxs(_Fragment, { children: [_jsx("p", { className: css.desc, children: skill.hostReached ? text(props, copy, 'skillInstall') : text(props, copy, 'skillUnavailable') }), _jsx("pre", { className: css.pre, children: shortestInstallCommand() }), _jsx("ul", { className: css.roots, "data-tidy-display-skill-roots": true, children: CONVENTIONAL_SKILL_ROOTS.map(root => (_jsx("li", { children: root }, root))) })] })) : null, _jsx("div", { className: css.actions, children: _jsx("button", { type: "button", className: css.button, disabled: checking, onClick: () => { void recheck(); }, children: checking ? text(props, copy, 'skillChecking') : text(props, copy, 'skillRecheck') }) })] })] }));
}
//# sourceMappingURL=SettingsSection.js.map