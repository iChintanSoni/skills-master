import { resolvePaths } from "../schema/projectConfig";
import type { TargetId } from "../types";
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
import { log } from "../util/log";
import { resolveTargets } from "../util/targets";

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
}

export interface AddResult {
  targets: TargetId[];
  installed: { name: string; version: string }[];
  skipped: string[];
}

export async function addCommand(opts: AddOptions): Promise<AddResult> {
  const cfg = loadConfigOrDefault(opts.cwd);
  const hadConfig = loadConfig(opts.cwd) != null;

  const targets = resolveTargets(opts.cwd, cfg.targets, opts.targets);

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
      for (const s of group) selected.add(s.name);
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
  const ownedFiles = new Set<string>();
  const sharedBlockFiles = new Set<string>();

  const prefix = opts.dryRun ? "[dry-run] " : "";
  for (const name of [...selected].sort()) {
    const skill = content.loadSkill(name);
    const result = installSkill(opts.cwd, skill, targets, paths, {
      dryRun: opts.dryRun,
      overwrite: opts.overwrite,
    });
    if (!opts.dryRun) lock.skills[name] = result.locked;
    installed.push({ name, version: result.version });

    for (const e of Object.values(result.locked.emitted)) {
      if (!e) continue;
      for (const f of e.files) ownedFiles.add(f);
      if (e.block) sharedBlockFiles.add(e.block);
    }

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
    } else {
      // An explicit --target/--ref is a decision about the project, not just
      // this one invocation: persist it, or the next bare `add`/`sync` would
      // silently revert to the old config and re-emit somewhere else.
      // --target widens rather than replaces, so adding one skill to a new tool
      // never quietly drops the tools already configured.
      const merged = [...new Set([...cfg.targets, ...(opts.targets ?? [])])].sort();
      const targetsChanged =
        opts.targets?.length != null && merged.join() !== [...cfg.targets].sort().join();
      const refChanged = opts.ref != null && opts.ref !== cfg.contentRef;
      if (targetsChanged || refChanged) {
        const next = {
          ...cfg,
          targets: targetsChanged ? (merged as TargetId[]) : cfg.targets,
          contentRef: refChanged ? opts.ref! : cfg.contentRef,
        };
        saveConfig(opts.cwd, next);
        const what = [
          targetsChanged ? `targets: ${next.targets.join(", ")}` : null,
          refChanged ? `ref: ${next.contentRef}` : null,
        ].filter(Boolean);
        log.info(`Updated skills-master.json (${what.join(", ")}).`);
      }
    }
    if (!cfg.commit) {
      // Ignore only files the emitters own outright, anchored to the project
      // root. Block-mode outputs live inside shared files (AGENTS.md,
      // .github/copilot-instructions.md) that may carry hand-written content,
      // so those are never gitignored.
      ensureGitignored(
        opts.cwd,
        [...ownedFiles].sort((a, b) => a.localeCompare(b)).map((f) => `/${f}`),
      );
      if (sharedBlockFiles.size > 0) {
        log.warn(
          `Not gitignoring shared file(s) with managed blocks: ${[...sharedBlockFiles].sort().join(", ")}.`,
        );
      }
    }
  }

  log.success(
    `${prefix}Installed ${installed.length} skill(s) into ${targets.length} target(s): ${targets.join(", ")}.`,
  );
  return { targets, installed, skipped };
}
