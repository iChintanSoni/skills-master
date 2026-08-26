import { describe, expect, it } from "vitest";
import {
  beginMarker,
  endMarker,
  hasBlock,
  removeBlock,
  renderBlock,
  upsertBlock,
} from "../../src/core/markers";

const ID = "my-skill";

describe("markers", () => {
  it("stamps the version into the begin marker when given one", () => {
    expect(beginMarker(ID, "1.2.3")).toBe(`<!-- BEGIN skills-master:${ID} v1.2.3 -->`);
    expect(beginMarker(ID)).toBe(`<!-- BEGIN skills-master:${ID} -->`);
    expect(endMarker(ID)).toBe(`<!-- END skills-master:${ID} -->`);
  });

  it("trims the body so blocks do not accumulate blank lines", () => {
    expect(renderBlock(ID, "\n\nbody\n\n", "1.0.0")).toBe(
      `${beginMarker(ID, "1.0.0")}\nbody\n${endMarker(ID)}`,
    );
  });
});

describe("upsertBlock", () => {
  it("appends to a file that has content, separated by a blank line", () => {
    const out = upsertBlock("# Title\n\nProse.\n", ID, "body", "1.0.0");
    expect(out).toBe(`# Title\n\nProse.\n\n${renderBlock(ID, "body", "1.0.0")}\n`);
  });

  it("returns just the block for an empty file", () => {
    expect(upsertBlock("", ID, "body")).toBe(`${renderBlock(ID, "body")}\n`);
    expect(upsertBlock("   \n\n", ID, "body")).toBe(`${renderBlock(ID, "body")}\n`);
  });

  it("replaces an existing block in place, leaving surrounding text alone", () => {
    const file = `intro\n\n${renderBlock(ID, "old", "1.0.0")}\n\noutro\n`;
    const out = upsertBlock(file, ID, "new", "2.0.0");
    expect(out).toContain("intro");
    expect(out).toContain("outro");
    expect(out).toContain("new");
    expect(out).not.toContain("old");
    expect(out).toContain("v2.0.0");
    expect(out).not.toContain("v1.0.0");
  });

  it("matches an existing block regardless of the version it carries", () => {
    const file = renderBlock(ID, "old", "1.0.0");
    expect(hasBlock(file, ID)).toBe(true);
    expect(hasBlock(renderBlock(ID, "old"), ID)).toBe(true);
    // one block in, one block out — never a duplicate
    const out = upsertBlock(file, ID, "new", "9.9.9");
    expect(out.match(/BEGIN skills-master:/g)).toHaveLength(1);
  });

  it("keeps sibling blocks untouched", () => {
    let file = upsertBlock("", "alpha", "A", "1.0.0");
    file = upsertBlock(file, "beta", "B", "1.0.0");
    const out = upsertBlock(file, "alpha", "A2", "1.1.0");
    expect(out).toContain("A2");
    expect(out).toContain("B");
    expect(hasBlock(out, "beta")).toBe(true);
  });

  it("treats an id with regex metacharacters literally", () => {
    const weird = "skill.v2+x";
    const file = upsertBlock("", weird, "body");
    expect(hasBlock(file, weird)).toBe(true);
    expect(hasBlock(file, "skillXv2+x")).toBe(false);
  });
});

describe("removeBlock", () => {
  it("returns the empty string when the block was the whole file", () => {
    expect(removeBlock(renderBlock(ID, "body", "1.0.0"), ID)).toBe("");
  });

  it("keeps hand-written content and collapses the gap it left", () => {
    const file = `# Title\n\n${renderBlock(ID, "body")}\n\nAfter.\n`;
    const out = removeBlock(file, ID);
    expect(out).toContain("# Title");
    expect(out).toContain("After.");
    expect(out).not.toContain("BEGIN skills-master");
    expect(out).not.toMatch(/\n{3,}/);
  });

  it("leaves sibling blocks in place", () => {
    let file = upsertBlock("", "alpha", "A");
    file = upsertBlock(file, "beta", "B");
    const out = removeBlock(file, "alpha");
    expect(hasBlock(out, "alpha")).toBe(false);
    expect(hasBlock(out, "beta")).toBe(true);
  });

  it("is a no-op for a block that is not there", () => {
    const file = "# Title\n\nProse.\n";
    expect(removeBlock(file, ID)).toBe(file);
  });
});
