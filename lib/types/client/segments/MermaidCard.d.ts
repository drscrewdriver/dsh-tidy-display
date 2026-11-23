export interface MermaidCardProps {
    /** Fence body (mdast code node value / host block text — fences stripped). */
    code: string;
    /** Stable per-message-position key; doubles as the GenuiBlock stateKey. */
    segKey: string;
    /** Render surface owning the mount (`reader:` / `native:`) — namespaced so
     * the two views never share persisted interaction state. */
    channel?: string;
}
export declare const MermaidCard: import("react").MemoExoticComponent<({ code, segKey, channel }: MermaidCardProps) => import("react").JSX.Element | null>;
//# sourceMappingURL=MermaidCard.d.ts.map