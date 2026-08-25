import type { Emitter, EmittedFile } from "../types";
import { condenseBody, demoteHeadings } from "../core/condense";
import { existsRel, hasResources, titleFromName } from "./util";

/**
 * AGENTS.md emitter — the broad cross-tool standard. Plain Markdown, no
 * frontmatter (per the spec). Each skill becomes a `###` section inside a
 * sentinel-managed block so installs compose and updates stay surgical.
 * Bodies are summarized aggressively (this file is read in full by many tools).
 */
export const agentsEmitter: Emitter = {
  id: "agents",
  label: "AGENTS.md",
  detect: (root) => existsRel(root, "AGENTS.md"),
  emit(skill, ctx): EmittedFile[] {
    const body = demoteHeadings(
      condenseBody(skill.body, {
        openQuestion: "summarize",
        hadResources: hasResources(skill.resources),
      }),
      // Body headings start at h2; the section title below is h3, so shift
      // the body down two levels to keep the outline well-formed.
      2,
    );
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
