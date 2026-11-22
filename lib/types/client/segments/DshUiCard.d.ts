export interface DshUiCardProps {
    /** Fence body (mdast code node value — fences already stripped by parse). */
    raw: string;
    streaming: boolean;
    /** Stable per-message-position key; doubles as the GenuiBlock stateKey. */
    segKey: string;
}
export declare const DshUiCard: import("react").MemoExoticComponent<({ raw, streaming, segKey }: DshUiCardProps) => import("react").JSX.Element>;
//# sourceMappingURL=DshUiCard.d.ts.map