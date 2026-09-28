import z from "schemastery";
//#region src/dsh-tidy-display.ts
/** Settings namespace (browser half binds the same namespace). */
const TIDYDISPLAY_SETTINGS_NAMESPACE = "tidy-display";
const RAIL_COLOR_KEYS = ["auto", "custom"];
const RAIL_SIDE_KEYS = ["left", "right"];
const RAIL_STYLE_KEYS = ["bar", "dot"];
const Config = z.object({
	railEnabled: z.boolean().default(true),
	railSide: z.union(RAIL_SIDE_KEYS).default("left"),
	railStyle: z.union(RAIL_STYLE_KEYS).default("bar"),
	railRing: z.boolean().default(true),
	railColor: z.union(RAIL_COLOR_KEYS).default("auto"),
	railColorCustom: z.string().default(""),
	railAccent: z.union(RAIL_COLOR_KEYS).default("auto"),
	railAccentCustom: z.string().default(""),
	autoLoad: z.boolean().default(true)
});
const name = "@drscrewdriver/dsh-tidy-display";
const inject = [];
function apply(ctx, config) {
	ctx.inject(["settings"], (settingsCtx) => {
		const settings = settingsCtx.settings;
		if (typeof settings?.installSection === "function") settings.installSection(ctx, TIDYDISPLAY_SETTINGS_NAMESPACE, Config, config ?? {}, {
			setSource: () => {},
			onChange: () => {}
		});
		else if (typeof settings?.register === "function") settings.register(TIDYDISPLAY_SETTINGS_NAMESPACE, Config, { base: config ?? {} });
	});
}
//#endregion
export { Config, RAIL_COLOR_KEYS, RAIL_SIDE_KEYS, RAIL_STYLE_KEYS, TIDYDISPLAY_SETTINGS_NAMESPACE, apply, inject, name };
