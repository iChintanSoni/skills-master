import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { lintSkills } from "../../src/core/lint";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "skills-master-lint-"));
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

interface SkillSpec {
  /** directory relative to the skills root, e.g. "apple/code/app-frameworks/foo" */
  dir: string;
  name?: string;
  domain?: string;
  cls?: string;
  category?: string;
  stability?: string;
  snapshotDate?: string;
  pairsWith?: string[];
  tags?: string[];
  body?: string;
  sources?: string[];
  /** resource filenames (examples.md / checklist.md / reference.md) to create alongside. */
  resources?: string[];
}

const BODY = [
  "## When to use",
  "",
  "Use when testing.",
  "",
  "## Core guidance",
  "",
  "- Guidance.",
  "",
  "## Pitfalls",
  "",
  "- Pitfall.",
  "",
  "## References",
  "",
  "- [Docs](https://example.com/docs)",
  "",
  "## See also",
  "",
  "- something",
  "",
].join("\n");

function writeSkill(spec: SkillSpec): void {
  const dir = join(root, spec.dir);
  mkdirSync(dir, { recursive: true });
  const name = spec.name ?? spec.dir.split("/").at(-1);
  const pairs = (spec.pairsWith ?? []).map((p) => `"${p}"`).join(", ");
  const sources = spec.sources ?? ["https://example.com/docs"];
  const sourcesLines = sources.length
    ? ["  sources:", ...sources.map((u) => `    - ${u}`)]
    : ["  sources: []"];
  const fm = [
    "---",
    `name: ${name}`,
    `description: "A test skill. Use when testing."`,
    `tags: [${(spec.tags ?? []).join(", ")}]`,
    "x-skills-master:",
    `  domain: ${spec.domain ?? spec.dir.split("/")[0]}`,
    `  class: ${spec.cls ?? "code"}`,
    `  category: ${spec.category ?? spec.dir.split("/")[2]}`,
    "  platforms: [testos]",
    `  pairs_with: [${pairs}]`,
    ...sourcesLines,
    `  snapshot_date: "${spec.snapshotDate ?? "2026-01-01"}"`,
    `  stability: ${spec.stability ?? "stable"}`,
    "  version: 1.0.0",
    "---",
    "",
  ].join("\n");
  writeFileSync(join(dir, "SKILL.md"), fm + (spec.body ?? BODY), "utf8");
  for (const f of spec.resources ?? []) {
    writeFileSync(join(dir, f), "## Resource\n\ncontent\n", "utf8");
  }
}

function messagesOf(level: "error" | "warn"): string[] {
  return lintSkills(root)
    .diagnostics.filter((d) => d.level === level)
    .map((d) => d.message);
}

describe("lintSkills — taxonomy path rule", () => {
  it("accepts a skill whose directory matches its frontmatter", () => {
    writeSkill({ dir: "apple/code/app-frameworks/good-skill" });
    const res = lintSkills(root);
    expect(res.errorCount).toBe(0);
    expect(res.warnCount).toBe(0);
  });

  it("errors when the category directory level is missing", () => {
    writeSkill({ dir: "apple/overviews/shallow-skill", cls: "overview", category: "overviews" });
    expect(messagesOf("error")).toEqual([
      expect.stringContaining(
        'on-disk path "apple/overviews/shallow-skill" must be "apple/overviews/overviews/shallow-skill"',
      ),
    ]);
  });

  it("errors when the skill is nested one level too deep", () => {
    writeSkill({
      dir: "apple/design/components/presentation/deep-skill",
      cls: "design",
      category: "components",
    });
    expect(messagesOf("error")).toEqual([
      expect.stringContaining('must be "apple/design/components/deep-skill"'),
    ]);
  });

  it("errors when the directory category disagrees with frontmatter", () => {
    writeSkill({ dir: "android/code/compose-ui/misfiled-skill", category: "architecture" });
    expect(messagesOf("error")).toEqual([
      expect.stringContaining('must be "android/code/architecture/misfiled-skill"'),
    ]);
  });

  it("maps the overview class to the overviews directory", () => {
    writeSkill({
      dir: "apple/overviews/overviews/choosing-things",
      cls: "overview",
      category: "overviews",
    });
    expect(lintSkills(root).errorCount).toBe(0);
  });
});

describe("lintSkills — existing rules still hold", () => {
  it("errors when name differs from the folder name", () => {
    writeSkill({ dir: "apple/code/app-frameworks/folder-name", name: "other-name" });
    expect(messagesOf("error")).toEqual(
      expect.arrayContaining([expect.stringContaining('name "other-name" must equal the folder')]),
    );
  });

  it("errors on a future snapshot_date", () => {
    writeSkill({ dir: "apple/code/app-frameworks/time-traveler", snapshotDate: "2999-01-01" });
    expect(messagesOf("error")).toEqual(
      expect.arrayContaining([
        expect.stringContaining("snapshot_date 2999-01-01 is in the future"),
      ]),
    );
  });

  it("errors on unreciprocated pairs_with", () => {
    writeSkill({ dir: "apple/code/app-frameworks/one-way", pairsWith: ["the-other"] });
    writeSkill({ dir: "apple/design/components/the-other", cls: "design", category: "components" });
    expect(messagesOf("error")).toEqual(
      expect.arrayContaining([
        expect.stringContaining('pairs_with "the-other" is not reciprocated'),
      ]),
    );
  });

  it("errors on contested without an Open question section", () => {
    writeSkill({ dir: "apple/code/app-frameworks/contested-skill", stability: "contested" });
    expect(messagesOf("error")).toEqual(
      expect.arrayContaining([expect.stringContaining('no "## Open question"')]),
    );
  });

  it("warns when the YAML ' #' comment hazard appears in a description", () => {
    const dir = join(root, "apple/code/app-frameworks/yaml-hazard");
    mkdirSync(dir, { recursive: true });
    const fm = [
      "---",
      "name: yaml-hazard",
      "description: Covers @Test and #expect macros. Use when testing.",
      "x-skills-master:",
      "  domain: apple",
      "  class: code",
      "  category: app-frameworks",
      "  platforms: [testos]",
      "  pairs_with: []",
      "  sources:",
      "    - https://example.com/docs",
      '  snapshot_date: "2026-01-01"',
      "  stability: stable",
      "  version: 1.0.0",
      "---",
      "",
    ].join("\n");
    writeFileSync(join(dir, "SKILL.md"), fm + BODY, "utf8");
    expect(messagesOf("warn")).toEqual(
      expect.arrayContaining([
        expect.stringContaining('contains " #", which YAML reads as a comment'),
      ]),
    );
  });

  it("errors on duplicate names across domains", () => {
    writeSkill({ dir: "apple/code/app-frameworks/same-name" });
    writeSkill({ dir: "android/code/compose-ui/same-name" });
    expect(messagesOf("error")).toEqual(
      expect.arrayContaining([expect.stringContaining('duplicate skill name "same-name"')]),
    );
  });
});

describe("lintSkills — tightened rules", () => {
  it("errors when a non-contested skill carries an Open question section", () => {
    writeSkill({
      dir: "apple/code/app-frameworks/settled-skill",
      body: `${BODY}\n## Open question\n\nNot actually open.\n`,
    });
    expect(messagesOf("error")).toEqual(
      expect.arrayContaining([
        expect.stringContaining('"## Open question" is reserved for stability: contested'),
      ]),
    );
  });

  it("accepts contested with an Open question section", () => {
    writeSkill({
      dir: "apple/code/app-frameworks/truly-contested",
      stability: "contested",
      body: `${BODY}\n## Open question\n\nGenuinely open.\n`,
    });
    expect(lintSkills(root).errorCount).toBe(0);
  });

  it("warns when sources exceed the 3-URL cap", () => {
    writeSkill({
      dir: "apple/code/app-frameworks/many-sources",
      sources: [
        "https://example.com/1",
        "https://example.com/2",
        "https://example.com/3",
        "https://example.com/4",
      ],
    });
    expect(messagesOf("warn")).toEqual(
      expect.arrayContaining([expect.stringContaining("4 sources — keep at most 3")]),
    );
  });

  it("warns when pairs_with exceeds the 4-partner cap", () => {
    const partners = ["p1", "p2", "p3", "p4", "p5"];
    writeSkill({ dir: "apple/code/app-frameworks/over-paired", pairsWith: partners });
    for (const p of partners) {
      writeSkill({ dir: `apple/code/app-frameworks/${p}`, pairsWith: ["over-paired"] });
    }
    expect(messagesOf("warn")).toEqual(
      expect.arrayContaining([expect.stringContaining("5 pairs_with entries — keep at most 4")]),
    );
  });

  it("accepts a skill sitting exactly at the 4-partner cap", () => {
    const partners = ["q1", "q2", "q3", "q4"];
    writeSkill({ dir: "apple/code/app-frameworks/at-cap", pairsWith: partners });
    for (const p of partners) {
      writeSkill({ dir: `apple/code/app-frameworks/${p}`, pairsWith: ["at-cap"] });
    }
    const res = lintSkills(root);
    expect(res.warnCount).toBe(0);
    expect(res.errorCount).toBe(0);
  });

  it("warns when a tag repeats a term the skill is already findable by", () => {
    writeSkill({ dir: "apple/code/app-frameworks/echo-tags", tags: ["testing", "app-frameworks"] });
    expect(messagesOf("warn")).toEqual(
      expect.arrayContaining([
        expect.stringContaining('tag "testing" is already in the name or description'),
        expect.stringContaining('tag "app-frameworks" is already in the name or description'),
      ]),
    );
  });

  it("catches a tag that only differs from the prose by spacing or case", () => {
    // the shared body says "Use when testing."
    writeSkill({ dir: "apple/code/app-frameworks/spaced-tags", tags: ["Use-When", "USEWHEN"] });
    expect(messagesOf("warn").filter((m) => m.startsWith("tag "))).toHaveLength(2);
  });

  it("accepts a tag that contributes a term the skill never states", () => {
    writeSkill({ dir: "apple/code/app-frameworks/useful-tags", tags: ["cryptography", "i18n"] });
    const res = lintSkills(root);
    expect(res.warnCount).toBe(0);
    expect(res.errorCount).toBe(0);
  });

  it("warns when a resource file exists but is never linked", () => {
    writeSkill({ dir: "apple/code/app-frameworks/orphaned-resources", resources: ["examples.md"] });
    expect(messagesOf("warn")).toEqual(
      expect.arrayContaining([expect.stringContaining("examples.md exists but is never linked")]),
    );
  });

  it("accepts a linked resource, including anchored links", () => {
    writeSkill({
      dir: "apple/code/app-frameworks/linked-resources",
      resources: ["examples.md", "checklist.md"],
      body: BODY.replace(
        "- [Docs](https://example.com/docs)",
        "- [Docs](https://example.com/docs)\n- [Worked examples](examples.md#setup)\n- [Checklist](./checklist.md)",
      ),
    });
    expect(lintSkills(root).warnCount).toBe(0);
    expect(lintSkills(root).errorCount).toBe(0);
  });
});

describe("lintSkills — spec name rule", () => {
  // The spec allows [a-z0-9] words joined by single hyphens, <= 64 chars, and
  // Claude's platform additionally rejects "claude"/"anthropic" in a name.
  const badNames: [string, string][] = [
    ["-leading-hyphen", "kebab-case"],
    ["trailing-hyphen-", "kebab-case"],
    ["double--hyphen", "kebab-case"],
    ["Upper-Case", "kebab-case"],
    ["under_score", "kebab-case"],
    ["a".repeat(65), "at most 64 characters"],
    ["claude-tooling", "reserved words"],
    ["anthropic-sdk", "reserved words"],
  ];

  for (const [name, expected] of badNames) {
    it(`errors on "${name.slice(0, 20)}"`, () => {
      writeSkill({ dir: `apple/code/app-frameworks/${name}`, name });
      expect(messagesOf("error")).toEqual(
        expect.arrayContaining([expect.stringContaining(expected)]),
      );
    });
  }

  it("accepts a spec-legal name", () => {
    writeSkill({ dir: "apple/code/app-frameworks/swiftui-grids-2" });
    expect(lintSkills(root).errorCount).toBe(0);
  });

  it("applies the same rule to pairs_with entries", () => {
    writeSkill({ dir: "apple/code/app-frameworks/paired", pairsWith: ["bad--partner"] });
    expect(messagesOf("error")).toEqual(
      expect.arrayContaining([expect.stringContaining("pairs_with.0: must be kebab-case")]),
    );
  });
});

describe("lintSkills — remaining rule coverage", () => {
  it("errors when the body exceeds 500 lines and warns above 450", () => {
    const pad = (n: number) => `${BODY}\n${"filler line\n".repeat(n)}`;
    writeSkill({ dir: "apple/code/app-frameworks/very-long", body: pad(510) });
    writeSkill({ dir: "apple/code/app-frameworks/getting-long", body: pad(440) });
    expect(messagesOf("error")).toEqual(
      expect.arrayContaining([expect.stringMatching(/body is 5\d\d lines \(max 500\)/)]),
    );
    expect(messagesOf("warn")).toEqual(
      expect.arrayContaining([expect.stringMatching(/body is 4\d\d lines \(approaching/)]),
    );
  });

  it("warns on each missing canonical heading", () => {
    writeSkill({
      dir: "apple/code/app-frameworks/no-headings",
      body: "Just prose, no sections.\n",
    });
    const warns = messagesOf("warn").filter((m) => m.includes("missing recommended section"));
    expect(warns).toHaveLength(5);
    for (const h of ["When to use", "Core guidance", "Pitfalls", "References", "See also"]) {
      expect(warns.some((m) => m.includes(h))).toBe(true);
    }
  });

  it("warns when the description lacks a Use-when clause", () => {
    const dir = join(root, "apple/code/app-frameworks/vague-skill");
    mkdirSync(dir, { recursive: true });
    const fm = [
      "---",
      "name: vague-skill",
      'description: "Covers something."',
      "x-skills-master:",
      "  domain: apple",
      "  class: code",
      "  category: app-frameworks",
      "  platforms: [testos]",
      "  pairs_with: []",
      "  sources:",
      "    - https://example.com/docs",
      '  snapshot_date: "2026-01-01"',
      "  stability: stable",
      "  version: 1.0.0",
      "---",
      "",
    ].join("\n");
    writeFileSync(join(dir, "SKILL.md"), fm + BODY, "utf8");
    expect(messagesOf("warn")).toEqual(
      expect.arrayContaining([expect.stringContaining('"Use when ..." trigger clause')]),
    );
  });

  it("warns when sources are absent entirely", () => {
    writeSkill({ dir: "apple/code/app-frameworks/unsourced", sources: [] });
    expect(messagesOf("warn")).toEqual(
      expect.arrayContaining([expect.stringContaining("no sources")]),
    );
  });

  it("errors when pairs_with names an unknown skill", () => {
    writeSkill({ dir: "apple/code/app-frameworks/lonely", pairsWith: ["ghost-skill"] });
    expect(messagesOf("error")).toEqual(
      expect.arrayContaining([
        expect.stringContaining('pairs_with references unknown skill "ghost-skill"'),
      ]),
    );
  });

  it("reports invalid frontmatter as errors without aborting the run", () => {
    const dir = join(root, "apple/code/app-frameworks/broken-skill");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "SKILL.md"), "---\nname: 42\n---\nbody", "utf8");
    writeSkill({ dir: "apple/code/app-frameworks/fine-skill" });
    const res = lintSkills(root);
    expect(res.skillCount).toBe(2);
    expect(res.errorCount).toBeGreaterThan(0);
  });
});
