/** Past this, a wait stops being a pause and becomes worth flagging. */
export declare const WAIT_OVERTIME_MS = 10000;
/**
 * The elapsed seconds of a wait, plus a bar that fills toward the ten-second
 * mark. Lives beside the status label rather than in the reader's own footer,
 * because the group status is what the eye is on while the model works — and it
 * is the only indicator that survives the model emitting its first tool call.
 *
 * Before the mark, the bar reads as progress; after it, the badge says the wait
 * has run long while the seconds keep counting.
 */
export declare function WaitClock({ startTime }: {
    startTime: number | null;
}): import("react").JSX.Element;
//# sourceMappingURL=WaitingClock.d.ts.map