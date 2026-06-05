import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { basename, isAbsolute, join, resolve } from "node:path";
import { findSkillDirs } from "../core/discover";
import { loadSkill } from "../core/parse";
import { buildRegistry } from "../core/registry-build";
import type { Registry } from "../schema/registry";
import type { ParsedSkill } from "../types";

/** Default content repo (override with SKILLS_MASTER_REPO). */
const DEFAULT_REPO = "github:iChintanSoni/skills-master";

/** A resolved, on-disk skills tree the CLI reads from. */
export class ContentSource {
  constructor(public readonly root: string) {}

  skillDirs(): string[] {
    return findSkillDirs(this.root);
  }

  findDir(name: string): string | undefined {
    const dirs = this.skillDirs();
    return dirs.find((d) => basename(d) === name) ?? dirs.find((d) => safeName(d, this.root) === name);
  }

  loadSkill(name: string): ParsedSkill {
    const dir = this.findDir(name);
    if (!dir) throw new Error(`Skill "${name}" not found in content at ${this.root}`);
    return loadSkill(dir, this.root);
  }

  registry(): Registry {
    return buildRegistry(this.root);
  }
}

function safeName(dir: string, root: string): string {
  try {
    return loadSkill(dir, root).name;
  } catch {
    return "";
  }
}

export interface ResolveContentOptions {
  /** explicit path to a local skills directory. */
  content?: string;
  /** git ref for remote fetch. */
  ref?: string;
  /** start dir for the upward repo search. */
  cwd?: string;
}

/**
 * Resolve where skill content lives, in priority order:
 *   1. explicit `--content <dir>`
 *   2. SKILLS_MASTER_CONTENT env var
 *   3. a `skills/` directory in this repo (dev convenience, searched upward)
 *   4. remote fetch via giget (published content)
 */
export async function resolveContent(opts: ResolveContentOptions = {}): Promise<ContentSource> {
  if (opts.content) {
    const root = isAbsolute(opts.content) ? opts.content : resolve(process.cwd(), opts.content);
    return new ContentSource(root);
  }
  const env = process.env.SKILLS_MASTER_CONTENT;
  if (env) return new ContentSource(resolve(env));

  const local = findLocalSkillsDir(opts.cwd ?? process.cwd());
  if (local) return new ContentSource(local);

  return new ContentSource(await fetchRemote(opts.ref ?? "main"));
}

/** Walk upward looking for a sibling `skills/` directory (the dev repo). */
function findLocalSkillsDir(start: string): string | null {
  let dir = resolve(start);
  for (let i = 0; i < 8; i++) {
    const candidate = join(dir, "skills");
    if (existsSync(join(dir, "pnpm-workspace.yaml")) && existsSync(candidate)) return candidate;
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/** Download the `skills/` subtree of the content repo to a local cache. */
async function fetchRemote(ref: string): Promise<string> {
  const repo = process.env.SKILLS_MASTER_REPO ?? DEFAULT_REPO;
  const cacheDir = join(homedir(), ".skills-master-cache", ref.replace(/[^\w.-]/g, "_"));
  const { downloadTemplate } = await import("giget");
  const { dir } = await downloadTemplate(`${repo}/skills#${ref}`, {
    dir: cacheDir,
    force: true,
    forceClean: true,
  });
  return dir;
}
