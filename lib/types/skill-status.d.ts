/** Shared generative-mcpapps identity. Plugin-tree presence is not installation. */
export declare const GENERATIVE_MCPAPPS_SKILL = "generative-mcpapps";
/** Conventional relative roots only. Never expand $HOME or dump host `root.path`. */
export declare const CONVENTIONAL_SKILL_ROOTS: readonly [".dsh/skills", ".agents/skills"];
/** Copy source relative to the plugin / checkout, not an absolute pack path. */
export declare const SKILL_PACK_RELATIVE = "skills/generative-mcpapps";
export type SkillRootSource = 'project-dsh' | 'project-agents' | 'user-dsh' | 'user-agents' | 'custom' | 'bundled' | (string & {});
export interface SkillRootInfo {
    readonly source: SkillRootSource;
    readonly path: string;
    readonly present?: boolean;
}
export interface HostSkillStatus {
    readonly name: typeof GENERATIVE_MCPAPPS_SKILL;
    readonly installed: boolean;
    readonly via: 'skills.list' | 'skill-root' | null;
    readonly roots: readonly SkillRootInfo[];
    /** Plugin-shipped pack path for copy guidance. Not a harness skill root. */
    readonly packPath?: string;
}
export declare function skillNameMatches(name: unknown): boolean;
export declare function skillListIncludes(entries: readonly {
    readonly name?: string;
}[] | undefined): boolean;
/** Directory bundle `name/SKILL.md` or flat `name.md` at a scanned root. */
export declare function skillRootEntryMatches(entryName: string): boolean;
export declare function skillsFromListResult(result: unknown): {
    name?: string;
}[];
export declare function publicSkillRoots(): readonly SkillRootInfo[];
/**
 * Strip host home / pack absolutes before anything user-facing (HTTP or Settings).
 * Detection still uses the raw scan; this is the public face.
 */
export declare function toPublicSkillStatus(status: HostSkillStatus): HostSkillStatus;
//# sourceMappingURL=skill-status.d.ts.map