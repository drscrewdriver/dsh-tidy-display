import { type ReactNode } from 'react';
import type { ChatConversationViewNode, TurnTailOwnerProps } from '@deepseek-ai/dsh-client-ui-chat/client';
import type { ToolCallBlock } from '@deepseek-ai/dsh-client-ui-conversation/client';
import type { AssistantActionOwnerProps } from '@deepseek-ai/dsh-client-ui-chat/client';
type MessageId = AssistantActionOwnerProps['messageId'];
import type { BlockRenderProps } from './types.js';
export declare function OfficialActions({ official, messageId }: Pick<BlockRenderProps, 'official'> & {
    messageId?: MessageId;
}): import("react").JSX.Element | null;
export declare function OfficialTool({ official, block, toolName, cwd, openFile, fallback }: BlockRenderProps & {
    official: NonNullable<BlockRenderProps['official']>;
    block: ToolCallBlock;
    toolName: string;
    fallback: ReactNode;
}): import("react").JSX.Element;
export declare function OfficialNode({ node, fallback, ...render }: BlockRenderProps & {
    node: ChatConversationViewNode;
    fallback: ReactNode;
}): string | number | boolean | Iterable<ReactNode> | import("react").JSX.Element | null | undefined;
/**
 * Render one assistant-step node through the official mirror seat. Only an
 * external shadow takeover (negative priority) is mirrored there; the host's own
 * assistant-step entry is filtered out, so the default path renders nothing and
 * the Reader keeps its own segmentation.
 */
export declare function AssistantStepDelegation({ node, ...render }: BlockRenderProps & {
    node: ChatConversationViewNode;
}): import("react").JSX.Element | null;
export declare function OfficialTail({ official, owner, produced }: Pick<BlockRenderProps, 'official'> & {
    owner?: TurnTailOwnerProps;
    produced: readonly string[];
}): import("react").JSX.Element | null;
export {};
//# sourceMappingURL=OfficialContent.d.ts.map