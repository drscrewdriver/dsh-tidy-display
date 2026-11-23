import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import fs, { access, readdir } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import z from "@deepseek-ai/schemastery";
//#region src/skill-status.ts
/** Shared generative-mcpapps identity. Plugin-tree presence is not installation. */
const GENERATIVE_MCPAPPS_SKILL = "generative-mcpapps";
/** Conventional relative roots only. Never expand $HOME or dump host `root.path`. */
const CONVENTIONAL_SKILL_ROOTS = [".dsh/skills", ".agents/skills"];
function skillNameMatches(name) {
	return typeof name === "string" && name === "generative-mcpapps";
}
function skillListIncludes(entries) {
	return Array.isArray(entries) && entries.some((entry) => skillNameMatches(entry?.name));
}
/** Directory bundle `name/SKILL.md` or flat `name.md` at a scanned root. */
function skillRootEntryMatches(entryName) {
	return entryName === "generative-mcpapps" || entryName === `generative-mcpapps.md`;
}
function skillsFromListResult(result) {
	if (Array.isArray(result)) return result;
	if (result === null || typeof result !== "object") return [];
	const record = result;
	if (record.ok === false) return [];
	if (Array.isArray(record.skills)) return record.skills;
	if (record.value && typeof record.value === "object") {
		const value = record.value;
		if (Array.isArray(value.skills)) return value.skills;
		if (Array.isArray(record.value)) return record.value;
	}
	return [];
}
function publicSkillRoots() {
	return CONVENTIONAL_SKILL_ROOTS.map((path) => ({
		source: "conventional",
		path
	}));
}
/**
* Strip host home / pack absolutes before anything user-facing (HTTP or Settings).
* Detection still uses the raw scan; this is the public face.
*/
function toPublicSkillStatus(status) {
	return {
		name: status.name,
		installed: status.installed,
		via: status.via,
		roots: publicSkillRoots()
	};
}
//#endregion
//#region src/skill-roots.ts
function expandHomePath(path, home = homedir()) {
	if (path === "~") return home;
	if (path.startsWith("~/") || path.startsWith("~\\")) return join(home, path.slice(2));
	return path;
}
/** `$DSH_HOME` or `~/.dsh`, matching official `resolveDshHome`. */
function resolveDshHome(env = process.env, home = homedir()) {
	const fromEnv = env.DSH_HOME;
	const selected = fromEnv !== void 0 && fromEnv.trim().length > 0 ? fromEnv : join(home, ".dsh");
	return resolve(expandHomePath(selected, home));
}
/** `$DSH_AGENTS_HOME` or `~/.agents`. */
function resolveAgentsHome(env = process.env, home = homedir()) {
	const fromEnv = env.DSH_AGENTS_HOME;
	const selected = fromEnv !== void 0 && fromEnv.trim().length > 0 ? fromEnv : join(home, ".agents");
	return resolve(expandHomePath(selected, home));
}
function userSkillRoots(env = process.env, home = homedir()) {
	return [{
		source: "user-dsh",
		path: join(resolveDshHome(env, home), "skills")
	}, {
		source: "user-agents",
		path: join(resolveAgentsHome(env, home), "skills")
	}];
}
function projectSkillRoots(projectRoot) {
	return [{
		source: "project-dsh",
		path: join(projectRoot, ".dsh", "skills")
	}, {
		source: "project-agents",
		path: join(projectRoot, ".agents", "skills")
	}];
}
async function findProjectRoot(cwd) {
	let current = resolve(cwd);
	while (true) {
		if (existsSync(join(current, ".git"))) return current;
		const parent = dirname(current);
		if (parent === current) return resolve(cwd);
		current = parent;
	}
}
async function rootHasGenerativeMcpapps(rootPath) {
	let entries;
	try {
		entries = await readdir(rootPath, { withFileTypes: true });
	} catch {
		return false;
	}
	for (const entry of entries) {
		if (entry.name === ".system") continue;
		if (!skillRootEntryMatches(entry.name)) continue;
		if (entry.isDirectory()) try {
			await access(join(rootPath, entry.name, "SKILL.md"));
			return true;
		} catch {
			continue;
		}
		if (entry.isFile()) return true;
	}
	return false;
}
/** Resolve the plugin-shipped pack. This path is never treated as a skill root. */
function pluginSkillPackPath(moduleUrl = import.meta.url) {
	const here = dirname(fileURLToPath(moduleUrl));
	return [
		join(here, "../skills", GENERATIVE_MCPAPPS_SKILL),
		join(here, "../../skills", GENERATIVE_MCPAPPS_SKILL),
		join(here, "skills", GENERATIVE_MCPAPPS_SKILL)
	].find((path) => existsSync(join(path, "SKILL.md")));
}
async function scanGenerativeMcpappsStatus(options = {}) {
	const roots = [...userSkillRoots(options.env ?? process.env, options.home ?? homedir())];
	const cwd = typeof options.cwd === "string" && options.cwd.trim().length > 0 ? isAbsolute(options.cwd) ? options.cwd : resolve(options.cwd) : void 0;
	if (cwd !== void 0) roots.unshift(...projectSkillRoots(await findProjectRoot(cwd)));
	const inspected = [];
	let rootHit = false;
	for (const root of roots) {
		const present = await rootHasGenerativeMcpapps(root.path);
		inspected.push({
			...root,
			present
		});
		if (present) rootHit = true;
	}
	let via = null;
	let listHit = false;
	if (options.listSkills) try {
		listHit = skillListIncludes(await options.listSkills());
		if (listHit) via = "skills.list";
	} catch {}
	if (!listHit && rootHit) via = "skill-root";
	const packPath = options.packPath ?? pluginSkillPackPath();
	return {
		name: GENERATIVE_MCPAPPS_SKILL,
		installed: listHit || rootHit,
		via,
		roots: inspected,
		...packPath !== void 0 ? { packPath } : {}
	};
}
//#endregion
//#region src/protocol-teaching.ts
const PROTOCOL_DEFAULTS = {
	dshUi: true,
	vcp: true
};
const DSH_UI_CHANNEL = `【dsh-ui 组件通道】(结构化数据与交互)
- 正文内 \`\`\`dsh-ui 围栏,内含严格合法 JSON:{"items":[{"type":"…"}]};规模 ≤200 节点、嵌套 ≤8 层(超出被截断)。
- 什么时候用:按共同维度比较 → table/choices;数值趋势/占比 → chart(kind: bars|line|donut, data:[{label,value}])/table;步骤/分支 → steps;需要筛选/输入/计算 → input/select/choices + 结果组件;单个数字无需强行出组件。普通解释和短清单默认正文,无组件数量配额。
- 组件字段以 genui skill 为准(可用时 MUST 先加载);无 skill 工具时用词汇表(括号内即**规范字段名/结构**):text(content)/row(items)/col(items)/grid(cols+items)/card(title+items)/callout(content, tone: info|success|warning|error)/stat(label+value)/badge(label)/progress(value)/list(items)/table(columns+rows)/keyvalue(pairs)/steps(steps:[{title,desc}])/compare(before+after)/diff(diffs)/json(value)/code(code)/file-tree(items)/button/choices(需带 action)。
- **字段名一律用规范名,严禁别名**:callout 正文是 \`content\`(不是 text/body/desc);text 正文是 \`content\`;table 是 \`columns\`+\`rows\`(不是 headers/data),rows 是**二维数组**不是对象数组;keyvalue 是 \`pairs\`(不是 items);badge 是 \`label\`(不是 text);steps 的 \`steps\` 是**对象数组** \`[{title,desc}]\`,每个阶段必须是带 title 的对象,不是字符串数组(如 ["第一阶段","第二阶段"])。别名与错误结构虽能在阅读视图被自动修正,但原生对话视图的内容识别要求「守卫前后逐字相等」,一旦需要改写/丢弃即判否——**整条围栏连同同围栏内其他组件一起退回普通代码块**,不做局部降级。
- 最小正确示例(照抄字段名与结构):{"items":[{"type":"callout","tone":"info","content":"结论一句话"},{"type":"table","columns":["包","下载","变化"],"rows":[["dsh-a","1,234","+5.2%"]]},{"type":"steps","steps":[{"title":"第一步","desc":"说明"},{"title":"第二步"}]}]}
- JSON 严格合法;≥3 节点或含 table 时 MUST 调 validate_dsh_ui,按诊断修改重验,通过后 MUST 逐字复制其 JSON 结果(工具可用时)。
- 交互组件必须带 action;点击后以 [genui-action] name + 数据回流(自动排队发送)。UI 能本地完成的状态变化(排序/判卷/显隐)不回流。
- 围栏只写在回答正文(思考块里不渲染);"panel":true 进会话面板原地更新。
- 不索取密码/API Key/Token/恢复码。`;
const VCP_CHANNEL = `【VCP 视觉卡片通道】(仅自由视觉容器:装帧封面/杂志排版/情绪卡片/终端风/数据大屏美化)
- 视觉内容输出为 \`\`\`html 围栏,围栏体内以根容器 <div id="vcp-root"> 开头(id 非 class——渲染层剥壳按 id 作用域化);裸 HTML 直写正文会被宿主原生视图转义成文字,严禁;严禁缩进成代码块;严禁写 .html 文件交付。
- 开标签只放短关键值:背景色/字色/字号,font-family 必须内联在根开标签;长样式(渐变/圆角/布局/行高)全部进 <style> 的 #vcp-root 前缀规则;选择器一律以 #vcp-root 前缀书写。
- 卡内无空行(\\n\\n),<style> 内无空行;无 backdrop-filter;禁 flex-wrap:wrap 与 margin:0 auto(流式防抖);CSS ≤200 行、类选择器 ≤12;入场动画只用 opacity 淡入;SVG 必带 width/height+viewBox;HTML 语境用 <img>,不解析 Markdown;代码展示用 <pre><code> 且尖括号必须转义(&lt; &gt;)。
- 交互仅限 onclick="input('…')"(回填输入框,由用户手动发送,不自动发送);禁 <script>/外链脚本(带脚本的卡会整体转沙箱渲染,主上下文不执行)。
- 主动判断何时上视觉:文学/故事/情感 → 纸质纹理衬线装帧;数理/推导 → KaTeX 公式($$…$$)/Mermaid 流程图;理性/代码/终端 → 极简深底等宽;警告/状态 → 高对比警示色。风格完全自由,铁律只保「不崩」。
- 审美底线(仅约束 VCP 卡):元素对齐 4/8 步长网格;一屏一个视觉焦点;强调色全卡至多一处;主色六成次色三成强调一成、全卡 ≤5 色;分组靠留白不靠边框堆叠;禁 Emoji——要图标用内联 SVG。
- 数学 $$…$$ 与 \`\`\`mermaid 围栏(卡外正文)可直接用。`;
const GENERAL_DISCIPLINE = `【通用纪律】
- 回复与 UI 文字一律匹配对话语言,不按示例推断。
- 只呈现一次信息,不重复正文已有内容。
- 思考最小化:关键词级即可,不誊写数据、不默背规则、不把 HTML/CSS 写进思考;为验证 spec 而调用工具不算思考税。
- 内容定稿 → 外壳一次成型:先写正文再包视觉外壳,禁止来回改。`;
/** 通道关闭时从路由表摘除对应条目;全关 → 降级文本。 */
function buildSegmentTeaching(switches, options = {}) {
	const { dshUi, vcp } = switches;
	if (!dshUi && !vcp) return "(交互式界面分段渲染当前全部关闭:请使用普通 Markdown 回复,不要输出 dsh-ui 围栏、<div id=\"vcp-root\"> 等 HTML 容器。)";
	const router = [];
	router.push("- 结构化数据与交互(表格/对比/筛选/表单/quiz/步骤/图表/面板)→ ```dsh-ui JSON 围栏——数据表格一律走这里,不要手写 HTML 表格。");
	router.push("- 流程/时序/类/状态/排期等**结构关系** → 正文 ```mermaid 围栏(首行必须是图类型声明:graph TD / flowchart LR / sequenceDiagram…);图只在卡外正文,卡内用 dsh-ui 的 diagram 组件。");
	if (vcp) router.push("- 自由视觉容器(装帧封面/杂志排版/情绪卡片/终端风/大屏美化)→ ```html 围栏包裹的 VCP 卡(见 VCP 通道)。");
	router.push("- 完整交互应用/原型(复杂 JS 逻辑的多步应用)→ ```mcp-app 围栏(沙箱渲染)。");
	router.push("- 一两句能说清的小事 → 纯 Markdown。就近选择即可;选得不够精确也会被正确渲染,不要为选择写论证。");
	const skillNote = options.hasSkillTool === true ? "组件字段 MUST 以 genui skill 为准(先加载 skill 工具)。" : "";
	const parts = [
		"## 交互式回复界面协议(分段渲染)",
		"你可把回复中的片段输出为可渲染的「界面段」,渲染器按段分发;普通解释仍是 Markdown。",
		"【通道选择 · 先于动笔】",
		...router
	];
	if (dshUi) parts.push(DSH_UI_CHANNEL);
	if (vcp) parts.push(VCP_CHANNEL);
	parts.push(GENERAL_DISCIPLINE);
	if (dshUi && skillNote) parts.push(skillNote);
	return parts.filter(Boolean).join("\n\n");
}
//#endregion
//#region src/reader-prefs.ts
/** Config field names — the volatile projection's key set (lockstep with the schema). */
const READER_CONFIG_FIELDS = [
	"motion",
	"foldIntensity",
	"frostedGlass",
	"bubbles",
	"segmentCards",
	"cardCollapseDefault",
	"renderMode",
	"deliverableOpenMode",
	"railEnabled",
	"railSide",
	"railStyle",
	"railRing",
	"hideOfficialNav",
	"railColor",
	"railColorCustom",
	"railColorLight",
	"railAccent",
	"railAccentCustom",
	"railAccentLight"
];
//#endregion
//#region src/config.ts
/**
* Entry configuration for `tidy-display` — the global reader preferences that
* used to live only in the client-store persist key `dsh.reader.v1`.
*
* On harness lines whose schemastery ships `.volatile()` (0.1.7+) every field
* is marked live-editable: the harness's settings describe projects them as the
* entry's config form (namespace = entry id `tidy-display`), and preference
* edits commit volatile-only without remounting the entry. On older lines the
* modifier is absent and the marks are skipped (feature-detect, the dsh-context
* convention) — the schema then acts as plain entry config and the client keeps
* reading/writing the persist key.
*
* Derived store fields (`autoFold`, `processOnly` both derive from
* `foldIntensity`) and session-scoped state (`expanded`) deliberately have no
* config field: the canonical source is `foldIntensity`, and `expanded` is
* per-message UI state, not a preference.
*/
/** Mark a field live-editable where the harness schemastery has the modifier. */
function volatileField(field) {
	const volatile = field.volatile;
	return typeof volatile === "function" ? volatile.call(field) : field;
}
function bool(field) {
	return volatileField(field);
}
/** The entry `config:` validator and the config-form generation's served schema. */
const Config = z.object({
	motion: bool(z.boolean().default(true)),
	foldIntensity: volatileField(z.union([
		0,
		1,
		2
	]).default(1)),
	frostedGlass: bool(z.boolean().default(false)),
	bubbles: bool(z.boolean().default(true)),
	segmentCards: bool(z.boolean().default(true)),
	cardCollapseDefault: bool(z.boolean().default(true)),
	renderMode: volatileField(z.union(["native", "delegate"]).default("native")),
	deliverableOpenMode: volatileField(z.union(["external", "sidebar"]).default("external")),
	railEnabled: bool(z.boolean().default(true)),
	railSide: volatileField(z.union(["left", "right"]).default("left")),
	railStyle: volatileField(z.union(["bar", "dot"]).default("bar")),
	railRing: bool(z.boolean().default(true)),
	hideOfficialNav: bool(z.boolean().default(true)),
	railColor: volatileField(z.union([
		"auto",
		"hue",
		"custom"
	]).default("auto")),
	railColorCustom: volatileField(z.string().default("")),
	railColorLight: volatileField(z.string().default("l3")),
	railAccent: volatileField(z.union([
		"auto",
		"hue",
		"custom"
	]).default("auto")),
	railAccentCustom: volatileField(z.string().default("")),
	railAccentLight: volatileField(z.string().default("l3"))
});
//#endregion
//#region src/dsh-tidy-display.ts
const name = "dsh-tidy-display";
const inject = ["webServer", "systemPrompt"];
function writeJson(res, status, body) {
	res.setHeader("Content-Type", "application/json");
	res.statusCode = status;
	res.end(JSON.stringify(body));
}
function skillLister(ctx) {
	const skills = ctx.get?.("skills");
	if (typeof skills?.list !== "function") return void 0;
	return async () => skillsFromListResult(await skills.list({}));
}
const PROTOCOL_STATE_FILE = join(process.env.DSH_HOME || join(process.env.HOME || process.env.USERPROFILE || "", ".dsh"), "dsh-tidy-display-protocol.json");
async function loadProtocolSwitches() {
	try {
		const raw = await fs.readFile(PROTOCOL_STATE_FILE, "utf8");
		const parsed = JSON.parse(raw);
		return {
			dshUi: parsed.dshUi !== false,
			vcp: parsed.vcp !== false
		};
	} catch {
		return { ...PROTOCOL_DEFAULTS };
	}
}
async function persistProtocolSwitches(switches) {
	await fs.mkdir(dirname(PROTOCOL_STATE_FILE), { recursive: true });
	await fs.writeFile(PROTOCOL_STATE_FILE, JSON.stringify({
		...switches,
		updatedAt: (/* @__PURE__ */ new Date()).toISOString()
	}, null, 2) + "\n", "utf8");
}
const VENDOR_MIME = {
	".js": "text/javascript; charset=utf-8",
	".mjs": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".map": "application/json; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".woff2": "font/woff2",
	".woff": "font/woff",
	".ttf": "font/ttf",
	".svg": "image/svg+xml"
};
/** 剥路由前缀并防穿越;非法请求返回 null。 */
function resolveStaticRequest(url, prefix, root) {
	const path = (url ?? "").split("?")[0] ?? "";
	if (!path.startsWith(prefix + "/")) return null;
	let rel;
	try {
		rel = decodeURIComponent(path.slice(prefix.length + 1));
	} catch {
		return null;
	}
	if (!rel || rel.includes("..") || rel.includes("/") || rel.includes("\\")) return null;
	const file = resolve(root, rel);
	if (!file.startsWith(root + sep) && file !== root) return null;
	return file;
}
async function serveStatic(req, res, prefix, root) {
	const file = resolveStaticRequest(req.url, prefix, root);
	if (!file) return false;
	const ext = file.slice(file.lastIndexOf(".")).toLowerCase();
	const mime = VENDOR_MIME[ext];
	if (!mime || !existsSync(file)) {
		res.statusCode = ext && VENDOR_MIME[ext] ? 404 : 403;
		res.end();
		return true;
	}
	const body = await fs.readFile(file);
	const etag = `"${body.length.toString(16)}"`;
	res.setHeader("Content-Type", mime);
	res.setHeader("Cache-Control", "public, max-age=86400");
	res.setHeader("ETag", etag);
	if (req.headers["if-none-match"] === etag) {
		res.statusCode = 304;
		res.end();
		return true;
	}
	res.statusCode = 200;
	res.end(body);
	return true;
}
/** 本插件 assets/vendor 目录(引擎等自携资产)。 */
function ownVendorRoot() {
	return resolve(dirname(fileURLToPath(import.meta.url)), "..", "assets", "vendor");
}
/** genui 懒引擎资产目录(<pkg>/lib/assets,经依赖解析定位)。找不到返回 null。 */
function genuiAssetsRoot() {
	try {
		const pkgJson = createRequire(import.meta.url).resolve("@changfenhuang/dsh-genui/package.json");
		const root = resolve(dirname(pkgJson), "lib", "assets");
		return existsSync(root) ? root : null;
	} catch {
		return null;
	}
}
function apply(ctx) {
	console.log("[my-plugins/dsh-tidy-display] loaded");
	const systemPrompt = ctx.get?.("systemPrompt");
	let refreshTeaching;
	if (systemPrompt && typeof systemPrompt.section === "function") {
		let cachedSwitches = null;
		loadProtocolSwitches().then((s) => {
			cachedSwitches = s;
		}).catch(() => {});
		const order = typeof systemPrompt.getSectionOrder === "function" ? systemPrompt.getSectionOrder("STRUCTURED_OUTPUT") ?? 200 : 200;
		ctx.effect(() => {
			const dispose = systemPrompt.section({
				name: "dsh-tidy-display:segments",
				order,
				text: () => buildSegmentTeaching(cachedSwitches ?? { ...PROTOCOL_DEFAULTS })
			});
			refreshTeaching = () => {
				loadProtocolSwitches().then((s) => {
					cachedSwitches = s;
				}).catch(() => {});
			};
			return dispose;
		}, "dsh-tidy-display: segment protocol teaching section");
	}
	if (ctx.webServer) ctx.effect(() => {
		const disposeReveal = ctx.webServer.register({
			kind: "exact",
			path: "/tidy-display/reveal",
			handler: async (req, res) => {
				if (req.method !== "POST") {
					res.statusCode = 405;
					res.end();
					return;
				}
				let body = "";
				req.on("data", (chunk) => {
					body += chunk;
				});
				req.on("end", () => {
					try {
						const data = JSON.parse(body);
						const targetPath = typeof data.path === "string" ? data.path.trim() : "";
						if (!targetPath) {
							res.statusCode = 400;
							res.end(JSON.stringify({
								ok: false,
								error: "Empty path"
							}));
							return;
						}
						if (process.platform === "darwin") spawn("open", ["-R", targetPath], {
							detached: true,
							stdio: "ignore"
						});
						else if (process.platform === "win32") spawn("explorer.exe", [`/select,${targetPath}`], {
							detached: true,
							stdio: "ignore"
						});
						else spawn("xdg-open", [targetPath], {
							detached: true,
							stdio: "ignore"
						});
						res.setHeader("Content-Type", "application/json");
						res.statusCode = 200;
						res.end(JSON.stringify({ ok: true }));
					} catch (err) {
						res.statusCode = 400;
						res.end(JSON.stringify({
							ok: false,
							error: String(err)
						}));
					}
				});
			}
		});
		const disposeSkill = ctx.webServer.register({
			kind: "exact",
			path: "/tidy-display/skill-status",
			handler: async (req, res) => {
				if (req.method !== "GET") {
					res.statusCode = 405;
					res.end();
					return;
				}
				try {
					writeJson(res, 200, toPublicSkillStatus(await scanGenerativeMcpappsStatus({
						cwd: new URL(req.url ?? "", "http://127.0.0.1").searchParams.get("cwd") ?? void 0,
						listSkills: skillLister(ctx)
					})));
				} catch (err) {
					writeJson(res, 500, {
						ok: false,
						error: String(err)
					});
				}
			}
		});
		const disposeProtocol = ctx.webServer.register({
			kind: "exact",
			path: "/tidy-display/protocol-state",
			handler: async (req, res) => {
				if (req.method === "GET") {
					writeJson(res, 200, {
						ok: true,
						...await loadProtocolSwitches()
					});
					return;
				}
				if (req.method !== "POST") {
					res.statusCode = 405;
					res.end();
					return;
				}
				let body = "";
				req.on("data", (chunk) => {
					body += chunk;
				});
				req.on("end", async () => {
					try {
						const data = JSON.parse(body);
						const next = {
							dshUi: data.dshUi !== false,
							vcp: data.vcp !== false
						};
						await persistProtocolSwitches(next);
						refreshTeaching?.();
						writeJson(res, 200, {
							ok: true,
							...next
						});
					} catch (err) {
						writeJson(res, 400, {
							ok: false,
							error: String(err)
						});
					}
				});
			}
		});
		const vendorRoot = ownVendorRoot();
		const disposeVendor = ctx.webServer.register({
			kind: "prefix",
			path: "/tidy-display/vendor",
			handler: async (req, res) => {
				await serveStatic(req, res, "/tidy-display/vendor", vendorRoot);
			}
		});
		const genuiRoot = genuiAssetsRoot();
		const disposeGenui = ctx.webServer.register({
			kind: "prefix",
			path: "/tidy-display/assets/genui",
			handler: async (req, res) => {
				if (!genuiRoot) {
					res.statusCode = 404;
					res.end();
					return;
				}
				await serveStatic(req, res, "/tidy-display/assets/genui", genuiRoot);
			}
		});
		return () => {
			disposeReveal();
			disposeSkill();
			disposeProtocol();
			disposeVendor();
			disposeGenui();
		};
	}, "dsh-tidy-display: reveal, skill-status, protocol-state and static routes");
}
//#endregion
export { Config, READER_CONFIG_FIELDS, apply, inject, name };
