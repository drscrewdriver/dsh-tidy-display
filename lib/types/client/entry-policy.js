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
        return (requested || view == null) && view !== 'reader' ? 'reader' : null;
    }
}
export function readerEntryRequested(search) {
    const value = new URLSearchParams(search).get('reader');
    return value === '1' || /^0\.1\.0-trial\.\d+$/.test(value ?? '');
}
//# sourceMappingURL=entry-policy.js.map