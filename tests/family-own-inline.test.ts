/**
 * 家族节接管 own 卡内联直挂的源码结构钉（2026-11-02 own-tab 批量修复）。
 *
 * tidy 测试跑 `node --import tsx/esm --test`（无 react-dom/server，不能像 brief/input
 * 那样 renderToStaticMarkup）；沿用结构钉把 tidy 自带那份 family-host 模块拷贝的
 * 「接管时 own 卡内联直挂 + 账本去重 + familySeated 判据」独立证成本仓，
 * 不借用姊妹仓结论。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const ROOT = join(fileURLToPath(import.meta.url), '..', '..')
const HOST = readFileSync(join(ROOT, 'src', 'client', 'family-host.ts'), 'utf8')
const SETTINGS = readFileSync(join(ROOT, 'src', 'client', 'settings.tsx'), 'utf8')

test('family-host 模块：FamilyHostSection 内联 own 行并对账本 own id 去重', () => {
  assert.match(HOST, /props\.renderOwn && row\.id === ownId/, 'ownId 行必须走 renderOwn 内联')
  assert.match(HOST, /tabs\.filter\(tab => tab\.id !== ownId\)/, '账本同 id 条目必须去重，不双渲')
})

test('settings.tsx：claim 传 ownTab(SettingsSection,injected) 且探针为 familySeated', () => {
  // 接管调用必须携带 ownTab（id + own 卡组件）。
  assert.match(SETTINGS, /claimFamilyHostIfOrphaned\([\s\S]*?\{\s*id:\s*'tidy-display',\s*component:\s*SettingsSection[\s\S]*?\}\s*,?\s*\)/,
    '接管调用必须传入 ownTab={id:tidy-display, component:SettingsSection, …}')
  // 判据改为查实际在位的家族容器，而非旧的 familyTabHeld。
  assert.match(SETTINGS, /entries\('settings\.section'\)/, '探针必须 entries(settings.section) 查 dsh-family 在位')
  assert.doesNotMatch(SETTINGS, /familyTabHeld/, '不得残留旧的 familyTabHeld 判据（自宣子槽恒 false）')
})
