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
        },
    });
}
//# sourceMappingURL=store.js.map