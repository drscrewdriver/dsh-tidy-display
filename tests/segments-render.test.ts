/**
 * Segmented-rendering hook decision tests — pure-function level (the render
 * layer imports CSS modules, so node tests exercise the decision helpers and
 * the mdast shapes the hooks branch on, mirroring tests/mcp-apps.test.ts).
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  isBlockLevelLineStart,
  isDshUiFence,
  looksLikeVcpHtmlBlock,
  normalizeSegmentLang,
} from '../src/client/segments/segment-decide.js'
import { parseGfmWithMath } from '../src/client/markdown/parse.js'

const OPEN = '<div id="vcp-root" style="background:#111">'

test('normalizeSegmentLang 剥标点与大小写', () => {
  assert.equal(normalizeSegmentLang('dsh-ui'), 'dsh-ui')
  assert.equal(normalizeSegmentLang('DSH-UI'), 'dsh-ui')
  assert.equal(normalizeSegmentLang('dsh-ui>'), 'dsh-ui')
  assert.equal(normalizeSegmentLang(' dsh-ui '), 'dsh-ui')
  assert.equal(normalizeSegmentLang('HTML:'), 'html')
})

test('isDshUiFence 识别主名与别名,拒绝普通语言', () => {
  assert.equal(isDshUiFence('dsh-ui'), true)
  assert.equal(isDshUiFence('dshui'), true)
  assert.equal(isDshUiFence('dsh-ui>'), true)
  assert.equal(isDshUiFence('js'), false)
  assert.equal(isDshUiFence('html'), false)
  assert.equal(isDshUiFence(null), false)
})

test('looksLikeVcpHtmlBlock:卡/整页前缀判真,其余判假', () => {
  assert.equal(looksLikeVcpHtmlBlock(`${OPEN}<p>x</p>`), true)
  assert.equal(looksLikeVcpHtmlBlock("<div id='vcp-root'>"), true)
  assert.equal(looksLikeVcpHtmlBlock('<!DOCTYPE html><html>'), true)
  assert.equal(looksLikeVcpHtmlBlock('<html lang="zh">'), true)
  assert.equal(looksLikeVcpHtmlBlock('<div class="x">不是卡'), false)
  assert.equal(looksLikeVcpHtmlBlock('<span>行内</span>'), false)
  assert.equal(looksLikeVcpHtmlBlock('&lt;div id="vcp-root"&gt;转义提及'), false)
})

test('isBlockLevelLineStart 仅列首(column 1)为真', () => {
  assert.equal(isBlockLevelLineStart({ start: { column: 1 } }), true)
  assert.equal(isBlockLevelLineStart({ start: { column: 3 } }), false)
  assert.equal(isBlockLevelLineStart(null), false)
  assert.equal(isBlockLevelLineStart({}), false)
})

test('mdast:行首 vcp 卡产生 html 块节点(column 1,value 以卡开标签开头)', () => {
  const root = parseGfmWithMath(`前言\n\n${OPEN}<p>卡</p></div>\n\n后记`)
  const htmlNodes = root.children.filter(n => n.type === 'html')
  assert.equal(htmlNodes.length, 1)
  const node = htmlNodes[0] as { value: string; position?: { start?: { column?: number } } }
  assert.equal(node.position?.start?.column, 1)
  assert.ok(node.value.startsWith(OPEN))
  assert.equal(looksLikeVcpHtmlBlock(node.value), true)
  assert.equal(isBlockLevelLineStart(node.position), true)
})

test('mdast:行内提及产生 column>1 的行内节点(挂点守卫跳过)', () => {
  const root = parseGfmWithMath('说明文字里提到 <div id="vcp-root"> 的字样不是卡片。')
  // 行内 html 不产生块级 html 节点,或产生的节点列首守卫为假
  const htmlNodes = root.children.filter(n => n.type === 'html')
  for (const node of htmlNodes) {
    const pos = (node as { position?: { start?: { column?: number } } }).position
    assert.equal(isBlockLevelLineStart(pos), false)
  }
})

test('mdast:未闭合行首卡吞掉后续行(「标签乱撒」根因文档化)', () => {
  const root = parseGfmWithMath(`${OPEN}<p>卡</p>\n没有空行分隔的后续 markdown **加粗**`)
  const htmlNodes = root.children.filter(n => n.type === 'html')
  assert.equal(htmlNodes.length, 1)
  const node = htmlNodes[0] as { value: string }
  assert.ok(node.value.includes('没有空行分隔的后续'), '后续行被吞进同一 html 块')
  assert.ok(node.value.includes('**加粗**'))
})
