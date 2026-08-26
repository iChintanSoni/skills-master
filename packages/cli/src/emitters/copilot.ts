import type { Emitter, EmittedFile } from "../types";
import { withFrontmatter } from "../core/yaml";
import { condenseBody } from "../core/condense";
import { stabilityNote, withStabilityNote } from "../core/stability-note";
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
  // A bare .github/ (workflows, templates) says nothing about Copilot use —
  // detect only on Copilot's own customization files.
  detect: (root) =>
    existsRel(root, ".github/copilot-instructions.md") || existsRel(root, ".github/instructions"),
  emit(skill, ctx): EmittedFile[] {
    const base = ctx.paths.copilot; // e.g. ".github"
    const instructionsPath = `${base}/instructions/${skill.name}.instructions.md`;

    // Skills without globs (design guidance, overviews) must not become
    // applyTo: "**" — that attaches them to every single request. Omitting
    // applyTo makes the file manual-attach; the always-loaded pointer line in
    // copilot-instructions.md still advertises it.
    const applyTo = globsToString(skill.frontmatter);
    const fm: Record<string, unknown> = {
      ...(applyTo ? { applyTo } : {}),
      description: skill.frontmatter.description,
    };
    const xm = skill.frontmatter["x-skills-master"];
    const body = withStabilityNote(
      condenseBody(skill.body, {
        openQuestion: "keep",
        hadResources: hasResources(skill.resources),
      }),
      stabilityNote(xm.stability, xm.snapshot_date),
    );

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
