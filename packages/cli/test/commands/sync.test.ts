import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addCommand } from "../../src/commands/add";
import { doctorCommand } from "../../src/commands/doctor";
import { syncCommand } from "../../src/commands/sync";
import { updateCommand } from "../../src/commands/update";
import { loadConfigOrDefault, saveConfig } from "../../src/core/project";
import type { TargetId } from "../../src/types";

const CONTENT_ROOT = fileURLToPath(new URL("../fixtures/content", import.meta.url));
const NAME = "fixture-skill";
const CLAUDE = `.claude/skills/${NAME}/SKILL.md`;
const CURSOR = `.cursor/rules/${NAME}.mdc`;
const AGENTS = "AGENTS.md";
const LOCK = "skills-master.lock.json";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "skills-master-sync-"));
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

const read = (p: string) => readFileSync(join(dir, p), "utf8");
const has = (p: string) => existsSync(join(dir, p));
const lockOf = () => JSON.parse(read(LOCK));

async function installTo(targets: TargetId[]) {
  return addCommand({ cwd: dir, names: [NAME], targets, content: CONTENT_ROOT });
}

function setTargets(targets: TargetId[]) {
  const cfg = loadConfigOrDefault(dir);
  cfg.targets = targets;
  saveConfig(dir, cfg);
}

function setPaths(paths: Record<string, string>) {
  const cfg = loadConfigOrDefault(dir);
  cfg.paths = { ...(cfg.paths ?? {}), ...paths } as typeof cfg.paths;
  saveConfig(dir, cfg);
}

describe("sync fills the gap update leaves", () => {
  it("update ignores a target added to config after install; sync emits it", async () => {
    await installTo(["claude"]);
    setTargets(["claude", "cursor"]);

    // This is the whole reason the command exists.
    await updateCommand({ cwd: dir, content: CONTENT_ROOT });
    expect(has(CURSOR)).toBe(false);

    const res = await syncCommand({ cwd: dir, content: CONTENT_ROOT });
    expect(has(CURSOR)).toBe(true);
    expect(res.synced).toEqual([NAME]);
    expect(res.addedTargets).toEqual(["cursor"]);
    expect(Object.keys(lockOf().skills[NAME].emitted).sort()).toEqual(["claude", "cursor"]);
    expect(doctorCommand({ cwd: dir }).ok).toBe(true);
  });

  it("repopulates a deleted output", async () => {
    await installTo(["claude"]);
    rmSync(join(dir, CLAUDE));
    await syncCommand({ cwd: dir, content: CONTENT_ROOT });
    expect(has(CLAUDE)).toBe(true);
    expect(doctorCommand({ cwd: dir }).ok).toBe(true);
  });

  it("is a no-op on an already-consistent project", async () => {
    await installTo(["claude", "cursor"]);
    const before = [CLAUDE, CURSOR].map(read);
    const res = await syncCommand({ cwd: dir, content: CONTENT_ROOT });
    expect(res.synced).toEqual([NAME]);
    expect(res.addedTargets).toEqual([]);
    expect([CLAUDE, CURSOR].map(read)).toEqual(before);
  });

  it("--dry-run writes nothing", async () => {
    await installTo(["claude"]);
    setTargets(["claude", "cursor"]);
    await syncCommand({ cwd: dir, content: CONTENT_ROOT, dryRun: true });
    expect(has(CURSOR)).toBe(false);
    expect(Object.keys(lockOf().skills[NAME].emitted)).toEqual(["claude"]);
  });

  it("limits to named skills", async () => {
    await addCommand({
      cwd: dir,
      names: [NAME, "fixture-tool-skill"],
      targets: ["claude"],
      content: CONTENT_ROOT,
    });
    setTargets(["claude", "cursor"]);
    const res = await syncCommand({ cwd: dir, names: [NAME], content: CONTENT_ROOT });
    expect(res.synced).toEqual([NAME]);
    expect(has(CURSOR)).toBe(true);
    expect(has(`.cursor/rules/fixture-tool-skill.mdc`)).toBe(false);
  });

  it("says so when nothing is installed", async () => {
    const res = await syncCommand({ cwd: dir, content: CONTENT_ROOT });
    expect(res.synced).toEqual([]);
  });
});

describe("sync and local edits", () => {
  it("leaves a hand-edited output alone by default", async () => {
    await installTo(["claude", "cursor"]);
    writeFileSync(join(dir, CURSOR), `${read(CURSOR)}\nMY EDIT\n`, "utf8");

    const res = await syncCommand({ cwd: dir, content: CONTENT_ROOT });
    expect(res.skipped).toEqual([NAME]);
    expect(res.synced).toEqual([]);
    expect(read(CURSOR)).toContain("MY EDIT");
  });

  it("--overwrite replaces it", async () => {
    await installTo(["claude", "cursor"]);
    writeFileSync(join(dir, CURSOR), `${read(CURSOR)}\nMY EDIT\n`, "utf8");

    const res = await syncCommand({ cwd: dir, content: CONTENT_ROOT, overwrite: true });
    expect(res.synced).toEqual([NAME]);
    expect(read(CURSOR)).not.toContain("MY EDIT");
  });
});

describe("sync and dropped targets", () => {
  it("reports output for a dropped target but does not delete it", async () => {
    await installTo(["claude", "cursor"]);
    setTargets(["claude"]);

    const res = await syncCommand({ cwd: dir, content: CONTENT_ROOT });
    expect(res.orphaned).toEqual([{ name: NAME, targets: ["cursor"] }]);
    expect(res.pruned).toBe(false);
    // a removal is the user's call, so the file stays
    expect(has(CURSOR)).toBe(true);
  });

  it("--prune removes it and drops it from the lockfile", async () => {
    await installTo(["claude", "cursor"]);
    setTargets(["claude"]);

    const res = await syncCommand({ cwd: dir, content: CONTENT_ROOT, prune: true });
    expect(res.pruned).toBe(true);
    expect(has(CURSOR)).toBe(false);
    expect(Object.keys(lockOf().skills[NAME].emitted)).toEqual(["claude"]);
    expect(doctorCommand({ cwd: dir }).ok).toBe(true);
  });

  it("keeps the lockfile honest about files still on disk when not pruning", async () => {
    await installTo(["claude", "cursor"]);
    setTargets(["claude"]);
    await syncCommand({ cwd: dir, content: CONTENT_ROOT });

    // cursor output still exists, so the lockfile must still describe it —
    // otherwise doctor would stop noticing if it drifted.
    expect(Object.keys(lockOf().skills[NAME].emitted).sort()).toEqual(["claude", "cursor"]);
    expect(doctorCommand({ cwd: dir }).ok).toBe(true);
  });
});

describe("sync and a changed paths override", () => {
  it("moves whole-file output and leaves nothing at the old location", async () => {
    await installTo(["claude"]);
    expect(has(CLAUDE)).toBe(true);
    setPaths({ claude: ".claude/moved" });

    const res = await syncCommand({ cwd: dir, content: CONTENT_ROOT });
    expect(has(`.claude/moved/${NAME}/SKILL.md`)).toBe(true);
    // A move that leaves the original behind would have agents loading the same
    // guidance twice — so this is cleaned without needing --prune.
    expect(has(CLAUDE)).toBe(false);
    expect(has(`.claude/skills/${NAME}`)).toBe(false);
    expect(res.stale[0]?.files).toContain(CLAUDE);
    expect(doctorCommand({ cwd: dir }).ok).toBe(true);
  });

  it("moves a managed block out of the old shared file", async () => {
    await installTo(["agents"]);
    expect(read(AGENTS)).toContain(`BEGIN skills-master:${NAME}`);
    setPaths({ agents: "docs/AGENTS.md" });

    await syncCommand({ cwd: dir, content: CONTENT_ROOT });
    expect(read("docs/AGENTS.md")).toContain(`BEGIN skills-master:${NAME}`);
    // the old file held only this block, so it goes entirely
    expect(has(AGENTS)).toBe(false);
    expect(doctorCommand({ cwd: dir }).ok).toBe(true);
  });

  it("--dry-run does not move anything", async () => {
    await installTo(["claude"]);
    setPaths({ claude: ".claude/moved" });
    await syncCommand({ cwd: dir, content: CONTENT_ROOT, dryRun: true });
    expect(has(CLAUDE)).toBe(true);
    expect(has(`.claude/moved/${NAME}/SKILL.md`)).toBe(false);
  });

  it("reports nothing stale when paths are unchanged", async () => {
    await installTo(["claude"]);
    const res = await syncCommand({ cwd: dir, content: CONTENT_ROOT });
    expect(res.stale).toEqual([]);
  });
});
