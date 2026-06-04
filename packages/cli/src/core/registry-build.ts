import { findSkillDirs } from "./discover";
import { loadSkill } from "./parse";
import type { Registry, RegistryEntry } from "../schema/registry";

/**
 * Build the catalog from the skill tree. Output is deterministic (no timestamp)
 * so a committed `registry.json` can be drift-checked in CI.
 */
export function buildRegistry(skillsRoot: string, version = "0.1.0"): Registry {
  const dirs = findSkillDirs(skillsRoot);
  const skills: RegistryEntry[] = dirs.map((dir) => {
    const s = loadSkill(dir, skillsRoot);
    const xm = s.frontmatter["x-skills-master"];
    return {
      name: s.name,
      domain: xm.domain,
      class: xm.class,
      category: xm.category,
      description: s.frontmatter.description,
      platforms: xm.platforms,
      stability: xm.stability,
      version: xm.version,
      tags: s.frontmatter.tags ?? [],
      pairs_with: xm.pairs_with,
      path: s.relPath,
      resources: {
        reference: Boolean(s.resources.reference),
        examples: Boolean(s.resources.examples),
        checklist: Boolean(s.resources.checklist),
      },
    };
  });
  skills.sort((a, b) => a.name.localeCompare(b.name));
  return {
    $schema: "https://skills-master.dev/schema/registry.json",
    version,
    skills,
  };
}
