import {
  diagnoseInstalled,
  type InstalledState,
  type SkillDiagnosis,
} from "../core/installed-state";
import { loadConfig, loadLockfile } from "../core/project";
import { log } from "../util/log";

export interface StatusOptions {
  cwd: string;
  /** limit the report to these skills. */
  names?: string[];
  /** limit the report to skills that are not `ok`. */
  problemsOnly?: boolean;
  json?: boolean;
}

export interface StatusReport {
  contentRef: string;
  configuredTargets: string[];
  skills: SkillDiagnosis[];
  counts: Record<InstalledState, number>;
}

const MARK: Record<InstalledState, string> = { ok: "ok", edited: "edited", missing: "missing" };

/**
 * Inventory of what is installed, from the lockfile and disk only — no network
 * and no content resolution, so it works offline and in a checkout with no
 * skills library nearby.
 *
 * Sibling to `doctor`, deliberately: they share drift detection
 * (`core/installed-state.ts`) but answer different questions. `doctor` asks
 * "is anything wrong?" and fails CI; `status` asks "what do I have?" and always
 * succeeds, so it is safe to pipe.
 */
export function statusCommand(opts: StatusOptions): StatusReport {
  const cfg = loadConfig(opts.cwd);
  const lock = loadLockfile(opts.cwd);

  let skills = diagnoseInstalled(opts.cwd, lock);
  if (opts.names?.length) {
    const want = new Set(opts.names);
    skills = skills.filter((s) => want.has(s.name));
  }
  if (opts.problemsOnly) skills = skills.filter((s) => s.state !== "ok");

  const counts: Record<InstalledState, number> = { ok: 0, edited: 0, missing: 0 };
  for (const s of skills) counts[s.state]++;

  const report: StatusReport = {
    contentRef: lock.contentRef,
    configuredTargets: cfg?.targets ?? [],
    skills,
    counts,
  };

  if (opts.json) {
    log.plain(JSON.stringify(report, null, 2));
    return report;
  }

  if (Object.keys(lock.skills).length === 0) {
    log.info("No skills installed — run `skills-master add <name>`.");
    return report;
  }
  if (skills.length === 0) {
    log.info(opts.problemsOnly ? "Nothing needs attention." : "No installed skills match.");
    return report;
  }

  log.info(
    `${skills.length} skill(s) from ref ${report.contentRef}` +
      (report.configuredTargets.length
        ? ` · config targets: ${report.configuredTargets.join(", ")}`
        : ""),
  );
  log.plain("");

  const nameWidth = Math.max(...skills.map((s) => s.name.length));
  const verWidth = Math.max(...skills.map((s) => s.version.length + 1));
  for (const s of skills) {
    const targets = s.targets
      .map((t) => (t.state === "ok" ? t.target : `${t.target} (${MARK[t.state]})`))
      .join(", ");
    log.plain(
      `  ${s.name.padEnd(nameWidth)}  ${`v${s.version}`.padEnd(verWidth)}  ${MARK[s.state].padEnd(7)}  ${targets}`,
    );
  }

  log.plain("");
  const parts = [`${counts.ok} ok`];
  if (counts.edited) parts.push(`${counts.edited} edited`);
  if (counts.missing) parts.push(`${counts.missing} missing`);
  log.plain(parts.join(", ") + ".");
  if (counts.edited || counts.missing) {
    log.plain("Run `skills-master doctor` for detail, or `update --overwrite` to reset.");
  }
  return report;
}
