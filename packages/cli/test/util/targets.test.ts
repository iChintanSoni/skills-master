import { describe, expect, it } from "vitest";
import { parseTargets } from "../../src/util/targets";
import { ALL_TARGETS } from "../../src/types";

describe("parseTargets", () => {
  it("returns undefined when the flag was not given, so config wins", () => {
    expect(parseTargets()).toBeUndefined();
    expect(parseTargets("")).toBeUndefined();
  });

  it('expands "all" to every target', () => {
    expect(parseTargets("all")).toEqual(ALL_TARGETS);
  });

  it("parses a comma-separated list, tolerating whitespace and stray commas", () => {
    expect(parseTargets("claude")).toEqual(["claude"]);
    expect(parseTargets("claude,cursor")).toEqual(["claude", "cursor"]);
    expect(parseTargets(" claude , cursor ")).toEqual(["claude", "cursor"]);
    expect(parseTargets("claude,,cursor,")).toEqual(["claude", "cursor"]);
  });

  it("rejects an unknown target by name and lists the valid ones", () => {
    expect(() => parseTargets("clyde")).toThrow(/Unknown target "clyde"/);
    expect(() => parseTargets("clyde")).toThrow(/claude/);
    expect(() => parseTargets("claude,clyde")).toThrow(/Unknown target "clyde"/);
  });

  it('does not treat "all" as valid inside a list', () => {
    expect(() => parseTargets("claude,all")).toThrow(/Unknown target "all"/);
  });
});
