import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { marketplaceBuildCommand } from "../../src/commands/marketplace";
import { ContentSource } from "../../src/content/source";

const CONTENT_ROOT = fileURLToPath(new URL("../fixtures/content", import.meta.url));

const CODE_PLUGIN = "plugins/skills-master-testdomain-code";
const CATEGORY_PLUGIN = "plugins/skills-master-testdomain-code-fixtures";
const TOOL_PLUGIN = "plugins/skills-master-testdomain-lang-tooling";
const MARKETPLACE = ".claude-plugin/marketplace.json";

let out: string;
const has = (p: string) => existsSync(join(out, p));
const read = (p: string) => readFileSync(join(out, p), "utf8");

function write(rel: string, contents: string): void {
  const abs = join(out, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, contents, "utf8");
}

function build(check = false) {
  return marketplaceBuildCommand({ content: CONTENT_ROOT, out, check });
}

/**
 * A copy of the fixture library with a second category inside `testdomain/code`.
 *
 * The shared fixture has one category per class, which is exactly the case where
 * the build *suppresses* category plugins — so it cannot exercise the split.
 * Adding the extra skill to the shared fixture would move the expectations of
 * ten unrelated tests, so it lives here, where it is the thing under test.
 */
function contentWithTwoCategories(): string {
  const root = join(out, "src-content");
  cpSync(CONTENT_ROOT, root, { recursive: true });
  const dir = join(root, "testdomain/code/extras/fixture-extra-skill");
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "SKILL.md"),
    [
      "---",
      "name: fixture-extra-skill",
      "description: A second fixture skill, in a second category. Use when exercising category grouping.",
      "license: MIT",
      "x-skills-master:",
      "  domain: testdomain",
      "  class: code",
      "  category: extras",
      "  platforms: [testos]",
      "  pairs_with: []",
      "  sources:",
      "    - https://example.com/docs/fixture-extra",
      '  snapshot_date: "2026-01-01"',
      "  stability: stable",
      "  version: 1.0.0",
      "---",
      "",
      "## Core guidance",
      "",
      "- Do the second deterministic thing.",
      "",
    ].join("\n"),
    "utf8",
  );
  return root;
}

/** Every skill directory bundled under plugins/, as "<plugin>/<skill>". */
function bundled(): string[] {
  const root = join(out, "plugins");
  if (!existsSync(root)) return [];
  return readdirSync(root)
    .flatMap((plugin) => {
      const skillsDir = join(root, plugin, "skills");
      if (!existsSync(skillsDir)) return [];
      return readdirSync(skillsDir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => `${plugin}/${e.name}`);
    })
    .sort();
}

beforeEach(() => {
  out = mkdtempSync(join(tmpdir(), "skills-master-mp-"));
});
afterEach(() => {
  rmSync(out, { recursive: true, force: true });
});

describe("marketplace build", () => {
  it("bundles every source skill into the plugin for its (domain, class)", async () => {
    await build();

    const source = new ContentSource(CONTENT_ROOT).skillDirs().length;
    expect(bundled()).toEqual([
      "skills-master-testdomain-code/fixture-skill",
      "skills-master-testdomain-lang-tooling/fixture-tool-skill",
    ]);
    // The packaging bug this guards: skills present in source but in no plugin.
    expect(bundled()).toHaveLength(source);
  });

  // 7.2: a class with more than one category also ships category-sized plugins,
  // small enough to keep the agent's always-on listing inside its budget.
  describe("category plugins", () => {
    it("ships every skill in both its class and its category plugin", async () => {
      await marketplaceBuildCommand({ content: contentWithTwoCategories(), out });
      expect(bundled()).toEqual([
        "skills-master-testdomain-code-extras/fixture-extra-skill",
        "skills-master-testdomain-code-fixtures/fixture-skill",
        "skills-master-testdomain-code/fixture-extra-skill",
        "skills-master-testdomain-code/fixture-skill",
        "skills-master-testdomain-lang-tooling/fixture-tool-skill",
      ]);
    });

    it("ships identical skill bytes in both granularities", async () => {
      await marketplaceBuildCommand({ content: contentWithTwoCategories(), out });
      expect(read(`${CATEGORY_PLUGIN}/skills/fixture-skill/SKILL.md`)).toBe(
        read(`${CODE_PLUGIN}/skills/fixture-skill/SKILL.md`),
      );
      expect(read(`${CATEGORY_PLUGIN}/skills/fixture-skill/examples.md`)).toBe(
        read(`${CODE_PLUGIN}/skills/fixture-skill/examples.md`),
      );
    });

    it("says on the category plugin why you would pick it, and leaves the class one alone", async () => {
      await marketplaceBuildCommand({ content: contentWithTwoCategories(), out });
      const plugins = JSON.parse(read(MARKETPLACE)).plugins as {
        name: string;
        description: string;
      }[];
      const category = plugins.find((p) => p.name === "skills-master-testdomain-code-fixtures")!;
      expect(category.description).toContain("fixtures only");
      expect(category.description).toMatch(/budget/i);
      // Existing listings must not move: the class plugin reads as it always did.
      expect(plugins.find((p) => p.name === "skills-master-testdomain-code")!.description).toBe(
        "Testdomain code skills (frameworks & APIs).",
      );
    });

    // lang-tooling has a single category here, so its category plugin would hold
    // exactly the same skills as its class plugin under a clumsier name.
    it("suppresses a category plugin that would duplicate its class plugin", async () => {
      await marketplaceBuildCommand({ content: contentWithTwoCategories(), out });
      const names = (JSON.parse(read(MARKETPLACE)).plugins as { name: string }[]).map(
        (p) => p.name,
      );
      expect(names).not.toContain("skills-master-testdomain-lang-tooling-fixtures");
      expect(names).toContain("skills-master-testdomain-lang-tooling");
    });
  });

  it("copies Level-3 resources and writes a manifest per plugin", async () => {
    await build();

    expect(has(`${CODE_PLUGIN}/skills/fixture-skill/SKILL.md`)).toBe(true);
    expect(has(`${CODE_PLUGIN}/skills/fixture-skill/reference.md`)).toBe(true);
    expect(has(`${CODE_PLUGIN}/skills/fixture-skill/examples.md`)).toBe(true);
    expect(has(`${CODE_PLUGIN}/skills/fixture-skill/checklist.md`)).toBe(true);
    expect(read(`${CODE_PLUGIN}/skills/fixture-skill/SKILL.md`)).not.toContain("x-skills-master");

    expect(JSON.parse(read(`${CODE_PLUGIN}/.claude-plugin/plugin.json`)).name).toBe(
      "skills-master-testdomain-code",
    );
    const names = JSON.parse(read(MARKETPLACE)).plugins.map((p: { name: string }) => p.name);
    expect(names).toEqual([
      "skills-master-testdomain-code",
      "skills-master-testdomain-lang-tooling",
    ]);
  });

  it("is deterministic across repeat runs", async () => {
    await build();
    const first = bundled().map((p) =>
      read(`plugins/${p.split("/")[0]}/skills/${p.split("/")[1]}/SKILL.md`),
    );
    const firstManifest = read(MARKETPLACE);

    await build();
    const second = bundled().map((p) =>
      read(`plugins/${p.split("/")[0]}/skills/${p.split("/")[1]}/SKILL.md`),
    );
    expect(second).toEqual(first);
    expect(read(MARKETPLACE)).toBe(firstManifest);
  });

  it("prunes output left behind when a skill moves to another class", async () => {
    await build();
    // Simulate the pre-existing drift: a stale copy under the old plugin.
    write(`${CODE_PLUGIN}/skills/fixture-tool-skill/SKILL.md`, "stale\n");
    write(`${CODE_PLUGIN}/skills/fixture-tool-skill/examples.md`, "stale\n");

    expect(await build(true)).toBe(false); // check catches it

    await build();
    expect(has(`${CODE_PLUGIN}/skills/fixture-tool-skill`)).toBe(false);
    expect(has(`${TOOL_PLUGIN}/skills/fixture-tool-skill/SKILL.md`)).toBe(true);
    expect(await build(true)).toBe(true);
  });

  it("--check fails on missing, changed, and stale output, and passes when current", async () => {
    expect(await build(true)).toBe(false); // nothing built yet

    await build();
    expect(await build(true)).toBe(true);

    write(`${CODE_PLUGIN}/skills/fixture-skill/SKILL.md`, "hand-edited\n");
    expect(await build(true)).toBe(false);

    await build();
    rmSync(join(out, `${TOOL_PLUGIN}/skills/fixture-tool-skill/SKILL.md`));
    expect(await build(true)).toBe(false);
  });

  it("--check does not write anything", async () => {
    await build(true);
    expect(existsSync(join(out, "plugins"))).toBe(false);
    expect(existsSync(join(out, MARKETPLACE))).toBe(false);
  });
});
