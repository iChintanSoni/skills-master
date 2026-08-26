import { describe, expect, it } from "vitest";
import { searchableText, searchNormalize } from "../../src/core/search-text";

describe("searchNormalize", () => {
  it("ignores case, spacing, and punctuation so spelling variants agree", () => {
    for (const variant of ["Wear OS", "wear-os", "WearOS", "wear_os"]) {
      expect(searchNormalize(variant)).toBe("wearos");
    }
    expect(searchNormalize("iOS 17")).toBe(searchNormalize("ios17"));
    expect(searchNormalize("async/await")).toBe(searchNormalize("async-await"));
    expect(searchNormalize("C++")).toBe("c");
  });

  it("keeps distinct terms distinct", () => {
    expect(searchNormalize("wear-os")).not.toBe(searchNormalize("android-tv"));
  });
});

describe("searchableText", () => {
  const skill = {
    name: "wear-compose",
    description: "Covers Compose for Wear OS — wear.compose.material3 components.",
    domain: "android",
    category: "form-factors",
    class: "code",
  };

  it("makes a hyphenated query match prose that spaces the term", () => {
    expect(searchableText(skill)).toContain(searchNormalize("wear-os"));
    expect(searchableText(skill)).toContain(searchNormalize("Wear OS"));
  });

  it("covers the facets a skill is filed under, not just its prose", () => {
    expect(searchableText(skill)).toContain(searchNormalize("form-factors"));
    expect(searchableText(skill)).toContain(searchNormalize("android"));
  });

  it("does not invent matches for terms the skill never mentions", () => {
    expect(searchableText(skill)).not.toContain(searchNormalize("carplay"));
  });
});
