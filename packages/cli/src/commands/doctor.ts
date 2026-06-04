import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { diskHash } from "../core/install";
import { loadConfig, loadLockfile } from "../core/project";
import { hasBlock } from "../core/markers";
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
  const names = Object.keys(lock.skills);
  if (names.length === 0) {
    log.info("No skills installed.");
    return { problems, ok: true };
  }

  for (const name of names) {
    const locked = lock.skills[name]!;
    for (const [target, e] of Object.entries(locked.emitted)) {
      for (const file of e.files) {
        if (!existsSync(join(opts.cwd, file))) note(`${name}: missing ${target} file ${file}`);
      }
      if (e.files.every((f) => existsSync(join(opts.cwd, f)))) {
        if (diskHash(opts.cwd, e.files) !== e.hash) {
          note(`${name}: local edits to ${target} output(s) (run \`update --overwrite\` to reset)`);
        }
      }
      if (e.block) {
        const abs = join(opts.cwd, e.block);
        if (!existsSync(abs) || !hasBlock(readFileSync(abs, "utf8"), name)) {
          note(`${name}: missing managed block in ${e.block}`);
        }
      }
    }
  }

  if (problems.length === 0) {
    log.success(`All ${names.length} installed skill(s) look healthy.`);
  } else {
    for (const p of problems) log.warn(p);
    log.plain(`\n${problems.length} problem(s) found.`);
  }
  return { problems, ok: problems.length === 0 };
}
