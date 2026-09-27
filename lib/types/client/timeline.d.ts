export interface TimelineItem {
    readonly turn: number;
    readonly prompt: string;
    readonly response: string;
    readonly hasDeliverables: boolean;
    readonly anchor: {
        readonly kind: 'loaded';
        readonly key: string;
    } | {
        readonly kind: 'unloaded';
        readonly seq: number;
    };
}
interface LoadedTurnNavigationItem {
    readonly turn: number;
    readonly anchorKey: string;
    readonly prompt: string;
    readonly response: string;
}
/**
 * Merge host turn outline with loaded navigation items and turn deliverables.
 * Guarantees strictly ascending turn order and dedupes entries.
 */
export declare function mergeTimelineItems(loaded: readonly LoadedTurnNavigationItem[] | undefined, outline: unknown, turnsWithDeliverables?: ReadonlySet<number>): readonly TimelineItem[];
export {};
//# sourceMappingURL=timeline.d.ts.map