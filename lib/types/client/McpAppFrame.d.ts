/**
 * Composer fill channel shared by every McpAppFrame in one Reader tree.
 * Provided by Blocks from the session-scoped Reader face (sanctioned
 * conversation input API); absent outside a Reader, where the DOM fallback
 * applies. React context avoids threading the callback through the whole
 * markdown pipeline (MarkdownText -> render context -> code fence).
 */
export type ComposerFill = (text: string) => boolean;
export declare const ComposerFillContext: import("react").Context<ComposerFill | undefined>;
export declare function useComposerFill(): ComposerFill | undefined;
export interface McpAppFrameProps {
    html: string;
    title?: string;
    initialHeight?: number;
    /** Session-scoped composer writer; falls back to context, then DOM. */
    fillComposer?: ComposerFill;
}
export declare const McpAppFrame: import("react").MemoExoticComponent<({ html, title: initialTitle, initialHeight, fillComposer: fillComposerProp, }: McpAppFrameProps) => import("react").JSX.Element>;
/**
 * Markdown code-fence mount point: picks the session composer writer from
 * React context (provided by Blocks) without changing the markdown
 * pipeline's signatures.
 */
export declare function McpAppCodeBlock({ html, title, initialHeight }: {
    html: string;
    title?: string;
    initialHeight?: number;
}): import("react").JSX.Element;
export declare function StreamingMcpAppPlaceholder({ title }: {
    title?: string;
}): import("react").JSX.Element;
//# sourceMappingURL=McpAppFrame.d.ts.map