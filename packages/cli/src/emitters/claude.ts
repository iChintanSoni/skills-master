import { RESOURCE_FILES, type Emitter, type EmittedFile, type ResourceKey } from "../types";
import { withFrontmatter } from "../core/yaml";
import { existsRel } from "./util";

/**
 * Claude Code emitter — the lossless, native projection.
 * Writes `.claude/skills/<name>/SKILL.md` plus verbatim copies of any resource
 * files, preserving progressive disclosure. The `x-skills-master` block is
 * dropped; the body (including links to resource files, which are co-located)
 * is kept exactly.
 */
export const claudeEmitter: Emitter = {
  id: "claude",
  label: "Claude Code",
  detect: (root) => existsRel(root, ".claude"),
  emit(skill, ctx): EmittedFile[] {
    const dir = `${ctx.paths.claude}/${skill.name}`;
    const fm = {
      name: skill.frontmatter.name,
      description: skill.frontmatter.description,
    };
    const files: EmittedFile[] = [
      {
        path: `${dir}/SKILL.md`,
        contents: withFrontmatter(fm, skill.body),
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
