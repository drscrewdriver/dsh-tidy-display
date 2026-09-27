import type { ToolCallBlock } from '@deepseek-ai/dsh-client-ui-conversation/client';
import type { ToolActivityEntry } from './tool-activity.js';
import type { BlockRenderProps } from './types.js';
/** One occurrence, keyed by call id all the way from generation to result. */
export declare const ToolActivity: import("react").MemoExoticComponent<({ entry, motion, turnClosed, onRead, depth, ...render }: BlockRenderProps & {
    entry: ToolActivityEntry;
    motion: boolean;
    turnClosed: boolean;
    onRead: () => void;
    depth?: number;
}) => import("react").JSX.Element>;
/** Rich media (images, MCP widgets) rendered outside the folded tool ledger. */
export declare function ToolMedia({ block, depth, ...render }: BlockRenderProps & {
    block: ToolCallBlock;
    depth?: number;
}): import("react").JSX.Element | null;
//# sourceMappingURL=ToolActivity.d.ts.map