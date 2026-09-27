/** Select the reading view on entry, without fighting a later explicit tab choice. */
export declare class ReaderEntryPolicy {
    private readonly requested;
    private readonly consumeRequest;
    private entered;
    constructor(requested: boolean, consumeRequest?: () => void);
    select(view: string | null | undefined): 'reader' | null;
}
export declare function readerEntryRequested(search: string): boolean;
//# sourceMappingURL=entry-policy.d.ts.map