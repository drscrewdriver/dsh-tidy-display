/** Shared generative-mcpapps identity. Plugin-tree presence is not installation. */

export const GENERATIVE_MCPAPPS_SKILL = 'generative-mcpapps';

/** Conventional relative roots only. Never expand $HOME or dump host `root.path`. */
export const CONVENTIONAL_SKILL_ROOTS = ['.dsh/skills', '.agents/skills'] as const;

/** Copy source relative to the plugin / checkout, not an absolute pack path. */
export const SKILL_PACK_RELATIVE = `skills/${GENERATIVE_MCPAPPS_SKILL}`;

export type SkillRootSource =
  | 'project-dsh'
  | 'project-agents'
  | 'user-dsh'
  | 'user-agents'
  | 'custom'
  | 'bundled'
  | (string & {});

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

export function skillNameMatches(name: unknown): boolean {
  return typeof name === 'string' && name === GENERATIVE_MCPAPPS_SKILL;
}

export function skillListIncludes(entries: readonly { readonly name?: string }[] | undefined): boolean {
  return Array.isArray(entries) && entries.some(entry => skillNameMatches(entry?.name));
}

/** Directory bundle `name/SKILL.md` or flat `name.md` at a scanned root. */
export function skillRootEntryMatches(entryName: string): boolean {
  return entryName === GENERATIVE_MCPAPPS_SKILL || entryName === `${GENERATIVE_MCPAPPS_SKILL}.md`;
}

export function skillsFromListResult(result: unknown): { name?: string }[] {
  if (Array.isArray(result)) return result;
  if (result === null || typeof result !== 'object') return [];
  const record = result as {
    ok?: boolean;
    value?: { skills?: unknown } | unknown;
    skills?: unknown;
  };
  if (record.ok === false) return [];
  if (Array.isArray(record.skills)) return record.skills as { name?: string }[];
  if (record.value && typeof record.value === 'object') {
    const value = record.value as { skills?: unknown };
    if (Array.isArray(value.skills)) return value.skills as { name?: string }[];
    if (Array.isArray(record.value)) return record.value as { name?: string }[];
  }
  return [];
}

export function publicSkillRoots(): readonly SkillRootInfo[] {
  return CONVENTIONAL_SKILL_ROOTS.map(path => ({ source: 'conventional', path }));
}

/**
 * Strip host home / pack absolutes before anything user-facing (HTTP or Settings).
 * Detection still uses the raw scan; this is the public face.
 */
export function toPublicSkillStatus(status: HostSkillStatus): HostSkillStatus {
  return {
    name: status.name,
    installed: status.installed,
    via: status.via,
    roots: publicSkillRoots(),
  };
}
