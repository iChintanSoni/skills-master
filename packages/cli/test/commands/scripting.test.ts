import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addCommand } from "../../src/commands/add";
import { searchCommand, viewCommand } from "../../src/commands/catalog";
import { doctorCommand } from "../../src/commands/doctor";
import { loadConfig } from "../../src/core/project";

const CONTENT_ROOT = fileURLToPath(new URL("../fixtures/content", import.meta.url));
const NAME = "fixture-skill";
const TOOL_NAME = "fixture-tool-skill";
const CLAUDE = `.claude/skills/${NAME}/SKILL.md`;

let dir: string;
let out: string[];

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "skills-master-scripting-"));
  out = [];
  vi.spyOn(console, "log").mockImplementation((m?: unknown) => {
    out.push(String(m));
  });
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

/** Everything printed must parse as one JSON document — that is the contract. */
const parsed = () => JSON.parse(out.join("\n"));

describe("search --json", () => {
  it("prints the hits as parseable JSON and nothing else", async () => {
    const hits = await searchCommand({ content: CONTENT_ROOT, query: "fixture", json: true });
    const j = parsed();
    expect(j.map((r: { name: string }) => r.name).sort()).toEqual(hits.map((r) => r.name).sort());
    expect(j[0]).toHaveProperty("platforms");
  });

  it("prints an empty array rather than a human 'no matches' line", async () => {
    await searchCommand({ content: CONTENT_ROOT, query: "zzz-nothing", json: true });
    expect(parsed()).toEqual([]);
  });
});

describe("view --json", () => {
  it("carries the metadata and the body in one document", async () => {
    await viewCommand({ content: CONTENT_ROOT, name: NAME, json: true });
    const j = parsed();
    expect(j.name).toBe(NAME);
    expect(j.stability).toBe("contested");
    expect(j.platforms).toEqual(["testos"]);
    expect(j.body).toContain("## When to use");
    expect(j.resources).toContain("examples");
  });

  it("does not emit the human header alongside the JSON", async () => {
    await viewCommand({ content: CONTENT_ROOT, name: NAME, json: true });
    expect(out.join("\n")).not.toContain("platforms: testos");
    expect(() => parsed()).not.toThrow();
  });

  it("--json wins over --raw", async () => {
    await viewCommand({ content: CONTENT_ROOT, name: NAME, json: true, raw: true });
    expect(() => parsed()).not.toThrow();
    expect(parsed().name).toBe(NAME);
  });
});

describe("doctor --json", () => {
  it("stays parseable on a healthy project and keeps ok true", async () => {
    await addCommand({ cwd: dir, names: [NAME], targets: ["claude"], content: CONTENT_ROOT });
    out.length = 0;
    const report = doctorCommand({ cwd: dir, json: true });

    expect(report.ok).toBe(true);
    const j = parsed();
    expect(j.ok).toBe(true);
    expect(j.problems).toEqual([]);
    expect(j.skills[0].name).toBe(NAME);
    expect(j.configuredTargets).toEqual(["claude"]);
  });

  it("reports problems in JSON while ok stays false, so the exit code is unchanged", async () => {
    await addCommand({ cwd: dir, names: [NAME], targets: ["claude"], content: CONTENT_ROOT });
    rmSync(join(dir, CLAUDE));
    out.length = 0;

    const report = doctorCommand({ cwd: dir, json: true });
    expect(report.ok).toBe(false); // bin.ts turns this into exit 1

    const j = parsed();
    expect(j.ok).toBe(false);
    expect(j.problems[0]).toContain("missing claude file");
    expect(j.skills[0].state).toBe("missing");
  });

  it("stays parseable on a project with nothing installed", () => {
    const report = doctorCommand({ cwd: dir, json: true });
    expect(report.ok).toBe(true);
    expect(parsed()).toMatchObject({ ok: true, problems: [], skills: [] });
  });

  it("suppresses the warning line that would otherwise corrupt the JSON", () => {
    // Without a config, the human path warns "No skills-master.json found".
    doctorCommand({ cwd: dir, json: true });
    expect(() => parsed()).not.toThrow();
  });
});

describe("add persists explicit --target / --ref", () => {
  it("widens the configured targets rather than replacing them", async () => {
    await addCommand({ cwd: dir, names: [NAME], targets: ["claude"], content: CONTENT_ROOT });
    expect(loadConfig(dir)?.targets).toEqual(["claude"]);

    await addCommand({ cwd: dir, names: [TOOL_NAME], targets: ["cursor"], content: CONTENT_ROOT });
    // Adding one skill to a new tool must not quietly drop the tool already set up.
    expect(loadConfig(dir)?.targets).toEqual(["claude", "cursor"]);
  });

  it("persists an explicit --ref", async () => {
    await addCommand({ cwd: dir, names: [NAME], targets: ["claude"], content: CONTENT_ROOT });
    await addCommand({
      cwd: dir,
      names: [TOOL_NAME],
      targets: ["claude"],
      ref: "v2",
      content: CONTENT_ROOT,
    });
    expect(loadConfig(dir)?.contentRef).toBe("v2");
  });

  it("leaves the config alone when the flags add nothing new", async () => {
    await addCommand({ cwd: dir, names: [NAME], targets: ["claude"], content: CONTENT_ROOT });
    const before = readFileSync(join(dir, "skills-master.json"), "utf8");

    await addCommand({ cwd: dir, names: [TOOL_NAME], targets: ["claude"], content: CONTENT_ROOT });
    expect(readFileSync(join(dir, "skills-master.json"), "utf8")).toBe(before);
  });

  it("leaves the config alone when no flags are given at all", async () => {
    await addCommand({ cwd: dir, names: [NAME], targets: ["claude"], content: CONTENT_ROOT });
    const before = readFileSync(join(dir, "skills-master.json"), "utf8");

    await addCommand({ cwd: dir, names: [TOOL_NAME], content: CONTENT_ROOT });
    expect(readFileSync(join(dir, "skills-master.json"), "utf8")).toBe(before);
  });

  it("does not write a config on --dry-run", async () => {
    await addCommand({ cwd: dir, names: [NAME], targets: ["claude"], content: CONTENT_ROOT });
    const before = readFileSync(join(dir, "skills-master.json"), "utf8");

    await addCommand({
      cwd: dir,
      names: [TOOL_NAME],
      targets: ["cursor"],
      content: CONTENT_ROOT,
      dryRun: true,
    });
    expect(readFileSync(join(dir, "skills-master.json"), "utf8")).toBe(before);
  });
});
