import { READER_CONFIG_DEFAULTS, READER_CONFIG_FIELDS } from '../reader-prefs.js';
function configFormsOf(ctx) {
    const forms = ctx.get?.('configForms');
    if (forms && typeof forms.get === 'function')
        return forms;
    return undefined;
}
export function installConfigBridge(ctx, prefs) {
    const forms = configFormsOf(ctx);
    if (!forms)
        return; // legacy host: the persist key stays the only copy
    const lastKnown = new Map();
    const disposers = [];
    const push = (field, value, form) => {
        lastKnown.set(field, value);
        void form.set(field, value).catch(() => { });
    };
    const applyField = (field, value) => {
        const set = prefs.actions[`set${field[0].toUpperCase()}${field.slice(1)}`];
        set?.(value);
    };
    const attach = (form) => {
        // store → config
        disposers.push(prefs.subscribe(() => {
            const snap = form.getSnapshot();
            if (snap.status !== 'ready' || !snap.writable)
                return;
            const store = prefs.getSnapshot();
            for (const field of READER_CONFIG_FIELDS) {
                const value = store[field];
                if (value === undefined || Object.is(value, lastKnown.get(field)))
                    continue;
                push(field, value, form);
            }
        }));
        const drain = () => {
            const snap = form.getSnapshot();
            if (snap.status !== 'ready')
                return;
            const store = prefs.getSnapshot();
            for (const field of READER_CONFIG_FIELDS) {
                const configValue = snap.value?.[field];
                if (configValue === undefined) {
                    // migration: an absent config field adopts a non-default store value once
                    const storeValue = store[field];
                    if (snap.writable && storeValue !== undefined && !Object.is(storeValue, READER_CONFIG_DEFAULTS[field]) && !lastKnown.has(field)) {
                        push(field, storeValue, form);
                    }
                    else if (storeValue !== undefined && !lastKnown.has(field)) {
                        // default-valued absent field: pin it so later unrelated store
                        // changes don't sweep the default into the config section
                        lastKnown.set(field, storeValue);
                    }
                    continue;
                }
                if (Object.is(configValue, lastKnown.get(field)))
                    continue;
                lastKnown.set(field, configValue);
                if (!Object.is(configValue, store[field]))
                    applyField(field, configValue);
            }
        };
        // config → store
        disposers.push(form.subscribe(drain));
        drain(); // in case the form was already ready before this attach
    };
    const form = forms.get?.('tidy-display');
    if (form)
        attach(form);
    // attach later when the host starts serving the namespace
    if (typeof forms.whileServed === 'function') {
        disposers.push(forms.whileServed(['tidy-display'], () => {
            if (!form) {
                const again = forms.get?.('tidy-display');
                if (again)
                    attach(again);
            }
        }));
    }
    ctx.effect(() => () => {
        for (const off of disposers) {
            try {
                off();
            }
            catch { /* already gone */ }
        }
    });
}
//# sourceMappingURL=config-bridge.js.map