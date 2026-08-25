import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { marketplaceBuildCommand } from "../../src/commands/marketplace";
import { ContentSource } from "../../src/content/source";

const CONTENT_ROOT = fileURLToPath(new URL("../fixtures/content", import.meta.url));

const CODE_PLUGIN = "plugins/skills-master-testdomain-code";
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
    expect(names).toEqual(["skills-master-testdomain-code", "skills-master-testdomain-lang-tooling"]);
  });

  it("is deterministic across repeat runs", async () => {
    await build();
    const first = bundled().map((p) => read(`plugins/${p.split("/")[0]}/skills/${p.split("/")[1]}/SKILL.md`));
    const firstManifest = read(MARKETPLACE);

    await build();
    const second = bundled().map((p) => read(`plugins/${p.split("/")[0]}/skills/${p.split("/")[1]}/SKILL.md`));
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
