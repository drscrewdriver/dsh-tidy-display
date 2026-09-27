export type DeliverableOpenMode = 'external' | 'sidebar';
export interface OpenModeSnapshot {
    getSnapshot: () => {
        deliverableOpenMode?: DeliverableOpenMode;
    };
    subscribe?: (fn: () => void) => () => void;
}
export declare function deliverableOpenModeOf(value: unknown): DeliverableOpenMode;
export declare function modeFromSnapshot(store: OpenModeSnapshot | undefined): DeliverableOpenMode;
/** Workspace-folder affordances stay on the OS opener, not the Sidebar switch. */
export declare function isFolderOpenPath(path: string): boolean;
/**
 * Session-scoped `dsh-resource://file/session/<id>/…` address.
 * Matches official `fileAddressFor` / `sessionFileAddress` (0.1.5).
 */
export declare function fileAddressFor(sessionId: string, cwd: string | undefined, path: string): string;
export declare function resolveOpenWorkspacePath(cwd: string | undefined, path: string, resolveWorkspacePath: (cwd: string | undefined, path: string) => string): string;
export declare function openDeliverableFile(args: {
    path: string;
    mode: DeliverableOpenMode;
    sessionId: string;
    cwd: string | undefined;
    resolveWorkspacePath: (cwd: string | undefined, path: string) => string;
    openExternal: (absolutePath: string) => Promise<void>;
    openSidebar?: (address: string) => void;
    fileAddressFor?: (sessionId: string, cwd: string | undefined, path: string) => string;
    warn?: (message: string, extra?: unknown) => void;
}): Promise<'sidebar' | 'external'>;
//# sourceMappingURL=open-file.d.ts.map