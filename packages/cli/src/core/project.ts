import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import {
  CONFIG_FILENAME,
  LOCKFILE_NAME,
  ProjectConfigSchema,
  type ProjectConfig,
} from "../schema/projectConfig";
import { LockfileSchema, emptyLockfile, type Lockfile } from "../schema/lockfile";

/** Parse a JSON file against a schema, naming the file in any failure. */
function parseJsonFile<T>(p: string, schema: { parse(v: unknown): T }): T {
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(p, "utf8"));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`${p} is not valid JSON: ${msg}`);
  }
  try {
    return schema.parse(data);
  } catch (err) {
    if (err instanceof z.ZodError) {
      const first = err.issues[0];
      const at = first?.path.length ? ` at "${first.path.join(".")}"` : "";
      throw new Error(`${p} is invalid${at}: ${first?.message ?? "schema mismatch"}`);
    }
    throw err;
  }
}

export function configPath(root: string): string {
  return join(root, CONFIG_FILENAME);
}
export function lockfilePath(root: string): string {
  return join(root, LOCKFILE_NAME);
}

export function loadConfig(root: string): ProjectConfig | null {
  const p = configPath(root);
  if (!existsSync(p)) return null;
  return parseJsonFile(p, ProjectConfigSchema);
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
  return parseJsonFile(p, LockfileSchema);
}

export function saveLockfile(root: string, lock: Lockfile): void {
  writeFileSync(lockfilePath(root), JSON.stringify(lock, null, 2) + "\n", "utf8");
}
