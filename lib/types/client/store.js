import { defineStore } from '@deepseek-ai/dsh-client-store';
import { FOLD_INTENSITY_DEFAULT, autoFoldFromIntensity, processOnlyFromIntensity, } from './fold-intensity.js';
function applyFoldIntensity(draft, value) {
    draft.foldIntensity = value;
    draft.autoFold = autoFoldFromIntensity(value);
    draft.processOnly = processOnlyFromIntensity(value);
}
export function createReaderStore() {
    return defineStore({
        init: () => ({
            expanded: {},
            motion: true,
            autoFold: true,
            deliverableOpenMode: 'external',
            foldIntensity: FOLD_INTENSITY_DEFAULT,
            frostedGlass: false,
            bubbles: true,
            processOnly: false,
            railEnabled: true,
            railSide: 'left',
            railStyle: 'bar',
            // Default on: the sheen is the rail's wallpaper-legibility guarantee
            // (the user-facing requirement was "selectable AND visible").
            railRing: true,
            hideOfficialNav: true,
            railColor: 'auto',
            railColorCustom: '',
            railColorLight: 'l3',
            railAccent: 'auto',
            railAccentCustom: '',
            railAccentLight: 'l3',
        }),
        persist: 'dsh.reader.v1',
        actions: {
            setExpanded: (draft, key, value) => { draft.expanded[key] = value; },
            resetExpanded: draft => { draft.expanded = {}; },
            setMotion: (draft, value) => { draft.motion = value; },
            setAutoFold: (draft, value) => {
                applyFoldIntensity(draft, value
                    ? (draft.foldIntensity === 2 ? 2 : 1)
                    : 0);
            },
            setDeliverableOpenMode: (draft, value) => { draft.deliverableOpenMode = value; },
            setFoldIntensity: (draft, value) => { applyFoldIntensity(draft, value); },
            setFrostedGlass: (draft, value) => { draft.frostedGlass = value; },
            setBubbles: (draft, value) => { draft.bubbles = value; },
            setRailEnabled: (draft, value) => { draft.railEnabled = value; },
            setRailSide: (draft, value) => { draft.railSide = value; },
            setRailStyle: (draft, value) => { draft.railStyle = value; },
            setRailRing: (draft, value) => { draft.railRing = value; },
            setHideOfficialNav: (draft, value) => { draft.hideOfficialNav = value; },
            setRailColor: (draft, value) => { draft.railColor = value; },
            setRailColorCustom: (draft, value) => { draft.railColorCustom = value; },
            setRailColorLight: (draft, value) => { draft.railColorLight = value; },
            setRailAccent: (draft, value) => { draft.railAccent = value; },
            setRailAccentCustom: (draft, value) => { draft.railAccentCustom = value; },
            setRailAccentLight: (draft, value) => { draft.railAccentLight = value; },
        },
    });
}
//# sourceMappingURL=store.js.map