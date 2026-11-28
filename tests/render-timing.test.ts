import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isRenderTimingProbeEnabled,
  renderTimingSnapshot,
  resetRenderTiming,
  setRenderTimingProbe,
  timeMermaidRender,
} from '../src/client/segments/render-timing.ts';

test('probe is off by default and records nothing while off', () => {
  resetRenderTiming();
  assert.equal(isRenderTimingProbeEnabled(), false);
  const stop = timeMermaidRender('reader', 'mm:1');
  stop();
  assert.equal(renderTimingSnapshot().count, 0, 'a disabled probe must not record');
  assert.equal(renderTimingSnapshot().repeats, 0);
});

test('a stopped render increments the sample count', () => {
  resetRenderTiming();
  setRenderTimingProbe(true);
  assert.equal(isRenderTimingProbeEnabled(), true);
  const before = renderTimingSnapshot().count;
  timeMermaidRender('reader', 'mm:2')();
  assert.equal(renderTimingSnapshot().count, before + 1);
});

test('stopping twice records one sample only', () => {
  resetRenderTiming();
  setRenderTimingProbe(true);
  const stop = timeMermaidRender('reader', 'mm:3');
  stop();
  stop();
  assert.equal(renderTimingSnapshot().count, 1);
});

test('repeats counts re-renders of the same segKey', () => {
  resetRenderTiming();
  setRenderTimingProbe(true);
  timeMermaidRender('reader', 'mm:same')();
  timeMermaidRender('reader', 'mm:same')();
  timeMermaidRender('reader', 'mm:same')();
  timeMermaidRender('reader', 'mm:other')();
  // three renders of one key = two repeats; the second key contributes none.
  assert.equal(renderTimingSnapshot().repeats, 2);
});

test('percentiles stay sane on the recorded samples', () => {
  resetRenderTiming();
  setRenderTimingProbe(true);
  for (let i = 0; i < 20; i += 1) timeMermaidRender('reader', `mm:${i}`)();
  const snapshot = renderTimingSnapshot();
  assert.equal(snapshot.count, 20);
  assert.ok(snapshot.p50 >= 0);
  assert.ok(snapshot.p95 >= snapshot.p50);
  assert.ok(snapshot.maxMs >= snapshot.p95);
});

test('turning the probe off stops recording and leaves no observer behind', () => {
  resetRenderTiming();
  setRenderTimingProbe(true);
  timeMermaidRender('reader', 'mm:on')();
  const recorded = renderTimingSnapshot().count;
  setRenderTimingProbe(false);
  timeMermaidRender('reader', 'mm:off')();
  assert.equal(renderTimingSnapshot().count, recorded, 'off must not record');
  assert.equal(isRenderTimingProbeEnabled(), false);
});

test('the snapshot has every field the diagnostics panel reads', () => {
  resetRenderTiming();
  const snapshot = renderTimingSnapshot();
  for (const key of ['count', 'p50', 'p95', 'maxMs', 'repeats', 'longTasks', 'longestTaskMs'] as const) {
    assert.equal(typeof snapshot[key], 'number', key + ' must be numeric');
  }
});
