/**
 * Core pure functions for SEP-1865 / MCP Apps integration.
 * Free of CSS module imports so it can be cleanly tested in Node test environments.
 */
export declare function getHostTheme(): 'dark' | 'light';
export declare function getCssTokens(theme: 'dark' | 'light'): Record<string, string>;
/**
 * Extracts a title from the HTML document's <title> tag.
 */
export declare function extractHtmlTitle(html: string): string | undefined;
/**
 * Normalizes user/model generated HTML to ensure a valid HTML5 structure
 * and embeds a dynamic theme listener so dark/light mode switches take effect immediately.
 */
export declare function ensureHtmlDocument(rawHtml: string, initialTheme?: 'dark' | 'light'): string;
/**
 * Determines whether a markdown code block represents an MCP App.
 */
export declare function isMcpAppCodeBlock(lang: string | null | undefined, meta: string | null | undefined, value: string): boolean;
/**
 * Extracts a title from code block meta or HTML content.
 */
export declare function extractMcpAppTitle(meta: string | null | undefined, value: string): string | undefined;
/**
 * Extracts an explicit height budget from code block meta (e.g. height=600 or height="500px").
 */
export declare function extractMcpAppHeight(meta: string | null | undefined): number | undefined;
/**
 * Formats a user-submitted MCP App event into a concise, natural language conversational prompt.
 * Avoids raw multiline JSON and excessive whitespace.
 */
export declare function formatReceiptPrompt(params: Record<string, unknown>, title?: string): string;
/**
 * Finds the DSH composer textarea. The page can contain multiple (hidden)
 * textareas, so prefer a visible, enabled one carrying the input-bar
 * `data-phase` marker; fall back to the tallest visible, then any enabled.
 */
export declare function findComposerTextarea(doc?: Document): HTMLTextAreaElement | null;
/**
 * DOM fallback for composer fill: types into the Lexical contenteditable
 * surface (`[data-composer-input]`) via execCommand insertText so the editor
 * adopts the change as a genuine user edit. Returns true when accepted.
 */
export declare function fillComposerDom(text: string, doc?: Document): boolean;
/**
 * Updates a React-controlled textarea and properly notifies React's valueTracker
 * so the backdrop and input state immediately reflect the text.
 */
export declare function setReactInputValue(textarea: HTMLTextAreaElement, value: string): void;
//# sourceMappingURL=mcp-app.d.ts.map