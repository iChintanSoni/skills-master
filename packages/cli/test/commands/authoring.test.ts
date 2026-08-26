import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { newSkillCommand } from "../../src/commands/new";
import { registryBuildCommand } from "../../src/commands/registry";
import { lintCommand } from "../../src/commands/lint";
import { lintSkills } from "../../src/core/lint";

const CONTENT_ROOT = fileURLToPath(new URL("../fixtures/content", import.meta.url));

let dir: string;
let content: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "skills-master-authoring-"));
  content = join(dir, "content");
  cpSync(CONTENT_ROOT, content, { recursive: true });
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe("new", () => {
  it("scaffolds at the taxonomy path the spec describes", async () => {
    const p = await newSkillCommand({ spec: "testdomain/code/fixtures/brand-new", content });
    expect(p).toBe(join(content, "testdomain/code/fixtures/brand-new/SKILL.md"));
    expect(existsSync(p)).toBe(true);
  });

  it("maps the overview class to its overviews/ directory", async () => {
    const p = await newSkillCommand({ spec: "testdomain/overview/fixtures/router", content });
    expect(p).toContain(join("testdomain", "overviews", "fixtures", "router"));
  });

  it("writes frontmatter that matches the leaf name and starts as emerging", async () => {
    const p = await newSkillCommand({ spec: "testdomain/code/fixtures/brand-new", content });
    const text = readFileSync(p, "utf8");
    expect(text).toContain("name: brand-new");
    expect(text).toContain("stability: emerging");
    expect(text).toContain("version: 0.1.0");
    expect(text).toContain("platforms: [testdomain]");
    // 7.4: a fresh skill starts with no tags, because none can earn their place yet
    expect(text).toContain("tags: []");
  });

  it("scaffolds every canonical heading the linter looks for", async () => {
    const p = await newSkillCommand({ spec: "testdomain/code/fixtures/brand-new", content });
    const text = readFileSync(p, "utf8");
    for (const h of ["## When to use", "## Core guidance", "## Pitfalls", "## References"]) {
      expect(text).toContain(h);
    }
  });

  it("rejects a spec with too few segments", async () => {
    await expect(newSkillCommand({ spec: "testdomain/code/foo", content })).rejects.toThrow(
      /Expected "domain\/class\/category\/name"/,
    );
  });

  it("rejects an unknown class rather than inventing a directory", async () => {
    await expect(
      newSkillCommand({ spec: "testdomain/nonsense/fixtures/x", content }),
    ).rejects.toThrow();
  });

  it("refuses to overwrite an existing skill unless forced", async () => {
    const spec = "testdomain/code/fixtures/brand-new";
    await newSkillCommand({ spec, content });
    await expect(newSkillCommand({ spec, content })).rejects.toThrow(/already exists/);
    await expect(newSkillCommand({ spec, content, force: true })).resolves.toContain("SKILL.md");
  });
});

describe("registry build", () => {
  it("writes registry.json covering every skill in the tree", async () => {
    expect(await registryBuildCommand({ content })).toBe(true);
    const reg = JSON.parse(readFileSync(join(content, "registry.json"), "utf8"));
    expect(reg.skills.map((s: { name: string }) => s.name).sort()).toEqual([
      "fixture-skill",
      "fixture-tool-skill",
    ]);
  });

  it("--check passes when the committed file is current", async () => {
    await registryBuildCommand({ content });
    expect(await registryBuildCommand({ content, check: true })).toBe(true);
  });

  it("--check fails on drift instead of silently rewriting", async () => {
    await registryBuildCommand({ content });
    writeFileSync(join(content, "registry.json"), '{"version":"0.1.0","skills":[]}\n', "utf8");
    expect(await registryBuildCommand({ content, check: true })).toBe(false);
  });

  it("--check fails when the file is missing entirely", async () => {
    expect(await registryBuildCommand({ content, check: true })).toBe(false);
  });

  it("stamps the version it was given", async () => {
    await registryBuildCommand({ content, version: "9.9.9" });
    const reg = JSON.parse(readFileSync(join(content, "registry.json"), "utf8"));
    expect(reg.version).toBe("9.9.9");
  });
});

describe("lint command", () => {
  it("returns true for a clean tree", async () => {
    expect(await lintCommand({ content })).toBe(true);
  });

  it("returns false when a skill has an error, so CI can fail on it", async () => {
    const p = join(content, "testdomain/code/fixtures/fixture-skill/SKILL.md");
    // pairs_with pointing at a skill that does not exist is an error-level rule
    writeFileSync(
      p,
      readFileSync(p, "utf8").replace("  pairs_with: []", "  pairs_with: [ghost-skill]"),
      "utf8",
    );
    expect(lintSkills(content).errorCount).toBeGreaterThan(0);
    expect(await lintCommand({ content })).toBe(false);
  });
});
