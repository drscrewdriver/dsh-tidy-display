import type { LiveStep } from './live-turn.js';
/** Keep process counts discoverable after the live-fold presentation retires. */
export declare function ClosedProcessSummary({ steps, open, onChange, controls }: {
    steps: readonly LiveStep[];
    open: boolean;
    onChange: (value: boolean) => void;
    controls: string;
}): import("react").JSX.Element | null;
//# sourceMappingURL=ClosedProcessSummary.d.ts.map