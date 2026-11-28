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

export type AttachmentReceipt =
  | { ok: true; value: { attachment: { mediaType: string }; data: Uint8Array | number[] } }
  | { ok: false; error: AttachmentReceiptError };

/** Which argument shape a host line accepts. `unknown` = not probed yet. */
export type AttachmentContract = 'ref' | 'id' | 'unknown';

/** Per-session memory of the shape that worked, so probing happens once. */
const contracts = new Map<string, AttachmentContract>();

export function attachmentContractOf(sessionId: string): AttachmentContract {
  return contracts.get(sessionId) ?? 'unknown';
}

/** Test seam: forget one session (or every session) between cases. */
export function resetAttachmentContracts(sessionId?: string): void {
  if (sessionId === undefined) contracts.clear();
  else contracts.delete(sessionId);
}

function errorOf(error: unknown): AttachmentReceiptError {
  const face = error as { code?: unknown; message?: unknown } | null | undefined;
  return {
    code: typeof face?.code === 'string' ? face.code : undefined,
    message: typeof face?.message === 'string' ? face.message : String(error),
  };
}

function isInvalidRef(receipt: { ok: false; error: AttachmentReceiptError }): boolean {
  return receipt.error.code === 'INVALID_ATTACHMENT_REF'
    // Some lines surface the business error inside the message only.
    || /INVALID_ATTACHMENT_REF/.test(receipt.error.message ?? '');
}

/**
 * Read one attachment through whichever contract this host accepts.
 *
 * @param sessionId session identity, used as the probe cache key.
 * @param attachment the reference carried by the message image block.
 * @param read the host's `readAttachment`, typed loosely because its declared
 *   parameter differs across supported lines.
 */
export async function readAttachmentCompat(
  sessionId: string,
  attachment: AttachmentRefLike,
  read: (argument: unknown) => Promise<AttachmentReceipt>,
): Promise<AttachmentReceipt> {
  const known = attachmentContractOf(sessionId);
  if (known === 'id') return read(attachment.attachmentId);
  if (known === 'ref') return read(attachment);

  // Unknown line: current contract first, legacy id only on a contract error.
  let first: AttachmentReceipt;
  try {
    first = await read(attachment);
  } catch (error) {
    // A thrown error is a transport/authorization failure, not a contract
    // mismatch — retrying with the id would only hide the real cause.
    return { ok: false, error: errorOf(error) };
  }
  if (first.ok) { contracts.set(sessionId, 'ref'); return first; }
  if (!isInvalidRef(first)) return first;

  let second: AttachmentReceipt;
  try {
    second = await read(attachment.attachmentId);
  } catch (error) {
    return { ok: false, error: errorOf(error) };
  }
  if (second.ok) { contracts.set(sessionId, 'id'); return second; }
  // Both shapes rejected: the reference error is the truthful one (the host
  // did understand the current contract and refused the attachment itself).
  return first;
}

/** Human-readable detail for the reading view's failed-image state. */
export function attachmentErrorDetail(error: AttachmentReceiptError): string {
  const code = error.code ? `${error.code}: ` : '';
  const message = (error.message ?? '').trim();
  return (code + (message || 'unknown error')).slice(0, 160);
}
