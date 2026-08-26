import type { Emitter, EmittedFile } from "../types";
import { withFrontmatter } from "../core/yaml";
import { condenseBody } from "../core/condense";
import { stabilityNote, withStabilityNote } from "../core/stability-note";
import { existsRel, globsToString, hasResources } from "./util";

/**
 * Cursor emitter — `.cursor/rules/<name>.mdc`, a single file.
 * Frontmatter is exactly the three fields Cursor understands:
 *   - `globs` present  → Auto-Attached rule
 *   - `globs` absent   → Agent-Requested rule (description-driven)
 * A skills library never sets `alwaysApply: true` (that would inject every
 * skill into every chat).
 */
export const cursorEmitter: Emitter = {
  id: "cursor",
  label: "Cursor",
  detect: (root) => existsRel(root, ".cursor"),
  emit(skill, ctx): EmittedFile[] {
    const globs = globsToString(skill.frontmatter);
    const fm: Record<string, unknown> = {
      description: skill.frontmatter.description,
    };
    if (globs) fm.globs = globs;
    fm.alwaysApply = false;

    const xm = skill.frontmatter["x-skills-master"];
    const body = withStabilityNote(
      condenseBody(skill.body, { hadResources: hasResources(skill.resources) }),
      stabilityNote(xm.stability, xm.snapshot_date),
    );

    return [
      {
        path: `${ctx.paths.cursor}/${skill.name}.mdc`,
        contents: withFrontmatter(fm, body),
        mode: "whole",
      },
    ];
  },
};
