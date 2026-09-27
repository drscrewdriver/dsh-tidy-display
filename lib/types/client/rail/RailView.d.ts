import * as React from 'react';
/**
 * Canvas message rail, ported from dsh-tidychat (release/0.1.7, white-sheen
 * ring edition). DOM single source of truth: identity/count/order come from
 * conversation rows carrying the host anchor contract (data-chat-anchor-key +
 * data-chat-flow-kind, present on native ChatView rows and on reader rows
 * since the anchor-contract fix). Port adjustments vs the tidychat original:
 * - config comes in as props from the reader store (no settings namespace)
 * - "load earlier" goes through the reader's own loadOlder (no button sniffing)
 * - summaries use the row-text fallback only (the event-source enhancement is
 *   a tidychat-side refinement, deferred); time is omitted until then.
 */
export type RailSide = 'left' | 'right';
export type RailStyle = 'bar' | 'dot';
export declare function RailView({ enabled, side, style: railStyle, ring, hasMore, loadOlder }: {
    enabled: boolean;
    side: RailSide;
    style: RailStyle;
    ring: boolean;
    hasMore: boolean;
    loadOlder: () => void | Promise<void>;
}): React.ReactElement | null;
//# sourceMappingURL=RailView.d.ts.map