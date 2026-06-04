import { z } from "zod";
import type { TargetId } from "../types";

export const TargetIdSchema = z.enum(["claude", "cursor", "copilot", "agents"]);

/** Default output location per target, relative to the project root. */
export const DEFAULT_PATHS: Record<TargetId, string> = {
  claude: ".claude/skills",
  cursor: ".cursor/rules",
  copilot: ".github",
  agents: "AGENTS.md",
};

export const ProjectConfigSchema = z
  .object({
    $schema: z.string().optional(),
    /** Git ref of the content repo to install from (tag/branch/sha). */
    contentRef: z.string().default("main"),
    /**
     * Targets to emit. Empty array means "auto-detect on every run".
     */
    targets: z.array(TargetIdSchema).default([]),
    /** Per-target output path overrides (merged over DEFAULT_PATHS). */
    paths: z
      .object({
        claude: z.string(),
        cursor: z.string(),
        copilot: z.string(),
        agents: z.string(),
      })
      .partial()
      .default({}),
    scope: z.enum(["project"]).default("project"),
    /** true = commit generated files; false = add them to .gitignore. */
    commit: z.boolean().default(true),
  })
  .strict();

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

export const CONFIG_FILENAME = "skills-master.json";
export const LOCKFILE_NAME = "skills-master.lock.json";

/** Resolve effective output paths by merging overrides over the defaults. */
export function resolvePaths(cfg: ProjectConfig): Record<TargetId, string> {
  return { ...DEFAULT_PATHS, ...cfg.paths } as Record<TargetId, string>;
}
