import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ParsedSkill, TargetId } from "../types";
import type { LockedSkill } from "../schema/lockfile";
import { compileSkill } from "./compile";
import { applyFiles, type ApplyOptions, type DetailedWriteResult } from "./writer";
import { sha256 } from "./hash";

export interface InstallResult {
  name: string;
  version: string;
  results: DetailedWriteResult[];
  locked: LockedSkill;
}

/** Hash a skill's canonical source for drift detection. */
export function sourceHashOf(skill: ParsedSkill): string {
  const xm = skill.frontmatter["x-skills-master"];
  return sha256(
    skill.relPath,
    xm.version,
    skill.frontmatter.description,
    skill.body,
    skill.resources.reference ?? "",
    skill.resources.examples ?? "",
    skill.resources.checklist ?? "",
  );
}

/**
 * Hash the given whole-file outputs as they currently exist on disk. Both the
 * lockfile (at install time) and the `update`/`doctor` drift checks use this
 * one function, so a clean install always reconciles.
 */
export function diskHash(projectRoot: string, relPaths: string[]): string {
  const sorted = [...relPaths].sort((a, b) => a.localeCompare(b));
  const parts: string[] = [];
  for (const p of sorted) {
    const abs = join(projectRoot, p);
    const contents = existsSync(abs) ? readFileSync(abs, "utf8") : "<<missing>>";
    parts.push(p, contents);
  }
  return sha256(...parts);
}

/** Compile a skill to the given targets and write the outputs to a project. */
export function installSkill(
  projectRoot: string,
  skill: ParsedSkill,
  targets: TargetId[],
  paths: Record<TargetId, string>,
  opts: ApplyOptions = {},
): InstallResult {
  const compiled = compileSkill(skill, targets, { projectRoot, paths });
  const allFiles = compiled.flatMap((c) => c.files);
  const results = applyFiles(projectRoot, allFiles, opts);

  const emitted: LockedSkill["emitted"] = {};
  for (const c of compiled) {
    const whole = c.files.filter((f) => f.mode === "whole").map((f) => f.path);
    const block = c.files.find((f) => f.mode === "block")?.path;
    // Hash covers only whole-file outputs (block files are marker-managed and
    // safe to reconcile). Computed from disk after writing so the lockfile
    // records what actually landed; in dry-run nothing is written or saved.
    const hash = opts.dryRun ? sha256("dry-run", ...whole) : diskHash(projectRoot, whole);
    emitted[c.target] = { files: whole, ...(block ? { block } : {}), hash };
  }

  const version = skill.frontmatter["x-skills-master"].version;
  return {
    name: skill.name,
    version,
    results,
    locked: { version, sourceHash: sourceHashOf(skill), emitted },
  };
}
