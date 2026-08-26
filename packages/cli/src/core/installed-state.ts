import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Lockfile } from "../schema/lockfile";
import { diskHash } from "./install";
import { hasBlock } from "./markers";

/**
 * How an installed target's output compares to what the lockfile recorded.
 * Ordered worst-last so a skill's overall state is the max of its targets.
 */
export const STATES = ["ok", "edited", "missing"] as const;
export type InstalledState = (typeof STATES)[number];

export interface TargetDiagnosis {
  target: string;
  /** lockfile-recorded files that are no longer on disk. */
  missingFiles: string[];
  /** every file is present but their combined hash no longer matches. */
  edited: boolean;
  /** shared file whose managed block has gone, when that is what happened. */
  missingBlock?: string;
  state: InstalledState;
}

export interface SkillDiagnosis {
  name: string;
  version: string;
  targets: TargetDiagnosis[];
  /** the worst state across this skill's targets. */
  state: InstalledState;
}

function worst(states: InstalledState[]): InstalledState {
  return states.reduce<InstalledState>(
    (acc, s) => (STATES.indexOf(s) > STATES.indexOf(acc) ? s : acc),
    "ok",
  );
}

/**
 * Compare the lockfile against what is actually on disk.
 *
 * The single source of truth for install health: `doctor` renders these as
 * problems and fails CI on them, `status` renders them as an inventory. Keeping
 * one implementation means the two can never disagree about what "edited" means.
 */
export function diagnoseInstalled(cwd: string, lock: Lockfile): SkillDiagnosis[] {
  const out: SkillDiagnosis[] = [];
  for (const name of Object.keys(lock.skills).sort()) {
    const locked = lock.skills[name]!;
    const targets: TargetDiagnosis[] = [];

    for (const [target, e] of Object.entries(locked.emitted)) {
      const missingFiles = e.files.filter((f) => !existsSync(join(cwd, f)));
      // Only meaningful once every file is present — a hash over missing files
      // would report "edited" for what is really a deletion.
      const edited = missingFiles.length === 0 && diskHash(cwd, e.files) !== e.hash;

      let missingBlock: string | undefined;
      if (e.block) {
        const abs = join(cwd, e.block);
        if (!existsSync(abs) || !hasBlock(readFileSync(abs, "utf8"), name)) missingBlock = e.block;
      }

      const state: InstalledState =
        missingFiles.length > 0 || missingBlock ? "missing" : edited ? "edited" : "ok";
      targets.push({ target, missingFiles, edited, missingBlock, state });
    }

    targets.sort((a, b) => a.target.localeCompare(b.target));
    out.push({
      name,
      version: locked.version,
      targets,
      state: worst(targets.map((t) => t.state)),
    });
  }
  return out;
}
