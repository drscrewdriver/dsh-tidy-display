/** Three-stop fold intensity persisted on `dsh.reader.v1`. Default is standard. */
export type FoldIntensity = 0 | 1 | 2;
export declare const FOLD_INTENSITY_DEFAULT: FoldIntensity;
/** Level 0: nothing auto-folds. Level 1: current-main choreography. Level 2: process summaries. */
export declare function foldIntensityOf(state: unknown): FoldIntensity;
export declare function frostedGlassOf(state: unknown): boolean;
/** Bubbles default on: snapshots persisted before the preference read as on. */
export declare function bubblesOf(state: unknown): boolean;
export declare function autoFoldFromIntensity(intensity: FoldIntensity): boolean;
export declare function processOnlyFromIntensity(intensity: FoldIntensity): boolean;
//# sourceMappingURL=fold-intensity.d.ts.map