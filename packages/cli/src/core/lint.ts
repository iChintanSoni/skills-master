import type { Frontmatter } from "../schema/frontmatter";
import { findSkillDirs, relPathOf } from "./discover";
import { loadRawSkill, validateFrontmatter } from "./parse";

export type DiagnosticLevel = "error" | "warn";

export interface Diagnostic {
  relPath: string;
  level: DiagnosticLevel;
  message: string;
}

export interface LintResult {
  diagnostics: Diagnostic[];
  skillCount: number;
  errorCount: number;
  warnCount: number;
}

const CANONICAL_HEADINGS = ["## When to use", "## Core guidance", "## Pitfalls", "## See also"];
const MAX_BODY_LINES = 500;
const WARN_BODY_LINES = 450;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface Loaded {
  relPath: string;
  folderName: string;
  fm?: Frontmatter;
  body: string;
}

export function lintSkills(skillsRoot: string): LintResult {
  const dirs = findSkillDirs(skillsRoot);
  const diagnostics: Diagnostic[] = [];
  const loaded: Loaded[] = [];
  const byName = new Map<string, Frontmatter>();

  for (const dir of dirs) {
    let raw;
    try {
      raw = loadRawSkill(dir, skillsRoot);
    } catch (err) {
      diagnostics.push({
        relPath: relPathOf(skillsRoot, dir),
        level: "error",
        message: `failed to parse SKILL.md: ${err instanceof Error ? err.message.split("\n")[0] : String(err)}`,
      });
      continue;
    }

    // YAML hazard: an unquoted scalar containing " #" is silently truncated as
    // a comment (e.g. "@Test, #expect" loses everything from "#expect" on).
    for (const line of raw.rawText.split("\n")) {
      const m = /^(\s*)(name|description|category):\s+(?!["'])(.*\s#.*)$/.exec(line);
      if (m) {
        diagnostics.push({
          relPath: raw.relPath,
          level: "warn",
          message: `frontmatter "${m[2]}" contains " #", which YAML reads as a comment — quote the value`,
        });
      }
    }

    const v = validateFrontmatter(raw.data);
    if (!v.ok) {
      for (const issue of v.issues) {
        diagnostics.push({ relPath: raw.relPath, level: "error", message: issue });
      }
      loaded.push({ relPath: raw.relPath, folderName: raw.folderName, body: raw.body });
      continue;
    }
    loaded.push({ relPath: raw.relPath, folderName: raw.folderName, fm: v.value, body: raw.body });
    byName.set(v.value.name, v.value);
  }

  const todayStr = today();

  for (const s of loaded) {
    const push = (level: DiagnosticLevel, message: string) =>
      diagnostics.push({ relPath: s.relPath, level, message });
    if (!s.fm) continue;
    const fm = s.fm;
    const xm = fm["x-skills-master"];

    // name == folder name
    if (fm.name !== s.folderName) {
      push("error", `name "${fm.name}" must equal the folder name "${s.folderName}"`);
    }

    // description shape (soft)
    if (!/use when/i.test(fm.description)) {
      push("warn", `description should include a "Use when ..." trigger clause`);
    }

    // snapshot_date not in the future
    if (xm.snapshot_date > todayStr) {
      push("error", `snapshot_date ${xm.snapshot_date} is in the future`);
    }

    // contested ⇒ Open question section
    if (xm.stability === "contested" && !/^## Open question\b/m.test(s.body)) {
      push("error", `stability is "contested" but no "## Open question" section is present`);
    }

    // body length
    const lineCount = s.body.split("\n").length;
    if (lineCount > MAX_BODY_LINES) {
      push("error", `SKILL.md body is ${lineCount} lines (max ${MAX_BODY_LINES}); move depth into reference.md/examples.md`);
    } else if (lineCount > WARN_BODY_LINES) {
      push("warn", `SKILL.md body is ${lineCount} lines (approaching the ${MAX_BODY_LINES}-line cap)`);
    }

    // domain should match the top path segment
    if (!s.relPath.startsWith(`${xm.domain}/`)) {
      push("warn", `domain "${xm.domain}" does not match the top folder of "${s.relPath}"`);
    }

    // sources should be https documentation URLs
    for (const url of xm.sources) {
      if (!/^https:\/\//.test(url)) {
        push("warn", `sources entry should be an https URL: ${url}`);
      }
    }

    // canonical headings
    for (const heading of CANONICAL_HEADINGS) {
      if (!s.body.includes(heading)) {
        push("warn", `missing recommended section "${heading}"`);
      }
    }

    // pairs_with referential integrity (bidirectional)
    for (const partner of xm.pairs_with) {
      const partnerFm = byName.get(partner);
      if (!partnerFm) {
        push("error", `pairs_with references unknown skill "${partner}"`);
        continue;
      }
      if (!partnerFm["x-skills-master"].pairs_with.includes(fm.name)) {
        push("error", `pairs_with "${partner}" is not reciprocated (add "${fm.name}" to its pairs_with)`);
      }
    }
  }

  const errorCount = diagnostics.filter((d) => d.level === "error").length;
  const warnCount = diagnostics.filter((d) => d.level === "warn").length;
  return { diagnostics, skillCount: dirs.length, errorCount, warnCount };
}
