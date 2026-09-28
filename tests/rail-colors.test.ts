import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  NAV_HUE_KEYS,
  NAV_HUE_PALETTE,
  NAV_LIGHT_IDX,
  contrastRatio,
  hueColor,
  parseRgba,
  parseRgb,
  validColor,
} from '../src/client/rail/colors.js'

test('parseRgba covers the syntaxes the color picker and CSS tokens produce', () => {
  assert.deepEqual(parseRgba('#3b82f6'), [59, 130, 246, 1])
  assert.deepEqual(parseRgba('#3b82f680'), [59, 130, 246, 0.502])
  assert.deepEqual(parseRgba('#fff'), [255, 255, 255, 1])
  assert.deepEqual(parseRgba('rgb(59, 130, 246)'), [59, 130, 246, 1])
  assert.deepEqual(parseRgba('rgba(59,130,246,0.25)'), [59, 130, 246, 0.25])
  assert.deepEqual(parseRgba('rgb(59 130 246 / 50%)'), [59, 130, 246, 0.5])
  assert.deepEqual(parseRgba('rgb(100%, 0%, 0%)'), [255, 0, 0, 1])
  assert.deepEqual(parseRgba('transparent'), [0, 0, 0, 0])
  assert.equal(parseRgba(''), null)
  assert.equal(parseRgba('junk'), null)
  assert.equal(parseRgba('rgb(1, 2)'), null)
})

test('parseRgb keeps only the channels the contrast math needs', () => {
  assert.deepEqual(parseRgb('#3b82f6'), [59, 130, 246])
  assert.deepEqual(parseRgb('rgba(1, 2, 3, 0.5)'), [1, 2, 3])
  assert.equal(parseRgb('nope'), null)
})

test('contrastRatio: WCAG extremes and the 3:1 rail bar threshold', () => {
  assert.equal(contrastRatio([0, 0, 0], [255, 255, 255]), 21)
  assert.equal(contrastRatio([255, 255, 255], [255, 255, 255]), 1)
  const blue = contrastRatio([59, 130, 246], [255, 255, 255])
  assert.ok(blue > 3 && blue < 4, `blue-on-white expected ~3.68, got ${blue}`)
  assert.equal(contrastRatio([255, 255, 255], [0, 0, 0]), 21)
})

test('validColor accepts only strings parseRgba understands, else fallback', () => {
  assert.equal(validColor('#3b82f6', 'FB'), '#3b82f6')
  assert.equal(validColor('  rgba(1,2,3,0.5)  ', 'FB'), 'rgba(1,2,3,0.5)')
  assert.equal(validColor('not-a-color', 'FB'), 'FB')
  assert.equal(validColor('', 'FB'), 'FB')
  assert.equal(validColor(undefined, 'FB'), 'FB')
  assert.equal(validColor(42, 'FB'), 'FB')
})

test('palette is 9 hues × 5 lightness stops, all parseable', () => {
  for (const hue of NAV_HUE_KEYS) {
    const row = NAV_HUE_PALETTE[hue]
    assert.ok(Array.isArray(row) && row.length === 5, `hue ${hue} must have 5 stops`)
    for (const stop of row) assert.notEqual(parseRgba(stop), null, `hue ${hue} stop ${stop} must parse`)
  }
  assert.deepEqual([...NAV_HUE_KEYS].sort(), ['black', 'blue', 'cyan', 'gray', 'green', 'orange', 'red', 'violet', 'white'].sort())
  assert.deepEqual(Object.keys(NAV_LIGHT_IDX), ['l1', 'l2', 'l3', 'l4', 'l5'])
})

test('hueColor resolves hue × lightness and falls back safely', () => {
  assert.equal(hueColor('blue', 'l3', 'FB'), '#3b82f6')
  assert.equal(hueColor('blue', 'l5', 'FB'), NAV_HUE_PALETTE.blue[4])
  assert.equal(hueColor('blue', undefined, 'FB'), NAV_HUE_PALETTE.blue[2])
  assert.equal(hueColor('rainbow', 'l3', 'FB'), 'FB')
  assert.equal(hueColor(undefined, 'l3', 'FB'), 'FB')
})
