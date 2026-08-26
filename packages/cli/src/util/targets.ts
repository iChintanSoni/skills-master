import { detectTargets } from "../emitters";
import { ALL_TARGETS, type TargetId } from "../types";

const VALID = new Set<string>(ALL_TARGETS);

/**
 * Which targets a command should emit to, in priority order: an explicit
 * `--target`, then the configured set, then whatever the project looks like it
 * uses, then everything. Shared by `add` and `sync` so the two can never
 * disagree about where output belongs.
 */
export function resolveTargets(
  cwd: string,
  configured: TargetId[],
  explicit?: TargetId[],
): TargetId[] {
  if (explicit?.length) return explicit;
  if (configured.length) return configured;
  const detected = detectTargets(cwd);
  return detected.length ? detected : ALL_TARGETS;
}

/**
 * Parse a `--target` value: a comma-separated list of target ids, or `all`.
 * Returns `undefined` when the flag was not given, which callers read as
 * "fall back to the configured or auto-detected targets".
 *
 * Lives here rather than in `bin.ts` so it can be tested directly — validating
 * the flag is real behavior, not commander wiring.
 */
export function parseTargets(value?: string): TargetId[] | undefined {
  if (!value) return undefined;
  if (value === "all") return ALL_TARGETS;
  const ids = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const id of ids) {
    if (!VALID.has(id)) {
      throw new Error(`Unknown target "${id}". Valid: ${[...VALID, "all"].join(", ")}.`);
    }
  }
  return ids as TargetId[];
}
