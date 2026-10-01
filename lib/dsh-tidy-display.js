import { spawn } from "node:child_process";
import { access, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
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
//#region src/reader-prefs.ts
/** Config field names — the volatile projection's key set (lockstep with the schema). */
const READER_CONFIG_FIELDS = [
	"motion",
	"foldIntensity",
	"frostedGlass",
	"bubbles",
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
const inject = ["webServer"];
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
function apply(ctx) {
	console.log("[my-plugins/dsh-tidy-display] loaded");
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
		return () => {
			disposeReveal();
			disposeSkill();
		};
	}, "dsh-tidy-display: reveal and skill-status routes");
}
//#endregion
export { Config, READER_CONFIG_FIELDS, apply, inject, name };
