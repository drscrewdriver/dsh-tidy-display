import { CONVENTIONAL_SKILL_ROOTS, GENERATIVE_MCPAPPS_SKILL, SKILL_PACK_RELATIVE, publicSkillRoots, skillListIncludes, skillsFromListResult, toPublicSkillStatus, } from '../skill-status.js';
export { CONVENTIONAL_SKILL_ROOTS, GENERATIVE_MCPAPPS_SKILL, SKILL_PACK_RELATIVE, publicSkillRoots, skillListIncludes, skillsFromListResult, toPublicSkillStatus, };
export async function detectGenerativeMcpappsSkill(probe) {
    let host;
    if (probe.fetchHostStatus) {
        try {
            host = await probe.fetchHostStatus();
        }
        catch {
            host = undefined;
        }
    }
    let remoteHit = false;
    if (probe.listRemoteSkills) {
        try {
            remoteHit = skillListIncludes(await probe.listRemoteSkills());
        }
        catch {
            remoteHit = false;
        }
    }
    const installed = Boolean(host?.installed || remoteHit);
    const via = remoteHit ? 'skills.list' : (host?.via ?? null);
    const publicHost = host === undefined ? undefined : toPublicSkillStatus(host);
    return {
        name: GENERATIVE_MCPAPPS_SKILL,
        installed,
        via,
        roots: publicHost?.roots ?? publicSkillRoots(),
        hostReached: host !== undefined,
    };
}
/** mkdir/cp using conventional relative roots only. Host paths are ignored. */
export function shortestInstallCommand(_status) {
    const dest = CONVENTIONAL_SKILL_ROOTS[0];
    return `mkdir -p ${dest} && cp -R ${SKILL_PACK_RELATIVE} ${dest}/`;
}
export function firstSessionId(list) {
    if (list?.ids && list.ids.length > 0)
        return list.ids[0];
    const keys = list?.byId ? Object.keys(list.byId) : [];
    return keys[0];
}
//# sourceMappingURL=skill-status.js.map