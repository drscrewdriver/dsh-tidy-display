export declare const StreamMotionContext: import("react").Context<{
    enabled: boolean;
    activatedAt: number;
    paused?: boolean;
    resumed?: boolean;
}>;
export declare function useStreamingText(source: string, streaming: boolean, options: {
    startedAt?: number;
    interrupted: boolean;
    selected: boolean;
}): {
    text: string;
    pending: boolean;
    revision: number;
    formatStreaming: boolean;
    reveal: boolean;
};
//# sourceMappingURL=streaming.d.ts.map