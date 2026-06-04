import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { resolveContent } from "../content/source";
import { CLASS_DIR, SkillClassSchema, type SkillClass } from "../schema/frontmatter";
import { log } from "../util/log";

export interface NewSkillOptions {
  /** "domain/class/category/name", e.g. "apple/code/app-frameworks/swiftui-foo". */
  spec: string;
  content?: string;
  cwd?: string;
  force?: boolean;
}

function template(domain: string, cls: SkillClass, category: string, name: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `---
name: ${name}
description: TODO — one-line, third person. Use when <triggers go here>.
globs:
  - "**/*"
tags: []
x-skills-master:
  domain: ${domain}
  class: ${cls}
  category: ${category}
  platforms: [${domain}]
  requires: {}
  pairs_with: []
  sources: []
  snapshot_date: "${today}"
  stability: emerging
  version: 0.1.0
---

## When to use

TODO — when should an agent reach for this skill?

## Core guidance

TODO — the do/don't, idioms, and best practices (original prose, no copied docs).

## Platform notes

TODO — platform-specific caveats.

## Pitfalls

TODO — common mistakes.

## See also

TODO — paired skills and source links.
`;
}

export async function newSkillCommand(opts: NewSkillOptions): Promise<string> {
  const parts = opts.spec.split("/").filter(Boolean);
  if (parts.length < 4) {
    throw new Error(`Expected "domain/class/category/name", got "${opts.spec}".`);
  }
  const domain = parts[0]!;
  const cls = SkillClassSchema.parse(parts[1]);
  const category = parts[2]!;
  const name = parts[parts.length - 1]!;

  const content = await resolveContent({ content: opts.content, cwd: opts.cwd });
  const dir = join(content.root, domain, CLASS_DIR[cls], ...parts.slice(2));
  const skillMd = join(dir, "SKILL.md");

  if (existsSync(skillMd) && !opts.force) {
    throw new Error(`Skill already exists at ${skillMd} (use --force to overwrite).`);
  }
  mkdirSync(dir, { recursive: true });
  writeFileSync(skillMd, template(domain, cls, category, name), "utf8");
  log.success(`Created ${skillMd}`);
  return skillMd;
}
