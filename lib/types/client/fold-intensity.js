export const FOLD_INTENSITY_DEFAULT = 1;
/** Level 0: nothing auto-folds. Level 1: current-main choreography. Level 2: process summaries. */
export function foldIntensityOf(state) {
    const rec = state && typeof state === 'object' ? state : {};
    if (rec.foldIntensity === 0 || rec.foldIntensity === 1 || rec.foldIntensity === 2)
        return rec.foldIntensity;
    if (rec.processOnly === true)
        return 2;
    if (rec.autoFold === false)
        return 0;
    return FOLD_INTENSITY_DEFAULT;
}
export function frostedGlassOf(state) {
    if (state && typeof state === 'object' && 'frostedGlass' in state) {
        return state.frostedGlass === true;
    }
    return state === true;
}
/** Bubbles default on: snapshots persisted before the preference read as on. */
export function bubblesOf(state) {
    if (state && typeof state === 'object' && 'bubbles' in state) {
        return state.bubbles !== false;
    }
    return true;
}
export function autoFoldFromIntensity(intensity) {
    return intensity !== 0;
}
export function processOnlyFromIntensity(intensity) {
    return intensity === 2;
}
//# sourceMappingURL=fold-intensity.js.map