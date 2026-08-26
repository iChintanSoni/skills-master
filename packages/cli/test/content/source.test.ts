import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ContentSource, resolveContent, SkillNotFoundError } from "../../src/content/source";

const CONTENT_ROOT = fileURLToPath(new URL("../fixtures/content", import.meta.url));
const NAME = "fixture-skill";

let dir: string;
const savedEnv = process.env.SKILLS_MASTER_CONTENT;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "skills-master-source-"));
  delete process.env.SKILLS_MASTER_CONTENT;
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
  if (savedEnv === undefined) delete process.env.SKILLS_MASTER_CONTENT;
  else process.env.SKILLS_MASTER_CONTENT = savedEnv;
});

/** A checkout that looks like the content monorepo to the upward walk. */
function fakeRepo(depth: number): { start: string; skills: string } {
  const root = join(dir, "repo");
  const skills = join(root, "skills");
  cpSync(CONTENT_ROOT, skills, { recursive: true });
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({ name: "skills-master-monorepo" }),
    "utf8",
  );
  const start = join(root, ...Array.from({ length: depth }, (_, i) => `nested${i}`));
  mkdirSync(start, { recursive: true });
  return { start, skills };
}

describe("ContentSource", () => {
  it("finds a skill by directory name", () => {
    const src = new ContentSource(CONTENT_ROOT);
    expect(src.loadSkill(NAME).name).toBe(NAME);
    expect(src.findDir(NAME)).toContain(NAME);
  });

  it("throws SkillNotFoundError — an absence, not a load failure", () => {
    const src = new ContentSource(CONTENT_ROOT);
    expect(() => src.loadSkill("nope")).toThrow(SkillNotFoundError);
    expect(src.findDir("nope")).toBeUndefined();
  });

  it("memoizes the directory scan so repeated lookups do not re-walk", () => {
    const src = new ContentSource(CONTENT_ROOT);
    expect(src.skillDirs()).toBe(src.skillDirs());
  });

  it("builds a registry by scanning when the tree ships no registry.json", () => {
    const reg = new ContentSource(CONTENT_ROOT).registry();
    expect(reg.skills.map((s) => s.name).sort()).toEqual(["fixture-skill", "fixture-tool-skill"]);
  });

  it("prefers a committed registry.json over scanning", () => {
    const root = join(dir, "with-registry");
    cpSync(CONTENT_ROOT, root, { recursive: true });
    writeFileSync(
      join(root, "registry.json"),
      JSON.stringify({
        $schema: "./registry.schema.json",
        version: "0.1.0",
        skills: [
          {
            name: "only-from-the-file",
            domain: "testdomain",
            class: "code",
            category: "fixtures",
            description: "proves the committed file was read",
            platforms: ["testos"],
            stability: "stable",
            version: "1.0.0",
            tags: [],
            pairs_with: [],
            path: "testdomain/code/fixtures/only-from-the-file",
            resources: { reference: false, examples: false, checklist: false },
          },
        ],
      }),
      "utf8",
    );
    expect(new ContentSource(root).registry().skills.map((s) => s.name)).toEqual([
      "only-from-the-file",
    ]);
  });

  it("falls back to scanning when the committed registry is corrupt", () => {
    const root = join(dir, "bad-registry");
    cpSync(CONTENT_ROOT, root, { recursive: true });
    writeFileSync(join(root, "registry.json"), "{ not json", "utf8");
    // Ground truth still wins — a broken cache must never mean "no skills".
    expect(new ContentSource(root).registry().skills.length).toBe(2);
  });

  it("falls back to scanning when the committed registry fails schema validation", () => {
    const root = join(dir, "invalid-registry");
    cpSync(CONTENT_ROOT, root, { recursive: true });
    writeFileSync(join(root, "registry.json"), JSON.stringify({ skills: "not-an-array" }), "utf8");
    expect(new ContentSource(root).registry().skills.length).toBe(2);
  });
});

describe("resolveContent priority order", () => {
  it("1. an explicit --content path wins over everything", async () => {
    process.env.SKILLS_MASTER_CONTENT = join(dir, "ignored");
    const src = await resolveContent({ content: CONTENT_ROOT });
    expect(src.root).toBe(CONTENT_ROOT);
  });

  it("resolves a relative --content against the working directory", async () => {
    const src = await resolveContent({ content: "test/fixtures/content" });
    expect(src.root).toBe(resolve(process.cwd(), "test/fixtures/content"));
  });

  it("errors on a missing --content directory instead of silently finding nothing", async () => {
    await expect(resolveContent({ content: join(dir, "nope") })).rejects.toThrow(
      /--content directory not found/,
    );
  });

  it("2. SKILLS_MASTER_CONTENT is used when --content is absent", async () => {
    process.env.SKILLS_MASTER_CONTENT = CONTENT_ROOT;
    const src = await resolveContent({ cwd: dir });
    expect(src.root).toBe(CONTENT_ROOT);
  });

  it("errors on a missing SKILLS_MASTER_CONTENT directory, naming the variable", async () => {
    process.env.SKILLS_MASTER_CONTENT = join(dir, "nope");
    await expect(resolveContent({ cwd: dir })).rejects.toThrow(
      /SKILLS_MASTER_CONTENT directory not found/,
    );
  });

  it("3. walks upward to a content checkout when nothing else is set", async () => {
    const { start, skills } = fakeRepo(3);
    const src = await resolveContent({ cwd: start });
    expect(src.root).toBe(skills);
  });

  it("ignores an unrelated repo that merely has a skills/ directory", async () => {
    const root = join(dir, "other");
    mkdirSync(join(root, "skills"), { recursive: true });
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "someone-else" }), "utf8");
    // No content repo above it, so this must fall through to the remote path
    // rather than hijacking resolution with an unrelated skills/ dir.
    await expect(resolveContent({ cwd: root, ref: "  " })).rejects.toThrow(/Invalid content ref/);
  });

  it("4. refuses a whitespace ref rather than wiping the whole cache root", async () => {
    // A blank ref sanitizes to "", collapsing the cache path to the cache root,
    // which the fetch's forceClean would then delete wholesale.
    await expect(resolveContent({ cwd: dir, ref: "   " })).rejects.toThrow(/Invalid content ref/);
    await expect(resolveContent({ cwd: dir, ref: "\t\n" })).rejects.toThrow(/Invalid content ref/);
  });
});
