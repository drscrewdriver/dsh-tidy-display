/** Motion parameters from the public transitions.dev streaming-text recipe. */
export declare const WORD_MOTION: {
    readonly duration: 350;
    readonly gap: 60;
    readonly blur: 1;
    readonly easing: "cubic-bezier(0.22, 1, 0.36, 1)";
    readonly maxDelay: 240;
    /** Floor for the per-word cadence once a batch is compressed. */
    readonly minGap: 3;
    /** One paint's words should land inside this window, however many arrive. */
    readonly batchMs: 90;
};
export interface RevealingWord {
    key: number;
    text: string;
    born: number | null;
}
/** Source-offset identity survives reparsing, frozen blocks, and final formatting. */
export declare class WordTimeline {
    generation: number;
    hasLiveText: boolean;
    private source;
    private enabled;
    private revision;
    private floor;
    private lastBirth;
    private readonly births;
    begin(source: string, enabled: boolean, revision: number, now: number): void;
    bornAt(offset: number): number | null;
    words(value: string, offset: number): RevealingWord[];
}
//# sourceMappingURL=word-timeline.d.ts.map