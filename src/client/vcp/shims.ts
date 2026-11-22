/**
 * vc/hp shims — ported from dsh-raw-html-v2 lib/client.js 2700-2788.
 *
 * The engine (vcp-engine-v1.js) is a self-contained IIFE whose free symbols are
 * `vc` (DOM node → React element with safety filtering), `hp` (CSS string →
 * camelCase object) and `f` ({Fragment, jsx}) — injected at bootstrap time via
 * `new Function('vc','hp','f', src)`.
 *
 * Port notes (vs upstream):
 * - The trusted-mode branch is REMOVED by design: tidy-display never provides
 *   `window.__vcpTrusted`, so `on*` handlers other than the `onclick="input('…')"`
 *   bridge are always stripped (upstream strips them too in the default path).
 * - `window.__dshInput` stays the composer-fill bridge; the tidy card component
 *   installs it from `ComposerFillContext` (see vcp/input-bridge.ts).
 */
import { createElement, type ReactNode } from 'react'

/** vc 用:内联 style 安全过滤(与 v1 宿主 vc 同规则)。 */
export function vcpFilterStyle(sv: string): string {
  return String(sv || '')
    .replace(/position\s*:\s*fixed\s*;?/gi, '')
    .replace(/z-index\s*:\s*\d{4,}\s*;?/gi, '')
    .replace(/(?<![\w-])content\s*:[^;]*;?/gi, '')
}

/** hp:CSS 声明串 → camelCase 对象(引擎 parseOpen/属性转换用)。 */
export function vcpHpShim(s: string): Record<string, string> {
  const r: Record<string, string> = {}
  const parts = String(s || '').split(';')
  for (let i = 0; i < parts.length; i++) {
    const idx = parts[i].indexOf(':')
    if (idx === -1) continue
    const k = parts[i].slice(0, idx).trim().replace(/-([a-z])/g, (h, p: string) => p.toUpperCase())
    r[k] = parts[i].slice(idx + 1).trim()
  }
  return r
}

export function vcpAllowHref(v: string): boolean { return /^(https?:|mailto:|\/|#)/i.test(v) }
export function vcpAllowSrc(v: string): boolean { return /^(https?:|data:image\/|\/|#)/i.test(v) }

declare global {
  interface Window {
    __dshInput?: (text: string) => void
  }
}

/** vc:DOM 节点 → React 元素(安全过滤 + onclick 桥 window.__dshInput)。
 *  script/object/embed 一律丢弃;iframe 仅放行 https/http/相对 src。 */
export function vcpVcShim(node: Node | null | undefined, key: string | number | null): ReactNode {
  if (!node) return null
  if (node.nodeType === 3) return node.textContent
  if (node.nodeType !== 1) return null
  const el = node as Element
  const tag = el.localName
  if (tag === 'script' || tag === 'object' || tag === 'embed') return null
  if (tag === 'iframe') {
    const fsrc = el.getAttribute('src') ?? ''
    if (!/^(https?:|\/)/i.test(fsrc)) return null
  }
  const props: Record<string, unknown> = { key }
  const attributes = el.attributes
  for (let i = 0; i < attributes.length; i++) {
    const c = attributes[i]
    const nm = c.name
    if (nm === 'onclick') {
      // 唯一放行的交互:input('...') 桥 → React onClick → window.__dshInput 回填输入框
      const m = /^input\s*\(\s*['"]([\s\S]*?)['"]\s*\)\s*;?\s*$/.exec(c.value)
      if (m) props.onClick = () => { const fn = window.__dshInput; if (fn) fn(m[1]) }
      // 其余自定义 onclick(原版可信模式通道)不移植:主页面永不执行模型 JS
      continue
    }
    if (/^on/i.test(nm)) continue // onchange/onmouseover/… 一律剥离
    if (nm === 'style') { props.style = vcpHpShim(vcpFilterStyle(c.value)); continue }
    if (nm === 'class') { props.className = c.value; continue }
    if (nm === 'href' && !vcpAllowHref(c.value)) continue
    if (nm === 'src' && !vcpAllowSrc(c.value)) continue
    if (nm === 'allowfullscreen') { props.allowFullScreen = true; continue } // React 驼峰
    props[nm] = c.value
  }
  const kids: ReactNode[] = []
  const childNodes = el.childNodes
  for (let j = 0; j < childNodes.length; j++) {
    const ch = vcpVcShim(childNodes[j], j)
    if (ch !== null && ch !== undefined) kids.push(ch)
  }
  return createElement(tag, props, kids.length ? kids : undefined)
}

/** 字体 url 路径兼容:url('/fonts/…') → url('/tidy-display/fonts/…')(v1 协议旧路径
 *  兜底归一;幂等——tidy 路由前缀不会被 /fonts/ 规则命中)。 */
export function vcpFontUrlCompat(html: string): string {
  return String(html || '').replace(/url\(\s*(['"]?)\/fonts\//gi, 'url($1/tidy-display/fonts/')
}
