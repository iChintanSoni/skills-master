import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addCommand } from "../../src/commands/add";
import { doctorCommand } from "../../src/commands/doctor";
import { statusCommand } from "../../src/commands/status";

const CONTENT_ROOT = fileURLToPath(new URL("../fixtures/content", import.meta.url));
const NAME = "fixture-skill";
const TOOL_NAME = "fixture-tool-skill";
const CURSOR = `.cursor/rules/${NAME}.mdc`;
const CLAUDE = `.claude/skills/${NAME}/SKILL.md`;
const AGENTS = "AGENTS.md";

let dir: string;
let out: string[];

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "skills-master-status-"));
  out = [];
  vi.spyOn(console, "log").mockImplementation((m?: unknown) => {
    out.push(String(m));
  });
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

const printed = () => out.join("\n");
const read = (p: string) => readFileSync(join(dir, p), "utf8");

async function installBoth(targets: ("claude" | "cursor" | "agents")[] = ["claude", "cursor"]) {
  return addCommand({ cwd: dir, names: [NAME, TOOL_NAME], targets, content: CONTENT_ROOT });
}

describe("status", () => {
  it("says nothing is installed rather than printing an empty table", () => {
    const report = statusCommand({ cwd: dir });
    expect(report.skills).toEqual([]);
    expect(printed()).toContain("No skills installed");
  });

  it("lists every installed skill with its version and targets", async () => {
    await installBoth();
    const report = statusCommand({ cwd: dir });

    expect(report.skills.map((s) => s.name)).toEqual([NAME, TOOL_NAME]);
    expect(report.counts).toEqual({ ok: 2, edited: 0, missing: 0 });
    expect(report.contentRef).toBe("main");

    const text = printed();
    expect(text).toContain(NAME);
    expect(text).toContain("v1.0.0");
    expect(text).toContain("claude, cursor");
    expect(text).toContain("2 ok.");
  });

  it("reports a hand-edited output as edited, per target", async () => {
    await installBoth();
    writeFileSync(join(dir, CURSOR), `${read(CURSOR)}\nMY EDIT\n`, "utf8");

    const report = statusCommand({ cwd: dir });
    const skill = report.skills.find((s) => s.name === NAME)!;
    expect(skill.state).toBe("edited");
    expect(skill.targets.find((t) => t.target === "cursor")?.edited).toBe(true);
    expect(skill.targets.find((t) => t.target === "claude")?.state).toBe("ok");
    expect(printed()).toContain("cursor (edited)");
  });

  it("reports a deleted output as missing, and names the file in the diagnosis", async () => {
    await installBoth();
    rmSync(join(dir, CLAUDE));

    const skill = statusCommand({ cwd: dir }).skills.find((s) => s.name === NAME)!;
    expect(skill.state).toBe("missing");
    const claude = skill.targets.find((t) => t.target === "claude")!;
    expect(claude.missingFiles).toContain(CLAUDE);
    // a deletion must not also be reported as an edit
    expect(claude.edited).toBe(false);
  });

  it("reports a managed block cut out of a shared file", async () => {
    await addCommand({ cwd: dir, names: [NAME], targets: ["agents"], content: CONTENT_ROOT });
    writeFileSync(join(dir, AGENTS), "# Mine\n\nNo blocks here.\n", "utf8");

    const skill = statusCommand({ cwd: dir }).skills[0]!;
    expect(skill.state).toBe("missing");
    expect(skill.targets[0]?.missingBlock).toBe(AGENTS);
  });

  it("takes the worst state across a skill's targets, not the first", async () => {
    await installBoth();
    // Break `cursor`, which sorts *after* the healthy `claude` — so a rollup
    // that just read the first target would wrongly report "ok".
    rmSync(join(dir, CURSOR));
    const skill = statusCommand({ cwd: dir }).skills.find((s) => s.name === NAME)!;
    expect(skill.targets.map((t) => [t.target, t.state])).toEqual([
      ["claude", "ok"],
      ["cursor", "missing"],
    ]);
    expect(skill.state).toBe("missing");
  });

  it("filters to named skills", async () => {
    await installBoth();
    const report = statusCommand({ cwd: dir, names: [TOOL_NAME] });
    expect(report.skills.map((s) => s.name)).toEqual([TOOL_NAME]);
    expect(printed()).not.toContain(`${NAME} `);
  });

  it("--problems hides healthy skills and says so when there are none", async () => {
    await installBoth();
    expect(statusCommand({ cwd: dir, problemsOnly: true }).skills).toEqual([]);
    expect(printed()).toContain("Nothing needs attention");

    out.length = 0;
    writeFileSync(join(dir, CURSOR), `${read(CURSOR)}\nMY EDIT\n`, "utf8");
    const report = statusCommand({ cwd: dir, problemsOnly: true });
    expect(report.skills.map((s) => s.name)).toEqual([NAME]);
  });

  it("--json emits the whole report and nothing else", async () => {
    await installBoth();
    out.length = 0; // drop the install's own logging; only status output matters here
    const report = statusCommand({ cwd: dir, json: true });
    const parsed = JSON.parse(printed());
    expect(parsed).toEqual(JSON.parse(JSON.stringify(report)));
    expect(parsed.skills[0]).toHaveProperty("targets");
    expect(parsed.counts.ok).toBe(2);
  });

  it("never fails, even when everything is broken — that is doctor's job", async () => {
    await installBoth();
    rmSync(join(dir, CLAUDE));
    expect(() => statusCommand({ cwd: dir })).not.toThrow();
    // doctor is the one that reports a problem for the same project
    expect(doctorCommand({ cwd: dir }).ok).toBe(false);
  });

  it("works offline: no content library needs to be reachable", async () => {
    await installBoth();
    // Nothing in this call resolves content — no --content, no network.
    const report = statusCommand({ cwd: dir });
    expect(report.skills).toHaveLength(2);
    expect(existsSync(join(dir, "skills-master.lock.json"))).toBe(true);
  });
});

describe("status and doctor agree", () => {
  it("every skill status calls a problem is one doctor reports", async () => {
    await installBoth();
    writeFileSync(join(dir, CURSOR), `${read(CURSOR)}\nMY EDIT\n`, "utf8");
    rmSync(join(dir, `.claude/skills/${TOOL_NAME}/SKILL.md`));

    const problems = statusCommand({ cwd: dir })
      .skills.filter((s) => s.state !== "ok")
      .map((s) => s.name);
    const reported = doctorCommand({ cwd: dir }).problems.join("\n");

    expect(problems.sort()).toEqual([NAME, TOOL_NAME]);
    for (const name of problems) expect(reported).toContain(name);
  });

  it("a clean project is clean in both", async () => {
    await installBoth();
    expect(statusCommand({ cwd: dir }).counts).toMatchObject({ edited: 0, missing: 0 });
    expect(doctorCommand({ cwd: dir }).ok).toBe(true);
  });
});
