import type { ReactNode } from 'react';
export interface SegmentCardProps {
    label: string;
    /** Status chip after the label (e.g. 沙箱 / 校验失败). */
    badge?: string | null;
    badgeTone?: 'info' | 'error';
    /** Streaming placeholder mode: renders a pulsing row, ignores children. */
    streaming?: boolean;
    streamingLabel?: string;
    /** Degraded mode: reason line under the title. */
    error?: string | null;
    /** Degraded mode: raw source folded under the title. */
    source?: string;
    /** Initial source-fold open state; callers pass `!cardCollapseDefault`. */
    sourceInitiallyOpen?: boolean;
    /** Rendered content (ok mode). */
    children?: ReactNode;
}
export declare const SegmentCard: import("react").MemoExoticComponent<({ label, badge, badgeTone, streaming, streamingLabel, error, source, sourceInitiallyOpen, children, }: SegmentCardProps) => import("react").JSX.Element>;
//# sourceMappingURL=SegmentCard.d.ts.map