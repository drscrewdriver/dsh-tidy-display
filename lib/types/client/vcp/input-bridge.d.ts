/**
 * window.__dshInput composer-fill bridge — the VCP protocol's interaction
 * channel (`onclick="input('…')"`) routes through this global. Ported concept
 * from dsh-raw-html-v2 (client.js defines it once globally); here it is wired
 * per-mount from the Reader's `ComposerFillContext` with reference counting so
 * the bridge always points at the currently-mounted card's session.
 */
import { type RefObject } from 'react';
/** 挂桥:首个卡片 mount 时安装;卸载时引用计数归零才拆除(防陈旧闭包填错会话)。 */
export declare function useDshInputBridge(fillComposer: RefObject<((text: string) => boolean) | undefined>): void;
//# sourceMappingURL=input-bridge.d.ts.map