import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ContentSource } from "../../src/content/source";
import { DEFAULT_PATHS } from "../../src/schema/projectConfig";
import { detectTargets, EMITTERS, getEmitter } from "../../src/emitters";
import { titleFromName } from "../../src/emitters/util";
import type { EmitContext } from "../../src/types";

const CONTENT_ROOT = fileURLToPath(new URL("../fixtures/content", import.meta.url));

function ctx(): EmitContext {
  return { projectRoot: "/project", paths: { ...DEFAULT_PATHS } };
}

function loadFixture() {
  return new ContentSource(CONTENT_ROOT).loadSkill("fixture-skill");
}

describe("emitters", () => {
  for (const emitter of EMITTERS) {
    it(`projects the fixture skill for ${emitter.id}`, () => {
      const files = emitter.emit(loadFixture(), ctx());
      expect(files).toMatchSnapshot();
    });
  }

  it("claude copies all Level-3 resource files verbatim", () => {
    const files = getEmitter("claude")!.emit(loadFixture(), ctx());
    const paths = files.map((f) => f.path);
    expect(paths).toContain(".claude/skills/fixture-skill/SKILL.md");
    expect(paths).toContain(".claude/skills/fixture-skill/reference.md");
    expect(paths).toContain(".claude/skills/fixture-skill/examples.md");
    expect(paths).toContain(".claude/skills/fixture-skill/checklist.md");
  });

  it("single-file targets condense (drop L3 links, add a pointer note)", () => {
    const cursor = getEmitter("cursor")!.emit(loadFixture(), ctx())[0]!;
    expect(cursor.contents).not.toMatch(/\]\(examples\.md\)/);
    expect(cursor.contents).toMatch(/full Claude Code skill/i);
  });

  it("carries the provisionality banner into every projection, digest included", () => {
    // The fixture is `contested`. AGENTS.md matters most here: its digest drops
    // `## Open question`, so the banner is the only thing that survives.
    for (const emitter of EMITTERS) {
      for (const f of emitter.emit(loadFixture(), ctx())) {
        if (!f.path.endsWith(".md") && !f.path.endsWith(".mdc")) continue;
        if (/examples\.md|checklist\.md|reference\.md|copilot-instructions/.test(f.path)) continue;
        expect(f.contents, `${emitter.id} -> ${f.path}`).toContain("**Contested**");
      }
    }
  });

  it("re-labels the banner when the skill's stability changes", () => {
    const skill = loadFixture();
    skill.frontmatter["x-skills-master"].stability = "emerging";
    for (const emitter of EMITTERS) {
      const first = emitter.emit(skill, ctx())[0]!;
      expect(first.contents).toContain("**Emerging**");
      expect(first.contents).toContain(skill.frontmatter["x-skills-master"].snapshot_date);
      expect(first.contents).not.toContain("**Contested**");
    }
  });

  it("leaves a stable skill's body unbannered", () => {
    const skill = loadFixture();
    skill.frontmatter["x-skills-master"].stability = "stable";
    for (const emitter of EMITTERS) {
      for (const f of emitter.emit(skill, ctx())) {
        expect(f.contents).not.toMatch(/\*\*(Emerging|Contested)\*\*/);
      }
    }
  });

  // 1.2: `license` is a spec field, so the Claude projection carries it — but
  // only when the skill declares one. An emitter that invented a license would
  // be asserting terms for content it did not author.
  it("carries an authored license into the Claude projection only", () => {
    const skillMd = getEmitter("claude")!
      .emit(loadFixture(), ctx())
      .find((f) => f.path.endsWith("SKILL.md"))!;
    expect(skillMd.contents).toContain("license: MIT");

    for (const emitter of EMITTERS) {
      if (emitter.id === "claude") continue;
      for (const f of emitter.emit(loadFixture(), ctx())) {
        expect(f.contents, `${emitter.id} -> ${f.path}`).not.toContain("license:");
      }
    }
  });

  it("emits no license line for a skill that declares none", () => {
    const unlicensed = new ContentSource(CONTENT_ROOT).loadSkill("fixture-tool-skill");
    const files = getEmitter("claude")!.emit(unlicensed, ctx());
    expect(files[0]!.contents).not.toContain("license:");
  });

  it("strips the x-skills-master block from every projection", () => {
    for (const emitter of EMITTERS) {
      for (const f of emitter.emit(loadFixture(), ctx())) {
        expect(f.contents).not.toContain("x-skills-master");
      }
    }
  });

  it("is deterministic across repeated runs", () => {
    for (const emitter of EMITTERS) {
      expect(emitter.emit(loadFixture(), ctx())).toEqual(emitter.emit(loadFixture(), ctx()));
    }
  });

  it("emits AGENTS.md and copilot root as block-mode, others as whole-file", () => {
    const agents = getEmitter("agents")!.emit(loadFixture(), ctx());
    expect(agents[0]!.mode).toBe("block");
    expect(agents[0]!.blockId).toBe("fixture-skill");

    const copilot = getEmitter("copilot")!.emit(loadFixture(), ctx());
    expect(copilot.find((f) => f.path.endsWith("copilot-instructions.md"))!.mode).toBe("block");
    expect(copilot.find((f) => f.path.endsWith(".instructions.md"))!.mode).toBe("whole");
  });
});

describe("titleFromName", () => {
  it("applies brand casing to compound tokens", () => {
    expect(titleFromName("swiftui-navigation")).toBe("SwiftUI Navigation");
    expect(titleFromName("swiftdata-modeling")).toBe("SwiftData Modeling");
    expect(titleFromName("hig-sheets")).toBe("HIG Sheets");
    expect(titleFromName("watchos-complications")).toBe("watchOS Complications");
    expect(titleFromName("m3-gestures")).toBe("M3 Gestures");
    expect(titleFromName("plain-name")).toBe("Plain Name");
  });
});

describe("detectTargets", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "skills-master-detect-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("does not claim Copilot for a repo that merely has .github workflows", () => {
    mkdirSync(join(dir, ".github/workflows"), { recursive: true });
    expect(detectTargets(dir)).toEqual([]);
  });

  it("detects Copilot from its own customization files", () => {
    mkdirSync(join(dir, ".github"), { recursive: true });
    writeFileSync(join(dir, ".github/copilot-instructions.md"), "# hi\n", "utf8");
    expect(detectTargets(dir)).toEqual(["copilot"]);

    rmSync(join(dir, ".github/copilot-instructions.md"));
    mkdirSync(join(dir, ".github/instructions"), { recursive: true });
    expect(detectTargets(dir)).toEqual(["copilot"]);
  });

  it("detects claude/cursor from their config dirs and agents from AGENTS.md", () => {
    mkdirSync(join(dir, ".claude"), { recursive: true });
    mkdirSync(join(dir, ".cursor"), { recursive: true });
    writeFileSync(join(dir, "AGENTS.md"), "# Agents\n", "utf8");
    expect(detectTargets(dir).sort()).toEqual(["agents", "claude", "cursor"]);
  });
});

describe("copilot applyTo scoping", () => {
  it("omits applyTo when the skill declares no globs", () => {
    const src = new ContentSource(CONTENT_ROOT);
    const skill = src.loadSkill("fixture-tool-skill"); // lang-tooling fixture, no globs
    const files = getEmitter("copilot")!.emit(skill, ctx());
    const whole = files.find((f) => f.mode === "whole")!;
    expect(whole.contents).not.toContain("applyTo");
    expect(whole.contents).toContain("description:");
  });
});
