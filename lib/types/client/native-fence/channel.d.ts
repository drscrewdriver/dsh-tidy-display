export interface NativeFenceChannel {
    setEnabled(on: boolean): void;
    dispose(): void;
}
/** Install the channel. Returns a controller; `setEnabled` starts/stops the
 * observer without losing the pref subscription, `dispose` tears everything
 * down and restores every stock block. */
export declare function installNativeFenceChannel(options: {
    /** Reactive gate — checked at every sweep entry and on toggle. */
    getEnabled: () => boolean;
}): NativeFenceChannel;
//# sourceMappingURL=channel.d.ts.map