/**
 * Dock 把手覆盖面 — 「整排都能拖」这条语义的源码守卫。
 *
 * 产品语义：胶囊排是**一个整体拖动面**，四颗按钮（分段/卡片/折叠/齿轮）
 * 全都得是把手；齿轮同时保留它自己的开面板 click，真实拖动后由
 * consumeDrag() 吞掉那次 click。0.6.6 把齿轮排除在外（"⚙ 不参与拖动"），
 * 结果只有三颗能起拖，用户体感是「整排只有一截能抓」——这条断言就是
 * 防止那个错位语义被再写回来。
 *
 * 扫源码而非渲染：组件的拖动只发生在 PointerEvent 层，没有 DOM 环境时
 * 用源码形状锁住「每个 <button className=capsule> 都绑了 onPointerDown
 * 且带 capsuleHandle」最稳，也不会锁住具体实现细节。
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DOCK_SRC = readFileSync(resolve(root, 'src/client/dock/RenderDock.tsx'), 'utf8')

/**
 * 粗粒度切出每个 JSX <button …> 开标签块（含多行属性）。
 *
 * 不能用 `indexOf('>')` 截断：属性里的 `=>`（onClick 箭头函数）会先被当成
 * 标签结束符，切出来的块会丢掉 onClick 之后的全部内容。这里用 `[^>]|=>` 的
 * 交替，让 `=>` 整体被吃掉、只有真正的标签结束 `>` 才停。
 */
function buttonTags(source: string): string[] {
  const tags: string[] = []
  // 交替顺序要紧：`=>` 必须排在 `[^>]` 之前，否则懒惰匹配会先吃掉 `=`，
  // 再让紧随的 `>` 冒充标签结束符。
  const open = /<button\b(?:=>|[^>])*?>/g
  let m: RegExpExecArray | null
  while ((m = open.exec(source)) !== null) tags.push(m[0])
  return tags
}

describe('dock capsule row handles', () => {
  const tags = buttonTags(DOCK_SRC)
  const capsules = tags.filter(tag => /\bcss\.capsule\b/.test(tag))

  it('renders exactly four capsules in the row', () => {
    // 分段 / 卡片 / 折叠 / 齿轮 —— 少一颗或多一颗都意味着布局改了，先看这里。
    assert.equal(capsules.length, 4, `expected 4 capsule buttons, got ${capsules.length}`)
  })

  it('binds the drag handle on every capsule, gear included', () => {
    const missing = capsules.filter(tag => !/onPointerDown=\{handlePointerDown\}/.test(tag))
    assert.deepEqual(missing, [], 'every capsule must call handlePointerDown — the gear is a handle too')
  })

  it('marks every capsule as a draggable handle for the grab cursor', () => {
    const missing = capsules.filter(tag => !/css\.capsuleHandle/.test(tag))
    assert.deepEqual(missing, [], 'every capsule needs css.capsuleHandle (grab cursor + touch-action)')
  })

  it('still swallows the post-drag click on the toggling capsules', () => {
    // 三颗开关 + 齿轮都必须消费拖动标记，否则拖完会误触开关/误开面板。
    const withClick = capsules.filter(tag => /\bonClick=/.test(tag))
    assert.equal(withClick.length, 4, 'every capsule should declare onClick')
    const missing = withClick.filter(tag => !/consumeDrag\(\)/.test(tag))
    assert.deepEqual(missing, [], 'every capsule onClick must early-return on consumeDrag()')
  })

  it('keeps the gear a pure panel toggle after the drag guard', () => {
    const gear = capsules.find(tag => /setOpen\(/.test(tag))
    assert.ok(gear, 'the gear capsule must toggle the settings panel')
    assert.match(gear!, /consumeDrag\(\)\s*\)\s*return;\s*setOpen\(/)
  })
})
