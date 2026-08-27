import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { addCommand } from "../../src/commands/add";
import { updateCommand } from "../../src/commands/update";
import { removeCommand } from "../../src/commands/remove";
import { doctorCommand } from "../../src/commands/doctor";
import { initCommand } from "../../src/commands/init";
import { ALL_TARGETS, DEFAULT_TARGETS } from "../../src/types";

const CONTENT_ROOT = fileURLToPath(new URL("../fixtures/content", import.meta.url));
const NAME = "fixture-skill";

const TOOL_NAME = "fixture-tool-skill";
const CONFIG = "skills-master.json";

const CLAUDE = `.claude/skills/${NAME}/SKILL.md`;
const AGENTS_SKILLS = `.agents/skills/${NAME}/SKILL.md`;
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

/**
 * A writable copy of the fixture library, so a test can change a skill upstream
 * the way a real content release would.
 */
function forkContent(): string {
  const forked = join(dir, "forked-content");
  cpSync(CONTENT_ROOT, forked, { recursive: true });
  return forked;
}

function skillPathIn(root: string, name = NAME): string {
  const rel =
    name === NAME ? `testdomain/code/fixtures/${name}` : `testdomain/lang-tooling/fixtures/${name}`;
  return join(root, rel, "SKILL.md");
}

/** Rewrites a skill upstream: new guidance text, and optionally a new version. */
function editUpstream(root: string, edit: { body?: string; version?: string }): void {
  const p = skillPathIn(root);
  let text = readFileSync(p, "utf8");
  if (edit.body) text = text.replace("Do the first deterministic thing.", edit.body);
  if (edit.version) text = text.replace(/^ {2}version: .*$/m, `  version: ${edit.version}`);
  writeFileSync(p, text, "utf8");
}

describe("install lifecycle", () => {
  it("add writes every target's files and a lockfile", async () => {
    const res = await install();
    expect(res.installed.map((s) => s.name)).toEqual([NAME]);

    expect(has(CLAUDE)).toBe(true);
    expect(has(`.claude/skills/${NAME}/examples.md`)).toBe(true);
    // Same projection at the cross-agent root, resource files included.
    expect(has(AGENTS_SKILLS)).toBe(true);
    expect(has(`.agents/skills/${NAME}/examples.md`)).toBe(true);
    expect(read(AGENTS_SKILLS)).toBe(read(CLAUDE));
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
      "# My Project\n\nHand-written intro.\n\n" +
      original.replace("### Fixture Skill", "### Fixture Skill\n\nCORRUPTION");
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
    expect(has(AGENTS_SKILLS)).toBe(false);
    expect(has(`.agents/skills/${NAME}`)).toBe(false);
    expect(has(CURSOR)).toBe(false);
    expect(has(COPILOT)).toBe(false);
    // Shared files held only this block, so they are deleted when emptied.
    expect(has(AGENTS)).toBe(false);
    expect(has(COPILOT_ROOT)).toBe(false);

    const lock = JSON.parse(read(LOCK));
    expect(lock.skills[NAME]).toBeUndefined();
  });

  it("commit:false gitignores only emitter-owned files, never shared files or target roots", async () => {
    writeFileSync(join(dir, "skills-master.json"), JSON.stringify({ commit: false }), "utf8");
    await install();

    const gi = read(".gitignore");
    const lines = gi.split("\n");
    // Whole-mode outputs are ignored as exact root-anchored paths.
    expect(lines).toContain(`/${CLAUDE}`);
    expect(lines).toContain(`/.claude/skills/${NAME}/examples.md`);
    expect(lines).toContain(`/${CURSOR}`);
    expect(lines).toContain(`/${COPILOT}`);
    // Shared block files and target roots must never be ignored: they can
    // carry hand-written content (.github workflows, a hand-authored AGENTS.md).
    expect(gi).not.toContain(COPILOT_ROOT);
    expect(lines).not.toContain("AGENTS.md");
    expect(lines).not.toContain("/AGENTS.md");
    expect(lines).not.toContain(".github");
    expect(lines).not.toContain("/.github");

    // Re-installing is idempotent: no duplicate entries, one header.
    await install();
    const again = read(".gitignore");
    expect(again).toBe(gi);
    expect(again.match(/# skills-master/g)).toHaveLength(1);
  });

  it("dry-run writes nothing", async () => {
    await addCommand({
      cwd: dir,
      names: [NAME],
      targets: ALL_TARGETS,
      content: CONTENT_ROOT,
      dryRun: true,
    });
    expect(has(CLAUDE)).toBe(false);
    expect(has(AGENTS)).toBe(false);
    expect(has(LOCK)).toBe(false);
  });
});

describe("error-handling honesty", () => {
  it("remove --target on a target the skill is not installed to removes nothing", async () => {
    await addCommand({ cwd: dir, names: [NAME], targets: ["claude"], content: CONTENT_ROOT });
    const res = removeCommand({ cwd: dir, names: [NAME], targets: ["cursor"] });
    expect(res.removed).toEqual([]);
    expect(res.missing).toEqual([NAME]);
    expect(has(CLAUDE)).toBe(true); // untouched
    const lock = JSON.parse(read(LOCK));
    expect(lock.skills[NAME]).toBeDefined();
  });

  it("a broken skill upstream is a load failure, not a deletion", async () => {
    await install();
    // Copy the fixture content and corrupt the skill's frontmatter.
    const badContent = join(dir, "bad-content");
    cpSync(CONTENT_ROOT, badContent, { recursive: true });
    const skillMd = join(badContent, "testdomain/code/fixtures", NAME, "SKILL.md");
    writeFileSync(skillMd, "---\nname: 42\n---\nbroken", "utf8");

    const res = await updateCommand({ cwd: dir, content: badContent });
    expect(res.skipped).toEqual([NAME]);
    expect(res.updated).toEqual([]);
  });

  it("a nonexistent --content directory is an error, not an empty catalog", async () => {
    await expect(
      addCommand({ cwd: dir, names: [NAME], targets: ["claude"], content: join(dir, "nope") }),
    ).rejects.toThrow(/--content directory not found/);
  });

  it("a corrupt config names the file instead of dumping a raw parse error", async () => {
    writeFileSync(join(dir, "skills-master.json"), "{ not json", "utf8");
    await expect(install()).rejects.toThrow(/skills-master\.json is not valid JSON/);

    writeFileSync(join(dir, "skills-master.json"), JSON.stringify({ commit: "yes" }), "utf8");
    await expect(install()).rejects.toThrow(/skills-master\.json is invalid at "commit"/);
  });
});

describe("init", () => {
  it("auto-detects the tools a project already uses", () => {
    mkdirSync(join(dir, ".cursor"), { recursive: true });
    writeFileSync(join(dir, "AGENTS.md"), "# Existing\n", "utf8");

    const cfg = initCommand({ cwd: dir });
    expect(cfg.targets.sort()).toEqual(["agents", "cursor"]);
    expect(JSON.parse(read(CONFIG)).targets.sort()).toEqual(["agents", "cursor"]);
  });

  // 5.1: the fallback is DEFAULT_TARGETS, not ALL_TARGETS. `agents-skills`
  // writes a second full copy of every skill, and VS Code Copilot reads both
  // roots — so it is opt-in rather than a default nobody asked for.
  it("falls back to the default targets when the project shows no sign of any tool", () => {
    const cfg = initCommand({ cwd: dir });
    expect(cfg.targets.sort()).toEqual([...DEFAULT_TARGETS].sort());
    expect(cfg.targets).not.toContain("agents-skills");
  });

  it("records explicit targets, commit, and contentRef verbatim", () => {
    const cfg = initCommand({ cwd: dir, targets: ["claude"], commit: false, contentRef: "v2" });
    expect(cfg).toMatchObject({ targets: ["claude"], commit: false, contentRef: "v2" });
    expect(JSON.parse(read(CONFIG))).toMatchObject({ targets: ["claude"], commit: false });
  });

  it("refuses to clobber an existing config unless forced", () => {
    initCommand({ cwd: dir, targets: ["claude"] });
    const second = initCommand({ cwd: dir, targets: ["cursor"] });
    expect(second.targets).toEqual(["claude"]); // untouched

    const forced = initCommand({ cwd: dir, targets: ["cursor"], force: true });
    expect(forced.targets).toEqual(["cursor"]);
  });

  it("drives a later add: init's targets decide what gets written", async () => {
    initCommand({ cwd: dir, targets: ["claude"] });
    await addCommand({ cwd: dir, names: [NAME], content: CONTENT_ROOT });

    expect(has(CLAUDE)).toBe(true);
    expect(has(CURSOR)).toBe(false);
    expect(has(AGENTS)).toBe(false);
    expect(doctorCommand({ cwd: dir }).ok).toBe(true);
  });
});

describe("update with a changed source", () => {
  it("re-emits every target and re-hashes the lockfile", async () => {
    const content = forkContent();
    await addCommand({ cwd: dir, names: [NAME], targets: ALL_TARGETS, content });
    const hashBefore = JSON.parse(read(LOCK)).skills[NAME].sourceHash;

    editUpstream(content, { body: "Do the second deterministic thing.", version: "1.1.0" });
    const res = await updateCommand({ cwd: dir, content });

    expect(res.updated).toEqual([NAME]);
    expect(res.upToDate).toEqual([]);
    for (const file of [CLAUDE, CURSOR, COPILOT]) {
      expect(read(file)).toContain("Do the second deterministic thing.");
      expect(read(file)).not.toContain("Do the first deterministic thing.");
    }
    expect(read(AGENTS)).toContain("Do the second deterministic thing.");

    const lock = JSON.parse(read(LOCK));
    expect(lock.skills[NAME].sourceHash).not.toBe(hashBefore);
    expect(lock.skills[NAME].version).toBe("1.1.0");
    expect(doctorCommand({ cwd: dir }).ok).toBe(true);
  });

  it("moves the block sentinel to the new version without duplicating the block", async () => {
    const content = forkContent();
    await addCommand({ cwd: dir, names: [NAME], targets: ["agents"], content });
    expect(read(AGENTS)).toContain(`BEGIN skills-master:${NAME} v1.0.0`);

    editUpstream(content, { body: "Newer guidance.", version: "2.0.0" });
    await updateCommand({ cwd: dir, content });

    const agents = read(AGENTS);
    expect(agents).toContain(`BEGIN skills-master:${NAME} v2.0.0`);
    expect(agents).not.toContain("v1.0.0");
    expect(agents.match(new RegExp(`BEGIN skills-master:${NAME}`, "g"))).toHaveLength(1);
  });

  it("skips a skill with local edits and leaves them intact", async () => {
    const content = forkContent();
    await addCommand({ cwd: dir, names: [NAME], targets: ["cursor"], content });
    writeFileSync(join(dir, CURSOR), `${read(CURSOR)}\n\nMY HAND EDIT\n`, "utf8");

    editUpstream(content, { body: "Upstream moved on.", version: "1.2.0" });
    const res = await updateCommand({ cwd: dir, content });

    expect(res.skipped).toEqual([NAME]);
    expect(res.updated).toEqual([]);
    expect(read(CURSOR)).toContain("MY HAND EDIT");
    expect(read(CURSOR)).not.toContain("Upstream moved on.");
    // the lockfile still describes what is actually on disk: the old version
    expect(JSON.parse(read(LOCK)).skills[NAME].version).toBe("1.0.0");
  });

  it("--overwrite takes the same edited file and resets it to upstream", async () => {
    const content = forkContent();
    await addCommand({ cwd: dir, names: [NAME], targets: ["cursor"], content });
    writeFileSync(join(dir, CURSOR), `${read(CURSOR)}\n\nMY HAND EDIT\n`, "utf8");

    editUpstream(content, { body: "Upstream moved on.", version: "1.2.0" });
    const res = await updateCommand({ cwd: dir, content, overwrite: true });

    expect(res.updated).toEqual([NAME]);
    expect(read(CURSOR)).not.toContain("MY HAND EDIT");
    expect(read(CURSOR)).toContain("Upstream moved on.");
  });
});

describe("doctor failure modes", () => {
  it("reports an emitted file that has been deleted", async () => {
    await install();
    rmSync(join(dir, CURSOR));

    const report = doctorCommand({ cwd: dir });
    expect(report.ok).toBe(false);
    expect(report.problems).toEqual(
      expect.arrayContaining([expect.stringContaining(`missing cursor file ${CURSOR}`)]),
    );
  });

  it("reports local edits to an emitted file", async () => {
    await install();
    writeFileSync(join(dir, CLAUDE), `${read(CLAUDE)}\nlocal edit\n`, "utf8");

    const report = doctorCommand({ cwd: dir });
    expect(report.ok).toBe(false);
    expect(report.problems).toEqual(
      expect.arrayContaining([expect.stringContaining("local edits to claude output(s)")]),
    );
  });

  it("reports a managed block that has been cut out of a shared file", async () => {
    await install();
    // Keep the file, drop the block — the shape a careless hand edit leaves.
    writeFileSync(join(dir, AGENTS), "# My Project\n\nNothing managed here any more.\n", "utf8");

    const report = doctorCommand({ cwd: dir });
    expect(report.ok).toBe(false);
    expect(report.problems).toEqual(
      expect.arrayContaining([expect.stringContaining(`missing managed block in ${AGENTS}`)]),
    );
  });

  it("is clean on a fresh project with nothing installed", () => {
    expect(doctorCommand({ cwd: dir }).ok).toBe(true);
  });
});

describe("remove --target on a subset", () => {
  it("removes one target's output and keeps the skill installed to the rest", async () => {
    await addCommand({
      cwd: dir,
      names: [NAME],
      targets: ["claude", "cursor"],
      content: CONTENT_ROOT,
    });
    expect(has(CLAUDE)).toBe(true);
    expect(has(CURSOR)).toBe(true);

    const res = removeCommand({ cwd: dir, names: [NAME], targets: ["cursor"] });
    expect(res.removed).toEqual([NAME]);

    expect(has(CURSOR)).toBe(false);
    expect(has(CLAUDE)).toBe(true);

    const locked = JSON.parse(read(LOCK)).skills[NAME];
    expect(Object.keys(locked.emitted)).toEqual(["claude"]);
    // the lockfile still matches disk, so doctor stays quiet
    expect(doctorCommand({ cwd: dir }).ok).toBe(true);
  });
});

describe("AGENTS.md with several skills", () => {
  async function installBoth() {
    return addCommand({
      cwd: dir,
      names: [NAME, TOOL_NAME],
      targets: ["agents"],
      content: CONTENT_ROOT,
    });
  }

  it("composes one block per skill in a single file", async () => {
    await installBoth();
    const agents = read(AGENTS);
    for (const n of [NAME, TOOL_NAME]) {
      expect(agents).toContain(`BEGIN skills-master:${n}`);
      expect(agents).toContain(`END skills-master:${n}`);
    }
    expect(agents.indexOf(`BEGIN skills-master:${NAME}`)).toBeLessThan(
      agents.indexOf(`BEGIN skills-master:${TOOL_NAME}`),
    );
  });

  it("keeps hand-written content outside the blocks across an update", async () => {
    await installBoth();
    writeFileSync(
      join(dir, AGENTS),
      `# House rules\n\nAlways run tests.\n\n${read(AGENTS)}`,
      "utf8",
    );

    await updateCommand({ cwd: dir, content: CONTENT_ROOT, overwrite: true });

    const agents = read(AGENTS);
    expect(agents).toContain("# House rules");
    expect(agents).toContain("Always run tests.");
    expect(agents).toContain(`BEGIN skills-master:${NAME}`);
    expect(agents).toContain(`BEGIN skills-master:${TOOL_NAME}`);
  });

  it("removing one skill leaves the other block and the file in place", async () => {
    await installBoth();
    removeCommand({ cwd: dir, names: [NAME] });

    expect(has(AGENTS)).toBe(true);
    const agents = read(AGENTS);
    expect(agents).not.toContain(`skills-master:${NAME} `);
    expect(agents).toContain(`BEGIN skills-master:${TOOL_NAME}`);
    expect(doctorCommand({ cwd: dir }).ok).toBe(true);
  });

  it("removing the last skill deletes the file it created", async () => {
    await installBoth();
    removeCommand({ cwd: dir, names: [NAME, TOOL_NAME] });
    expect(has(AGENTS)).toBe(false);
  });
});
