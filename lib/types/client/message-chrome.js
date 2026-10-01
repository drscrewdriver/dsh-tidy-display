/** Local clock and run-duration labels for reader message chrome. */
import { t } from './locales.js';
function pad2(n) {
    return String(n).padStart(2, '0');
}
/**
 * Elapsed wall time, matching official Chat `duration.minutes` / `duration.seconds`.
 * @param ms - Elapsed milliseconds (negatives clamp to zero).
 */
export function formatRunDuration(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return minutes > 0
        ? t('time.minutesSeconds', { m: minutes, ss: pad2(seconds) })
        : t('time.seconds', { n: seconds });
}
/**
 * Settled-turn duration pill, matching official `message.ranFor`.
 * @param ms - Elapsed milliseconds.
 */
export function formatRanFor(ms) {
    return t('time.ranFor', { duration: formatRunDuration(ms) });
}
/**
 * Compact local timestamp. Same calendar day → `HH:mm`; earlier this year →
 * `M月D日 HH:mm`; other years → `YYYY年M月D日 HH:mm`.
 * @param time - Unix epoch ms from the source session event.
 * @param now - Reference instant for the day/year cut.
 */
export function formatMessageClock(time, now = Date.now()) {
    const d = new Date(time);
    const n = new Date(now);
    const clock = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    if (d.getFullYear() === n.getFullYear()
        && d.getMonth() === n.getMonth()
        && d.getDate() === n.getDate()) {
        return clock;
    }
    if (d.getFullYear() === n.getFullYear()) {
        return t('date.monthDay', { m: d.getMonth() + 1, d: d.getDate(), clock });
    }
    return t('date.yearMonthDay', { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(), clock });
}
//# sourceMappingURL=message-chrome.js.map