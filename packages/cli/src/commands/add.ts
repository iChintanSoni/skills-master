import { resolvePaths } from "../schema/projectConfig";
import { ALL_TARGETS, type TargetId } from "../types";
import { detectTargets } from "../emitters";
import { resolveContent } from "../content/source";
import { installSkill } from "../core/install";
import {
  loadConfig,
  loadConfigOrDefault,
  loadLockfile,
  saveConfig,
  saveLockfile,
} from "../core/project";
import { ensureGitignored } from "../core/gitignore";
import type { ConflictChoice } from "../core/writer";
import { log } from "../util/log";

export interface AddOptions {
  cwd: string;
  /** skill names, category names, or class names to install. */
  names: string[];
  targets?: TargetId[];
  content?: string;
  ref?: string;
  withPairs?: boolean;
  dryRun?: boolean;
  overwrite?: boolean;
  /** interactive conflict resolver (bin supplies this on a TTY). */
  onConflict?: (path: string) => ConflictChoice;
}

export interface AddResult {
  targets: TargetId[];
  installed: { name: string; version: string }[];
  skipped: string[];
}

export async function addCommand(opts: AddOptions): Promise<AddResult> {
  const cfg = loadConfigOrDefault(opts.cwd);
  const hadConfig = loadConfig(opts.cwd) != null;

  let targets = opts.targets?.length ? opts.targets : cfg.targets;
  if (!targets.length) targets = detectTargets(opts.cwd);
  if (!targets.length) targets = ALL_TARGETS;

  const content = await resolveContent({
    content: opts.content,
    ref: opts.ref ?? cfg.contentRef,
    cwd: opts.cwd,
  });
  const registry = content.registry();
  const byName = new Map(registry.skills.map((s) => [s.name, s]));

  // Resolve tokens → concrete skill names (name > category > class).
  const selected = new Set<string>();
  const skipped: string[] = [];
  for (const token of opts.names) {
    if (byName.has(token)) {
      selected.add(token);
      continue;
    }
    const byCategory = registry.skills.filter((s) => s.category === token);
    const byClass = registry.skills.filter((s) => s.class === token);
    const group = byCategory.length ? byCategory : byClass;
    if (group.length) {
      group.forEach((s) => selected.add(s.name));
    } else {
      log.warn(`No skill, category, or class matches "${token}".`);
      skipped.push(token);
    }
  }

  if (opts.withPairs) {
    for (const name of [...selected]) {
      for (const pair of byName.get(name)?.pairs_with ?? []) {
        if (byName.has(pair)) selected.add(pair);
        else log.warn(`Paired skill "${pair}" (from "${name}") is not in the registry.`);
      }
    }
  }

  if (selected.size === 0) {
    log.error("Nothing to install.");
    return { targets, installed: [], skipped };
  }

  const paths = resolvePaths(cfg);
  const lock = loadLockfile(opts.cwd);
  lock.contentRef = opts.ref ?? cfg.contentRef;
  const installed: { name: string; version: string }[] = [];

  const prefix = opts.dryRun ? "[dry-run] " : "";
  for (const name of [...selected].sort()) {
    const skill = content.loadSkill(name);
    const result = installSkill(opts.cwd, skill, targets, paths, {
      dryRun: opts.dryRun,
      overwrite: opts.overwrite,
      onConflict: opts.onConflict,
    });
    if (!opts.dryRun) lock.skills[name] = result.locked;
    installed.push({ name, version: result.version });

    for (const r of result.results) {
      const tag = r.mode === "block" ? `${r.path} [${r.blockId}]` : r.path;
      log.info(`${prefix}${r.action.padEnd(9)} ${tag}`);
    }
  }

  if (!opts.dryRun) {
    saveLockfile(opts.cwd, lock);
    if (!hadConfig) {
      saveConfig(opts.cwd, { ...cfg, targets });
      log.info("Wrote skills-master.json.");
    }
    if (!cfg.commit) {
      const outs = targets.map((t) => paths[t]);
      ensureGitignored(opts.cwd, outs);
    }
  }

  log.success(
    `${prefix}Installed ${installed.length} skill(s) into ${targets.length} target(s): ${targets.join(", ")}.`,
  );
  return { targets, installed, skipped };
}
