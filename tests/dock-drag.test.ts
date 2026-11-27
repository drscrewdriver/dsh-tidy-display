/**
 * Dock drag clamp — bidirectional limits (up 1.5x row height, down to the
 * measured viewport floor), threshold and negative-height protection.
 * Run via: npm test (vitest/node test picking up tests/*.test.ts).
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { clampDockOffset, DRAG_THRESHOLD_PX, DOCK_MAX_LIFT, DOCK_MAX_DROP } from '../src/client/dock/drag.ts'

describe('clampDockOffset', () => {
  it('leaves an in-range upward drag untouched', () => {
    assert.equal(clampDockOffset(-20, 40), -20)
  })
  it('clamps to -1.5x row height on over-drag upward', () => {
    assert.equal(clampDockOffset(-100, 40), -DOCK_MAX_LIFT * 40)
  })

  // Product semantics: the capsule row is draggable in BOTH directions inside
  // its limits — the previous "downward is always 0" assertion locked in the
  // one-way bug, so it is deliberately replaced.
  it('leaves an in-range downward drag untouched (measured floor)', () => {
    assert.equal(clampDockOffset(10, 40, 14), 10)
    assert.equal(clampDockOffset(14, 40, 14), 14)
  })
  it('clamps a downward over-drag to the measured floor', () => {
    assert.equal(clampDockOffset(200, 40, 14), 14)
  })
  it('falls back to a symmetric 1.5x row height downward limit', () => {
    assert.equal(clampDockOffset(10, 40), 10)
    assert.equal(clampDockOffset(100, 40), DOCK_MAX_DROP * 40)
    assert.equal(DOCK_MAX_DROP, DOCK_MAX_LIFT)
  })
  it('degrades an unusable downward floor to the shipped position only', () => {
    assert.equal(clampDockOffset(10, 40, 0), 0)
    assert.equal(clampDockOffset(10, 40, -8), 0)
    assert.equal(clampDockOffset(10, 40, Number.NaN), 0)
  })
  it('keeps both limits ordered around a zero offset', () => {
    assert.equal(clampDockOffset(0, 40, 14), 0)
    assert.ok(clampDockOffset(-5, 40, 14) < 0)
    assert.ok(clampDockOffset(5, 40, 14) > 0)
  })
  it('returns 0 for a non-positive row height', () => {
    assert.equal(clampDockOffset(-10, 0), 0)
    assert.equal(clampDockOffset(-10, -5), 0)
    assert.equal(clampDockOffset(10, 0, 14), 0)
  })
  it('exposes a 4px click-vs-drag threshold', () => {
    assert.equal(DRAG_THRESHOLD_PX, 4)
  })
});
