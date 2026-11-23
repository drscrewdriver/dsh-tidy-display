/**
 * 教学段字段名门禁——协议教学必须给出**规范字段名**, 否则模型只能凭直觉写
 * 别名(text/body/headers…), 而原生对话视图的 contentRecognized 要求
 * canonicalJson(守卫结果) === canonicalJson(原文): 任何别名改写都会让整条
 * 围栏退回普通代码块(0.5.3 实测事故: callout 用 text 导致同围栏表格一起不渲染)。
 *
 * 这些断言直接对齐 @changfenhuang/dsh-genui 的 schema.ts 规范字段,
 * 改教学文案时若误删规范名或写回别名, 这里立刻红。
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { buildSegmentTeaching, PROTOCOL_DEFAULTS } from '../src/protocol-teaching.js'

const teaching = buildSegmentTeaching(PROTOCOL_DEFAULTS, { hasSkillTool: false })

/** 规范化空白与反引号, 便于跨行断言。 */
const flat = teaching.replace(/\s+/g, ' ')

test('教学段给出 callout 的规范正文字段 content', () => {
  assert.match(flat, /callout\(content/, 'callout 必须显式写出 content 字段')
  // 别名禁令必须点名 text —— 这是模型最常写错的那个
  assert.match(flat, /严禁别名/)
  assert.match(flat, /callout 正文是 `content`\(不是 text\/body\/desc\)/)
})

test('教学段给出 table 的 columns + rows 且声明 rows 为二维数组', () => {
  assert.match(flat, /table\(columns\+rows\)/)
  assert.match(flat, /rows 是\*\*二维数组\*\*不是对象数组/)
})

test('教学段给出 keyvalue 的 pairs 与 badge 的 label', () => {
  assert.match(flat, /keyvalue\(pairs\)/)
  assert.match(flat, /badge\(label\)/)
  assert.match(flat, /keyvalue 是 `pairs`\(不是 items\)/)
  assert.match(flat, /badge 是 `label`\(不是 text\)/)
})

test('教学段含一条可直接照抄的最小正确示例', () => {
  assert.match(flat, /最小正确示例/)
  // 示例本身必须是合法 JSON 且字段规范
  const match = teaching.match(/最小正确示例[^:]*:(\{.*\})/)
  assert.ok(match, '必须含 JSON 示例')
  const spec = JSON.parse(match[1]) as { items: Array<Record<string, unknown>> }
  assert.ok(Array.isArray(spec.items) && spec.items.length > 0)
  for (const node of spec.items) {
    const type = node.type
    if (type === 'callout') {
      assert.equal(typeof node.content, 'string', 'callout 示例必须用 content')
      assert.equal('text' in node, false, 'callout 示例不得出现别名 text')
    }
    if (type === 'table') {
      assert.ok(Array.isArray(node.columns), 'table 示例必须有 columns')
      assert.ok(Array.isArray(node.rows), 'table 示例必须有 rows')
      for (const row of node.rows as unknown[]) {
        assert.ok(Array.isArray(row), 'table.rows 必须是二维数组')
      }
    }
    if (type === 'steps') {
      assert.ok(Array.isArray(node.steps), 'steps 示例必须有 steps 数组')
      for (const step of node.steps as unknown[]) {
        assert.ok(typeof step === 'object' && step !== null && !Array.isArray(step), 'steps 每项必须是对象')
        assert.equal(typeof (step as Record<string, unknown>).title, 'string', 'steps 每项必须有字符串 title')
      }
    }
  }
})

test('教学段明令 steps 用对象数组而非字符串数组', () => {
  assert.match(flat, /steps\(steps:\[\{title,desc\}\]\)/, '词汇表须给出 steps 对象结构')
  assert.match(flat, /steps 的 `steps` 是\*\*对象数组\*\*/, '须写明 steps 是对象数组')
  assert.match(flat, /不是字符串数组/, '须点名禁止字符串数组写法')
})

test('字段名带别名禁令说明后果(整条围栏退回代码块)', () => {
  assert.match(flat, /整条围栏连同同围栏内其他组件一起退回普通代码块/)
})

test('路由表常驻 mermaid 入口(不随 dshUi/vcp 开关消失)', () => {
  // 渲染走 markdown 围栏 + genui 懒引擎,与两条卡片通道的开关无关;
  // 条目若挂在 VCP_CHANNEL 里,关掉 VCP 后模型就不知道还能出图。
  assert.match(flat, /正文 ```mermaid 围栏/, '路由表须有 mermaid 条目')
  assert.match(flat, /首行必须是图类型声明/, '须点明首行是图类型声明')
  const onlyDshUi = buildSegmentTeaching({ dshUi: true, vcp: false }, { hasSkillTool: false }).replace(/\s+/g, ' ')
  assert.match(onlyDshUi, /正文 ```mermaid 围栏/, 'vcp 关闭时 mermaid 条目仍在')
  const onlyVcp = buildSegmentTeaching({ dshUi: false, vcp: true }, { hasSkillTool: false }).replace(/\s+/g, ' ')
  assert.match(onlyVcp, /正文 ```mermaid 围栏/, 'dshUi 关闭时 mermaid 条目仍在')
})
