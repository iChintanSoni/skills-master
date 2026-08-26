import { describe, expect, it } from "vitest";
import { stabilityNote, withStabilityNote } from "../../src/core/stability-note";

describe("stabilityNote", () => {
  it("stays silent for stable skills, so settled guidance carries no banner", () => {
    expect(stabilityNote("stable", "2026-01-01")).toBeNull();
    expect(withStabilityNote("## When to use\n", null)).toBe("## When to use\n");
  });

  it("dates the emerging banner from authored frontmatter, never a build clock", () => {
    const note = stabilityNote("emerging", "2026-08-25");
    expect(note).toContain("Emerging");
    expect(note).toContain("2026-08-25");
    // same input, same output — emitters must be byte-reproducible
    expect(stabilityNote("emerging", "2026-08-25")).toBe(note);
  });

  it("tells a reader not to pick a default for contested skills", () => {
    const note = stabilityNote("contested", "2026-01-01");
    expect(note).toContain("Contested");
    expect(note).toMatch(/does not prescribe/);
    // no date: contestedness is not a function of when it was checked
    expect(note).not.toContain("2026-01-01");
  });
});

describe("withStabilityNote", () => {
  it("puts the banner ahead of the first heading, separated by a blank line", () => {
    const out = withStabilityNote("## When to use\n\nBody.\n", "> **Emerging** — x.");
    expect(out).toBe("> **Emerging** — x.\n\n## When to use\n\nBody.\n");
  });

  it("does not accumulate blank lines when the body starts with newlines", () => {
    const out = withStabilityNote("\n\n## When to use\n", "> **Emerging** — x.");
    expect(out).toBe("> **Emerging** — x.\n\n## When to use\n");
  });
});
