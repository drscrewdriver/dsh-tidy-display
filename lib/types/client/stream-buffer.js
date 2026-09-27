/** Presentation only. The original session string remains the source of truth. */
// The reveal runs at the rate the source is actually producing (feed-forward)
// plus a proportional term that closes whatever backlog jitter left behind.
// A proportional-only controller drains exactly one window per window, so the
// display trails live output by catchUpMs forever — unreadable-but-smooth at
// 75 chars/s, permanently behind at 1000. The feed-forward term is what makes
// the pace adapt to the model instead of to a fixed constant.
export const STREAM_TIMING = {
    catchUpMs: 520,
    maxQueuedMs: 600,
    finishMs: 96,
    revealMs: 350,
    minimumRate: 260,
    /** Weight of the newest arrival sample in the smoothed source rate. */
    rateWeight: 0.35,
    /** A longer gap is a pause between runs, not a slow model: keep the estimate. */
    rateGapMs: 250,
};
const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
function atOrAfter(values, target) {
    let low = 0;
    let high = values.length - 1;
    while (low < high) {
        const middle = (low + high) >>> 1;
        if (values[middle] < target)
            low = middle + 1;
        else
            high = middle;
    }
    return low;
}
export class StreamBuffer {
    target;
    visible;
    revision = 0;
    boundaries = [0];
    arrivals = [];
    lastAt = null;
    credit = 0;
    finishAt = null;
    rateEwma = 0;
    lastArrival = null;
    constructor(initial = '') {
        this.target = initial;
        this.visible = initial;
        this.segment(0);
    }
    get pending() { return this.visible.length < this.target.length; }
    segment(from) {
        const index = atOrAfter(this.boundaries, from);
        this.boundaries.length = index;
        for (const part of graphemes.segment(this.target.slice(from)))
            this.boundaries.push(from + part.index);
        if (this.boundaries.at(-1) !== this.target.length)
            this.boundaries.push(this.target.length);
    }
    /** Non-append updates, cancellations and hidden/reduced views never replay. */
    update(text, now, options = {}) {
        if (options.immediate || !text.startsWith(this.target)) {
            if (text !== this.target)
                this.revision++;
            this.target = text;
            this.flush();
            this.boundaries = [0];
            this.segment(0);
            return;
        }
        if (text !== this.target) {
            const wasPending = this.pending;
            const grew = text.length - this.target.length;
            const from = this.boundaries.at(-2) ?? 0;
            this.observe(grew, now);
            this.target = text;
            // Re-segment the previous last cluster: an emoji/combining sequence can
            // itself span transport chunks. Frozen source prefixes are not scanned.
            this.segment(from);
            this.arrivals.push({ end: text.length, at: now });
            if (!wasPending) {
                this.lastAt = now;
                this.credit = 0;
            }
        }
        if (options.finished && this.finishAt === null)
            this.finishAt = now + STREAM_TIMING.finishMs;
        if (!options.finished)
            this.finishAt = null;
        if (this.target.length - this.visible.length > 8192) {
            this.revision++;
            this.flush();
        }
    }
    /** Smoothed source rate, so one jittery transport chunk cannot set the pace. */
    observe(grew, now) {
        const previous = this.lastArrival;
        this.lastArrival = now;
        if (previous === null || grew <= 0)
            return;
        const elapsed = now - previous;
        if (elapsed <= 0 || elapsed > STREAM_TIMING.rateGapMs)
            return;
        const sample = grew * 1000 / elapsed;
        this.rateEwma = this.rateEwma === 0
            ? sample
            : this.rateEwma * (1 - STREAM_TIMING.rateWeight) + sample * STREAM_TIMING.rateWeight;
    }
    flush() {
        this.visible = this.target;
        this.arrivals = [];
        this.credit = 0;
        this.lastAt = null;
        this.lastArrival = null;
        this.finishAt = null;
    }
    advance(now) {
        if (!this.pending)
            return false;
        const before = this.visible.length;
        const index = atOrAfter(this.boundaries, before);
        const remaining = this.boundaries.length - index - 1;
        const delta = Math.max(0, now - (this.lastAt ?? now));
        this.lastAt = now;
        const windowMs = this.finishAt === null ? STREAM_TIMING.catchUpMs : Math.max(16, Math.min(STREAM_TIMING.catchUpMs, this.finishAt - now));
        // Feed-forward keeps pace with the source; the proportional term then drains
        // whatever backlog is left, so lag decays instead of settling at one window.
        const rate = Math.max(STREAM_TIMING.minimumRate, this.rateEwma + remaining * 1000 / windowMs);
        this.credit += rate * delta / 1000;
        const count = Math.floor(this.credit);
        this.credit -= count;
        let end = this.boundaries[Math.min(this.boundaries.length - 1, index + count)];
        for (const item of this.arrivals) {
            if (now - item.at < STREAM_TIMING.maxQueuedMs)
                break;
            end = Math.max(end, this.boundaries[atOrAfter(this.boundaries, item.end)]);
        }
        if (this.finishAt !== null && now >= this.finishAt)
            end = this.target.length;
        // Never expose half of a surrogate pair while the source can still grow.
        if (end && /[\uD800-\uDBFF]/.test(this.target[end - 1]) && this.finishAt === null)
            end--;
        end = Math.max(before, end);
        this.visible = this.target.slice(0, end);
        this.arrivals = this.arrivals.filter(item => item.end > end);
        if (!this.pending) {
            this.credit = 0;
            this.lastAt = null;
        }
        return end !== before;
    }
}
//# sourceMappingURL=stream-buffer.js.map