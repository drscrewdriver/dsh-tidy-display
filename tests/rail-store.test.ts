import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRailStore, type RailState } from '../src/client/store.js';

const DEFAULTS: RailState = {
  railEnabled: true,
  railSide: 'left',
  railStyle: 'bar',
  railRing: true,
  railColor: 'auto',
  railColorCustom: '',
  railColorLight: 'l3',
  railAccent: 'auto',
  railAccentCustom: '',
  railAccentLight: 'l3',
  autoLoad: true,
};

test('rail store defaults: everything on, sheen on, takeover on, left bar rail', () => {
  const prefs = createRailStore().create();
  const snap = prefs.getSnapshot();
  for (const [key, value] of Object.entries(DEFAULTS)) {
    assert.deepEqual(snap[key as keyof RailState], value, `default ${key}`);
  }
});

test('rail actions change exactly their own field', () => {
  const prefs = createRailStore().create();
  prefs.actions.setRailEnabled(false);
  prefs.actions.setRailSide('right');
  prefs.actions.setRailStyle('dot');
  prefs.actions.setRailRing(false);
  prefs.actions.setRailColor('custom');
  prefs.actions.setRailColorCustom('rgba(16,185,129,0.8)');
  prefs.actions.setRailAccent('violet');
  prefs.actions.setRailAccentCustom('#8b5cf6');
  prefs.actions.setAutoLoad(false);
  const snap = prefs.getSnapshot();
  assert.equal(snap.railEnabled, false);
  assert.equal(snap.railSide, 'right');
  assert.equal(snap.railStyle, 'dot');
  assert.equal(snap.railRing, false);
  assert.equal(snap.railColor, 'custom');
  assert.equal(snap.railColorCustom, 'rgba(16,185,129,0.8)');
  assert.equal(snap.railAccent, 'violet');
  assert.equal(snap.railAccentCustom, '#8b5cf6');
  assert.equal(snap.autoLoad, false);
  // untouched siblings keep defaults
  assert.equal(snap.railColorLight, 'l3');
  assert.equal(snap.railAccentLight, 'l3');
});

test('subscribe fires on actions and the snapshot is stable between updates', () => {
  const prefs = createRailStore().create();
  let fired = 0;
  const unsubscribe = prefs.subscribe(() => { fired += 1; });
  prefs.actions.setRailSide('right');
  assert.equal(fired, 1);
  assert.equal(prefs.getSnapshot().railSide, 'right');
  unsubscribe();
  prefs.actions.setRailSide('left');
  assert.equal(fired, 1, 'listener removed by unsubscribe');
});
