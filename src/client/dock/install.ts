/**
 * Dock installer — body-mounts the RenderDock via its own React root at client
 * entry, so it lives across BOTH the reading view and the native conversation
 * view. No composer injection ([data-composer-card] stays host-owned).
 */
import { createRoot, type Root } from 'react-dom/client'
import { createElement } from 'react'
import { RenderDock, type DockPrefs } from './RenderDock.js'

export function installRenderDock(prefs: DockPrefs): () => void {
  if (typeof document === 'undefined') return () => {}
  const host = document.createElement('div')
  host.dataset.tidyRenderDockRoot = ''
  document.body.appendChild(host)
  let root: Root | null = createRoot(host)
  root.render(createElement(RenderDock, { prefs }))
  return () => {
    // unmount 时移除容器(重复 install 场景由调用方保证单例)
    root?.unmount()
    root = null
    host.remove()
  }
}
