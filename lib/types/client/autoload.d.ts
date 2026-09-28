/**
 * Smart AutoLoad Governor, ported from dsh-tidychat (compat/0.1.5 line).
 *
 * Internal budget is TIME, not row counts, so the behavior is self-consistent
 * across machines: keep clicking the host "load earlier" button until the
 * per-page processing cost (measured after each settled batch) exceeds a soft
 * budget twice-ish or the hard budget once — then pause with a hint instead of
 * wedging the tab.
 *
 * Adaptations vs the tidychat original:
 * - no fold surgery / divider to measure; the measured scan is the rail
 *   refresh notification (`onSettle`), which is the real per-page cost here;
 * - session scoping is replaced by scroll-container identity: when the host
 *   swaps the conversation column, the governor resets (old async callbacks
 *   are fenced out by a generation counter, same as the original).
 */
export declare const SOFT_BUDGET_MS = 30;
export declare const HARD_BUDGET_MS = 50;
export type GovernorStatus = 'idle' | 'loading' | 'settling' | 'paused' | 'done';
export interface AutoLoadState {
    generation: number;
    status: GovernorStatus;
    consecutiveSlow: number;
    nullStreak: number;
}
export interface AutoLoadOptions {
    /** Conversation scroll container (identity changes reset the governor). */
    getRoot: () => Element | null;
    /** Master switch (settings), polled every cycle. */
    isEnabled: () => boolean;
    /** Rail refresh after each settled page; its duration is the measured cost. */
    onSettle?: () => void;
}
export declare function findLoadOlderButton(): HTMLButtonElement | null;
export declare function startAutoLoad(opts: AutoLoadOptions): () => void;
//# sourceMappingURL=autoload.d.ts.map