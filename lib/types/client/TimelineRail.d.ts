import type { TimelineItem } from './timeline.js';
interface TimelineRailProps {
    items: readonly TimelineItem[];
    activeTurn: number | null;
    busyTurn?: number | null;
    onNavigate: (item: TimelineItem) => void;
}
export declare const TimelineRail: import("react").MemoExoticComponent<({ items, activeTurn, busyTurn, onNavigate, }: TimelineRailProps) => import("react").JSX.Element | null>;
export {};
//# sourceMappingURL=TimelineRail.d.ts.map