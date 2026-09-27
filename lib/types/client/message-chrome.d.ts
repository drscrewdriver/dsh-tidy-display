/** Local clock and run-duration labels for reader message chrome. */
/**
 * Elapsed wall time, matching official Chat `duration.minutes` / `duration.seconds`.
 * @param ms - Elapsed milliseconds (negatives clamp to zero).
 */
export declare function formatRunDuration(ms: number): string;
/**
 * Settled-turn duration pill, matching official `message.ranFor`.
 * @param ms - Elapsed milliseconds.
 */
export declare function formatRanFor(ms: number): string;
/**
 * Compact local timestamp. Same calendar day → `HH:mm`; earlier this year →
 * `M月D日 HH:mm`; other years → `YYYY年M月D日 HH:mm`.
 * @param time - Unix epoch ms from the source session event.
 * @param now - Reference instant for the day/year cut.
 */
export declare function formatMessageClock(time: number, now?: number): string;
//# sourceMappingURL=message-chrome.d.ts.map