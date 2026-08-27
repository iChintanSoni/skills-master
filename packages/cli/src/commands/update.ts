import { resolvePaths } from "../schema/projectConfig";
import type { ParsedSkill, TargetId } from "../types";
import { SkillNotFoundError, resolveContent } from "../content/source";
import { diskHash, installSkill, sourceHashOf } from "../core/install";
import { loadConfigOrDefault, loadLockfile, saveLockfile } from "../core/project";
import { log } from "../util/log";

export interface UpdateOptions {
  cwd: string;
  names?: string[];
  content?: string;
  ref?: string;
  dryRun?: boolean;
  overwrite?: boolean;
  /** report which installed skills are behind the content and write nothing. */
  check?: boolean;
}

/** One installed skill whose emitted output no longer matches the content. */
export interface BehindSkill {
  name: string;
  installed: string;
  available: string;
  /** why it is behind: a newer release, an edit with no version bump, or a ref move. */
  reason: "version" | "content" | "ref";
}

export interface UpdateResult {
  updated: string[];
  upToDate: string[];
  skipped: string[];
  /** `--check` only: skills whose installed output is stale. */
  behind?: BehindSkill[];
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

  // `--check` answers a question `doctor` structurally cannot: doctor compares
  // emitted files against the lockfile, never the lockfile against the source,
  // so an install pinned to an old release reports healthy. This resolves the
  // content and reports what has moved. It writes nothing and re-emits nothing —
  // it is the CI gate, not a rehearsal of the update (that is --dry-run).
  if (opts.check) {
    const behind: BehindSkill[] = [];
    for (const name of names.sort()) {
      const locked = lock.skills[name];
      if (!locked) {
        log.warn(`"${name}" is not installed.`);
        skipped.push(name);
        continue;
      }
      let skill: ParsedSkill;
      try {
        skill = content.loadSkill(name);
      } catch (err) {
        if (err instanceof SkillNotFoundError) {
          log.warn(`"${name}" no longer exists in the content library.`);
        } else {
          log.error(
            `Failed to load "${name}": ${err instanceof Error ? err.message : String(err)}`,
          );
        }
        skipped.push(name);
        continue;
      }

      const available = skill.frontmatter["x-skills-master"].version;
      const sourceChanged = locked.sourceHash !== sourceHashOf(skill);
      const refChanged = lock.contentRef !== ref;
      if (!sourceChanged && !refChanged) {
        upToDate.push(name);
        continue;
      }
      // A content edit with no version bump is the case that matters most here:
      // resource files and descriptions change without a release, and nothing
      // else in the toolchain would tell a consumer their copy went stale.
      const reason = !sourceChanged ? "ref" : available !== locked.version ? "version" : "content";
      behind.push({ name, installed: locked.version, available, reason });
    }

    for (const b of behind) {
      const detail =
        b.reason === "version"
          ? `${b.installed} → ${b.available}`
          : b.reason === "content"
            ? `${b.installed} (content changed without a version bump)`
            : `${b.installed} (content ref moved to ${ref})`;
      log.info(`↑ ${b.name.padEnd(32)} ${detail}`);
    }
    if (behind.length === 0) {
      log.success(`All ${upToDate.length} installed skill(s) are current.`);
    } else {
      log.warn(
        `${behind.length} of ${behind.length + upToDate.length} installed skill(s) are behind — run \`update\`.`,
      );
    }
    return { updated, upToDate, skipped, behind };
  }

  for (const name of names.sort()) {
    const locked = lock.skills[name];
    if (!locked) {
      log.warn(`"${name}" is not installed — run \`add\` first.`);
      skipped.push(name);
      continue;
    }

    let skill: ParsedSkill;
    try {
      skill = content.loadSkill(name);
    } catch (err) {
      // Only an actual absence means "removed upstream" — a parse or I/O
      // failure must not masquerade as a deletion.
      if (err instanceof SkillNotFoundError) {
        log.warn(`"${name}" no longer exists in the content library.`);
      } else {
        log.error(`Failed to load "${name}": ${err instanceof Error ? err.message : String(err)}`);
      }
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
    if (userEdited && !opts.overwrite) {
      log.warn(`${prefix}"${name}" has local edits — skipping (use --overwrite to replace).`);
      skipped.push(name);
      continue;
    }

    const result = installSkill(opts.cwd, skill, targets, paths, {
      dryRun: opts.dryRun,
      overwrite: opts.overwrite || !userEdited,
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
