import { describe, expect, it } from "vitest";
import { condenseBody } from "../../src/core/condense";

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
