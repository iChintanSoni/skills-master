import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ContentSource, resolveContent } from "../../src/content/source";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "skills-master-source-"));
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
  delete process.env.SKILLS_MASTER_CONTENT;
});

function writeSkill(dir: string, name: string): void {
  const abs = join(root, dir);
  mkdirSync(abs, { recursive: true });
  const fm = [
    "---",
    `name: ${name}`,
    `description: "A test skill. Use when testing."`,
    "x-skills-master:",
    "  domain: testdomain",
    "  class: code",
    `  category: ${dir.split("/")[2]}`,
    "  platforms: [testos]",
    "  pairs_with: []",
    "  sources:",
    "    - https://example.com/docs",
    '  snapshot_date: "2026-01-01"',
    "  stability: stable",
    "  version: 1.0.0",
    "---",
    "",
    "## When to use",
    "",
    "Testing.",
    "",
  ].join("\n");
  writeFileSync(join(abs, "SKILL.md"), fm, "utf8");
}

describe("ContentSource.registry", () => {
  it("prefers the committed registry.json over scanning", () => {
    writeSkill("testdomain/code/cat/on-disk-skill", "on-disk-skill");
    const committed = {
      version: "0.1.0",
      skills: [
        {
          name: "from-registry-file",
          domain: "testdomain",
          class: "code",
          category: "cat",
          description: "Came from the committed file. Use when proving the file was read.",
          platforms: ["testos"],
          pairs_with: [],
          stability: "stable",
          version: "1.0.0",
          path: "testdomain/code/cat/from-registry-file",
          resources: { reference: false, examples: false, checklist: false },
        },
      ],
    };
    writeFileSync(join(root, "registry.json"), JSON.stringify(committed), "utf8");

    const reg = new ContentSource(root).registry();
    expect(reg.skills.map((s) => s.name)).toEqual(["from-registry-file"]);
  });

  it("falls back to scanning when no registry.json exists", () => {
    writeSkill("testdomain/code/cat/scanned-skill", "scanned-skill");
    const reg = new ContentSource(root).registry();
    expect(reg.skills.map((s) => s.name)).toEqual(["scanned-skill"]);
  });

  it("falls back to scanning when registry.json is unreadable", () => {
    writeSkill("testdomain/code/cat/scanned-skill", "scanned-skill");
    writeFileSync(join(root, "registry.json"), "{ not json", "utf8");
    const reg = new ContentSource(root).registry();
    expect(reg.skills.map((s) => s.name)).toEqual(["scanned-skill"]);
  });

  it("memoizes the registry and the directory walk", () => {
    writeSkill("testdomain/code/cat/first-skill", "first-skill");
    const src = new ContentSource(root);
    expect(src.registry()).toBe(src.registry());

    const before = src.skillDirs();
    writeSkill("testdomain/code/cat/second-skill", "second-skill");
    expect(src.skillDirs()).toBe(before); // cached — no re-walk within an instance
    expect(new ContentSource(root).skillDirs()).toHaveLength(2);
  });
});

describe("resolveContent priority", () => {
  it("explicit content wins over the environment variable", async () => {
    const other = mkdtempSync(join(tmpdir(), "skills-master-env-"));
    try {
      process.env.SKILLS_MASTER_CONTENT = other;
      const src = await resolveContent({ content: root });
      expect(src.root).toBe(root);
    } finally {
      rmSync(other, { recursive: true, force: true });
    }
  });

  it("uses SKILLS_MASTER_CONTENT when no explicit content is given", async () => {
    process.env.SKILLS_MASTER_CONTENT = root;
    const src = await resolveContent({ cwd: tmpdir() });
    expect(src.root).toBe(root);
  });

  it("errors when SKILLS_MASTER_CONTENT points nowhere", async () => {
    process.env.SKILLS_MASTER_CONTENT = join(root, "missing");
    await expect(resolveContent({ cwd: tmpdir() })).rejects.toThrow(
      /SKILLS_MASTER_CONTENT directory not found/,
    );
  });
});
