/**
 * VCP engine render core — ported from dsh-raw-html-v2 lib/client.js
 * 2799-2908 (VcpRootFontGuard / vcpSettleMemo / vcpEngineRender) plus
 * vcpPageRender (:2913-2931) and scopePageCss (segmentation.ts).
 *
 * Feed card HTML (closed or streaming half) to the engine on window.__vcpStable;
 * the engine produces React elements with streaming increments, per-message
 * scoping, font locking and self-healing. This layer only transports
 * "segment → engine" and never rewrites render logic.
 *
 * Port notes (vs upstream):
 * - Font URL compat normalizes /fonts/ → /tidy-display/fonts/ (upstream used
 *   /fonts-v2/); the plugin's own font route serves whatever assets exist, and
 *   a missing route degrades to the system font chain (graceful, per findings).
 * - Debug frame logging stays throttled at 500ms.
 */
import { createElement, type ReactNode } from 'react'
import { scopePageCss } from './segmentation.js'
import { vcpFontUrlCompat } from './shims.js'
import { engineUnavailablePlaceholder, isVcpEngineReady } from './bootstrap.js'

interface VcpEngineWindow extends Window {
  __vcpStable?: {
    render?: (html: string, streaming?: boolean) => unknown
    fixBlank?: (html: string) => string
  }
}

/** 根容器字体 DOM 锁定:display:contents 守卫包住引擎产物,ref 挂载时(每帧 commit
 *  幂等)对根容器 setProperty('font-family', …, 'important')——流式与 settle 后一致
 *  执行,根字体即时生效、永不回退、零结构干扰。 */
export function VcpRootFontGuard(props: { children?: ReactNode }): ReactNode {
  return createElement('div', {
    style: { display: 'contents' },
    ref: (el: HTMLDivElement | null): void => {
      if (!el || !el.querySelector) return
      try {
        const root = el.querySelector('[id^="vcp-msg-"], [id="vcp-root"]') as HTMLElement | null
        if (!root || !root.style) return
        const fam = root.style.fontFamily
        if (fam && fam.indexOf('!important') === -1 && fam.indexOf('important') === -1) {
          root.style.setProperty('font-family', fam, 'important')
        }
      } catch {
        // DOM 字体锁权失败不致命:引擎侧 !important 规则仍在
      }
    },
  }, props.children)
}

// settle 复用缓存:引擎 settle 帧(streaming=false)走 fullRender——每次全新建树,
// 与流式闭合帧叠加 = 「渲染完又闪一下」。按 (key + html) 记住最后一次引擎产物:
// settle 帧内容与上帧一致 → 直接复用上帧元素(已挂载 DOM,React diff 零更新 → 零闪)。
const vcpSettleMemo = new Map<string, { html: string; el: unknown }>()
const VCP_SETTLE_MEMO_MAX = 16

let vcpDbgLast = 0

/** 卡 HTML(闭合或流式半截)→ React 元素:喂 v1 引擎;引擎未就绪给轻量占位。 */
export function vcpEngineRender(html: string, streaming: boolean, key?: string | number | null): ReactNode {
  const w = typeof window === 'undefined' ? undefined : window as VcpEngineWindow
  if (!isVcpEngineReady() || !w?.__vcpStable || typeof w.__vcpStable.render !== 'function') {
    // 引擎未就绪(同步加载在 client 启动早期完成,几乎不会走到;路由缺失/重试耗尽时
    // 停在此处,外层卡组件负责降级为折叠源码卡)
    return createElement('div', {
      key: key as never,
      style: { padding: '6px 0', fontSize: '12px', color: 'var(--dsw-alias-label-tertiary,#999)' },
    }, engineUnavailablePlaceholder(streaming))
  }
  const memoKey = key === undefined || key === null ? '' : String(key)
  let el: unknown = null
  let rawHtml = String(html || '')
  // 字体路径兼容垫片:模型输出沿用 v1 路径 url('/fonts/…'),归一到本插件路由
  rawHtml = vcpFontUrlCompat(rawHtml)
  // settle 复用:非流式且内容与 memo 一致 → 直接返回上帧元素(跳过引擎 fullRender)
  if (streaming !== true && memoKey) {
    const hit = vcpSettleMemo.get(memoKey)
    if (hit && hit.html === rawHtml && hit.el !== null) {
      return createElement(VcpRootFontGuard, { key: key as never }, hit.el as ReactNode)
    }
  }
  try {
    // 与 v1 宿主一致的前处理:fixBlank 压缩 vcp-root 内空行 + 前置空行兜底
    if (typeof w.__vcpStable.fixBlank === 'function') {
      try { rawHtml = w.__vcpStable.fixBlank(rawHtml) } catch { /* fixBlank 失败按原文渲染 */ }
    }
    el = w.__vcpStable.render(rawHtml, streaming === true)
  } catch (e) {
    console.warn('[dsh-tidy-display] v1 引擎 render 异常,回退文本', (e as Error)?.message ?? e)
  }
  // 帧级诊断(节流 500ms)
  const nowDbg = Date.now()
  if (nowDbg - vcpDbgLast > 500) {
    vcpDbgLast = nowDbg
    try {
      console.debug('[vcp-tidy-frame] len=' + rawHtml.length + ' streaming=' + (streaming === true) + ' el=' + (el === null || el === undefined ? 'NULL' : 'OK') + ' head=' + rawHtml.slice(0, 60).replace(/\s+/g, ' '))
    } catch { /* 诊断日志失败不影响渲染 */ }
  }
  if (el === null || el === undefined) return null
  if (memoKey) {
    try {
      vcpSettleMemo.set(memoKey, { html: rawHtml, el })
      if (vcpSettleMemo.size > VCP_SETTLE_MEMO_MAX) {
        const it = vcpSettleMemo.keys().next()
        if (!it.done) vcpSettleMemo.delete(it.value)
      }
    } catch { /* memo 写入失败只损失零闪优化 */ }
  }
  return createElement(VcpRootFontGuard, { key: key as never }, el as ReactNode)
}

/** 整页 HTML 渲染:style 内 html/body 脱敏为 .vcp-page-host 后喂引擎;外层 frame
 *  (限高滚动)+ host(承接页面级样式,防 body{…} 全局污染)。 */
export function vcpPageRender(rawHtml: string, streaming: boolean, key?: string | number | null): ReactNode {
  const html = scopePageCss(rawHtml)
  const inner = vcpEngineRender(html, streaming)
  if (inner === null || inner === undefined) return null
  return createElement('div', {
    key: key as never,
    style: {
      boxSizing: 'border-box', width: '100%', margin: '2px 0',
      borderRadius: '10px', overflow: 'auto', maxHeight: '72vh',
      border: '1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.1))',
      background: 'var(--dsw-alias-bg-overlay,#ffffff)',
    },
  },
    createElement('div', {
      className: 'vcp-page-host',
      style: { boxSizing: 'border-box', width: '100%' },
    }, inner))
}

/** 清空 settle memo(卡结构变化/内存压力时可用)。 */
export function clearVcpSettleMemo(): void {
  vcpSettleMemo.clear()
}
