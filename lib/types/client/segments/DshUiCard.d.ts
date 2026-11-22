export interface DshUiCardProps {
    /** Fence body (mdast code node value — fences already stripped by parse). */
    raw: string;
    streaming: boolean;
    /** Stable per-message-position key; doubles as the GenuiBlock stateKey. */
    segKey: string;
    /** Render surface owning the card — namespaces the durable interaction
     * stateKey so the Reader (`reader:`) and the native-view DOM channel
     * (`native:`) never share persisted component state. Defaults to `reader`. */
    channel?: string;
}
export declare const DshUiCard: import("react").MemoExoticComponent<({ raw, streaming, segKey, channel }: DshUiCardProps) => import("react").JSX.Element>;
//# sourceMappingURL=DshUiCard.d.ts.map