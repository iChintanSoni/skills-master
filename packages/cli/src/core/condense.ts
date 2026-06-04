/**
 * Condense a canonical SKILL.md body for single-file targets (Cursor, Copilot,
 * AGENTS.md) that cannot carry on-demand resource files.
 *
 *  - Links to reference.md / examples.md / checklist.md are flattened to plain
 *    text and a one-line pointer to the full skill is appended ("drop-and-note").
 *  - The `## Open question` section can optionally be summarized to a single
 *    tradeoff line for terse targets.
 */

const L3_LINK_RE =
  /\[([^\]]+)\]\((?:\.\/)?(reference|examples|checklist)\.md(?:#[^)]*)?\)/g;

export interface CondenseOptions {
  /** "keep" (default) leaves the section intact; "summarize" collapses it. */
  openQuestion?: "keep" | "summarize";
  /** whether the source skill had any resource files (drives the pointer note). */
  hadResources?: boolean;
  /** how to refer to the full skill in the appended note. */
  fullSkillNote?: string;
}

const DEFAULT_NOTE =
  "Extended reference and worked examples are available in the full Claude Code skill for this topic.";

export function condenseBody(body: string, opts: CondenseOptions = {}): string {
  let out = body;
  let strippedLink = false;

  out = out.replace(L3_LINK_RE, (_m, text: string) => {
    strippedLink = true;
    return text;
  });

  if (opts.openQuestion === "summarize") {
    out = summarizeOpenQuestion(out);
  }

  out = out.replace(/\n{3,}/g, "\n\n").trim();

  if (opts.hadResources || strippedLink) {
    out += `\n\n> ${opts.fullSkillNote ?? DEFAULT_NOTE}`;
  }

  return out + "\n";
}

function summarizeOpenQuestion(body: string): string {
  const re = /^## Open question[ \t]*\n([\s\S]*?)(?=\n## |\s*$)/m;
  return body.replace(re, (_m, section: string) => {
    const firstPara = section.trim().split(/\n\s*\n/)[0]?.replace(/\s+/g, " ").trim() ?? "";
    return `## Open question\n\nTradeoff: ${firstPara}\n`;
  });
}
