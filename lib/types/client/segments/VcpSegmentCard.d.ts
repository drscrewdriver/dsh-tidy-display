export interface VcpSegmentCardProps {
    /** Closed card HTML, streaming half (pending), or page document. */
    html: string;
    streaming: boolean;
    /** Stable per-message-position key — engine settle memo identity. */
    segKey: string;
    /** Render as a full-page document frame (scoped CSS, 72vh scroll). */
    page?: boolean;
    label?: string;
}
export declare const VcpSegmentCard: import("react").MemoExoticComponent<({ html, streaming, segKey, page, label, }: VcpSegmentCardProps) => import("react").JSX.Element>;
//# sourceMappingURL=VcpSegmentCard.d.ts.map