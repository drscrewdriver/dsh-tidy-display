/** Official PendingSubmission.images is optional at runtime; text-only sends omit it. */
export function asReadonlyArray(value) {
    return Array.isArray(value) ? value : [];
}
function isImage(value) {
    return value !== null && typeof value === 'object' && typeof value.previewUrl === 'string';
}
/**
 * Safe image list for conversation.view pending echoes.
 * Official 0.1.5 uses `images`; older hosts used `attachments`.
 * Either field may be missing — never read `.length` on undefined.
 */
export function pendingSubmissionImages(submission) {
    if (submission == null)
        return [];
    if (Array.isArray(submission.images))
        return submission.images.filter(isImage);
    if (Array.isArray(submission.attachments)) {
        const images = [];
        for (const item of submission.attachments) {
            if (item?.type === 'image' && isImage(item.value))
                images.push(item.value);
        }
        return images;
    }
    return [];
}
//# sourceMappingURL=pending-submission.js.map