import { defineStore } from '@deepseek-ai/dsh-client-store';
export function createRailStore() {
    return defineStore({
        init: () => ({
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
            autoLoad: true,
        }),
        persist: 'dsh.reader.v1',
        actions: {
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
            setAutoLoad: (draft, value) => { draft.autoLoad = value; },
        },
    });
}
//# sourceMappingURL=store.js.map