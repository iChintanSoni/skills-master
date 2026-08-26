/**
 * Shared text normalization for skill lookup.
 *
 * Comparing on letters and digits alone means a query matches however the user
 * spaces, hyphenates, or cases it: "wear os", "wear-os" and "WearOS" all find
 * prose that says "Wear OS", and "ios17" finds "iOS 17". `search` uses it to
 * match, and the linter uses it to spot tags a skill's own text already covers.
 */
export function searchNormalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/** The text a skill is findable by, before tags are considered. */
export function searchableText(parts: {
  name: string;
  description: string;
  domain: string;
  category: string;
  class: string;
}): string {
  return searchNormalize(
    [parts.name, parts.description, parts.domain, parts.category, parts.class].join(" "),
  );
}
