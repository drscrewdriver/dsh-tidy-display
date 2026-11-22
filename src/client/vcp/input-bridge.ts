/**
 * window.__dshInput composer-fill bridge — the VCP protocol's interaction
 * channel (`onclick="input('…')"`) routes through this global. Ported concept
 * from dsh-raw-html-v2 (client.js defines it once globally); here it is wired
 * per-mount from the Reader's `ComposerFillContext` with reference counting so
 * the bridge always points at the currently-mounted card's session.
 */
import { useEffect, type RefObject } from 'react'

interface BridgeWindow extends Window {
  __dshInput?: (text: string) => void
}

let refCount = 0

/** 挂桥:首个卡片 mount 时安装;卸载时引用计数归零才拆除(防陈旧闭包填错会话)。 */
export function useDshInputBridge(fillComposer: RefObject<((text: string) => boolean) | undefined>): void {
  useEffect(() => {
    const fill = fillComposer.current
    if (typeof window === 'undefined' || typeof fill !== 'function') return
    const w = window as BridgeWindow
    const handler = (text: string): void => {
      try { fill(text) } catch (e) {
        console.warn('[dsh-tidy-display] __dshInput 回填失败', e)
      }
    }
    w.__dshInput = handler
    refCount += 1
    return () => {
      refCount -= 1
      if (refCount <= 0 && w.__dshInput === handler) delete w.__dshInput
    }
  }, [fillComposer])
}
