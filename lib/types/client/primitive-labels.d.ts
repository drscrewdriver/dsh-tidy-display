import type { DiffBlockLabels, JsonTreeLabels, MarkdownLabels, ReadBlockLabels, SearchBlockLabels, TerminalBlockLabels, WebBlockLabels } from '@deepseek-ai/dsh-client-ui-primitives';
/**
 * Labels handed to the official content primitives.
 *
 * Every plain string is a getter on purpose: the primitive components keep the
 * object identity around, so resolving through `t()` at property-read time is
 * what lets a mid-session language switch take effect on the next render
 * instead of freezing the copy at module load.
 */
export declare const markdownLabels: MarkdownLabels;
export declare const readBlockLabels: ReadBlockLabels;
export declare const terminalBlockLabels: TerminalBlockLabels;
export declare const diffBlockLabels: DiffBlockLabels;
export declare const searchBlockLabels: SearchBlockLabels;
export declare const webBlockLabels: WebBlockLabels;
export declare const jsonTreeLabels: JsonTreeLabels;
export declare const truncatedJsonLabel: (total: number) => string;
//# sourceMappingURL=primitive-labels.d.ts.map