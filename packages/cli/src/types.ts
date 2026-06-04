/**
 * Shared types for the skills-master compiler.
 *
 * The canonical authored unit is a *skill*: a directory containing a `SKILL.md`
 * (frontmatter + body) plus optional on-demand resource files. An *emitter*
 * projects a parsed skill into the files a particular AI tool expects.
 */

import type { Frontmatter } from "./schema/frontmatter";

export type { Frontmatter } from "./schema/frontmatter";

/** The four AI-tool targets shipped at launch. */
export type TargetId = "claude" | "cursor" | "copilot" | "agents";

export const ALL_TARGETS: TargetId[] = ["claude", "cursor", "copilot", "agents"];

/** On-demand "Level 3" resource files that may sit beside a SKILL.md. */
export interface SkillResources {
  reference?: string;
  examples?: string;
  checklist?: string;
}

export const RESOURCE_FILES = {
  reference: "reference.md",
  examples: "examples.md",
  checklist: "checklist.md",
} as const;

export type ResourceKey = keyof typeof RESOURCE_FILES;

/** A skill after its SKILL.md and resource files have been read and validated. */
export interface ParsedSkill {
  /** kebab-case name; equals the leaf folder name. */
  name: string;
  /** absolute path to the skill's source directory. */
  dir: string;
  /** path relative to the skills root, e.g. `code/app-frameworks/swiftdata-modeling`. */
  relPath: string;
  /** validated, normalized frontmatter. */
  frontmatter: Frontmatter;
  /** markdown body (everything after the frontmatter). */
  body: string;
  /** raw text of any present resource files. */
  resources: SkillResources;
}

/**
 * Output file modes:
 * - `whole`  — the emitter owns the entire file (overwrite as a unit).
 * - `block`  — the emitter owns only a marked region inside a shared file.
 */
export type FileMode = "whole" | "block";

export interface EmittedFile {
  /** path relative to the consuming project root. */
  path: string;
  /** for `whole`: the full file contents. for `block`: the managed region body. */
  contents: string;
  mode: FileMode;
  /** required for `block` mode — identifies the managed region (usually the skill name). */
  blockId?: string;
  /** for `block` mode — written into the BEGIN marker for drift detection. */
  blockVersion?: string;
}

export interface EmitContext {
  /** absolute path to the consuming project root. */
  projectRoot: string;
  /** effective per-target output paths (already merged with defaults). */
  paths: Record<TargetId, string>;
}

export interface Emitter {
  id: TargetId | (string & {});
  /** human label for logs. */
  label: string;
  /** detect whether this tool is present in a project (used by auto-detect). */
  detect(projectRoot: string): boolean;
  /** project a skill into target files. */
  emit(skill: ParsedSkill, ctx: EmitContext): EmittedFile[];
}

/** Result of applying a single EmittedFile to disk. */
export type WriteAction = "created" | "updated" | "unchanged" | "skipped";

export interface WriteResult {
  path: string;
  mode: FileMode;
  blockId?: string;
  action: WriteAction;
}
