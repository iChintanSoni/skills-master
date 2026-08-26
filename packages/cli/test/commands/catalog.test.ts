import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listCommand, searchCommand, viewCommand } from "../../src/commands/catalog";
import { SkillNotFoundError } from "../../src/content/source";

const content = fileURLToPath(new URL("../fixtures/content", import.meta.url));
const NAME = "fixture-skill";
const TOOL_NAME = "fixture-tool-skill";

let out: string[];

beforeEach(() => {
  out = [];
  vi.spyOn(console, "log").mockImplementation((msg?: unknown) => {
    out.push(String(msg));
  });
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

const printed = () => out.join("\n");
const names = (rows: { name: string }[]) => rows.map((r) => r.name).sort();

describe("list", () => {
  it("returns every skill when nothing is filtered", async () => {
    expect(names(await listCommand({ content }))).toEqual([NAME, TOOL_NAME]);
  });

  it("filters by domain, class, and category independently", async () => {
    expect(names(await listCommand({ content, domain: "testdomain" }))).toEqual([NAME, TOOL_NAME]);
    expect(names(await listCommand({ content, domain: "nosuchdomain" }))).toEqual([]);
    expect(names(await listCommand({ content, class: "code" }))).toEqual([NAME]);
    expect(names(await listCommand({ content, class: "lang-tooling" }))).toEqual([TOOL_NAME]);
    expect(names(await listCommand({ content, category: "fixtures" }))).toEqual([NAME, TOOL_NAME]);
  });

  it("filters by platform", async () => {
    expect(names(await listCommand({ content, platform: "testos" }))).toEqual([NAME, TOOL_NAME]);
    expect(names(await listCommand({ content, platform: "watchos" }))).toEqual([]);
  });

  it("intersects filters rather than unioning them", async () => {
    expect(names(await listCommand({ content, class: "code", category: "fixtures" }))).toEqual([
      NAME,
    ]);
    expect(await listCommand({ content, class: "code", domain: "nosuchdomain" })).toEqual([]);
  });

  it("--json prints parseable JSON and nothing else", async () => {
    const rows = await listCommand({ content, json: true });
    const parsed = JSON.parse(printed());
    expect(parsed.map((r: { name: string }) => r.name).sort()).toEqual(names(rows));
    expect(parsed[0]).toHaveProperty("platforms");
  });

  it("says so rather than printing an empty group when nothing matches", async () => {
    expect(await listCommand({ content, domain: "nope" })).toEqual([]);
    expect(printed()).not.toContain(NAME);
  });
});

describe("search", () => {
  it("matches on description text, not just the name", async () => {
    const hits = await searchCommand({ content, query: "exercising emitters" });
    expect(names(hits)).toEqual([NAME]);
  });

  it("matches on facets", async () => {
    expect(names(await searchCommand({ content, query: "lang-tooling" }))).toEqual([TOOL_NAME]);
  });

  it("ignores case, spacing, and hyphens in the query", async () => {
    const variants = ["fixture-skill", "Fixture Skill", "FIXTURESKILL", "fixture skill"];
    for (const q of variants) {
      expect(names(await searchCommand({ content, query: q })), q).toContain(NAME);
    }
  });

  it("returns an empty list and says so when nothing matches", async () => {
    expect(await searchCommand({ content, query: "zzz-no-such-term" })).toEqual([]);
    expect(printed()).toContain("No matches");
  });
});

describe("view", () => {
  it("prints the metadata an author needs before editing", async () => {
    await viewCommand({ content, name: NAME });
    const text = printed();
    expect(text).toContain(NAME);
    expect(text).toContain("testdomain/code/fixtures");
    expect(text).toContain("contested"); // stability
    expect(text).toContain("platforms: testos");
    expect(text).toContain("sources:");
  });

  it("lists the skill's resource files", async () => {
    await viewCommand({ content, name: NAME });
    expect(printed()).toContain("resource files:");
    expect(printed()).toContain("examples");
  });

  it("--raw prints the body alone, with no metadata header", async () => {
    await viewCommand({ content, name: NAME, raw: true });
    const text = printed();
    expect(text).toContain("## When to use");
    expect(text).not.toContain("platforms: testos");
    expect(text).not.toContain("sources:");
  });

  it("fails loudly on an unknown skill instead of printing nothing", async () => {
    await expect(viewCommand({ content, name: "no-such-skill" })).rejects.toThrow(
      SkillNotFoundError,
    );
  });
});
