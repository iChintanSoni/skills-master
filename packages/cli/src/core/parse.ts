import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import matter from "gray-matter";
import { FrontmatterSchema, type Frontmatter } from "../schema/frontmatter";
import {
  RESOURCE_FILES,
  type ParsedSkill,
  type ResourceKey,
  type SkillResources,
} from "../types";
import { relPathOf } from "./discover";

export interface RawSkill {
  dir: string;
  relPath: string;
  /** leaf folder name (the expected `name`). */
  folderName: string;
  /** unvalidated frontmatter object. */
  data: Record<string, unknown>;
  body: string;
  resources: SkillResources;
  skillMdPath: string;
  /** full unparsed SKILL.md text (used for YAML-hazard linting). */
  rawText: string;
}

/** Read a skill directory's SKILL.md and resource files without validating. */
export function loadRawSkill(dir: string, skillsRoot: string): RawSkill {
  const skillMdPath = join(dir, "SKILL.md");
  const rawText = readFileSync(skillMdPath, "utf8");
  const parsed = matter(rawText);

  const resources: SkillResources = {};
  for (const key of Object.keys(RESOURCE_FILES) as ResourceKey[]) {
    const p = join(dir, RESOURCE_FILES[key]);
    if (existsSync(p)) resources[key] = readFileSync(p, "utf8");
  }

  return {
    dir,
    relPath: relPathOf(skillsRoot, dir),
    folderName: basename(dir),
    data: parsed.data as Record<string, unknown>,
    body: parsed.content.replace(/^\n+/, "").trimEnd(),
    resources,
    skillMdPath,
    rawText,
  };
}

export class SkillValidationError extends Error {
  constructor(
    public readonly relPath: string,
    public readonly issues: string[],
  ) {
    super(`Invalid skill "${relPath}":\n  - ${issues.join("\n  - ")}`);
    this.name = "SkillValidationError";
  }
}

/** Validate raw frontmatter; returns the typed frontmatter or a list of issues. */
export function validateFrontmatter(
  data: Record<string, unknown>,
): { ok: true; value: Frontmatter } | { ok: false; issues: string[] } {
  const result = FrontmatterSchema.safeParse(data);
  if (result.success) return { ok: true, value: result.data };
  const issues = result.error.issues.map((i) => {
    const path = i.path.join(".");
    return path ? `${path}: ${i.message}` : i.message;
  });
  return { ok: false, issues };
}

/** Load and validate a skill directory into a ParsedSkill (throws on failure). */
export function loadSkill(dir: string, skillsRoot: string): ParsedSkill {
  const raw = loadRawSkill(dir, skillsRoot);
  const validated = validateFrontmatter(raw.data);
  if (!validated.ok) throw new SkillValidationError(raw.relPath, validated.issues);
  return {
    name: validated.value.name,
    dir: raw.dir,
    relPath: raw.relPath,
    frontmatter: validated.value,
    body: raw.body,
    resources: raw.resources,
  };
}
