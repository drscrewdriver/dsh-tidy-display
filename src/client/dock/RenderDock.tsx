/**
 * Render dock — the fixed bottom-right control cluster (both views, body-
 * mounted; the composer card is never touched). Capsule row = quick toggles
 * (render mode / segment cards / card collapse), gear opens the panel with
 * protocol teaching switches (client → node sync via POST
 * /tidy-display/protocol-state) and the coexistence hint.
 *
 * Prototype lineage: raw-html-v2's trusted badge (position, pill styling) and
 * its "VCP 渲染设置" panel (theme tokens, ESC/outside close).
 */
import { memo, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import css from './RenderDock.module.css'
import type { OpenPrefs, ReaderPrefsSnapshot } from '../SettingsSection.js'

export type DockPrefs = OpenPrefs

interface ProtocolState { dshUi: boolean; vcp: boolean }

function detectCoinstalled(): { rawHtmlV2: boolean; genui: boolean } {
  try {
    const entries = (window as unknown as { __DSH_BOOT__?: { entries?: ReadonlyArray<{ id?: string }> } }).__DSH_BOOT__?.entries
    const ids = (entries ?? []).map(e => e.id ?? '').join(' ')
    return { rawHtmlV2: /raw-html/i.test(ids), genui: /dsh-genui/i.test(ids) }
  } catch {
    return { rawHtmlV2: false, genui: false }
  }
}

function Switch({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`${css.switch} ${on ? css.switchOn : ''}`}
      onClick={onClick}
    />
  )
}

export const RenderDock = memo(function RenderDock({ prefs }: { prefs: DockPrefs }) {
  const snap = useSyncExternalStore(
    prefs.subscribe,
    () => prefs.getSnapshot(),
    () => ({}) as ReaderPrefsSnapshot,
  )
  const [open, setOpen] = useState(false)
  const [lifted, setLifted] = useState(false)
  const [protocols, setProtocols] = useState<ProtocolState | null>(null)
  const coinstalled = useMemo(detectCoinstalled, [])

  const segmentCards = snap.segmentCards !== false;
  const collapse = snap.cardCollapseDefault !== false;
  const mode = snap.renderMode === 'delegate' ? 'delegate' : 'native';

  // 位置冲突:raw-html-v2 的可信徽章占同一坐标(right:14px;bottom:14px)时上移让位
  useEffect(() => {
    const check = (): void => {
      setLifted(document.getElementById('vcp-trusted-toggle') !== null)
    }
    check()
    const iv = window.setInterval(check, 2000)
    const stop = window.setTimeout(() => window.clearInterval(iv), 10000)
    return () => { window.clearInterval(iv); window.clearTimeout(stop) }
  }, [])

  // 面板:ESC / 外点关闭
  useEffect(() => {
    if (!open) return
    const key = (e: KeyboardEvent): void => { if (e.key === 'Escape') setOpen(false) }
    const outside = (e: MouseEvent): void => {
      const target = e.target as Node
      const root = document.querySelector('[data-tidy-render-dock]')
      if (root && root.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('keydown', key)
    window.setTimeout(() => document.addEventListener('click', outside), 0)
    return () => {
      document.removeEventListener('keydown', key)
      document.removeEventListener('click', outside)
    }
  }, [open])

  // 协议教学开关(教学端):GET 初值,POST 同步 node 半(下一回合生效)
  useEffect(() => {
    let alive = true
    void fetch('/tidy-display/protocol-state').then(r => r.json()).then((data: { ok?: boolean; dshUi?: boolean; vcp?: boolean }) => {
      if (alive && data?.ok) setProtocols({ dshUi: data.dshUi !== false, vcp: data.vcp !== false })
    }).catch(() => {})
    return () => { alive = false }
  }, [])

  const postProtocol = useCallback(async (patch: Partial<ProtocolState>): Promise<void> => {
    setProtocols(prev => ({ dshUi: true, vcp: true, ...prev, ...patch }))
    try {
      const res = await fetch('/tidy-display/protocol-state', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const data = await res.json() as { ok?: boolean; dshUi?: boolean; vcp?: boolean }
      if (data?.ok) setProtocols({ dshUi: data.dshUi !== false, vcp: data.vcp !== false })
    } catch {
      // 网络失败保留本地乐观态;下次打开面板重新 GET
    }
  }, [])

  const rawHtmlV2Missing = mode === 'delegate' && !coinstalled.rawHtmlV2

  return (
    <div className={css.root} data-tidy-render-dock data-dock-lifted={lifted || undefined}>
      {open && (
        <div className={css.panel} role="dialog" aria-label="整洁显示渲染设置">
          <p className={css.panelTitle}>渲染设置 · 整洁显示</p>
          <div className={css.row}>
            <span className={css.rowText}>
              原生分段
              <p className={css.rowDesc}>关闭 = assistant 行委托外部渲染器(raw-html-v2 等)</p>
            </span>
            <Switch on={mode === 'native'} label="原生分段" onClick={() => prefs.actions.setRenderMode?.(mode === 'native' ? 'delegate' : 'native')} />
          </div>
          <div className={css.row}>
            <span className={css.rowText}>
              分段卡片
              <p className={css.rowDesc}>dsh-ui / VCP 段渲染为卡片;关闭回退普通渲染</p>
            </span>
            <Switch on={segmentCards} label="分段卡片" onClick={() => prefs.actions.setSegmentCards?.(!segmentCards)} />
          </div>
          <div className={css.row}>
            <span className={css.rowText}>
              源码默认折叠
              <p className={css.rowDesc}>不可渲染的卡折叠为标题栏</p>
            </span>
            <Switch on={collapse} label="源码默认折叠" onClick={() => prefs.actions.setCardCollapseDefault?.(!collapse)} />
          </div>
          {protocols && (
            <>
              <div className={css.row}>
                <span className={css.rowText}>
                  教模型 dsh-ui 组件
                  <p className={css.rowDesc}>关闭后不再教新围栏;历史卡照常渲染</p>
                </span>
                <Switch on={protocols.dshUi} label="教模型 dsh-ui 组件" onClick={() => { void postProtocol({ dshUi: !protocols.dshUi }) }} />
              </div>
              <div className={css.row}>
                <span className={css.rowText}>
                  教模型 VCP 视觉卡
                  <p className={css.rowDesc}>关闭后不再教新卡;历史卡照常渲染</p>
                </span>
                <Switch on={protocols.vcp} label="教模型 VCP 视觉卡" onClick={() => { void postProtocol({ vcp: !protocols.vcp }) }} />
              </div>
            </>
          )}
          {(coinstalled.rawHtmlV2 || coinstalled.genui || rawHtmlV2Missing) && (
            <p className={css.hint}>
              {mode === 'native' && (coinstalled.rawHtmlV2 || coinstalled.genui)
                ? `检测到 ${[coinstalled.rawHtmlV2 ? 'raw-html-v2' : '', coinstalled.genui ? 'genui' : ''].filter(Boolean).join('、')}:dsh-ui 围栏与 VCP 卡(html 围栏/转义文本)已由本插件双视图接管(genui 已接管的围栏自动让位),建议禁用原插件(教学统一、免双引擎)。`
                : ''}
              {rawHtmlV2Missing ? '委托模式需要 raw-html-v2 已安装并启用。' : ''}
            </p>
          )}
        </div>
      )}
      <div className={css.cluster}>
        <button
          type="button"
          className={`${css.capsule} ${mode === 'native' ? css.capsuleOn : ''}`}
          onClick={() => prefs.actions.setRenderMode?.(mode === 'native' ? 'delegate' : 'native')}
          aria-pressed={mode === 'native'}
          title="渲染模式:原生分段 / 委托外部"
        >{mode === 'native' ? '分段' : '委托'}</button>
        <button
          type="button"
          className={`${css.capsule} ${segmentCards ? css.capsuleOn : ''}`}
          onClick={() => prefs.actions.setSegmentCards?.(!segmentCards)}
          aria-pressed={segmentCards}
          title="分段卡片渲染开关"
        >{segmentCards ? '卡片' : '卡片关'}</button>
        <button
          type="button"
          className={`${css.capsule} ${collapse ? css.capsuleOn : ''}`}
          onClick={() => prefs.actions.setCardCollapseDefault?.(!collapse)}
          aria-pressed={collapse}
          title="不可渲染卡源码默认折叠"
        >{collapse ? '折叠' : '展开'}</button>
        <button
          type="button"
          className={css.capsule}
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-label="渲染设置面板"
          title="渲染设置面板"
        >{open ? '×' : '⚙'}</button>
      </div>
    </div>
  )
})
