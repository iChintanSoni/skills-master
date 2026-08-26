import { CLASS_DIR, type Frontmatter } from "../schema/frontmatter";
import type { SkillResources } from "../types";
import { findSkillDirs, relPathOf } from "./discover";
import { loadRawSkill, type RawSkill, validateFrontmatter } from "./parse";
import { searchableText, searchNormalize } from "./search-text";

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

const CANONICAL_HEADINGS = [
  "## When to use",
  "## Core guidance",
  "## Pitfalls",
  "## References",
  "## See also",
];
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
  resources?: SkillResources;
}

export function lintSkills(skillsRoot: string): LintResult {
  const dirs = findSkillDirs(skillsRoot);
  const diagnostics: Diagnostic[] = [];
  const loaded: Loaded[] = [];
  const byName = new Map<string, Frontmatter>();

  for (const dir of dirs) {
    let raw: RawSkill;
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
      loaded.push({
        relPath: raw.relPath,
        folderName: raw.folderName,
        body: raw.body,
        resources: raw.resources,
      });
      continue;
    }
    loaded.push({
      relPath: raw.relPath,
      folderName: raw.folderName,
      fm: v.value,
      body: raw.body,
      resources: raw.resources,
    });
    byName.set(v.value.name, v.value);
  }

  // Skill names must be globally unique (the registry and `add` key on name).
  const nameDirs = new Map<string, string[]>();
  for (const s of loaded) {
    const n = s.fm?.name ?? s.folderName;
    (nameDirs.get(n) ?? nameDirs.set(n, []).get(n)!).push(s.relPath);
  }
  for (const [name, paths] of nameDirs) {
    if (paths.length > 1) {
      for (const p of paths) {
        diagnostics.push({
          relPath: p,
          level: "error",
          message: `duplicate skill name "${name}" (also at ${paths.filter((x) => x !== p).join(", ")})`,
        });
      }
    }
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

    // contested ⇔ Open question section (the heading is reserved for contested)
    const hasOpenQuestion = /^## Open question\b/m.test(s.body);
    if (xm.stability === "contested" && !hasOpenQuestion) {
      push("error", `stability is "contested" but no "## Open question" section is present`);
    } else if (xm.stability !== "contested" && hasOpenQuestion) {
      push(
        "error",
        `"## Open question" is reserved for stability: contested skills — retitle the section or mark the skill contested`,
      );
    }

    // sources cap (authoring.md: 1-3 canonical citation URLs)
    if (xm.sources.length > 3) {
      push("warn", `${xm.sources.length} sources — keep at most 3 canonical citation URLs`);
    }

    // Tags exist only to add search terms the skill is not already findable by.
    // `search` matches on letters and digits alone, so a tag whose text is
    // already in the name, description, or facets can never change a result.
    const findable = searchableText({
      name: fm.name,
      description: fm.description,
      domain: xm.domain,
      category: xm.category,
      class: xm.class,
    });
    for (const tag of fm.tags ?? []) {
      if (findable.includes(searchNormalize(tag))) {
        push("warn", `tag "${tag}" is already in the name or description — it adds no search term`);
      }
    }

    // Level-3 resources must be linked from the body: condense flattens links
    // and appends the pointer note, and agents navigate through them — an
    // unlinked resource is invisible in every emit target.
    const l3: [keyof SkillResources, string][] = [
      ["reference", "reference.md"],
      ["examples", "examples.md"],
      ["checklist", "checklist.md"],
    ];
    for (const [key, file] of l3) {
      if (
        s.resources?.[key] != null &&
        !s.body.includes(`(${file}`) &&
        !s.body.includes(`(./${file}`)
      ) {
        push("warn", `${file} exists but is never linked from the SKILL.md body`);
      }
    }

    // body length
    const lineCount = s.body.split("\n").length;
    if (lineCount > MAX_BODY_LINES) {
      push(
        "error",
        `SKILL.md body is ${lineCount} lines (max ${MAX_BODY_LINES}); move depth into reference.md/examples.md`,
      );
    } else if (lineCount > WARN_BODY_LINES) {
      push(
        "warn",
        `SKILL.md body is ${lineCount} lines (approaching the ${MAX_BODY_LINES}-line cap)`,
      );
    }

    // The on-disk location is derived entirely from frontmatter; any drift
    // means the registry and coverage reports carry a phantom taxonomy.
    const expectedPath = `${xm.domain}/${CLASS_DIR[xm.class]}/${xm.category}/${fm.name}`;
    if (s.relPath !== expectedPath) {
      push(
        "error",
        `on-disk path "${s.relPath}" must be "${expectedPath}" (domain/class dir/category/name from frontmatter)`,
      );
    }

    // sources should be present and be https documentation URLs
    if (xm.sources.length === 0) {
      push("warn", `no sources — add at least one canonical documentation URL`);
    }
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
    if (xm.pairs_with.length > 4) {
      push(
        "warn",
        `${xm.pairs_with.length} pairs_with entries — keep at most 4; put wider cross-references in "## See also"`,
      );
    }
    for (const partner of xm.pairs_with) {
      const partnerFm = byName.get(partner);
      if (!partnerFm) {
        push("error", `pairs_with references unknown skill "${partner}"`);
        continue;
      }
      if (!partnerFm["x-skills-master"].pairs_with.includes(fm.name)) {
        push(
          "error",
          `pairs_with "${partner}" is not reciprocated (add "${fm.name}" to its pairs_with)`,
        );
      }
    }
  }

  const errorCount = diagnostics.filter((d) => d.level === "error").length;
  const warnCount = diagnostics.filter((d) => d.level === "warn").length;
  return { diagnostics, skillCount: dirs.length, errorCount, warnCount };
}
