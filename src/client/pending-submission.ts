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

export function asReadonlyArray<T>(value: unknown): readonly T[] {
  return Array.isArray(value) ? value as readonly T[] : [];
}

function isImage(value: unknown): value is PendingSubmissionImage {
  return value !== null && typeof value === 'object' && typeof (value as PendingSubmissionImage).previewUrl === 'string';
}

/**
 * Safe image list for conversation.view pending echoes.
 * Official 0.1.5 uses `images`; older hosts used `attachments`.
 * Either field may be missing — never read `.length` on undefined.
 */
export function pendingSubmissionImages(submission: PendingSubmissionLike | null | undefined): readonly PendingSubmissionImage[] {
  if (submission == null) return [];
  if (Array.isArray(submission.images)) return submission.images.filter(isImage);
  if (Array.isArray(submission.attachments)) {
    const images: PendingSubmissionImage[] = [];
    for (const item of submission.attachments) {
      if (item?.type === 'image' && isImage(item.value)) images.push(item.value);
    }
    return images;
  }
  return [];
}
