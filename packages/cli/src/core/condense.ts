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

/** First `max` top-level bullets of a `## <section>`, or its first paragraph as fallback. */
function sectionHighlights(body: string, section: string, max: number): string[] {
  const re = new RegExp(`^## ${section}\\n([\\s\\S]*?)(?=\\n## |(?![\\s\\S]))`, "m");
  const m = re.exec(body);
  if (!m) return [];
  const text = m[1]!;
  const bullets: string[] = [];
  let inFence = false;
  for (const line of text.split("\n")) {
    if (/^(```|~~~)/.test(line.trimStart())) {
      inFence = !inFence;
      continue;
    }
    if (!inFence && /^- /.test(line.trim())) bullets.push(line.trim());
    if (bullets.length === max) break;
  }
  if (bullets.length > 0) return bullets;
  const firstPara = text
    .trim()
    .split(/\n\s*\n/)[0]
    ?.replace(/\s+/g, " ")
    .trim();
  return firstPara ? [firstPara] : [];
}

export interface DigestOptions {
  /** skill name, used in the pointer note. */
  name: string;
  /** frontmatter description (already carries the "use when" trigger clause). */
  description: string;
}

/**
 * Aggressive digest for always-injected shared files (AGENTS.md): description
 * plus the leading Core guidance and Pitfalls bullets. The full body averages
 * ~1.9k tokens per skill and shared files are read in full on every request,
 * so everything else — code fences, references, platform notes — is dropped
 * in favor of a pointer to the complete projections.
 */
export function digestBody(body: string, opts: DigestOptions): string {
  const guidance = sectionHighlights(body, "Core guidance", 6);
  const pitfalls = sectionHighlights(body, "Pitfalls", 3);
  // Bullets can carry links to resource files that do not exist next to a
  // consumer's AGENTS.md — flatten them like condenseBody does.
  const flatten = (lines: string[]) =>
    lines.map((l) => l.replace(L3_LINK_RE, (_m, text: string) => text));
  const parts: string[] = [opts.description.trim()];
  if (guidance.length > 0) parts.push(`#### Core guidance\n\n${flatten(guidance).join("\n")}`);
  if (pitfalls.length > 0) parts.push(`#### Pitfalls\n\n${flatten(pitfalls).join("\n")}`);
  parts.push(
    `> Digest only — the complete skill (full guidance, examples, references) ships with the Claude Code, Cursor, and Copilot projections, or via \`skills-master view ${opts.name}\`.`,
  );
  return parts.join("\n\n");
}
