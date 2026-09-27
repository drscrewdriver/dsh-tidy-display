import type { ReactNode } from 'react';
import type { ChatSnapshot } from '@deepseek-ai/dsh-client-ui-chat/client';
import type { ReaderProps } from './types.js';
import type { LiveStep, LiveTurnItem } from './live-turn.js';
/** Public projection only. Descendants cannot leak live data through a frozen frame. */
export declare const useFlowChat: ReaderProps['useChat'];
export type PresentationFrame = {
    items: readonly LiveTurnItem[];
    snapshot: ChatSnapshot;
};
export declare function ChoreographedFlow({ frame, motion, enabled, urgent, open, onOpenChange, processOpen, renderStep, id }: {
    frame: PresentationFrame;
    motion: boolean;
    enabled: boolean;
    urgent: boolean;
    open: Readonly<Record<string, boolean>>;
    onOpenChange: (key: string, value: boolean) => void;
    processOpen: boolean;
    renderStep: (step: LiveStep, folded: boolean) => ReactNode;
    id: string;
}): import("react").JSX.Element;
//# sourceMappingURL=ChoreographedFlow.d.ts.map