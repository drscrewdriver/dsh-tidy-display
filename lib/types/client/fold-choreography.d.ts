import type { LiveStep, LiveTurnItem } from './live-turn.js';
/** Presentation clock, not model/network time. */
export declare const FOLD_TIMING: {
    readonly collapse: 320;
    readonly count: 160;
    readonly settle: 80;
    readonly reveal: 180;
    /**
     * Slack added to every phase deadline before the watchdog forces the next phase.
     *
     * The choreography advances on animation promises and rendered frames. Both are
     * best-effort: a cancelled animation *rejects* and a compositor that never
     * finishes one leaves its promise pending, while a backgrounded tab stops
     * delivering frames. Without a deadline the machine would sit in a non-idle
     * phase forever, and a non-idle phase freezes both the frame source and the text
     * reveal, so the turn would look stuck until a remount. This is the liveness
     * guarantee that does not depend on any of them.
     */
    readonly watchdogSlack: 240;
};
export type FoldPhase = 'idle' | 'collapse' | 'count' | 'settle' | 'reveal';
export type FlowRow = {
    kind: 'summary';
    key: string;
    item: Extract<LiveTurnItem, {
        kind: 'fold';
    }>;
} | {
    kind: 'step';
    key: string;
    step: LiveStep;
    foldKey?: string;
};
/** A step always has the same parent and React key, even when its membership changes. */
export declare function flowRows(items: readonly LiveTurnItem[]): FlowRow[];
export declare function retiringKeys(before: readonly LiveTurnItem[], after: readonly LiveTurnItem[], open: Readonly<Record<string, boolean>>): string[];
/** Insert only new summary slots. Never admit incoming content during shrink. */
export declare function collapseRows(before: readonly LiveTurnItem[], target: readonly LiveTurnItem[]): FlowRow[];
export declare function containsNewUser(before: readonly LiveTurnItem[], after: readonly LiveTurnItem[]): boolean;
//# sourceMappingURL=fold-choreography.d.ts.map