/** Select the reading view on entry, without fighting a later explicit tab choice. */
export class ReaderEntryPolicy {
    requested;
    consumeRequest;
    entered = false;
    constructor(requested, consumeRequest = () => { }) {
        this.requested = requested;
        this.consumeRequest = consumeRequest;
    }
    select(view) {
        const requested = !this.entered && this.requested;
        if (!this.entered) {
            this.entered = true;
            if (this.requested)
                this.consumeRequest();
        }
        // R2: default tab is 对话 — only an explicit ?reader=1 request (this.requested)
        // lands on the reader. A null view no longer forces reader; the host's own
        // default (chat) stays. Explicit reader still works on entry.
        return requested && view !== 'reader' ? 'reader' : null;
    }
}
export function readerEntryRequested(search) {
    const value = new URLSearchParams(search).get('reader');
    return value === '1' || /^0\.1\.0-trial\.\d+$/.test(value ?? '');
}
//# sourceMappingURL=entry-policy.js.map