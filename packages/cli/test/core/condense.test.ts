import { describe, expect, it } from "vitest";
import { condenseBody, digestBody } from "../../src/core/condense";

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

describe("digestBody", () => {
  const body = [
    "## When to use",
    "",
    "Long prose that the digest drops.",
    "",
    "## Core guidance",
    "",
    "- First rule.",
    "- Second rule.",
    "```swift",
    "- not a bullet, inside a fence",
    "```",
    "- Third rule.",
    "",
    "## Pitfalls",
    "",
    "- One pitfall.",
    "",
    "## References",
    "",
    "- [Docs](https://example.com)",
    "",
  ].join("\n");

  it("keeps description, guidance and pitfall bullets, and the pointer note", () => {
    const out = digestBody(body, { name: "some-skill", description: "Does X. Use when Y." });
    expect(out).toContain("Does X. Use when Y.");
    expect(out).toContain("#### Core guidance");
    expect(out).toContain("- First rule.");
    expect(out).toContain("- Third rule.");
    expect(out).toContain("#### Pitfalls");
    expect(out).toContain("skills-master view some-skill");
  });

  it("drops everything else: prose sections, fences, references", () => {
    const out = digestBody(body, { name: "some-skill", description: "d" });
    expect(out).not.toContain("Long prose");
    expect(out).not.toContain("inside a fence");
    expect(out).not.toContain("References");
    expect(out).not.toContain("example.com");
  });

  it("caps guidance at 6 bullets and pitfalls at 3", () => {
    const many = `## Core guidance\n\n${Array.from({ length: 10 }, (_, i) => `- G${i}.`).join("\n")}\n\n## Pitfalls\n\n${Array.from({ length: 6 }, (_, i) => `- P${i}.`).join("\n")}\n`;
    const out = digestBody(many, { name: "n", description: "d" });
    expect(out).toContain("- G5.");
    expect(out).not.toContain("- G6.");
    expect(out).toContain("- P2.");
    expect(out).not.toContain("- P3.");
  });

  it("falls back to the first paragraph when a section has no bullets", () => {
    const prose =
      "## Core guidance\n\nOnly prose here,\nwrapped across lines.\n\nSecond paragraph.\n";
    const out = digestBody(prose, { name: "n", description: "d" });
    expect(out).toContain("Only prose here, wrapped across lines.");
    expect(out).not.toContain("Second paragraph.");
  });
});

describe("digestBody link flattening", () => {
  it("flattens resource-file links inside kept bullets", () => {
    const body = "## Core guidance\n\n- See [worked examples](examples.md#setup) for details.\n";
    const out = digestBody(body, { name: "n", description: "d" });
    expect(out).toContain("See worked examples for details.");
    expect(out).not.toContain("(examples.md");
  });
});
