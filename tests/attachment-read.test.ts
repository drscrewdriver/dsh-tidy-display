import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  attachmentContractOf,
  attachmentErrorDetail,
  readAttachmentCompat,
  resetAttachmentContracts,
  type AttachmentReceipt,
} from '../src/client/attachment-read.ts';

const REF = { attachmentId: 'sha256:' + 'a'.repeat(64), mediaType: 'image/png', bytes: 12, width: 4, height: 3 };
const OK: AttachmentReceipt = { ok: true, value: { attachment: { mediaType: 'image/png' }, data: [1, 2, 3] } };
const INVALID: AttachmentReceipt = {
  ok: false,
  error: { code: 'INVALID_ATTACHMENT_REF', message: 'Attachment reference is invalid.' },
};

test('0.2.2+ host: the whole reference is passed, never the bare id', async () => {
  resetAttachmentContracts();
  const seen: unknown[] = [];
  const read = async (argument: unknown) => { seen.push(argument); return OK; };
  const receipt = await readAttachmentCompat('s1', REF, read);
  assert.equal(receipt.ok, true);
  assert.equal(seen.length, 1);
  assert.equal(seen[0], REF, 'must forward the reference object itself');
  assert.notEqual(seen[0], REF.attachmentId);
  assert.equal(attachmentContractOf('s1'), 'ref');
});

test('0.1.x/0.2.1 host: falls back to the bare id and remembers it', async () => {
  resetAttachmentContracts();
  const seen: unknown[] = [];
  const read = async (argument: unknown) => {
    seen.push(argument);
    if (typeof argument === 'string') return OK;
    // Legacy host ignores the extra field and validates a missing id.
    return INVALID;
  };
  const receipt = await readAttachmentCompat('s2', REF, read);
  assert.equal(receipt.ok, true);
  assert.deepEqual(seen, [REF, REF.attachmentId]);
  assert.equal(attachmentContractOf('s2'), 'id');

  // Second call must not probe again: one round trip, id shape.
  seen.length = 0;
  await readAttachmentCompat('s2', REF, read);
  assert.deepEqual(seen, [REF.attachmentId]);
});

test('a reference host is remembered so later calls cost one round trip', async () => {
  resetAttachmentContracts();
  const seen: unknown[] = [];
  const read = async (argument: unknown) => { seen.push(argument); return OK; };
  await readAttachmentCompat('s3', REF, read);
  seen.length = 0;
  await readAttachmentCompat('s3', REF, read);
  assert.deepEqual(seen, [REF]);
});

test('a business error that is not a contract mismatch is returned as-is', async () => {
  resetAttachmentContracts();
  const seen: unknown[] = [];
  const missing: AttachmentReceipt = { ok: false, error: { code: 'ATTACHMENT_NOT_FOUND', message: 'gone' } };
  const read = async (argument: unknown) => { seen.push(argument); return missing; };
  const receipt = await readAttachmentCompat('s4', REF, read);
  assert.equal(receipt.ok, false);
  assert.equal(seen.length, 1, 'no retry when the attachment itself is refused');
  assert.equal(attachmentContractOf('s4'), 'unknown');
});

test('a thrown transport error is not mistaken for a contract mismatch', async () => {
  resetAttachmentContracts();
  let calls = 0;
  const read = async (): Promise<AttachmentReceipt> => { calls += 1; throw new Error('connection reset'); };
  const receipt = await readAttachmentCompat('s5', REF, read);
  assert.equal(receipt.ok, false);
  assert.equal(calls, 1);
  assert.equal((receipt as { error: { message: string } }).error.message, 'connection reset');
});

test('both shapes rejected: the reference error is the reported one', async () => {
  resetAttachmentContracts();
  const read = async (): Promise<AttachmentReceipt> => INVALID;
  const receipt = await readAttachmentCompat('s6', REF, read);
  assert.equal(receipt.ok, false);
  assert.equal((receipt as { error: { code: string } }).error.code, 'INVALID_ATTACHMENT_REF');
});

test('attachmentErrorDetail keeps code and message for the reading view', () => {
  assert.equal(attachmentErrorDetail({ code: 'E_X', message: 'boom' }), 'E_X: boom');
  assert.equal(attachmentErrorDetail({ message: 'boom' }), 'boom');
  assert.equal(attachmentErrorDetail({}), 'unknown error');
  assert.equal(attachmentErrorDetail({ message: 'x'.repeat(400) }).length, 160);
});
