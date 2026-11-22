/**
 * VCP engine bootstrap — ported from dsh-raw-html-v2 lib/client.js 2816-2843.
 *
 * Loads assets/vendor/vcp-engine-v1.js (self-contained IIFE, free symbols vc/hp/f)
 * via synchronous XHR from the plugin's own static route, executes it with the
 * shims, and parks the engine on `window.__vcpStable` (render/fixBlank). Failure
 * retries 5×/500ms; idempotent via the `__vcpStable.render` readiness check.
 *
 * Port notes (vs upstream):
 * - URL is the tidy-display vendor route (node half registers /tidy-display/vendor/).
 * - Not auto-invoked at module scope (upstream loads before apply): the client
 *   entry calls `bootstrapVcpEngine()` guarded by `typeof window !== 'undefined'`,
 *   so Node test environments can import these modules safely.
 * - `f` MUST wrap `jsx` — the React main object has no `.jsx` (it lives in
 *   jsx-runtime); upstream注释 records the streaming-path crash when unwrapped.
 */
import { Fragment, createElement } from 'react'
import { vcpHpShim, vcpVcShim } from './shims.js'

export const VCP_ENGINE_URL = '/tidy-display/vendor/vcp-engine-v1.js'

interface VcpEngineWindow extends Window {
  __vcpStable?: {
    render?: (html: string, streaming?: boolean) => unknown
    fixBlank?: (html: string) => string
  }
}

const state = { tried: 0, ready: false }

/** 引擎是否已就绪(挂 window.__vcpStable.render)。 */
export function isVcpEngineReady(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean((window as VcpEngineWindow).__vcpStable && typeof (window as VcpEngineWindow).__vcpStable!.render === 'function')
}

/** 加载 v1 渲染引擎(同步 XHR,本地静态文件秒回;失败异步重试 5 次)。幂等。 */
export function ensureVcpEngine(): void {
  if (typeof window === 'undefined') return
  if (isVcpEngineReady()) { state.ready = true; return }
  if (state.tried > 5) return
  state.tried += 1
  try {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', VCP_ENGINE_URL, false)
    xhr.send()
    if (xhr.status === 200 && xhr.responseText && xhr.responseText.indexOf('__vcpStable') !== -1) {
      // f 必须提供 jsx/Fragment(引擎流式组装路径调用 f.jsx)——React 主对象没有 .jsx
      // 方法(在 jsx-runtime),用 createElement 等价实现。漏包 → 流式路径每帧
      // `f.jsx is not a function`,卡只能等 settle 走 fullRender 才整块出现。
      const fn = new Function('vc', 'hp', 'f', xhr.responseText)
      const vcpF = { Fragment, jsx: createElement }
      fn(vcpVcShim, vcpHpShim, vcpF)
      state.ready = isVcpEngineReady()
      if (state.ready) return
    }
  } catch (e) {
    console.warn('[dsh-tidy-display] vcp-engine 同步加载失败', (e as Error)?.message ?? e)
  }
  window.setTimeout(ensureVcpEngine, 500)
}

/** 客户端入口调用(带环境守卫);幂等,重复调用只是重试计数继续。 */
export function bootstrapVcpEngine(): void {
  if (typeof window === 'undefined') return
  if (isVcpEngineReady()) { state.ready = true; return }
  ensureVcpEngine()
}

/** 引擎未就绪时卡片占位文本(渲染层用)。 */
export function engineUnavailablePlaceholder(streaming: boolean): string {
  return streaming ? '✦ 正在生成视觉卡片…' : '(VCP 渲染引擎未就绪,已折叠显示源码)'
}
