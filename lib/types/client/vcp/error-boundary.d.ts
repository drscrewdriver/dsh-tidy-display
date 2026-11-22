/**
 * VCP error boundary — ported from dsh-raw-html-v2 lib/client.js 3327-3349.
 * A caught render error degrades THIS card only and never lets the slot/Reader
 * tree abdicate.
 */
import { Component, type ReactNode } from 'react';
interface BoundaryProps {
    children?: ReactNode;
}
interface BoundaryState {
    err: Error | null;
}
export declare class VcpErrorBoundary extends Component<BoundaryProps, BoundaryState> {
    state: BoundaryState;
    static getDerivedStateFromError(err: Error): BoundaryState;
    componentDidCatch(err: Error, info: unknown): void;
    render(): ReactNode;
}
export {};
//# sourceMappingURL=error-boundary.d.ts.map