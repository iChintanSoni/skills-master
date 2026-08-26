import type { Stability } from "../schema/frontmatter";

/**
 * A one-line provisionality banner for skills that are not `stable`.
 *
 * `stability` lives in `x-skills-master`, which every emitter strips, so the
 * label reached no consuming agent — nothing distinguished guidance about a
 * pre-1.0 API from guidance about a settled one. `contested` at least survived
 * through the body's `## Open question` section, except in the AGENTS.md
 * digest, which drops it. Emitting the banner into the body puts the signal
 * where every projection carries it.
 *
 * Deterministic by construction: the only variable is `snapshot_date`, which is
 * authored frontmatter, never a build-time clock.
 */
export function stabilityNote(stability: Stability, snapshotDate: string): string | null {
  switch (stability) {
    case "stable":
      return null;
    case "emerging":
      return `> **Emerging** — this covers an API that was pre-1.0, newly shipped, or still moving as of ${snapshotDate}. Treat the specifics as provisional and confirm against current documentation before relying on them.`;
    case "contested":
      return "> **Contested** — practitioners disagree here and the vendor does not prescribe an answer. Weigh the tradeoffs for the project at hand rather than adopting one option as the default.";
  }
}

/** Prepends the banner to a body, leaving `stable` bodies untouched. */
export function withStabilityNote(body: string, note: string | null): string {
  if (!note) return body;
  return `${note}\n\n${body.replace(/^\n+/, "")}`;
}
