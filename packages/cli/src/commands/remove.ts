import type { TargetId } from "../types";
import { loadLockfile, saveLockfile } from "../core/project";
import { pruneEmptyDirs, removeBlockFromFile, removeWholeFile } from "../core/writer";
import { log } from "../util/log";

export interface RemoveOptions {
  cwd: string;
  names: string[];
  /** restrict removal to specific targets; default = every target the skill was installed to. */
  targets?: TargetId[];
  dryRun?: boolean;
}

export interface RemoveResult {
  removed: string[];
  missing: string[];
}

export function removeCommand(opts: RemoveOptions): RemoveResult {
  const lock = loadLockfile(opts.cwd);
  const removed: string[] = [];
  const missing: string[] = [];
  const prefix = opts.dryRun ? "[dry-run] " : "";

  for (const name of opts.names) {
    const locked = lock.skills[name];
    if (!locked) {
      log.warn(`"${name}" is not installed.`);
      missing.push(name);
      continue;
    }

    const targets = (opts.targets?.length
      ? opts.targets
      : (Object.keys(locked.emitted) as TargetId[])
    ).filter((t) => locked.emitted[t]);

    const wholeRemoved: string[] = [];
    for (const t of targets) {
      const e = locked.emitted[t]!;
      for (const file of e.files) {
        if (removeWholeFile(opts.cwd, file, opts.dryRun)) {
          wholeRemoved.push(file);
          log.info(`${prefix}removed   ${file}`);
        }
      }
      if (e.block && removeBlockFromFile(opts.cwd, e.block, name, opts.dryRun)) {
        log.info(`${prefix}unblocked ${e.block} [${name}]`);
      }
      if (!opts.dryRun) delete locked.emitted[t];
    }
    pruneEmptyDirs(opts.cwd, wholeRemoved, opts.dryRun);

    if (!opts.dryRun) {
      if (Object.keys(locked.emitted).length === 0) delete lock.skills[name];
    }
    removed.push(name);
  }

  if (!opts.dryRun) saveLockfile(opts.cwd, lock);
  log.success(`${prefix}Removed ${removed.length} skill(s).`);
  return { removed, missing };
}
