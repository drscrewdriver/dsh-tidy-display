import test from 'node:test';
import assert from 'node:assert/strict';
import { HANDOVER_KINDS, handsBackToModel, WAIT_AFTER, waitingAnchor } from '../src/client/waiting-clock.js';

const nodes = new Map<string, { kind: string; data: unknown }>([
  ['u1', { kind: 'user', data: { time: 1000 } }],
  ['s1', { kind: 'steering', data: { time: 301000 } }],
  ['s2', { kind: 'steering', data: { time: 305000 } }],
  ['a1', { kind: 'assistant-step', data: { time: 302000 } }],
  ['ctx', { kind: 'context', data: { time: 399000 } }],
  // A settled tool: the root carries its result, so control returns to the model.
  ['tr', { kind: 'tool-call', data: { time: 61000, root: { kind: 'tool-result', callId: 'c1' } } }],
  // A running tool: no result yet, so the tool — not the model — is working.
  ['tc', { kind: 'tool-call', data: { time: 62000, root: { callId: 'c2', name: 'read', argsRaw: '{}' } } }],
  // A command that already reported an outcome.
  ['cmd', { kind: 'command', data: { time: 70000, outcome: { kind: 'success' } } }],
  // A command that has not settled yet.
  ['cmd-open', { kind: 'command', data: { time: 71000, outcome: null } }],
]);
const get = (key: string) => nodes.get(key);

// The regression this guards: the handover set is matched against the CHAT layer's
// kind union, because that is what `snapshot.nodes` holds. A conversation-layer name
// ('tool-result') or an invented one ('tool-return') never occurs there, so the branch
// it guards is silently dead — which is how a returned tool stopped restarting the wait.
test('handover kinds are chat-layer kinds, verified against the host type', () => {
  // The compile-time check lives in the `satisfies` in waiting-clock; this is the
  // runtime echo so a cast cannot quietly defeat it.
  for (const kind of HANDOVER_KINDS) {
    assert.ok(WAIT_AFTER.has(kind) || kind === 'user' || kind === 'steering' || kind === 'tool-call' || kind === 'command', kind);
  }
});

test('the conversation-layer name for a returned tool is NOT a chat kind', () => {
  // 'tool-result' is real in the conversation contract, but the reader never sees a
  // node with that kind: it is nested inside tool-call data. Keeping it in the set
  // was the bug, so pin its absence.
  assert.ok(!WAIT_AFTER.has('tool-result' as never), 'tool-result is not a chat node kind');
  assert.ok(!WAIT_AFTER.has('tool-return' as never), 'tool-return was never a kind at all');
  assert.ok(!WAIT_AFTER.has('command-input' as never), 'command-input is not a chat node kind');
});

test('a returned tool hands control back to the model', () => {
  const node = get('tr')!;
  assert.ok(handsBackToModel(node));
  assert.deepEqual(waitingAnchor(['u1', 's1', 'tr'], get), { key: 'tr', time: 61000 });
});

test('a running tool does NOT hand control back — the tool is the one working', () => {
  assert.ok(!handsBackToModel(get('tc')!));
  // Falling back to the user's message: the wait keeps its earlier clock.
  assert.deepEqual(waitingAnchor(['u1', 'tc'], get), { key: 'u1', time: 1000 });
});

test('a settled command hands over; one still executing does not', () => {
  assert.ok(handsBackToModel(get('cmd')!));
  assert.ok(!handsBackToModel(get('cmd-open')!));
  assert.deepEqual(waitingAnchor(['u1', 'cmd'], get), { key: 'cmd', time: 70000 });
  assert.deepEqual(waitingAnchor(['u1', 'cmd-open'], get), { key: 'u1', time: 1000 });
});

test('ordinary waiting starts at user input', () => assert.deepEqual(waitingAnchor(['u1'], get), { key: 'u1', time: 1000 }));
test('steering resets a five-minute-old turn to the new input', () => assert.deepEqual(waitingAnchor(['u1', 's1'], get), { key: 's1', time: 301000 }));
test('repeated steering resets even while the waiting indicator stays mounted', () => assert.deepEqual(waitingAnchor(['u1', 's1', 's2'], get), { key: 's2', time: 305000 }));

// An assistant-step mid-turn is not a handover, so the wait keeps its earlier clock.
test('an assistant step does not reset waiting', () => assert.deepEqual(waitingAnchor(['u1', 's1', 'a1'], get), { key: 's1', time: 301000 }));

// Context injection IS a handover: the model owes the next move from that moment,
// and the clock must not keep counting the minutes spent before it.
test('context injection restarts the wait', () => assert.deepEqual(waitingAnchor(['u1', 's1', 'a1', 'ctx'], get), { key: 'ctx', time: 399000 }));

test('local echo resets immediately before steering admission', () => assert.deepEqual(waitingAnchor(['u1'], get, [{ requestId: 'new', time: 301000, placement: 'next-step' }]), { key: 'pending:new', time: 301000 }));

test('queued future turns and stale echoes cannot reset current waiting', () => {
  assert.deepEqual(waitingAnchor(['u1', 's1'], get, [{ requestId: 'q', time: 400000, placement: 'queued' }]), { key: 's1', time: 301000 });
  assert.deepEqual(waitingAnchor(['u1', 's1'], get, [{ requestId: 'old', time: 1000 }]), { key: 's1', time: 301000 });
});

test('missing latest timestamp falls back to a new-input clock, not old history', () => {
  assert.deepEqual(waitingAnchor(['u1', 'bad'], key => key === 'bad' ? { kind: 'steering', data: {} } : get(key)), { key: 'bad', time: null });
  assert.deepEqual(waitingAnchor([], get), { key: 'unresolved', time: null });
});
