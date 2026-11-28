/**
 * Durable image resolution for the reading view.
 *
 * Two host contracts exist for `session.readAttachment`:
 *
 * - **0.1.0-rc.2 … 0.2.1** take the bare attachment id
 *   (`readAttachment(attachmentId: AttachmentIdType)`, forwarded to
 *   `remote.session.attachment({ sessionId, attachmentId })`).
 * - **0.2.2+** take the whole reference (`readAttachment(attachment:
 *   ImageAttachmentRef)`, forwarded to `remote.session.attachment({ sessionId,
 *   attachment })`) and verify id + media type + byte length + dimensions
 *   against the stored object.
 *
 * This plugin declares `>=0.1.0-rc.2 <0.3.0-0`, so it has to speak both. We
 * try the reference first (the current contract), and only when the host
 * rejects it with `INVALID_ATTACHMENT_REF` do we retry with the id — and we
 * remember which shape this session accepted, so a failure costs one probe per
 * session instead of two round trips per image.
 */
/** The subset of `ImageAttachmentRef` this module needs. */
export interface AttachmentRefLike {
    attachmentId: string;
    mediaType?: string;
}
/** Business error shape carried by a rejected `RemoteResult`. */
export interface AttachmentReceiptError {
    code?: string;
    message?: string;
}
export type AttachmentReceipt = {
    ok: true;
    value: {
        attachment: {
            mediaType: string;
        };
        data: Uint8Array | number[];
    };
} | {
    ok: false;
    error: AttachmentReceiptError;
};
/** Which argument shape a host line accepts. `unknown` = not probed yet. */
export type AttachmentContract = 'ref' | 'id' | 'unknown';
export declare function attachmentContractOf(sessionId: string): AttachmentContract;
/** Test seam: forget one session (or every session) between cases. */
export declare function resetAttachmentContracts(sessionId?: string): void;
/**
 * Read one attachment through whichever contract this host accepts.
 *
 * @param sessionId session identity, used as the probe cache key.
 * @param attachment the reference carried by the message image block.
 * @param read the host's `readAttachment`, typed loosely because its declared
 *   parameter differs across supported lines.
 */
export declare function readAttachmentCompat(sessionId: string, attachment: AttachmentRefLike, read: (argument: unknown) => Promise<AttachmentReceipt>): Promise<AttachmentReceipt>;
/** Human-readable detail for the reading view's failed-image state. */
export declare function attachmentErrorDetail(error: AttachmentReceiptError): string;
//# sourceMappingURL=attachment-read.d.ts.map