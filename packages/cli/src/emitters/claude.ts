import { RESOURCE_FILES, type Emitter, type EmittedFile, type ResourceKey } from "../types";
import { stabilityNote, withStabilityNote } from "../core/stability-note";
import { withFrontmatter } from "../core/yaml";
import { existsRel } from "./util";

/**
 * Claude Code emitter — the lossless, native projection.
 * Writes `.claude/skills/<name>/SKILL.md` plus verbatim copies of any resource
 * files, preserving progressive disclosure. The `x-skills-master` block is
 * dropped; the body (including links to resource files, which are co-located)
 * is kept exactly, prefixed by a provisionality banner when the skill is not
 * `stable` — `stability` is stripped with the rest of the block, so the body is
 * the only place that signal can survive.
 */
export const claudeEmitter: Emitter = {
  id: "claude",
  label: "Claude Code",
  detect: (root) => existsRel(root, ".claude"),
  emit(skill, ctx): EmittedFile[] {
    const dir = `${ctx.paths.claude}/${skill.name}`;
    const xm = skill.frontmatter["x-skills-master"];
    const note = stabilityNote(xm.stability, xm.snapshot_date);
    const fm = {
      name: skill.frontmatter.name,
      description: skill.frontmatter.description,
    };
    const files: EmittedFile[] = [
      {
        path: `${dir}/SKILL.md`,
        contents: withFrontmatter(fm, withStabilityNote(skill.body, note)),
        mode: "whole",
      },
    ];
    for (const key of Object.keys(RESOURCE_FILES) as ResourceKey[]) {
      const text = skill.resources[key];
      if (text) {
        files.push({
          path: `${dir}/${RESOURCE_FILES[key]}`,
          contents: text.trimEnd() + "\n",
          mode: "whole",
        });
      }
    }
    return files;
  },
};
