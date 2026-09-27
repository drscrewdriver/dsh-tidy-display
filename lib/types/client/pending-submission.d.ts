/** Official PendingSubmission.images is optional at runtime; text-only sends omit it. */
export interface PendingSubmissionImage {
    readonly previewUrl: string;
    readonly width?: number;
    readonly height?: number;
    readonly name?: string;
}
export interface PendingSubmissionLike {
    readonly images?: readonly PendingSubmissionImage[] | null;
    readonly attachments?: readonly {
        readonly type?: string;
        readonly value?: PendingSubmissionImage;
    }[] | null;
}
export interface PendingSubmissionEcho extends PendingSubmissionLike {
    readonly requestId: string;
    readonly text?: string;
    readonly time?: number;
    readonly placement?: string;
}
export declare function asReadonlyArray<T>(value: unknown): readonly T[];
/**
 * Safe image list for conversation.view pending echoes.
 * Official 0.1.5 uses `images`; older hosts used `attachments`.
 * Either field may be missing — never read `.length` on undefined.
 */
export declare function pendingSubmissionImages(submission: PendingSubmissionLike | null | undefined): readonly PendingSubmissionImage[];
//# sourceMappingURL=pending-submission.d.ts.map