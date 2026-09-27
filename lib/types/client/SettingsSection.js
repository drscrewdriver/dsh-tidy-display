import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
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
const FOLD_STOPS = [
    { value: 0, key: 'foldNone' },
    { value: 1, key: 'foldStandard' },
    { value: 2, key: 'foldSummary' },
];
export function SettingsSection(props) {
    const copy = props.copy ?? settingsCopyFor(props.languageTag);
    const snap = useSyncExternalStore(props.prefs.subscribe, () => props.prefs.getSnapshot() ?? {}, () => ({}));
    const mode = deliverableOpenModeOf(snap.deliverableOpenMode);
    const glass = frostedGlassOf(snap);
    const bubbles = bubblesOf(snap);
    const autoFold = snap.autoFold !== false && snap.foldIntensity !== 0;
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
    return (_jsxs("div", { className: css.section, "data-better-display-settings": true, children: [_jsxs("div", { className: css.row, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: text(props, copy, 'openTitle') }), _jsx("div", { className: css.desc, children: text(props, copy, 'openDescription') })] }), _jsx("button", { type: "button", role: "switch", "aria-checked": on, className: css.switch, "data-on": on || undefined, "data-better-display-open-mode": mode, onClick: () => { setMode(on ? 'external' : 'sidebar'); } })] }), _jsxs("div", { className: css.row, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: text(props, copy, 'glassTitle') }), _jsx("div", { className: css.desc, children: text(props, copy, 'glassDescription') })] }), _jsx("button", { type: "button", role: "switch", "aria-checked": glass, className: css.switch, "data-on": glass || undefined, "data-better-display-glass": glass ? 'on' : 'off', onClick: () => { props.prefs.actions.setFrostedGlass(!glass); } })] }), _jsxs("div", { className: css.row, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: text(props, copy, 'bubbleTitle') }), _jsx("div", { className: css.desc, children: text(props, copy, 'bubbleDescription') })] }), _jsx("button", { type: "button", role: "switch", "aria-checked": bubbles, className: css.switch, "data-on": bubbles || undefined, "data-better-display-bubbles": bubbles ? 'on' : 'off', onClick: () => { props.prefs.actions.setBubbles?.(!bubbles); } })] }), _jsxs("div", { className: css.row, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: text(props, copy, 'foldTitle') }), _jsx("div", { className: css.desc, children: text(props, copy, 'foldDescription') })] }), _jsx("button", { type: "button", role: "switch", "aria-checked": autoFold, className: css.switch, "data-on": autoFold || undefined, "data-better-display-auto-fold": autoFold ? 'on' : 'off', onClick: () => {
                            props.prefs.actions.setAutoFold?.(!autoFold);
                            props.prefs.actions.setFoldIntensity?.(!autoFold ? 1 : 0);
                        } })] }), _jsxs("section", { className: css.block, "data-better-display-skill": skill?.installed ? 'installed' : 'missing', children: [_jsx("div", { className: css.title, children: text(props, copy, 'skillTitle') }), _jsx("div", { className: css.status, children: _jsx("span", { className: css.badge, "data-ok": skill?.installed || undefined, children: skill?.installed ? text(props, copy, 'skillInstalled') : text(props, copy, 'skillMissing') }) }), _jsx("p", { className: css.desc, children: text(props, copy, 'skillPurpose') }), _jsx("p", { className: css.desc, children: text(props, copy, 'skillPluginNote') }), skill && !skill.installed ? (_jsxs(_Fragment, { children: [_jsx("p", { className: css.desc, children: skill.hostReached ? text(props, copy, 'skillInstall') : text(props, copy, 'skillUnavailable') }), _jsx("pre", { className: css.pre, children: shortestInstallCommand() }), _jsx("ul", { className: css.roots, "data-better-display-skill-roots": true, children: CONVENTIONAL_SKILL_ROOTS.map(root => (_jsx("li", { children: root }, root))) })] })) : null, _jsx("div", { className: css.actions, children: _jsx("button", { type: "button", className: css.button, disabled: checking, onClick: () => { void recheck(); }, children: checking ? text(props, copy, 'skillChecking') : text(props, copy, 'skillRecheck') }) })] })] }));
}
//# sourceMappingURL=SettingsSection.js.map