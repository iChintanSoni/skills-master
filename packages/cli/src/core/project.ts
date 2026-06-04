import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  CONFIG_FILENAME,
  LOCKFILE_NAME,
  ProjectConfigSchema,
  type ProjectConfig,
} from "../schema/projectConfig";
import { LockfileSchema, emptyLockfile, type Lockfile } from "../schema/lockfile";

export function configPath(root: string): string {
  return join(root, CONFIG_FILENAME);
}
export function lockfilePath(root: string): string {
  return join(root, LOCKFILE_NAME);
}

export function loadConfig(root: string): ProjectConfig | null {
  const p = configPath(root);
  if (!existsSync(p)) return null;
  return ProjectConfigSchema.parse(JSON.parse(readFileSync(p, "utf8")));
}

/** Load config, or return parsed defaults if none exists. */
export function loadConfigOrDefault(root: string): ProjectConfig {
  return loadConfig(root) ?? ProjectConfigSchema.parse({});
}

export function saveConfig(root: string, cfg: ProjectConfig): void {
  const withSchema = { $schema: "https://skills-master.dev/schema/config.json", ...cfg };
  writeFileSync(configPath(root), JSON.stringify(withSchema, null, 2) + "\n", "utf8");
}

export function loadLockfile(root: string): Lockfile {
  const p = lockfilePath(root);
  if (!existsSync(p)) return emptyLockfile();
  return LockfileSchema.parse(JSON.parse(readFileSync(p, "utf8")));
}

export function saveLockfile(root: string, lock: Lockfile): void {
  writeFileSync(lockfilePath(root), JSON.stringify(lock, null, 2) + "\n", "utf8");
}
