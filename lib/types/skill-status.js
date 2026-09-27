/** Shared generative-mcpapps identity. Plugin-tree presence is not installation. */
export const GENERATIVE_MCPAPPS_SKILL = 'generative-mcpapps';
/** Conventional relative roots only. Never expand $HOME or dump host `root.path`. */
export const CONVENTIONAL_SKILL_ROOTS = ['.dsh/skills', '.agents/skills'];
/** Copy source relative to the plugin / checkout, not an absolute pack path. */
export const SKILL_PACK_RELATIVE = `skills/${GENERATIVE_MCPAPPS_SKILL}`;
export function skillNameMatches(name) {
    return typeof name === 'string' && name === GENERATIVE_MCPAPPS_SKILL;
}
export function skillListIncludes(entries) {
    return Array.isArray(entries) && entries.some(entry => skillNameMatches(entry?.name));
}
/** Directory bundle `name/SKILL.md` or flat `name.md` at a scanned root. */
export function skillRootEntryMatches(entryName) {
    return entryName === GENERATIVE_MCPAPPS_SKILL || entryName === `${GENERATIVE_MCPAPPS_SKILL}.md`;
}
export function skillsFromListResult(result) {
    if (Array.isArray(result))
        return result;
    if (result === null || typeof result !== 'object')
        return [];
    const record = result;
    if (record.ok === false)
        return [];
    if (Array.isArray(record.skills))
        return record.skills;
    if (record.value && typeof record.value === 'object') {
        const value = record.value;
        if (Array.isArray(value.skills))
            return value.skills;
        if (Array.isArray(record.value))
            return record.value;
    }
    return [];
}
export function publicSkillRoots() {
    return CONVENTIONAL_SKILL_ROOTS.map(path => ({ source: 'conventional', path }));
}
/**
 * Strip host home / pack absolutes before anything user-facing (HTTP or Settings).
 * Detection still uses the raw scan; this is the public face.
 */
export function toPublicSkillStatus(status) {
    return {
        name: status.name,
        installed: status.installed,
        via: status.via,
        roots: publicSkillRoots(),
    };
}
//# sourceMappingURL=skill-status.js.map