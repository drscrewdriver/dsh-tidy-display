function fallbackCreateSnapshotStore(initial) {
    let value = initial;
    const listeners = new Set();
    const notify = () => { for (const l of [...listeners])
        l(); };
    return {
        getSnapshot: () => value,
        subscribe(fn) { listeners.add(fn); return () => { listeners.delete(fn); }; },
        update(mutator) {
            const draft = structuredClone(value);
            mutator(draft);
            value = draft;
            notify();
        },
        set(next) { value = next; notify(); },
    };
}
function fallbackDefineStore(spec) {
    return {
        spec,
        create(scopeKey) {
            let state = spec.init();
            const listeners = new Set();
            const persistKey = spec.persist ? (scopeKey ? `${spec.persist}.${scopeKey}` : spec.persist) : undefined;
            if (persistKey) {
                try {
                    const raw = localStorage.getItem(persistKey);
                    if (raw)
                        state = { ...state, ...JSON.parse(raw) };
                }
                catch { /* corrupted persisted value → fresh state */ }
            }
            const commit = () => {
                if (persistKey) {
                    try {
                        localStorage.setItem(persistKey, JSON.stringify(state));
                    }
                    catch { /* quota/private mode → session-only */ }
                }
                for (const l of [...listeners])
                    l();
            };
            const actions = {};
            for (const [name, fn] of Object.entries(spec.actions)) {
                ;
                actions[name] = (...params) => {
                    const draft = structuredClone(state);
                    fn(draft, ...params);
                    state = draft;
                    commit();
                };
            }
            return {
                actions,
                getSnapshot: () => state,
                subscribe(fn) { listeners.add(fn); return () => { listeners.delete(fn); }; },
                clearPersisted() {
                    if (persistKey) {
                        try {
                            localStorage.removeItem(persistKey);
                        }
                        catch { /* ignore */ }
                    }
                },
            };
        },
    };
}
function loadHostModule() {
    try {
        const mod = require('@deepseek-ai/dsh-client-store');
        if (mod && typeof mod.defineStore === 'function' && typeof mod.createSnapshotStore === 'function')
            return mod;
    }
    catch { /* old line: module not materialized */ }
    return undefined;
}
const hostModule = loadHostModule();
export const defineStore = hostModule ? hostModule.defineStore : fallbackDefineStore;
export const createSnapshotStore = hostModule ? hostModule.createSnapshotStore : fallbackCreateSnapshotStore;
//# sourceMappingURL=store-face.js.map