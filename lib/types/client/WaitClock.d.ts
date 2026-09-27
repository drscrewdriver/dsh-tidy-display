/** Past this, a wait stops being a pause and reads as the model not answering. */
export declare const WAIT_OVERTIME_MS = 10000;
/**
 * How long the model has been given the turn, counted in plain seconds.
 *
 * Just the number and, past ten seconds, a「暂未响应」badge — no bar, because the
 * question the reader has is「how long has this been hanging」, not「how far
 * along」: there is no known total to be a fraction of.
 *
 * The clock restarts whenever the anchor changes, so each wait is timed from the
 * event that started it rather than from the beginning of the turn.
 */
export declare function WaitClock({ startTime }: {
    startTime: number | null;
}): import("react").JSX.Element;
//# sourceMappingURL=WaitClock.d.ts.map