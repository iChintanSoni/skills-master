import { resolveContent, SkillNotFoundError } from "../content/source";
import { installSkill } from "../core/install";
import { diagnoseInstalled } from "../core/installed-state";
import { loadConfigOrDefault, loadLockfile, saveLockfile } from "../core/project";
import { pruneEmptyDirs, removeBlockFromFile, removeWholeFile } from "../core/writer";
import { resolvePaths } from "../schema/projectConfig";
import type { TargetId } from "../types";
import { log } from "../util/log";
import { resolveTargets } from "../util/targets";
import { removeCommand } from "./remove";

export interface SyncOptions {
  cwd: string;
  /** limit the sync to these installed skills. */
  names?: string[];
  content?: string;
  ref?: string;
  dryRun?: boolean;
  /** re-emit over locally edited outputs instead of leaving them alone. */
  overwrite?: boolean;
  /** delete outputs for targets the config no longer lists. */
  prune?: boolean;
}

export interface SyncResult {
  /** skills re-emitted (whether or not any bytes changed). */
  synced: string[];
  /** skills left alone because their output is locally edited. */
  skipped: string[];
  /** targets emitted to that the lockfile had no record of. */
  addedTargets: TargetId[];
  /** installed targets the config no longer lists, per skill. */
  orphaned: { name: string; targets: TargetId[] }[];
  /**
   * Output left at a location the skill no longer emits to — what a changed
   * `paths` override leaves behind. Invisible to `doctor`, because the lockfile
   * has already moved on to the new location.
   */
  stale: { name: string; files: string[]; blocks: string[] }[];
  pruned: boolean;
}

/**
 * Re-emit installed skills to match the *current* config.
 *
 * `update` only ever re-emits to the targets a skill was already installed to,
 * so a target added to `skills-master.json` after the fact, or a changed
 * `paths` override, never produces files — the config says one thing and disk
 * says another, with nothing to reconcile them. `sync` is that reconciliation:
 * it takes the configured target set as the source of truth and makes disk
 * match it.
 *
 * Local edits are preserved by default (same detection `doctor` and `status`
 * use); `--overwrite` replaces them.
 *
 * Two kinds of leftover, treated differently on purpose. Dropping a target from
 * the config is a *removal* — reported, but only deleted with `--prune`, since
 * the user may still want those files. Changing a `paths` override is a *move* —
 * cleaned up immediately, because leaving the old copy would have agents loading
 * the same guidance twice, and because the chance is fleeting: once the lockfile
 * points at the new path, nothing records that the old one was ever ours.
 */
export async function syncCommand(opts: SyncOptions): Promise<SyncResult> {
  const cfg = loadConfigOrDefault(opts.cwd);
  const lock = loadLockfile(opts.cwd);
  const targets = resolveTargets(opts.cwd, cfg.targets);
  const paths = resolvePaths(cfg);
  const prefix = opts.dryRun ? "[dry-run] " : "";

  const all = Object.keys(lock.skills).sort();
  const names = opts.names?.length ? all.filter((n) => opts.names!.includes(n)) : all;

  const result: SyncResult = {
    synced: [],
    skipped: [],
    addedTargets: [],
    orphaned: [],
    stale: [],
    pruned: false,
  };

  if (all.length === 0) {
    log.info("No skills installed — run `skills-master add <name>`.");
    return result;
  }
  if (names.length === 0) {
    log.warn("No installed skills match.");
    return result;
  }

  const edited = new Map(
    diagnoseInstalled(opts.cwd, lock).map((d) => [d.name, d.targets.some((t) => t.edited)]),
  );

  const content = await resolveContent({
    content: opts.content,
    ref: opts.ref ?? cfg.contentRef,
    cwd: opts.cwd,
  });

  log.info(`Syncing ${names.length} skill(s) to targets: ${targets.join(", ")}`);

  const addedTargets = new Set<TargetId>();
  const pruneNames: string[] = [];
  const pruneTargets = new Set<TargetId>();

  for (const name of names) {
    const locked = lock.skills[name]!;
    const installedTo = Object.keys(locked.emitted) as TargetId[];

    const orphans = installedTo.filter((t) => !targets.includes(t));
    if (orphans.length) {
      result.orphaned.push({ name, targets: orphans });
      pruneNames.push(name);
      for (const t of orphans) pruneTargets.add(t);
    }

    if (edited.get(name) && !opts.overwrite) {
      log.warn(`${prefix}"${name}" has local edits — skipping (use --overwrite to replace).`);
      result.skipped.push(name);
      continue;
    }

    let skill: Awaited<ReturnType<typeof content.loadSkill>>;
    try {
      skill = content.loadSkill(name);
    } catch (err) {
      if (err instanceof SkillNotFoundError) {
        log.warn(`"${name}" no longer exists in the content library — leaving it in place.`);
      } else {
        log.error(`Failed to load "${name}": ${err instanceof Error ? err.message : String(err)}`);
      }
      result.skipped.push(name);
      continue;
    }

    for (const t of targets) if (!locked.emitted[t]) addedTargets.add(t);

    // Where this skill's output lived *before* this sync, for the targets we
    // are about to re-emit. Compared against the new locations below.
    const prevFiles = new Set<string>();
    const prevBlocks = new Map<string, string>();
    for (const t of targets) {
      const e = locked.emitted[t];
      if (!e) continue;
      for (const f of e.files) prevFiles.add(f);
      if (e.block) prevBlocks.set(t, e.block);
    }

    const emitted = installSkill(opts.cwd, skill, targets, paths, {
      dryRun: opts.dryRun,
      overwrite: true, // edits were already checked above
    });

    // A changed `paths` override moves output without removing the old copy,
    // and the lockfile now points at the new location — so nothing else in the
    // toolchain can see the leftovers. Collect them here.
    const nowFiles = new Set<string>();
    for (const e of Object.values(emitted.locked.emitted)) {
      for (const f of e.files) nowFiles.add(f);
    }
    const staleFiles = [...prevFiles].filter((f) => !nowFiles.has(f));
    const staleBlocks = [...prevBlocks]
      .filter(([t, b]) => emitted.locked.emitted[t]?.block !== b)
      .map(([, b]) => b);
    if (staleFiles.length || staleBlocks.length) {
      result.stale.push({ name, files: staleFiles, blocks: staleBlocks });
    }
    if (!opts.dryRun) {
      // Preserve any target the config no longer lists until --prune removes it,
      // so the lockfile keeps describing files that are still on disk.
      lock.skills[name] = {
        ...emitted.locked,
        emitted: { ...locked.emitted, ...emitted.locked.emitted },
      };
    }
    result.synced.push(name);

    for (const r of emitted.results) {
      if (r.action === "unchanged") continue;
      const tag = r.mode === "block" ? `${r.path} [${r.blockId}]` : r.path;
      log.info(`${prefix}${r.action.padEnd(9)} ${tag}`);
    }
  }

  result.addedTargets = [...addedTargets].sort();
  if (!opts.dryRun) saveLockfile(opts.cwd, lock);

  if (result.orphaned.length) {
    const list = [...pruneTargets].sort().join(", ");
    if (opts.prune) {
      removeCommand({
        cwd: opts.cwd,
        names: pruneNames,
        targets: [...pruneTargets],
        dryRun: opts.dryRun,
      });
      result.pruned = true;
    } else {
      log.warn(
        `${result.orphaned.length} skill(s) still have output for target(s) the config no longer lists: ${list}. Re-run with --prune to remove.`,
      );
    }
  }

  // Cleaning up after a path change is not gated on --prune, unlike dropping a
  // target. Changing `paths` is a *move*: the old copy is output this tool wrote
  // and has just relocated, and leaving it behind would have agents loading the
  // same guidance twice from a file nothing tracks any more. It also cannot be
  // deferred — once the lockfile points at the new path, a later run has no
  // record that the old location was ever ours.
  if (result.stale.length) {
    const gone: string[] = [];
    for (const f of result.stale.flatMap((s) => s.files)) {
      if (removeWholeFile(opts.cwd, f, opts.dryRun)) {
        gone.push(f);
        log.info(`${prefix}moved-from ${f}`);
      }
    }
    pruneEmptyDirs(opts.cwd, gone, opts.dryRun);
    for (const s of result.stale) {
      for (const b of s.blocks) {
        if (removeBlockFromFile(opts.cwd, b, s.name, opts.dryRun)) {
          log.info(`${prefix}unblocked  ${b} [${s.name}]`);
        }
      }
    }
  }

  const bits = [`${result.synced.length} synced`];
  if (result.addedTargets.length) bits.push(`new target(s): ${result.addedTargets.join(", ")}`);
  if (result.skipped.length) bits.push(`${result.skipped.length} skipped`);
  log.success(`${prefix}${bits.join(", ")}.`);
  return result;
}
