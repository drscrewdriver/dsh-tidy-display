/** Minimal structural face of the host module (avoid a hard type dependency). */
export interface SnapshotStoreLike<T> {
    getSnapshot(): T;
    subscribe(fn: () => void): () => void;
    update(mutator: (draft: T) => void): void;
    set(next: T): void;
}
export interface StoreInstanceLike<T, A> {
    readonly actions: A;
    getSnapshot(): T;
    subscribe(fn: () => void): () => void;
    clearPersisted(): void;
}
export interface StoreHandleLike<T, A> {
    readonly spec: {
        init: () => T;
        persist?: string;
        actions: Record<string, (draft: T, ...params: any[]) => void>;
    };
    create(scopeKey?: string): StoreInstanceLike<T, A>;
}
declare function fallbackCreateSnapshotStore<T>(initial: T): SnapshotStoreLike<T>;
declare function fallbackDefineStore<T extends object, A extends Record<string, (draft: T, ...params: any[]) => void>>(spec: {
    init: () => T;
    persist?: string;
    actions: A;
}): StoreHandleLike<T, A>;
export declare const defineStore: typeof fallbackDefineStore;
export declare const createSnapshotStore: typeof fallbackCreateSnapshotStore;
export {};
//# sourceMappingURL=store-face.d.ts.map