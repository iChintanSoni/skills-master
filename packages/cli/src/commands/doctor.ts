import { diagnoseInstalled } from "../core/installed-state";
import { loadConfig, loadLockfile } from "../core/project";
import { log } from "../util/log";

export interface DoctorOptions {
  cwd: string;
  json?: boolean;
}

export interface DoctorReport {
  problems: string[];
  ok: boolean;
}

export function doctorCommand(opts: DoctorOptions): DoctorReport {
  const problems: string[] = [];
  const note = (msg: string) => problems.push(msg);

  const cfg = loadConfig(opts.cwd);
  const lock = loadLockfile(opts.cwd);
  const diagnoses = diagnoseInstalled(opts.cwd, lock);

  // `--json` must stay parseable, so none of the human-facing lines are printed.
  // The exit-code contract is unchanged: `ok` still drives it.
  const emit = (report: DoctorReport): DoctorReport => {
    if (!opts.json) return report;
    log.plain(
      JSON.stringify(
        {
          ok: report.ok,
          problems: report.problems,
          skills: diagnoses,
          configuredTargets: cfg?.targets ?? [],
        },
        null,
        2,
      ),
    );
    return report;
  };

  if (!opts.json) {
    if (!cfg) {
      log.warn("No skills-master.json found — run `skills-master init`.");
    } else {
      log.info(`Config targets: ${cfg.targets.length ? cfg.targets.join(", ") : "(auto-detect)"}`);
    }
  }

  if (diagnoses.length === 0) {
    if (!opts.json) log.info("No skills installed.");
    return emit({ problems, ok: true });
  }

  for (const skill of diagnoses) {
    for (const t of skill.targets) {
      for (const file of t.missingFiles) {
        note(`${skill.name}: missing ${t.target} file ${file}`);
      }
      if (t.edited) {
        note(
          `${skill.name}: local edits to ${t.target} output(s) (run \`update --overwrite\` to reset)`,
        );
      }
      if (t.missingBlock) {
        note(`${skill.name}: missing managed block in ${t.missingBlock}`);
      }
    }
  }

  if (!opts.json) {
    if (problems.length === 0) {
      log.success(`All ${diagnoses.length} installed skill(s) look healthy.`);
    } else {
      for (const p of problems) log.warn(p);
      log.plain(`\n${problems.length} problem(s) found.`);
    }
  }
  return emit({ problems, ok: problems.length === 0 });
}
