import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { asReadonlyArray, pendingSubmissionImages } from '../src/client/pending-submission.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('text-only pending submission does not throw on missing images', () => {
  const echo = { requestId: 'r1', text: 'hello', time: 1 };
  assert.doesNotThrow(() => pendingSubmissionImages(echo).length);
  assert.deepEqual(pendingSubmissionImages(echo), []);
  assert.deepEqual(pendingSubmissionImages({ images: undefined }), []);
  assert.deepEqual(pendingSubmissionImages({ attachments: undefined }), []);
  assert.deepEqual(pendingSubmissionImages(undefined), []);
  assert.deepEqual(pendingSubmissionImages(null), []);
});

test('official images and legacy attachments both resolve', () => {
  assert.deepEqual(
    pendingSubmissionImages({ images: [{ previewUrl: 'blob:a', width: 4, height: 3, name: 'a.png' }] }),
    [{ previewUrl: 'blob:a', width: 4, height: 3, name: 'a.png' }],
  );
  assert.deepEqual(
    pendingSubmissionImages({ attachments: [{ type: 'image', value: { previewUrl: 'blob:b' } }, { type: 'file' }] }),
    [{ previewUrl: 'blob:b' }],
  );
});

test('pendingSubmissions that is not an array is treated as empty', () => {
  assert.deepEqual(asReadonlyArray(undefined), []);
  assert.deepEqual(asReadonlyArray(null), []);
  assert.deepEqual(asReadonlyArray({ length: 2 }), []);
  assert.deepEqual(asReadonlyArray([{ requestId: 'a' }]), [{ requestId: 'a' }]);
});

test('Reader and committed client bundle do not read unguarded submission.images.length', () => {
  const source = readFileSync(resolve(root, 'src/client/Reader.tsx'), 'utf8');
  assert.match(source, /pendingSubmissionImages/);
  assert.doesNotMatch(source, /submission\.images\.length/);
  const client = readFileSync(resolve(root, 'lib/client.js'), 'utf8');
  assert.doesNotMatch(client, /submission\.images\.length/);
  assert.match(client, /pendingSubmissionImages|function pendingSubmissionImages/);
});
