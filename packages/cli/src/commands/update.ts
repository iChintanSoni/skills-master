import { resolvePaths } from "../schema/projectConfig";
import type { TargetId } from "../types";
import { resolveContent } from "../content/source";
import { diskHash, installSkill, sourceHashOf } from "../core/install";
import { loadConfigOrDefault, loadLockfile, saveLockfile } from "../core/project";
import type { ConflictChoice } from "../core/writer";
import { log } from "../util/log";

export interface UpdateOptions {
  cwd: string;
  names?: string[];
  content?: string;
  ref?: string;
  dryRun?: boolean;
  overwrite?: boolean;
  onConflict?: (path: string) => ConflictChoice;
}

export interface UpdateResult {
  updated: string[];
  upToDate: string[];
  skipped: string[];
}

export async function updateCommand(opts: UpdateOptions): Promise<UpdateResult> {
  const cfg = loadConfigOrDefault(opts.cwd);
  const lock = loadLockfile(opts.cwd);
  const ref = opts.ref ?? cfg.contentRef;
  const updated: string[] = [];
  const upToDate: string[] = [];
  const skipped: string[] = [];

  const names = opts.names?.length ? opts.names : Object.keys(lock.skills);
  if (names.length === 0) {
    log.info("No installed skills to update.");
    return { updated, upToDate, skipped };
  }

  const content = await resolveContent({ content: opts.content, ref, cwd: opts.cwd });
  const paths = resolvePaths(cfg);
  const prefix = opts.dryRun ? "[dry-run] " : "";

  for (const name of names.sort()) {
    const locked = lock.skills[name];
    if (!locked) {
      log.warn(`"${name}" is not installed — run \`add\` first.`);
      skipped.push(name);
      continue;
    }

    let skill;
    try {
      skill = content.loadSkill(name);
    } catch {
      log.warn(`"${name}" no longer exists in the content library.`);
      skipped.push(name);
      continue;
    }

    const refChanged = lock.contentRef !== ref;
    const sourceChanged = locked.sourceHash !== sourceHashOf(skill);
    if (!opts.overwrite && !sourceChanged && !refChanged) {
      upToDate.push(name);
      continue;
    }

    // Re-emit to exactly the targets this skill was installed to.
    const targets = Object.keys(locked.emitted) as TargetId[];

    // Detect user edits to owned whole-files since install.
    const userEdited = targets.some((t) => {
      const e = locked.emitted[t];
      return e && diskHash(opts.cwd, e.files) !== e.hash;
    });
    if (userEdited && !opts.overwrite && !opts.onConflict) {
      log.warn(`${prefix}"${name}" has local edits — skipping (use --overwrite to replace).`);
      skipped.push(name);
      continue;
    }

    const result = installSkill(opts.cwd, skill, targets, paths, {
      dryRun: opts.dryRun,
      overwrite: opts.overwrite || !userEdited,
      onConflict: opts.onConflict,
    });
    if (!opts.dryRun) lock.skills[name] = result.locked;
    updated.push(name);
    for (const r of result.results) {
      if (r.action === "unchanged") continue;
      const tag = r.mode === "block" ? `${r.path} [${r.blockId}]` : r.path;
      log.info(`${prefix}${r.action.padEnd(9)} ${tag}`);
    }
  }

  if (!opts.dryRun) {
    lock.contentRef = ref;
    saveLockfile(opts.cwd, lock);
  }

  log.success(
    `${prefix}Updated ${updated.length}, up-to-date ${upToDate.length}, skipped ${skipped.length}.`,
  );
  return { updated, upToDate, skipped };
}
