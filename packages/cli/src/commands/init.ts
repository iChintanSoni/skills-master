import { ProjectConfigSchema, type ProjectConfig } from "../schema/projectConfig";
import { ALL_TARGETS, type TargetId } from "../types";
import { detectTargets } from "../emitters";
import { loadConfig, saveConfig } from "../core/project";
import { log } from "../util/log";

export interface InitOptions {
  cwd: string;
  /** explicit target set; if omitted, auto-detect (falling back to all). */
  targets?: TargetId[];
  commit?: boolean;
  contentRef?: string;
  force?: boolean;
}

export function initCommand(opts: InitOptions): ProjectConfig {
  const existing = loadConfig(opts.cwd);
  if (existing && !opts.force) {
    log.warn(`skills-master.json already exists — leaving it untouched (use --force to overwrite).`);
    return existing;
  }

  let targets = opts.targets;
  if (!targets || targets.length === 0) {
    const detected = detectTargets(opts.cwd);
    if (detected.length > 0) {
      targets = detected;
      log.info(`Detected tools: ${detected.join(", ")}`);
    } else {
      targets = ALL_TARGETS;
      log.info(`No tools detected — defaulting to all targets (${ALL_TARGETS.join(", ")}).`);
    }
  }

  const cfg = ProjectConfigSchema.parse({
    contentRef: opts.contentRef ?? "main",
    targets,
    commit: opts.commit ?? true,
  });
  saveConfig(opts.cwd, cfg);
  log.success(`Wrote skills-master.json (targets: ${targets.join(", ")}, commit: ${cfg.commit}).`);
  return cfg;
}
