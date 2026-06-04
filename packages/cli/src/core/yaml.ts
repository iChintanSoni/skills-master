import YAML from "yaml";

/**
 * Serialize a frontmatter object to a deterministic YAML block (no `---` fences).
 * Insertion order of keys is preserved, so emitters control field order.
 * Long strings are not wrapped (lineWidth: 0), keeping descriptions on one line.
 */
export function toYaml(obj: Record<string, unknown>): string {
  return YAML.stringify(obj, { lineWidth: 0 }).trimEnd();
}

/** Wrap a YAML block in `---` fences for embedding at the top of a Markdown file. */
export function frontmatterBlock(obj: Record<string, unknown>): string {
  return `---\n${toYaml(obj)}\n---`;
}

/**
 * Build a full Markdown document from a frontmatter object and a body.
 * Guarantees exactly one blank line between the frontmatter and the body.
 */
export function withFrontmatter(obj: Record<string, unknown>, body: string): string {
  return `${frontmatterBlock(obj)}\n\n${body.trim()}\n`;
}
