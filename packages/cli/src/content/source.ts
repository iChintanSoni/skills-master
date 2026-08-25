import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, isAbsolute, join, resolve } from "node:path";
import { findSkillDirs } from "../core/discover";
import { loadSkill } from "../core/parse";
import { buildRegistry } from "../core/registry-build";
import type { Registry } from "../schema/registry";
import type { ParsedSkill } from "../types";

/** Default content repo (override with SKILLS_MASTER_REPO). */
const DEFAULT_REPO = "github:iChintanSoni/skills-master";

/** package.json `name` that identifies the skills-master content repo (dev checkout). */
const CONTENT_REPO_PACKAGE = "skills-master-monorepo";

/** The named skill does not exist in the content tree (vs. failing to load). */
export class SkillNotFoundError extends Error {
  constructor(
    public readonly skillName: string,
    root: string,
  ) {
    super(`Skill "${skillName}" not found in content at ${root}`);
    this.name = "SkillNotFoundError";
  }
}

/** A resolved, on-disk skills tree the CLI reads from. */
export class ContentSource {
  constructor(public readonly root: string) {}

  skillDirs(): string[] {
    return findSkillDirs(this.root);
  }

  findDir(name: string): string | undefined {
    const dirs = this.skillDirs();
    return (
      dirs.find((d) => basename(d) === name) ?? dirs.find((d) => safeName(d, this.root) === name)
    );
  }

  loadSkill(name: string): ParsedSkill {
    const dir = this.findDir(name);
    if (!dir) throw new SkillNotFoundError(name, this.root);
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
 *   3. the skills-master content repo, if running inside it (dev convenience, searched upward)
 *   4. remote fetch via giget (published content)
 */
export async function resolveContent(opts: ResolveContentOptions = {}): Promise<ContentSource> {
  if (opts.content) {
    const root = isAbsolute(opts.content) ? opts.content : resolve(process.cwd(), opts.content);
    if (!existsSync(root)) throw new Error(`--content directory not found: ${root}`);
    return new ContentSource(root);
  }
  const env = process.env.SKILLS_MASTER_CONTENT;
  if (env) {
    const root = resolve(env);
    if (!existsSync(root)) throw new Error(`SKILLS_MASTER_CONTENT directory not found: ${root}`);
    return new ContentSource(root);
  }

  const local = findLocalSkillsDir(opts.cwd ?? process.cwd());
  if (local) return new ContentSource(local);

  return new ContentSource(await fetchRemote(opts.ref ?? "main"));
}

/**
 * Walk upward looking for the skills-master content repo: a root whose
 * `package.json` name is {@link CONTENT_REPO_PACKAGE} and that has a `skills/`
 * subtree. Keying on the package name (not just any pnpm workspace with a
 * `skills/` dir) keeps an unrelated monorepo from hijacking content resolution.
 */
function findLocalSkillsDir(start: string): string | null {
  let dir = resolve(start);
  for (let i = 0; i < 8; i++) {
    const candidate = join(dir, "skills");
    if (existsSync(candidate) && isContentRepoRoot(dir)) return candidate;
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/** True when `dir` is the skills-master monorepo root (by package.json name). */
function isContentRepoRoot(dir: string): boolean {
  try {
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as { name?: string };
    return pkg.name === CONTENT_REPO_PACKAGE;
  } catch {
    return false;
  }
}

/** Download the `skills/` subtree of the content repo to a local cache. */
async function fetchRemote(ref: string): Promise<string> {
  const repo = process.env.SKILLS_MASTER_REPO ?? DEFAULT_REPO;
  // An empty sanitized ref would collapse the cache path to the cache root,
  // which forceClean below would then wipe wholesale.
  const safeRef = ref.trim().replace(/[^\w.-]/g, "_");
  if (!safeRef) throw new Error(`Invalid content ref "${ref}".`);
  const cacheDir = join(homedir(), ".skills-master-cache", safeRef);
  const { downloadTemplate } = await import("giget");
  try {
    const { dir } = await downloadTemplate(`${repo}/skills#${ref.trim()}`, {
      dir: cacheDir,
      force: true,
      forceClean: true,
    });
    return dir;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to fetch skills content from ${repo}#${ref.trim()}: ${msg}\n` +
        `Check the ref, or point at a local checkout with --content <dir> or SKILLS_MASTER_CONTENT.`,
    );
  }
}
