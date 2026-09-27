import { access, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GENERATIVE_MCPAPPS_SKILL, skillListIncludes, skillRootEntryMatches, } from './skill-status.js';
export function expandHomePath(path, home = homedir()) {
    if (path === '~')
        return home;
    if (path.startsWith('~/') || path.startsWith('~\\'))
        return join(home, path.slice(2));
    return path;
}
/** `$DSH_HOME` or `~/.dsh`, matching official `resolveDshHome`. */
export function resolveDshHome(env = process.env, home = homedir()) {
    const fromEnv = env.DSH_HOME;
    const selected = fromEnv !== undefined && fromEnv.trim().length > 0 ? fromEnv : join(home, '.dsh');
    return resolve(expandHomePath(selected, home));
}
/** `$DSH_AGENTS_HOME` or `~/.agents`. */
export function resolveAgentsHome(env = process.env, home = homedir()) {
    const fromEnv = env.DSH_AGENTS_HOME;
    const selected = fromEnv !== undefined && fromEnv.trim().length > 0 ? fromEnv : join(home, '.agents');
    return resolve(expandHomePath(selected, home));
}
export function userSkillRoots(env = process.env, home = homedir()) {
    return [
        { source: 'user-dsh', path: join(resolveDshHome(env, home), 'skills') },
        { source: 'user-agents', path: join(resolveAgentsHome(env, home), 'skills') },
    ];
}
export function projectSkillRoots(projectRoot) {
    return [
        { source: 'project-dsh', path: join(projectRoot, '.dsh', 'skills') },
        { source: 'project-agents', path: join(projectRoot, '.agents', 'skills') },
    ];
}
export async function findProjectRoot(cwd) {
    let current = resolve(cwd);
    while (true) {
        if (existsSync(join(current, '.git')))
            return current;
        const parent = dirname(current);
        if (parent === current)
            return resolve(cwd);
        current = parent;
    }
}
export async function rootHasGenerativeMcpapps(rootPath) {
    let entries;
    try {
        entries = await readdir(rootPath, { withFileTypes: true });
    }
    catch {
        return false;
    }
    for (const entry of entries) {
        if (entry.name === '.system')
            continue;
        if (!skillRootEntryMatches(entry.name))
            continue;
        if (entry.isDirectory()) {
            try {
                await access(join(rootPath, entry.name, 'SKILL.md'));
                return true;
            }
            catch {
                continue;
            }
        }
        if (entry.isFile())
            return true;
    }
    return false;
}
/** Resolve the plugin-shipped pack. This path is never treated as a skill root. */
export function pluginSkillPackPath(moduleUrl = import.meta.url) {
    const here = dirname(fileURLToPath(moduleUrl));
    const candidates = [
        join(here, '../skills', GENERATIVE_MCPAPPS_SKILL),
        join(here, '../../skills', GENERATIVE_MCPAPPS_SKILL),
        join(here, 'skills', GENERATIVE_MCPAPPS_SKILL),
    ];
    return candidates.find(path => existsSync(join(path, 'SKILL.md')));
}
export async function scanGenerativeMcpappsStatus(options = {}) {
    const env = options.env ?? process.env;
    const home = options.home ?? homedir();
    const roots = [...userSkillRoots(env, home)];
    const cwd = typeof options.cwd === 'string' && options.cwd.trim().length > 0
        ? (isAbsolute(options.cwd) ? options.cwd : resolve(options.cwd))
        : undefined;
    if (cwd !== undefined)
        roots.unshift(...projectSkillRoots(await findProjectRoot(cwd)));
    const inspected = [];
    let rootHit = false;
    for (const root of roots) {
        const present = await rootHasGenerativeMcpapps(root.path);
        inspected.push({ ...root, present });
        if (present)
            rootHit = true;
    }
    let via = null;
    let listHit = false;
    if (options.listSkills) {
        try {
            listHit = skillListIncludes(await options.listSkills());
            if (listHit)
                via = 'skills.list';
        }
        catch {
            // Registry/RPC absence falls back to the scanned roots.
        }
    }
    if (!listHit && rootHit)
        via = 'skill-root';
    const packPath = options.packPath ?? pluginSkillPackPath();
    return {
        name: GENERATIVE_MCPAPPS_SKILL,
        installed: listHit || rootHit,
        via,
        roots: inspected,
        ...packPath !== undefined ? { packPath } : {},
    };
}
//# sourceMappingURL=skill-roots.js.map