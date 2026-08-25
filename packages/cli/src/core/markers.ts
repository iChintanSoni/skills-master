/**
 * Sentinel-marker management for shared files (AGENTS.md, copilot-instructions.md).
 *
 * A managed region looks like:
 *
 *   <!-- BEGIN skills-master:<id> v<version> -->
 *   ...generated content...
 *   <!-- END skills-master:<id> -->
 *
 * Only the bytes between (and including) the markers are ever touched, so any
 * hand-written content elsewhere in the file is preserved.
 */

const PREFIX = "skills-master";

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function beginMarker(id: string, version?: string): string {
  return version ? `<!-- BEGIN ${PREFIX}:${id} v${version} -->` : `<!-- BEGIN ${PREFIX}:${id} -->`;
}

export function endMarker(id: string): string {
  return `<!-- END ${PREFIX}:${id} -->`;
}

function blockRegex(id: string): RegExp {
  const esc = escapeRe(id);
  return new RegExp(
    `[ \\t]*<!-- BEGIN ${PREFIX}:${esc}(?: v[^>]*)? -->[\\s\\S]*?<!-- END ${PREFIX}:${esc} -->`,
  );
}

/** Build a complete managed block (markers + body). */
export function renderBlock(id: string, body: string, version?: string): string {
  return `${beginMarker(id, version)}\n${body.trim()}\n${endMarker(id)}`;
}

export function hasBlock(file: string, id: string): boolean {
  return blockRegex(id).test(file);
}

/**
 * Insert or replace a managed block. Returns the new file contents.
 * If the block is absent it is appended, separated by a blank line.
 */
export function upsertBlock(file: string, id: string, body: string, version?: string): string {
  const block = renderBlock(id, body, version);
  const re = blockRegex(id);
  if (re.test(file)) {
    return file.replace(re, block);
  }
  const base = file.replace(/\s+$/, "");
  if (base.length === 0) return block + "\n";
  return `${base}\n\n${block}\n`;
}

/**
 * Remove a managed block (and a trailing blank line). Returns the new contents.
 * If the file becomes empty (only whitespace), returns the empty string so the
 * caller can delete it.
 */
export function removeBlock(file: string, id: string): string {
  const re = new RegExp(blockRegex(id).source + `\\n?\\n?`);
  const next = file.replace(re, "");
  return next.trim().length === 0 ? "" : next.replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}
