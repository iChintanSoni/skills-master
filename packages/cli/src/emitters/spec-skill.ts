import { stabilityNote, withStabilityNote } from "../core/stability-note";
import { quoted, withFrontmatter } from "../core/yaml";
import { RESOURCE_FILES, type EmittedFile, type ParsedSkill, type ResourceKey } from "../types";

/**
 * The Agent Skills projection: `<root>/<name>/SKILL.md` plus verbatim copies of
 * any resource files, preserving progressive disclosure.
 *
 * Two targets mount this same output at different roots, because no agent reads
 * both: Claude Code scans `.claude/skills` and has no notion of `.agents/skills`
 * (verified against 2.1.231), while Codex and Gemini CLI scan `.agents/skills`
 * and have no notion of `.claude/skills`. The projection itself is identical —
 * it is the specification's format, not any one tool's.
 *
 * `x-skills-master` is dropped; the body is kept exactly, prefixed by a
 * provisionality banner when the skill is not `stable`, since `stability` is
 * stripped with the rest of the block and the body is the only place that
 * signal can survive.
 */
export function specSkillFiles(skill: ParsedSkill, dir: string): EmittedFile[] {
  const xm = skill.frontmatter["x-skills-master"];
  const note = stabilityNote(xm.stability, xm.snapshot_date);
  // `license` is a spec field, so it rides along when the skill declares one.
  // Absent means absent: the emitter has no business inventing a license for
  // content it did not author.
  //
  // `metadata` is the spec's string→string map for non-spec facts. It carries
  // the two authored facts that decide whether an installed skill is still
  // worth trusting — which release it is, and when it was last checked against
  // the vendor docs. Both die with the strip of `x-skills-master` otherwise,
  // and a plugin consumer has no lockfile to recover them from. It costs no
  // context: the listing preloads `- <name>: <description>` per skill and
  // nothing else.
  const fm = {
    name: skill.frontmatter.name,
    description: skill.frontmatter.description,
    ...(skill.frontmatter.license ? { license: skill.frontmatter.license } : {}),
    metadata: {
      version: quoted(xm.version),
      "snapshot-date": quoted(xm.snapshot_date),
    },
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
}
