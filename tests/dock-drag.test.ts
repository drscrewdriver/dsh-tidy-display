/**
 * Dock drag clamp — limit, threshold and negative-height protection.
 * Run via: npm test (vitest/node test picking up tests/*.test.ts).
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { clampDockOffset, DRAG_THRESHOLD_PX, DOCK_MAX_LIFT } from '../src/client/dock/drag.ts'

describe('clampDockOffset', () => {
  it('leaves an in-range upward drag untouched', () => {
    assert.equal(clampDockOffset(-20, 40), -20)
  })
  it('clamps to -1.5x row height on over-drag upward', () => {
    assert.equal(clampDockOffset(-100, 40), -DOCK_MAX_LIFT * 40)
  })
  it('clamps any downward drag to 0 (never below shipped position)', () => {
    assert.equal(clampDockOffset(10, 40), 0)
    assert.equal(clampDockOffset(0, 40), 0)
  })
  it('returns 0 for a non-positive row height', () => {
    assert.equal(clampDockOffset(-10, 0), 0)
    assert.equal(clampDockOffset(-10, -5), 0)
  })
  it('exposes a 4px click-vs-drag threshold', () => {
    assert.equal(DRAG_THRESHOLD_PX, 4)
  })
});
