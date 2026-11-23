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
  }
})

test('字段名带别名禁令说明后果(整条围栏退回代码块)', () => {
  assert.match(flat, /整条围栏连同同围栏内其他组件一起退回普通代码块/)
})
