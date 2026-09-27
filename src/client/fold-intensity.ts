/** Three-stop fold intensity persisted on `dsh.reader.v1`. Default is standard. */
export type FoldIntensity = 0 | 1 | 2;

export const FOLD_INTENSITY_DEFAULT: FoldIntensity = 1;

/** Level 0: nothing auto-folds. Level 1: current-main choreography. Level 2: process summaries. */
export function foldIntensityOf(state: unknown): FoldIntensity {
  const rec = state && typeof state === 'object' ? state as Record<string, unknown> : {};
  if (rec.foldIntensity === 0 || rec.foldIntensity === 1 || rec.foldIntensity === 2) return rec.foldIntensity;
  if (rec.processOnly === true) return 2;
  if (rec.autoFold === false) return 0;
  return FOLD_INTENSITY_DEFAULT;
}

export function frostedGlassOf(state: unknown): boolean {
  if (state && typeof state === 'object' && 'frostedGlass' in state) {
    return (state as { frostedGlass?: unknown }).frostedGlass === true;
  }
  return state === true;
}

/** Bubbles default on: snapshots persisted before the preference read as on. */
export function bubblesOf(state: unknown): boolean {
  if (state && typeof state === 'object' && 'bubbles' in state) {
    return (state as { bubbles?: unknown }).bubbles !== false;
  }
  return true;
}

export function autoFoldFromIntensity(intensity: FoldIntensity): boolean {
  return intensity !== 0;
}

export function processOnlyFromIntensity(intensity: FoldIntensity): boolean {
  return intensity === 2;
}
