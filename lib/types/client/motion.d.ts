import type { ReactNode, RefObject } from 'react';
export declare function useMotionAllowed(enabled: boolean): boolean;
export declare function usePinnedSelection(root: RefObject<HTMLElement>, selector?: string): readonly string[];
export declare function StatusText({ text, motion, shimmer }: {
    text: string;
    motion: boolean;
    shimmer?: boolean;
}): import("react").JSX.Element;
export declare function Disclosure({ open, onChange, label, controls, buttonRef, ariaLabel }: {
    open: boolean;
    onChange: (value: boolean) => void;
    label: ReactNode;
    controls?: string;
    buttonRef: RefObject<HTMLButtonElement>;
    ariaLabel?: string;
}): import("react").JSX.Element;
/** Supplemental details stay in source order beside their own narration. */
export declare function ProcessFragment({ open, motion, onRead, returnFocusTo, nodeKey, children, framed }: {
    open: boolean;
    motion: boolean;
    onRead: () => void;
    nodeKey: string;
    returnFocusTo: RefObject<HTMLElement>;
    children: ReactNode;
    framed?: boolean;
}): import("react").JSX.Element | null;
/** Retire only narration that was actually visible; historical rows stay folded. */
export declare function RetiringContent({ visible, children }: {
    visible: boolean;
    children: ReactNode;
}): import("react").JSX.Element | null;
export declare function useReadingScroll(root: RefObject<HTMLElement>, motion: boolean): {
    detached: boolean;
    jump: () => void;
    /** Stop tail-follow so a rail landing is not pulled back to the live bottom. */
    release: () => void;
};
//# sourceMappingURL=motion.d.ts.map