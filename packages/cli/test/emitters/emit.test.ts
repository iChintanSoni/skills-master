import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ContentSource } from "../../src/content/source";
import { DEFAULT_PATHS } from "../../src/schema/projectConfig";
import { EMITTERS, getEmitter } from "../../src/emitters";
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
