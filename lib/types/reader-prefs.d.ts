/**
 * Reader preference metadata shared by the host Config schema and the client
 * bridge — deliberately free of schemastery (and of any host-only import) so
 * the client bundle can use it verbatim.
 */
/** Resolved shape cordis hands to `apply`; raw patch values may be partial. */
export interface ReaderConfig {
    motion: boolean;
    foldIntensity: 0 | 1 | 2;
    frostedGlass: boolean;
    bubbles: boolean;
    /** 分段分发渲染总开关：dsh-ui 围栏 / vcp-root 卡 / 围栏包裹 vcp 卡在阅读视图渲染为卡片。 */
    segmentCards: boolean;
    /** 不可渲染段（解析失败/引擎缺失/校验未过）默认折叠展示源码，不裸撒。 */
    cardCollapseDefault: boolean;
    /** 阅读视图渲染模式：native = 原生分段；delegate = 委托外部 shadow 渲染器（raw-html-v2 等）。 */
    renderMode: 'native' | 'delegate';
    deliverableOpenMode: 'external' | 'sidebar';
    railEnabled: boolean;
    railSide: 'left' | 'right';
    railStyle: 'bar' | 'dot';
    railRing: boolean;
    hideOfficialNav: boolean;
    railColor: string;
    railColorCustom: string;
    railColorLight: string;
    railAccent: string;
    railAccentCustom: string;
    railAccentLight: string;
}
/** Config field names — the volatile projection's key set (lockstep with the schema). */
export declare const READER_CONFIG_FIELDS: readonly ["motion", "foldIntensity", "frostedGlass", "bubbles", "segmentCards", "cardCollapseDefault", "renderMode", "deliverableOpenMode", "railEnabled", "railSide", "railStyle", "railRing", "hideOfficialNav", "railColor", "railColorCustom", "railColorLight", "railAccent", "railAccentCustom", "railAccentLight"];
export type ReaderConfigField = (typeof READER_CONFIG_FIELDS)[number];
/** Defaults mirror `createReaderStore().init` — the migration's "non-default" test. */
export declare const READER_CONFIG_DEFAULTS: Record<ReaderConfigField, unknown>;
//# sourceMappingURL=reader-prefs.d.ts.map