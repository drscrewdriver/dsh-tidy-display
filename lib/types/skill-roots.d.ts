import { type HostSkillStatus, type SkillRootInfo } from './skill-status.js';
export declare function expandHomePath(path: string, home?: string): string;
/** `$DSH_HOME` or `~/.dsh`, matching official `resolveDshHome`. */
export declare function resolveDshHome(env?: Record<string, string | undefined>, home?: string): string;
/** `$DSH_AGENTS_HOME` or `~/.agents`. */
export declare function resolveAgentsHome(env?: Record<string, string | undefined>, home?: string): string;
export declare function userSkillRoots(env?: Record<string, string | undefined>, home?: string): readonly SkillRootInfo[];
export declare function projectSkillRoots(projectRoot: string): readonly SkillRootInfo[];
export declare function findProjectRoot(cwd: string): Promise<string>;
export declare function rootHasGenerativeMcpapps(rootPath: string): Promise<boolean>;
/** Resolve the plugin-shipped pack. This path is never treated as a skill root. */
export declare function pluginSkillPackPath(moduleUrl?: string): string | undefined;
export declare function scanGenerativeMcpappsStatus(options?: {
    cwd?: string;
    env?: Record<string, string | undefined>;
    home?: string;
    packPath?: string;
    listSkills?: () => Promise<readonly {
        readonly name?: string;
    }[] | undefined>;
}): Promise<HostSkillStatus>;
//# sourceMappingURL=skill-roots.d.ts.map