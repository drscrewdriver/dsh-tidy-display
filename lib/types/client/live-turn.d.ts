import type { ChatConversationViewNode } from '@deepseek-ai/dsh-client-ui-chat/client';
import type { AssistantBlock } from '@deepseek-ai/dsh-client-ui-conversation/client';
import type { TurnBoundary } from './projection.js';
import type { ReaderFlowEntry, ToolActivityEntry } from './tool-activity.js';
export type LiveStep = {
    kind: 'reasoning';
    key: string;
    nodeKey: string;
    start: number;
    blocks: AssistantBlock[];
    step: number;
} | {
    kind: 'body';
    key: string;
    nodeKey: string;
    start: number;
    blocks: AssistantBlock[];
    step: number;
} | {
    kind: 'tool';
    key: string;
    entry: ToolActivityEntry;
} | {
    kind: 'user';
    key: string;
    nodeKey: string;
} | {
    kind: 'other';
    key: string;
    nodeKey: string;
};
export type LiveTurnItem = {
    kind: 'user';
    key: string;
    step: Extract<LiveStep, {
        kind: 'user';
    }>;
} | {
    kind: 'fold';
    key: string;
    steps: readonly LiveStep[];
    summary: string;
} | {
    kind: 'open';
    key: string;
    step: LiveStep;
};
export declare function liveFoldEnabled(boundary: TurnBoundary): boolean;
export declare function foldSummary(steps: readonly LiveStep[]): string;
/** One chain: fold only when a new reasoning step has prior body/tool/reasoning. */
export declare function splitChain(chain: readonly LiveStep[]): {
    fold: readonly LiveStep[] | null;
    open: readonly LiveStep[];
};
/** Expand readerFlow into source-ordered live steps using existing block boundaries. */
export declare function segmentLiveTurn(flow: readonly ReaderFlowEntry[], get: (key: string) => ChatConversationViewNode | undefined): LiveStep[];
export declare function presentLiveTurn(steps: readonly LiveStep[], boundary: TurnBoundary, autoFold?: boolean): LiveTurnItem[];
//# sourceMappingURL=live-turn.d.ts.map