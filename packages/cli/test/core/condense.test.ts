import { describe, expect, it } from "vitest";
import { condenseBody, demoteHeadings } from "../../src/core/condense";

describe("condenseBody", () => {
  it("flattens Level-3 links to their text", () => {
    const out = condenseBody("See [worked examples](examples.md#setup) and [ref](./reference.md).");
    expect(out).toContain("See worked examples and ref.");
    expect(out).not.toContain("examples.md");
  });

  it("leaves external and non-L3 links intact", () => {
    const body =
      "[SwiftData](https://developer.apple.com/documentation/swiftdata) and [x](other.md)";
    expect(condenseBody(body)).toContain("(https://developer.apple.com/documentation/swiftdata)");
    expect(condenseBody(body)).toContain("[x](other.md)");
  });

  it("appends the pointer note only when something was stripped", () => {
    expect(condenseBody("[a](examples.md)")).toMatch(/full Claude Code skill/i);
    expect(condenseBody("no links here")).not.toMatch(/full Claude Code skill/i);
  });

  // Regression: the L3 link regex used [^\]]+ for link text, which can itself
  // match "[", making every "[" an overlapping restart position — quadratic
  // blowup on bracket-heavy input (CodeQL js/polynomial-redos). The unfixed
  // regex needs several seconds here; the fixed one is ~1ms. The budget is
  // deliberately loose so this measures complexity, not machine speed.
  it("stays linear on adversarial bracket-heavy input", () => {
    for (const attack of [
      "[".repeat(100_000),
      "[](examples.md#" + "[(](examples.md#".repeat(20_000),
    ]) {
      const started = performance.now();
      condenseBody(attack);
      expect(performance.now() - started).toBeLessThan(2_000);
    }
  });
});

describe("summarizeOpenQuestion (via condenseBody)", () => {
  const body =
    "## Core guidance\n\ntext\n\n## Open question\n\nFirst paragraph states the tradeoff.\n\nSecond paragraph elaborates at length.\n";

  it("collapses the section to its first paragraph", () => {
    const out = condenseBody(body, { openQuestion: "summarize" });
    expect(out).toContain("Tradeoff: First paragraph states the tradeoff.");
    expect(out).not.toContain("Second paragraph");
  });

  it("summarizes a section that ends at the end of the body", () => {
    const out = condenseBody("## Open question\n\nOnly paragraph.\n", {
      openQuestion: "summarize",
    });
    expect(out).toContain("Tradeoff: Only paragraph.");
    // Regression: with the old \s*$ lookahead the capture matched nothing and
    // the output was a bare "Tradeoff: " with the paragraph left behind.
    expect(out).not.toMatch(/Tradeoff:\s*\n/);
  });

  it("stops at the next h2", () => {
    const out = condenseBody(`${body}## References\n\n- link\n`, { openQuestion: "summarize" });
    expect(out).toContain("## References");
    expect(out).not.toContain("Second paragraph");
  });
});

describe("demoteHeadings", () => {
  it("shifts headings by the given amount, capped at h6", () => {
    expect(demoteHeadings("## A\n\n### B\n\n###### C", 2)).toBe("#### A\n\n##### B\n\n###### C");
  });

  it("leaves fenced code blocks untouched", () => {
    const md = "## A\n\n```sh\n# comment, not a heading\n```\n\n## B";
    expect(demoteHeadings(md, 2)).toBe("#### A\n\n```sh\n# comment, not a heading\n```\n\n#### B");
  });

  it("ignores hashes that are not headings", () => {
    expect(demoteHeadings("#tag and #5 stay", 2)).toBe("#tag and #5 stay");
  });
});
