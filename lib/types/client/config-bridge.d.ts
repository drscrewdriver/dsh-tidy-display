import type { Context } from '@deepseek-ai/cordis';
/** Store-facing slice the bridge needs (baked actions + snapshot source). */
interface PrefsFace {
    getSnapshot(): Record<string, unknown>;
    subscribe(fn: () => void): () => void;
    actions: Record<string, ((value: never) => void) | undefined>;
}
export declare function installConfigBridge(ctx: Context, prefs: PrefsFace): void;
export {};
//# sourceMappingURL=config-bridge.d.ts.map