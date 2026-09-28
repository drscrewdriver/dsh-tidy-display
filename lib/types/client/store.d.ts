import type { EngineStoreHandle } from '@deepseek-ai/dsh-client-store';
/**
 * Rail-only prefs for the legacy (pre-0.1.7) compat lines. The reader-face
 * fields from main are gone; the persist key stays `dsh.reader.v1` so a
 * profile that once ran the 0.1.7 line keeps its rail choices.
 */
export interface RailState {
    railEnabled: boolean;
    railSide: 'left' | 'right';
    railStyle: 'bar' | 'dot';
    /** White sheen beneath current/hover marks. */
    railRing: boolean;
    /** Hide the official TurnNavigator (0.1.2+; absent on 0.1.1). */
    hideOfficialNav: boolean;
    /** Rail palette (ported from dsh-tidychat): auto / hue×lightness / custom. */
    railColor: string;
    railColorCustom: string;
    railColorLight: string;
    railAccent: string;
    railAccentCustom: string;
    railAccentLight: string;
    /** Auto-click the host "load earlier" button under the Governor budget. */
    autoLoad: boolean;
}
type RailActions = {
    setRailEnabled: (draft: RailState, value: boolean) => void;
    setRailSide: (draft: RailState, value: 'left' | 'right') => void;
    setRailStyle: (draft: RailState, value: 'bar' | 'dot') => void;
    setRailRing: (draft: RailState, value: boolean) => void;
    setHideOfficialNav: (draft: RailState, value: boolean) => void;
    setRailColor: (draft: RailState, value: string) => void;
    setRailColorCustom: (draft: RailState, value: string) => void;
    setRailColorLight: (draft: RailState, value: string) => void;
    setRailAccent: (draft: RailState, value: string) => void;
    setRailAccentCustom: (draft: RailState, value: string) => void;
    setRailAccentLight: (draft: RailState, value: string) => void;
    setAutoLoad: (draft: RailState, value: boolean) => void;
};
export declare function createRailStore(): EngineStoreHandle<RailState, RailActions>;
export {};
//# sourceMappingURL=store.d.ts.map