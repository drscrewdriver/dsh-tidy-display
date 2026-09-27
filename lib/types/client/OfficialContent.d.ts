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
export declare function OfficialTail({ official, owner, produced }: Pick<BlockRenderProps, 'official'> & {
    owner?: TurnTailOwnerProps;
    produced: readonly string[];
}): import("react").JSX.Element | null;
export {};
//# sourceMappingURL=OfficialContent.d.ts.map