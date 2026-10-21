import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ReaderEntryPolicy, readerEntryRequested } from '../src/client/entry-policy.js';

// R2: the default tab is 对话 — an entry with no explicit request never forces
// the reader. A null/undefined view falls through to the host's own default.
test('fresh sessions default to the host (对话), not the reading view', () => {
  const policy = new ReaderEntryPolicy(false);
  assert.equal(policy.select(null), null);
  assert.equal(policy.select(undefined), null);
  assert.equal(policy.select('reader'), null);
});

test('an explicit native or third-party tab selection is not overwritten', () => {
  const policy = new ReaderEntryPolicy(false);
  for (const view of ['chat', 'trajectory', 'other-plugin']) assert.equal(policy.select(view), null);
  assert.equal(policy.select(null), null);
  assert.equal(policy.select('chat'), null);
});

// With an explicit ?reader=1 request the reader lands once, then releases every
// later tab choice — including a still-null view, because the request is spent.
test('the trial URL enters reading once and releases later tab choices', () => {
  let consumed = 0;
  const policy = new ReaderEntryPolicy(true, () => { consumed++; });
  assert.equal(policy.select('chat'), 'reader');
  assert.equal(consumed, 1);
  assert.equal(policy.select('reader'), null);
  assert.equal(policy.select('chat'), null);
  assert.equal(policy.select('trajectory'), null);
  assert.equal(consumed, 1);
  assert.equal(policy.select(null), null);
});

test('already-selected reading still consumes the entry request', () => {
  let consumed = false;
  const policy = new ReaderEntryPolicy(true, () => { consumed = true; });
  assert.equal(policy.select('reader'), null);
  assert.equal(consumed, true);
  assert.equal(policy.select('chat'), null);
});

test('current and previously delivered trial links have real entry semantics', () => {
  for (const query of ['?reader=1', '?reader=0.1.0-trial.2', '?reader=0.1.0-trial.3']) assert.equal(readerEntryRequested(query), true);
  for (const query of ['', '?reader=0', '?reader=unrelated', '?other=reader']) assert.equal(readerEntryRequested(query), false);
});
