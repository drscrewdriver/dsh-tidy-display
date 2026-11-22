/**
 * VCP error boundary — ported from dsh-raw-html-v2 lib/client.js 3327-3349.
 * A caught render error degrades THIS card only and never lets the slot/Reader
 * tree abdicate.
 */
import { Component, createElement, type ReactNode } from 'react'

interface BoundaryProps { children?: ReactNode }
interface BoundaryState { err: Error | null }

export class VcpErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  override state: BoundaryState = { err: null }

  static getDerivedStateFromError(err: Error): BoundaryState {
    return { err }
  }

  override componentDidCatch(err: Error, info: unknown): void {
    console.error('[dsh-tidy-display] 渲染边界捕获(本卡已降级显示,不影响其余内容)', err, err?.stack ?? '', info)
  }

  override render(): ReactNode {
    if (this.state.err !== null) {
      return createElement('div', {
        style: {
          padding: '10px 12px', borderRadius: '8px', fontSize: '12px', lineHeight: '1.6',
          color: 'var(--dsw-alias-label-tertiary,#888)',
          background: 'var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.04))',
          border: '1px dashed var(--dsw-alias-border-l2,rgba(0,0,0,.18))',
        },
      }, '本卡渲染异常,已局部降级(其余内容不受影响)。请在浏览器 console 查找 [dsh-tidy-display] 渲染边界捕获 的错误详情并反馈。')
    }
    return this.props.children
  }
}
