import test from 'node:test';
import assert from 'node:assert/strict';
import { collapseRows, containsNewUser, flowRows, FOLD_TIMING, retiringKeys } from '../src/client/fold-choreography.js';
import { presentLiveTurn } from '../src/client/live-turn.js';
import type { LiveStep } from '../src/client/live-turn.js';
const reasoning = (n: number): LiveStep => ({ kind: 'reasoning', key: `r${n}`, nodeKey: `n${n}`, start: 0, blocks: [], step: n });
const body: LiveStep = { kind: 'body', key: 'b1', nodeKey: 'n1', start: 1, blocks: [], step: 1 };
const open = { status: 'open' } as const;
test('first fold retains every visible step key and admits no incoming reasoning', () => {
  const before = presentLiveTurn([reasoning(1), body], open);
  const after = presentLiveTurn([reasoning(1), body, reasoning(2)], open);
  assert.deepEqual(retiringKeys(before, after, {}), ['r1', 'b1']);
  const rows = collapseRows(before, after);
  assert.deepEqual(rows.filter(x => x.kind === 'step').map(x => x.key), ['r1', 'b1']);
  assert.equal(rows[0].kind, 'summary');
  assert.equal(rows[0].kind === 'summary' && rows[0].item.summary, '思考×0 · 输出×0');
  assert.equal(new Set(flowRows(after).map(row => row.key)).size, flowRows(after).length);
});
test('repeat fold retires only displayed open rows, retaining the same summary identity', () => {
  const before = presentLiveTurn([reasoning(1), body, reasoning(2)], open);
  const after = presentLiveTurn([reasoning(1), body, reasoning(2), reasoning(3)], open);
  assert.deepEqual(retiringKeys(before, after, {}), ['r2']);
  assert.equal(collapseRows(before, after)[0].key, flowRows(before)[0].key);
  assert.deepEqual(retiringKeys(before, after, { 'live-fold:r1': true }), []);
});
test('user admission bypasses buffered choreography and preserves source ordering', () => {
  const before = presentLiveTurn([reasoning(1)], open);
  const user: LiveStep = { kind: 'user', key: 'u2', nodeKey: 'u2' };
  const after = presentLiveTurn([reasoning(1), user, reasoning(2)], open);
  assert.equal(containsNewUser(before, after), true);
  assert.deepEqual(retiringKeys(before, after, {}), []);
  assert.deepEqual(flowRows(after).map(row => row.key), ['r1', 'u2', 'r2']);
});
test('disabling fold preserves all source steps; phase budget is bounded', () => {
  const items = presentLiveTurn([reasoning(1), body, reasoning(2)], open, false);
  assert.equal(items.some(item => item.kind === 'fold'), false);
  assert.equal(FOLD_TIMING.collapse + FOLD_TIMING.count + FOLD_TIMING.settle, 560);
});

// Every phase must be escapable without cooperating animations or frames. A
// non-idle phase holds the frame source at `shown` and pauses the text reveal, so
// a phase that cannot advance freezes the whole turn until the view remounts —
// which is exactly the reported "output stalls at the end, refresh fixes it".
// The slack is what makes the deadline strictly later than the nominal phase.
test('every phase has a bounded budget and a watchdog strictly beyond it', () => {
  assert.ok(FOLD_TIMING.watchdogSlack > 0, 'watchdog slack must be positive');
  for (const phase of ['collapse', 'count', 'settle', 'reveal'] as const) {
    const budget = FOLD_TIMING[phase];
    assert.ok(Number.isFinite(budget) && budget > 0, phase + ' needs a positive budget');
    assert.ok(budget + FOLD_TIMING.watchdogSlack > budget, phase + ' deadline must exceed its budget');
    // Far below any plausible user perception of "stuck".
    assert.ok(budget + FOLD_TIMING.watchdogSlack < 1000, phase + ' must not read as a stall');
  }
});
