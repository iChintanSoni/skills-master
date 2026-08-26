import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addCommand } from "../../src/commands/add";

const CONTENT_ROOT = fileURLToPath(new URL("../fixtures/content", import.meta.url));
const NAME = "fixture-skill";
const TOOL_NAME = "fixture-tool-skill";

let dir: string;
let content: string;
let warnings: string[];

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "skills-master-add-"));
  content = join(dir, "content");
  cpSync(CONTENT_ROOT, content, { recursive: true });
  warnings = [];
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation((m?: unknown) => {
    warnings.push(String(m));
  });
  vi.spyOn(console, "error").mockImplementation((m?: unknown) => {
    warnings.push(String(m));
  });
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

const installed = (r: { installed: { name: string }[] }) => r.installed.map((s) => s.name).sort();

/** Make the two fixture skills a reciprocal pair, as the linter requires. */
function pairFixtures(): void {
  const paths: [string, string][] = [
    [join(content, "testdomain/code/fixtures", NAME, "SKILL.md"), TOOL_NAME],
    [join(content, "testdomain/lang-tooling/fixtures", TOOL_NAME, "SKILL.md"), NAME],
  ];
  for (const [p, partner] of paths) {
    writeFileSync(
      p,
      readFileSync(p, "utf8").replace("  pairs_with: []", `  pairs_with: [${partner}]`),
      "utf8",
    );
  }
}

describe("add token resolution", () => {
  it("installs an exact skill name", async () => {
    const res = await addCommand({ cwd: dir, names: [NAME], targets: ["claude"], content });
    expect(installed(res)).toEqual([NAME]);
  });

  it("expands a category token to every skill in it", async () => {
    const res = await addCommand({ cwd: dir, names: ["fixtures"], targets: ["claude"], content });
    expect(installed(res)).toEqual([NAME, TOOL_NAME]);
  });

  it("expands a class token when no category matches", async () => {
    const res = await addCommand({
      cwd: dir,
      names: ["lang-tooling"],
      targets: ["claude"],
      content,
    });
    expect(installed(res)).toEqual([TOOL_NAME]);
  });

  it("prefers a category over a class when a token could be either", async () => {
    // "fixtures" is the category both skills share; "code" is only a class.
    const byCategory = await addCommand({
      cwd: dir,
      names: ["fixtures"],
      targets: ["claude"],
      content,
    });
    expect(installed(byCategory)).toEqual([NAME, TOOL_NAME]);

    const byClass = await addCommand({ cwd: dir, names: ["code"], targets: ["claude"], content });
    expect(installed(byClass)).toEqual([NAME]);
  });

  it("de-duplicates when tokens overlap", async () => {
    const res = await addCommand({
      cwd: dir,
      names: [NAME, "fixtures", NAME],
      targets: ["claude"],
      content,
    });
    expect(installed(res)).toEqual([NAME, TOOL_NAME]);
  });

  it("warns and records an unmatched token without failing the whole run", async () => {
    const res = await addCommand({
      cwd: dir,
      names: [NAME, "not-a-thing"],
      targets: ["claude"],
      content,
    });
    expect(installed(res)).toEqual([NAME]);
    expect(res.skipped).toEqual(["not-a-thing"]);
    expect(warnings.join("\n")).toContain('No skill, category, or class matches "not-a-thing"');
  });

  it("installs nothing and says so when no token matches", async () => {
    const res = await addCommand({ cwd: dir, names: ["nope"], targets: ["claude"], content });
    expect(res.installed).toEqual([]);
    expect(res.skipped).toEqual(["nope"]);
    expect(existsSync(join(dir, ".claude"))).toBe(false);
    expect(warnings.join("\n")).toContain("Nothing to install");
  });
});

describe("add --with-pairs", () => {
  it("pulls in a skill's declared partner", async () => {
    pairFixtures();
    const res = await addCommand({
      cwd: dir,
      names: [NAME],
      targets: ["claude"],
      content,
      withPairs: true,
    });
    expect(installed(res)).toEqual([NAME, TOOL_NAME]);
  });

  it("does not follow pairs unless asked", async () => {
    pairFixtures();
    const res = await addCommand({ cwd: dir, names: [NAME], targets: ["claude"], content });
    expect(installed(res)).toEqual([NAME]);
  });

  it("is one hop, not transitive closure", async () => {
    // Only NAME <-> TOOL_NAME exist, so a single hop is the whole graph here;
    // what matters is that the pass runs over the originally selected set.
    pairFixtures();
    const res = await addCommand({
      cwd: dir,
      names: [TOOL_NAME],
      targets: ["claude"],
      content,
      withPairs: true,
    });
    expect(installed(res)).toEqual([NAME, TOOL_NAME]);
  });

  it("warns about a partner missing from the registry instead of crashing", async () => {
    const p = join(content, "testdomain/code/fixtures", NAME, "SKILL.md");
    writeFileSync(
      p,
      readFileSync(p, "utf8").replace("  pairs_with: []", "  pairs_with: [ghost-skill]"),
      "utf8",
    );
    const res = await addCommand({
      cwd: dir,
      names: [NAME],
      targets: ["claude"],
      content,
      withPairs: true,
    });
    expect(installed(res)).toEqual([NAME]);
    expect(warnings.join("\n")).toContain('Paired skill "ghost-skill"');
  });
});
