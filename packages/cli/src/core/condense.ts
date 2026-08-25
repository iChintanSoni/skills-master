/**
 * Condense a canonical SKILL.md body for single-file targets (Cursor, Copilot,
 * AGENTS.md) that cannot carry on-demand resource files.
 *
 *  - Links to reference.md / examples.md / checklist.md are flattened to plain
 *    text and a one-line pointer to the full skill is appended ("drop-and-note").
 *  - The `## Open question` section can optionally be summarized to a single
 *    tradeoff line for terse targets.
 */

// The character classes deliberately exclude their own delimiters and newlines.
// A link-text class of [^\]]+ can match "[", which makes every "[" an overlapping
// restart position and the whole scan quadratic on adversarial input
// (CodeQL js/polynomial-redos). Excluding "[" keeps restarts disjoint, so
// matching stays linear. Markdown link text may not span lines here either.
const L3_LINK_RE = /\[([^\][\n]+)\]\((?:\.\/)?(reference|examples|checklist)\.md(?:#[^()\n]*)?\)/g;

export interface CondenseOptions {
  /** "keep" (default) leaves the section intact; "summarize" collapses it. */
  openQuestion?: "keep" | "summarize";
  /** whether the source skill had any resource files (drives the pointer note). */
  hadResources?: boolean;
  /** how to refer to the full skill in the appended note. */
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
    out += `\n\n> ${DEFAULT_NOTE}`;
  }

  return out + "\n";
}

function summarizeOpenQuestion(body: string): string {
  // The section runs to the next h2 or the true end of input. `$` must not be
  // line-end here (the pattern is /m for the heading anchor), so absolute end
  // is spelled (?![\s\S]) — with \s*$ the lazy capture stopped at the first
  // newline and "summarized" every section to an empty string.
  const re = /^## Open question[ \t]*\n([\s\S]*?)(?=\n## |(?![\s\S]))/m;
  return body.replace(re, (_m, section: string) => {
    const firstPara =
      section
        .trim()
        .split(/\n\s*\n/)[0]
        ?.replace(/\s+/g, " ")
        .trim() ?? "";
    return `## Open question\n\nTradeoff: ${firstPara}\n`;
  });
}

/**
 * Demote every markdown heading by `by` levels (capped at h6), leaving fenced
 * code blocks untouched. Used when a skill body (headings start at h2) is
 * nested under a titled section in a shared file like AGENTS.md.
 */
export function demoteHeadings(md: string, by: number): string {
  let inFence = false;
  return md
    .split("\n")
    .map((line) => {
      if (/^(```|~~~)/.test(line.trimStart())) {
        inFence = !inFence;
        return line;
      }
      if (inFence) return line;
      const m = /^(#{1,6})(\s)/.exec(line);
      if (!m) return line;
      const hashes = m[1]!;
      return "#".repeat(Math.min(6, hashes.length + by)) + line.slice(hashes.length);
    })
    .join("\n");
}
