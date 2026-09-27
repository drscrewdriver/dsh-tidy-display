import { useLayoutEffect } from 'react';
import { ReaderEntryPolicy, readerEntryRequested } from './entry-policy.js';
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
        id: 'dsh-better-display-entry',
        store: native,
        inject: () => ({ policy }),
    }, ReaderEntry);
}
//# sourceMappingURL=entry.js.map