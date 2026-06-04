import { type Emitter, type EmittedFile } from "../types";
import { withFrontmatter } from "../core/yaml";
import { condenseBody } from "../core/condense";
import { existsRel, globsToString, hasResources, titleFromName } from "./util";

/**
 * GitHub Copilot emitter — two outputs:
 *   1. `.github/instructions/<name>.instructions.md` (whole file) with the
 *      required `applyTo` glob and the condensed body.
 *   2. a one-line pointer block in `.github/copilot-instructions.md` (managed
 *      via sentinel markers) so the always-loaded root file stays small.
 */
export const copilotEmitter: Emitter = {
  id: "copilot",
  label: "GitHub Copilot",
  detect: (root) => existsRel(root, ".github"),
  emit(skill, ctx): EmittedFile[] {
    const base = ctx.paths.copilot; // e.g. ".github"
    const instructionsPath = `${base}/instructions/${skill.name}.instructions.md`;
    const applyTo = globsToString(skill.frontmatter) ?? "**";

    const fm = {
      applyTo,
      description: skill.frontmatter.description,
    };
    const body = condenseBody(skill.body, {
      openQuestion: "keep",
      hadResources: hasResources(skill.resources),
    });

    const pointer = `For ${titleFromName(skill.name)} guidance, see \`${instructionsPath}\`.`;

    return [
      {
        path: instructionsPath,
        contents: withFrontmatter(fm, body),
        mode: "whole",
      },
      {
        path: `${base}/copilot-instructions.md`,
        contents: pointer,
        mode: "block",
        blockId: skill.name,
        blockVersion: skill.frontmatter["x-skills-master"].version,
      },
    ];
  },
};
