import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Frontmatter } from "../schema/frontmatter";

/** True when `rel` exists under the project root (used for tool auto-detection). */
export function existsRel(root: string, rel: string): boolean {
  return existsSync(join(root, rel));
}

const ACRONYMS: Record<string, string> = {
  hig: "HIG",
  ui: "UI",
  ml: "ML",
  ar: "AR",
  api: "API",
  sf: "SF",
  spm: "SPM",
  ios: "iOS",
  ipados: "iPadOS",
  macos: "macOS",
  tvos: "tvOS",
  visionos: "visionOS",
  watchos: "watchOS",
};

/** Human title derived from a kebab-case skill name (e.g. "hig-sheets" → "HIG Sheets"). */
export function titleFromName(name: string): string {
  return name
    .split("-")
    .filter(Boolean)
    .map((w) => ACRONYMS[w] ?? w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Comma-join a skill's globs, or undefined if it declares none. */
export function globsToString(fm: Frontmatter): string | undefined {
  const g = fm.globs;
  if (!g || g.length === 0) return undefined;
  return g.join(",");
}

/** True when the skill ships any on-demand resource files. */
export function hasResources(resources: {
  reference?: string;
  examples?: string;
  checklist?: string;
}): boolean {
  return Boolean(resources.reference || resources.examples || resources.checklist);
}
