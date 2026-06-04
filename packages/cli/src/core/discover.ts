import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SKILL_FILE = "SKILL.md";
const IGNORE = new Set(["node_modules", ".git", "dist", ".cache"]);

/**
 * Recursively find every directory under `skillsRoot` that contains a SKILL.md.
 * Returns absolute directory paths, sorted for deterministic output.
 */
export function findSkillDirs(skillsRoot: string): string[] {
  const found: string[] = [];
  if (!existsSync(skillsRoot)) return found;

  const walk = (dir: string): void => {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    if (entries.includes(SKILL_FILE)) found.push(dir);
    for (const entry of entries) {
      if (IGNORE.has(entry) || entry.startsWith(".")) continue;
      const full = join(dir, entry);
      let isDir = false;
      try {
        isDir = statSync(full).isDirectory();
      } catch {
        isDir = false;
      }
      if (isDir) walk(full);
    }
  };

  walk(skillsRoot);
  return found.sort();
}

/** Path of a skill dir relative to the skills root (uses forward slashes). */
export function relPathOf(skillsRoot: string, dir: string): string {
  return relative(skillsRoot, dir).split(/[\\/]/).join("/");
}
