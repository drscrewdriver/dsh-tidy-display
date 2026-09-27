import type { LiveStep } from './live-turn.js';
/**
 * Line counts for everything a folded run of steps changed.
 *
 * A run that touched no files renders nothing, so an ordinary process digest is
 * unchanged. Clicking the counts opens the same diff surface the official tool
 * row uses — one file at a time, red removed / green added, expandable.
 */
export declare function DiffStat({ steps, label }: {
    steps: readonly LiveStep[];
    label: string;
}): import("react").JSX.Element | null;
//# sourceMappingURL=DiffPanel.d.ts.map