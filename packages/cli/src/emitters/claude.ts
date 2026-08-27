import type { Emitter, EmittedFile } from "../types";
import { specSkillFiles } from "./spec-skill";
import { existsRel } from "./util";

/**
 * Claude Code emitter — the lossless, native projection.
 *
 * Writes the Agent Skills projection to `.claude/skills/<name>/`, the only
 * skills root Claude Code scans: the 2.1.231 binary has no reference to
 * `.agents/skills` at all, which is why the `agents-skills` target exists
 * alongside this one rather than replacing it.
 */
export const claudeEmitter: Emitter = {
  id: "claude",
  label: "Claude Code",
  detect: (root) => existsRel(root, ".claude"),
  emit(skill, ctx): EmittedFile[] {
    return specSkillFiles(skill, `${ctx.paths.claude}/${skill.name}`);
  },
};
