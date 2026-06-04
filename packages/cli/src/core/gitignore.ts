import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Ensure each entry appears in the project's .gitignore (idempotent). */
export function ensureGitignored(root: string, entries: string[]): void {
  const p = join(root, ".gitignore");
  const current = existsSync(p) ? readFileSync(p, "utf8") : "";
  const lines = new Set(current.split("\n").map((l) => l.trim()));
  const missing = entries.filter((e) => !lines.has(e));
  if (missing.length === 0) return;
  const header = current.includes("# skills-master") ? "" : "\n# skills-master generated outputs\n";
  const next = current.replace(/\s*$/, "") + header + missing.join("\n") + "\n";
  writeFileSync(p, next, "utf8");
}
