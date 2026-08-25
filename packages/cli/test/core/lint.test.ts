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
  const fm = [
    "---",
    `name: ${name}`,
    `description: "A test skill. Use when testing."`,
    "x-skills-master:",
    `  domain: ${spec.domain ?? spec.dir.split("/")[0]}`,
    `  class: ${spec.cls ?? "code"}`,
    `  category: ${spec.category ?? spec.dir.split("/")[2]}`,
    "  platforms: [testos]",
    `  pairs_with: [${pairs}]`,
    "  sources:",
    ...sources.map((u) => `    - ${u}`),
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
