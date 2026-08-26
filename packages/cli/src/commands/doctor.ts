import { diagnoseInstalled } from "../core/installed-state";
import { loadConfig, loadLockfile } from "../core/project";
import { log } from "../util/log";

export interface DoctorOptions {
  cwd: string;
}

export interface DoctorReport {
  problems: string[];
  ok: boolean;
}

export function doctorCommand(opts: DoctorOptions): DoctorReport {
  const problems: string[] = [];
  const note = (msg: string) => problems.push(msg);

  const cfg = loadConfig(opts.cwd);
  if (!cfg) {
    log.warn("No skills-master.json found — run `skills-master init`.");
  } else {
    log.info(`Config targets: ${cfg.targets.length ? cfg.targets.join(", ") : "(auto-detect)"}`);
  }

  const lock = loadLockfile(opts.cwd);
  const diagnoses = diagnoseInstalled(opts.cwd, lock);
  if (diagnoses.length === 0) {
    log.info("No skills installed.");
    return { problems, ok: true };
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

  if (problems.length === 0) {
    log.success(`All ${diagnoses.length} installed skill(s) look healthy.`);
  } else {
    for (const p of problems) log.warn(p);
    log.plain(`\n${problems.length} problem(s) found.`);
  }
  return { problems, ok: problems.length === 0 };
}
