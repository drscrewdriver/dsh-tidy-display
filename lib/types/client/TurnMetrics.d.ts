import type { TurnTailChatData } from '@deepseek-ai/dsh-client-ui-chat/client';
type TurnTokenUsage = NonNullable<TurnTailChatData['tokenUsage']>;
export interface TurnMetricsProps {
    usage?: TurnTokenUsage;
    runMs?: number;
    tokensPerSecond?: number;
    ttftMs?: number;
}
export declare const TurnMetrics: import("react").MemoExoticComponent<({ usage, runMs, tokensPerSecond, ttftMs, }: TurnMetricsProps) => import("react").JSX.Element | null>;
export {};
//# sourceMappingURL=TurnMetrics.d.ts.map