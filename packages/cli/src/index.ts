/** Programmatic API for the skills-master compiler and commands. */

export * from "./types";
export { FrontmatterSchema } from "./schema/frontmatter";
export { ProjectConfigSchema, resolvePaths, DEFAULT_PATHS } from "./schema/projectConfig";
export { RegistrySchema } from "./schema/registry";

export { loadSkill, loadRawSkill, validateFrontmatter } from "./core/parse";
export { findSkillDirs } from "./core/discover";
export { lintSkills } from "./core/lint";
export { buildRegistry } from "./core/registry-build";
export { compileSkill } from "./core/compile";
export { installSkill, sourceHashOf, diskHash } from "./core/install";
export { condenseBody } from "./core/condense";
export * as markers from "./core/markers";

export { EMITTERS, getEmitter, detectTargets } from "./emitters";
export { ContentSource, resolveContent } from "./content/source";

export { initCommand } from "./commands/init";
export { addCommand } from "./commands/add";
export { updateCommand } from "./commands/update";
export { removeCommand } from "./commands/remove";
export { doctorCommand } from "./commands/doctor";
export { listCommand, searchCommand, viewCommand } from "./commands/catalog";
export { lintCommand } from "./commands/lint";
export { registryBuildCommand } from "./commands/registry";
export { marketplaceBuildCommand } from "./commands/marketplace";
export { newSkillCommand } from "./commands/new";
