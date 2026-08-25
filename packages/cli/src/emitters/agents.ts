import type { Emitter, EmittedFile } from "../types";
import { digestBody } from "../core/condense";
import { existsRel, titleFromName } from "./util";

/**
 * AGENTS.md emitter — the broad cross-tool standard, now read natively by
 * Codex, Cursor, and Copilot among others. Plain Markdown, no frontmatter
 * (per the spec). Each skill becomes a `###` section inside a
 * sentinel-managed block so installs compose and updates stay surgical.
 * Because consumers inject the whole file on every request, blocks carry a
 * digest (description + leading guidance/pitfall bullets), not the full body.
 */
export const agentsEmitter: Emitter = {
  id: "agents",
  label: "AGENTS.md",
  detect: (root) => existsRel(root, "AGENTS.md"),
  emit(skill, ctx): EmittedFile[] {
    const body = digestBody(skill.body, {
      name: skill.name,
      description: skill.frontmatter.description,
    });
    const section = `### ${titleFromName(skill.name)}\n\n${body.trim()}`;
    return [
      {
        path: ctx.paths.agents,
        contents: section,
        mode: "block",
        blockId: skill.name,
        blockVersion: skill.frontmatter["x-skills-master"].version,
      },
    ];
  },
};
