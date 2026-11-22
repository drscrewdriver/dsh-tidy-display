/**
 * VCP segmentation tests — ports the upstream contract cases that matter for
 * the Reader integration (closed card / streaming pending / fence wrapper /
 * line-start requirement / trailing raw swallow / page documents / script probe).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  hasScriptTag,
  splitMermaidFence,
  splitVcpText,
  stripFenceWrapper,
  trimTrailingOpenTag,
} from '../src/client/vcp/segmentation.js'

const OPEN = '<div id="vcp-root" style="background:#111">'
const CLOSE = '</div>'

test('闭合卡片切成 vcp 段,前后 md 保留', () => {
  const text = `前言一段\n\n${OPEN}<p>卡内容</p>${CLOSE}\n\n后记`
  const segs = splitVcpText(text)
  assert.deepEqual(segs.map(s => s.type), ['md', 'vcp', 'md'])
  const card = segs[1] as { type: 'vcp'; html: string }
  assert.ok(card.html.startsWith(OPEN))
  assert.ok(card.html.endsWith(CLOSE))
  assert.match((segs[0] as { text: string }).text, /前言/)
  assert.match((segs[2] as { text: string }).text, /后记/)
})

test('行内提及 vcp-root 不误切(开标签必须行首)', () => {
  const text = '说明文字里提到 <div id="vcp-root"> 的字样,不是卡片。'
  const segs = splitVcpText(text)
  assert.equal(segs.length, 1)
  assert.equal(segs[0].type, 'md')
})

test('未闭合卡片 → pending 尾巴(流式)', () => {
  const text = `前言\n\n${OPEN}<p>写了一半…`
  const segs = splitVcpText(text)
  assert.deepEqual(segs.map(s => s.type), ['md', 'pending'])
  const pending = segs[1] as { text: string }
  assert.ok(pending.text.startsWith(OPEN))
  assert.ok(!pending.text.startsWith('前言'))
})

test('```html 围栏包装的卡片:围栏行剥离,卡进 vcp 段', () => {
  const text = `${'```html'}\n${OPEN}<p>卡</p>${CLOSE}\n${'```'}\n\n后续说明`
  const segs = splitVcpText(text)
  assert.deepEqual(segs.map(s => s.type), ['vcp', 'md'])
  const card = segs[0] as { type: 'vcp'; html: string }
  assert.ok(card.html.includes('<p>卡</p>'))
  assert.ok(!card.html.includes('```'))
})

test('卡尾 <style> 兄弟块被吞进卡 HTML', () => {
  const text = `${OPEN}<p>卡</p>${CLOSE}\n<style>#vcp-root p{color:#fff}</style>\n\n后文`
  const segs = splitVcpText(text)
  assert.deepEqual(segs.map(s => s.type), ['vcp', 'md'])
  const card = segs[0] as { type: 'vcp'; html: string }
  assert.ok(card.html.includes('<style>'), 'style 应随卡')
  assert.match((segs[1] as { text: string }).text, /后文/)
})

test('卡尾未闭合 <script> 吞到文尾,md 段保持干净', () => {
  const text = `${OPEN}<p>卡</p>${CLOSE}\n<script>var x = 1;\nfunction f() { return`
  const segs = splitVcpText(text)
  assert.deepEqual(segs.map(s => s.type), ['vcp'])
  const card = segs[0] as { type: 'vcp'; html: string }
  assert.ok(card.html.includes('<script>'))
})

test('嵌套 div 正确配平(卡内 div 不提前闭合)', () => {
  const text = `${OPEN}<div class="a"><span>x</span></div><div class="b">y</div>${CLOSE}\n\n尾`
  const segs = splitVcpText(text)
  assert.deepEqual(segs.map(s => s.type), ['vcp', 'md'])
  const card = segs[0] as { type: 'vcp'; html: string }
  assert.ok(card.html.endsWith(CLOSE))
  // md 段保留卡后的前导空行(上游行为,markdown 自身消化)
  assert.equal((segs[1] as { text: string }).text.trim(), '尾')
})

test('整页 HTML 文档切成 page 段', () => {
  const text = `说明\n\n<!DOCTYPE html>\n<html><body><p>page</p></body></html>\n\n尾巴`
  const segs = splitVcpText(text)
  assert.deepEqual(segs.map(s => s.type), ['md', 'page', 'md'])
  const page = segs[1] as { type: 'page'; html?: string }
  assert.ok(page.html?.startsWith('<!DOCTYPE html>'))
  assert.ok(page.html?.endsWith('</html>'))
})

test('mermaid 围栏转引擎形态 HTML', () => {
  const segs = splitMermaidFence('前\n```mermaid\ngraph TD; A-->B;\n```\n后')
  assert.deepEqual(segs.map(s => s.type), ['md', 'mermaid', 'md'])
  const mm = segs[1] as { html: string }
  assert.ok(mm.html.includes('<pre><code class="language-mermaid">'))
  assert.ok(mm.html.includes('graph TD; A--&gt;B;'), '尖括号应转义')
})

test('trimTrailingOpenTag 剥流式半截开标签,不误伤比较符', () => {
  assert.equal(trimTrailingOpenTag('文本 <div id="vcp-r'), '文本 ')
  assert.equal(trimTrailingOpenTag('a < b 且 c > d'), 'a < b 且 c > d')
  assert.equal(trimTrailingOpenTag('普通文本'), '普通文本')
})

test('stripFenceWrapper 剥首尾围栏行', () => {
  assert.equal(stripFenceWrapper('```html\n<div>x</div>\n```'), '<div>x</div>')
  assert.equal(stripFenceWrapper('没有围栏'), '没有围栏')
})

test('hasScriptTag:裸 script(含未闭合)判真,转义/无 script 判假', () => {
  assert.equal(hasScriptTag('<div><script>var a=1</script></div>'), true)
  assert.equal(hasScriptTag('<div><script>var a=1'), true)
  assert.equal(hasScriptTag('<div>&lt;script&gt;escaped&lt;/script&gt;</div>'), false)
  assert.equal(hasScriptTag('<div><style>p{color:#fff}</style></div>'), false)
})
