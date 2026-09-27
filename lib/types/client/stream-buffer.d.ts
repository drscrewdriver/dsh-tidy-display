/** Presentation only. The original session string remains the source of truth. */
export declare const STREAM_TIMING: {
    readonly catchUpMs: 520;
    readonly maxQueuedMs: 600;
    readonly finishMs: 96;
    readonly revealMs: 350;
    readonly minimumRate: 260;
    /** Weight of the newest arrival sample in the smoothed source rate. */
    readonly rateWeight: 0.35;
    /** A longer gap is a pause between runs, not a slow model: keep the estimate. */
    readonly rateGapMs: 250;
};
export declare class StreamBuffer {
    target: string;
    visible: string;
    revision: number;
    private boundaries;
    private arrivals;
    private lastAt;
    private credit;
    private finishAt;
    private rateEwma;
    private lastArrival;
    constructor(initial?: string);
    get pending(): boolean;
    private segment;
    /** Non-append updates, cancellations and hidden/reduced views never replay. */
    update(text: string, now: number, options?: {
        immediate?: boolean;
        finished?: boolean;
    }): void;
    /** Smoothed source rate, so one jittery transport chunk cannot set the pace. */
    private observe;
    flush(): void;
    advance(now: number): boolean;
}
//# sourceMappingURL=stream-buffer.d.ts.map