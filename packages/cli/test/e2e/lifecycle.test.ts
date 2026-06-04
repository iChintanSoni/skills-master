import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { addCommand } from "../../src/commands/add";
import { updateCommand } from "../../src/commands/update";
import { removeCommand } from "../../src/commands/remove";
import { doctorCommand } from "../../src/commands/doctor";
import { ALL_TARGETS } from "../../src/types";

const CONTENT_ROOT = fileURLToPath(new URL("../fixtures/content", import.meta.url));
const NAME = "fixture-skill";

const CLAUDE = `.claude/skills/${NAME}/SKILL.md`;
const CURSOR = `.cursor/rules/${NAME}.mdc`;
const COPILOT = `.github/instructions/${NAME}.instructions.md`;
const COPILOT_ROOT = ".github/copilot-instructions.md";
const AGENTS = "AGENTS.md";
const LOCK = "skills-master.lock.json";

let dir: string;
const read = (p: string) => readFileSync(join(dir, p), "utf8");
const has = (p: string) => existsSync(join(dir, p));

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "skills-master-e2e-"));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

async function install() {
  return addCommand({ cwd: dir, names: [NAME], targets: ALL_TARGETS, content: CONTENT_ROOT });
}

describe("install lifecycle", () => {
  it("add writes every target's files and a lockfile", async () => {
    const res = await install();
    expect(res.installed.map((s) => s.name)).toEqual([NAME]);

    expect(has(CLAUDE)).toBe(true);
    expect(has(`.claude/skills/${NAME}/examples.md`)).toBe(true);
    expect(has(CURSOR)).toBe(true);
    expect(has(COPILOT)).toBe(true);
    expect(read(COPILOT_ROOT)).toContain(`BEGIN skills-master:${NAME}`);
    expect(read(AGENTS)).toContain("### Fixture Skill");
    expect(read(AGENTS)).toContain(`BEGIN skills-master:${NAME}`);

    const lock = JSON.parse(read(LOCK));
    expect(lock.skills[NAME].version).toBe("1.0.0");

    expect(doctorCommand({ cwd: dir }).ok).toBe(true);
  });

  it("update with unchanged content is a no-op", async () => {
    await install();
    const before = [CLAUDE, CURSOR, COPILOT, COPILOT_ROOT, AGENTS].map(read);

    const res = await updateCommand({ cwd: dir, content: CONTENT_ROOT });
    expect(res.updated).toEqual([]);
    expect(res.upToDate).toContain(NAME);

    const after = [CLAUDE, CURSOR, COPILOT, COPILOT_ROOT, AGENTS].map(read);
    expect(after).toEqual(before);
  });

  it("update --overwrite replaces only the managed block, preserving hand edits", async () => {
    await install();

    // Hand-edit AGENTS.md: add content outside the block and corrupt inside it.
    const original = read(AGENTS);
    const corrupted =
      "# My Project\n\nHand-written intro.\n\n" + original.replace("### Fixture Skill", "### Fixture Skill\n\nCORRUPTION");
    writeFileSync(join(dir, AGENTS), corrupted, "utf8");

    await updateCommand({ cwd: dir, content: CONTENT_ROOT, overwrite: true });

    const result = read(AGENTS);
    expect(result).toContain("# My Project"); // outside-the-block edit preserved
    expect(result).toContain("Hand-written intro.");
    expect(result).not.toContain("CORRUPTION"); // inside-the-block edit reverted
    expect(result).toContain("### Fixture Skill");
  });

  it("remove deletes all outputs and clears the lockfile", async () => {
    await install();
    const res = removeCommand({ cwd: dir, names: [NAME] });
    expect(res.removed).toEqual([NAME]);

    expect(has(CLAUDE)).toBe(false);
    expect(has(`.claude/skills/${NAME}`)).toBe(false); // dir pruned
    expect(has(CURSOR)).toBe(false);
    expect(has(COPILOT)).toBe(false);
    // Shared files held only this block, so they are deleted when emptied.
    expect(has(AGENTS)).toBe(false);
    expect(has(COPILOT_ROOT)).toBe(false);

    const lock = JSON.parse(read(LOCK));
    expect(lock.skills[NAME]).toBeUndefined();
  });

  it("dry-run writes nothing", async () => {
    await addCommand({ cwd: dir, names: [NAME], targets: ALL_TARGETS, content: CONTENT_ROOT, dryRun: true });
    expect(has(CLAUDE)).toBe(false);
    expect(has(AGENTS)).toBe(false);
    expect(has(LOCK)).toBe(false);
  });
});
