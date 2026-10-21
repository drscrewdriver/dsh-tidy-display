import { useEffect, useLayoutEffect } from 'react';
import { ReaderEntryPolicy, readerEntryRequested } from './entry-policy.js';
// R3: the reader hides the host composer (输入框区域). The composer card lives
// OUTSIDE the reader `.root` subtree, so a Reader.module.css rule cannot reach
// it; we publish a document-level flag that injected global CSS keys off. The
// reader root carries the stable, hash-independent attr `data-dsh-tidy-display`
// (set on the root in Reader.tsx), so the same global CSS reclaims the reader's
// own composer-reserved gutters — root padding-inline-end, .jumpDock bottom
// offset, reasoning scroll-margin — all of which read --dsh-composer-height /
// …-side-clearance — without depending on the CSS-Module hash. Mirrors the
// RailView global-<style> + `html[data-*]` convention.
const READER_ATTR = 'data-tidychat-reader';
let readerCssInjected = false;
let readerOwners = 0;
function ensureReaderComposerCss() {
    if (readerCssInjected || typeof document === 'undefined')
        return;
    readerCssInjected = true;
    const style = document.createElement('style');
    style.textContent = `
html[${READER_ATTR}] [data-composer-seat],
html[${READER_ATTR}] [data-composer-card] { display: none !important; }
html[${READER_ATTR}] [data-dsh-tidy-display] {
  --dsh-composer-side-clearance: 0px;
  --dsh-composer-height: 0px;
}
`;
    document.head.appendChild(style);
}
function isConversationStore(store) {
    return typeof store === 'object' && store !== null
        && store.spec.persist === 'dsh.conversation'
        && typeof store.spec.actions.setView === 'function';
}
function ReaderEntry({ useStore, actions, policy }) {
    const view = useStore(state => state.view);
    useLayoutEffect(() => {
        const next = policy.select(view);
        if (next)
            actions.setView(next);
    }, [view, actions, policy]);
    // R3: mark the document while the reader view is active so the injected CSS
    // hides the composer and reclaims its reserved space. Refcounted because the
    // entry can be torn down before/after sibling reads; the flag is cleared only
    // when no reader instance remains (switching reader→chat unmounts this).
    useEffect(() => {
        if (typeof document === 'undefined' || view !== 'reader')
            return;
        ensureReaderComposerCss();
        readerOwners += 1;
        document.documentElement.setAttribute(READER_ATTR, '1');
        return () => {
            readerOwners = Math.max(0, readerOwners - 1);
            if (readerOwners === 0)
                document.documentElement.removeAttribute(READER_ATTR);
        };
    }, [view]);
    return null;
}
/** Reuse the native store handle; its framework-owned instance preserves drafts. */
export function installReaderEntry(ctx) {
    const native = ctx.slots.entriesOfSlot('conversation.session')[0]?.store;
    if (!isConversationStore(native))
        throw new Error('DSH Reader cannot bind the native conversation view store.');
    const policy = new ReaderEntryPolicy(readerEntryRequested(location.search), () => {
        const url = new URL(location.href);
        url.searchParams.delete('reader');
        history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
    });
    return ctx.slots.register({
        name: 'conversation.input.dock',
        id: 'dsh-tidy-display-entry',
        store: native,
        inject: () => ({ policy }),
    }, ReaderEntry);
}
//# sourceMappingURL=entry.js.map