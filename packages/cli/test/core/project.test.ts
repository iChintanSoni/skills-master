import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  configPath,
  loadConfig,
  loadConfigOrDefault,
  loadLockfile,
  saveConfig,
  saveLockfile,
} from "../../src/core/project";
import { CONFIG_FILENAME, LOCKFILE_NAME } from "../../src/schema/projectConfig";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "skills-master-project-"));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("config round-trip", () => {
  it("returns null rather than throwing when no config exists", () => {
    expect(loadConfig(dir)).toBeNull();
  });

  it("falls back to schema defaults when no config exists", () => {
    const cfg = loadConfigOrDefault(dir);
    expect(cfg.contentRef).toBe("main");
    expect(cfg.targets).toEqual([]);
    expect(cfg.commit).toBe(true);
  });

  it("saves and reloads every field, stamping a $schema for editor completion", () => {
    const cfg = loadConfigOrDefault(dir);
    cfg.targets = ["claude", "cursor"];
    cfg.contentRef = "v3";
    cfg.commit = false;
    saveConfig(dir, cfg);

    const reloaded = loadConfig(dir);
    expect(reloaded).toMatchObject({
      targets: ["claude", "cursor"],
      contentRef: "v3",
      commit: false,
    });
    expect(reloaded?.$schema).toMatch(/^https:\/\//);
    // and re-saving what we read back is stable, not additive
    saveConfig(dir, reloaded!);
    expect(loadConfig(dir)).toEqual(reloaded);
  });

  it("writes readable JSON at the documented filename", () => {
    saveConfig(dir, loadConfigOrDefault(dir));
    expect(configPath(dir)).toBe(join(dir, CONFIG_FILENAME));
    const text = readFileSync(configPath(dir), "utf8");
    expect(text.endsWith("\n")).toBe(true);
    expect(() => JSON.parse(text)).not.toThrow();
  });

  it("applies defaults to a sparse config file", () => {
    writeFileSync(join(dir, CONFIG_FILENAME), JSON.stringify({ contentRef: "v9" }), "utf8");
    const cfg = loadConfig(dir);
    expect(cfg).toMatchObject({ contentRef: "v9", targets: [], commit: true });
  });

  it("names the file and the failing field on invalid JSON", () => {
    writeFileSync(join(dir, CONFIG_FILENAME), "{ nope", "utf8");
    expect(() => loadConfig(dir)).toThrow(new RegExp(`${CONFIG_FILENAME} is not valid JSON`));
  });

  it("names the offending key on a schema failure", () => {
    writeFileSync(join(dir, CONFIG_FILENAME), JSON.stringify({ targets: ["nope"] }), "utf8");
    expect(() => loadConfig(dir)).toThrow(/is invalid at "targets/);
  });
});

describe("lockfile round-trip", () => {
  it("returns an empty lockfile when none exists", () => {
    expect(loadLockfile(dir).skills).toEqual({});
  });

  it("saves and reloads installed-skill state", () => {
    const lock = loadLockfile(dir);
    lock.contentRef = "v2";
    lock.skills["a-skill"] = {
      version: "1.0.0",
      sourceHash: "abc",
      emitted: { claude: { files: [".claude/skills/a-skill/SKILL.md"], hash: "def" } },
    };
    saveLockfile(dir, lock);

    const again = loadLockfile(dir);
    expect(again.contentRef).toBe("v2");
    expect(again.skills["a-skill"]?.emitted.claude?.files).toEqual([
      ".claude/skills/a-skill/SKILL.md",
    ]);
  });

  it("names the lockfile when it is corrupt, rather than dumping a parse error", () => {
    writeFileSync(join(dir, LOCKFILE_NAME), "not json at all", "utf8");
    expect(() => loadLockfile(dir)).toThrow(new RegExp(`${LOCKFILE_NAME.replace(".", "\\.")}`));
  });
});
