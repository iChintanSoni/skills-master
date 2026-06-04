import { z } from "zod";

/** Records, per target, which files an install produced and their content hash. */
export const EmittedTargetSchema = z.object({
  /** whole-file outputs owned by this target for this skill. */
  files: z.array(z.string()).default([]),
  /** shared file this skill writes a managed block into (block-mode targets). */
  block: z.string().optional(),
  /** sha256 of the concatenated emitted contents, for drift detection. */
  hash: z.string(),
});

export const LockedSkillSchema = z.object({
  /** resolved skill version at install time. */
  version: z.string(),
  /** sha256 of the canonical SKILL.md + resource files at install time. */
  sourceHash: z.string(),
  /** targets this skill was emitted to. */
  emitted: z.record(z.string(), EmittedTargetSchema),
});

export const LockfileSchema = z.object({
  lockfileVersion: z.literal(1).default(1),
  contentRef: z.string().default("main"),
  skills: z.record(z.string(), LockedSkillSchema).default({}),
});

export type EmittedTarget = z.infer<typeof EmittedTargetSchema>;
export type LockedSkill = z.infer<typeof LockedSkillSchema>;
export type Lockfile = z.infer<typeof LockfileSchema>;

export function emptyLockfile(contentRef = "main"): Lockfile {
  return { lockfileVersion: 1, contentRef, skills: {} };
}
