import { z } from "zod";
import semver from "semver";

/**
 * kebab-case, used for skill `name` and `pairs_with` references.
 *
 * Shape is the Agent Skills specification's name rule
 * (https://agentskills.io/specification): lowercase letters and digits joined
 * by single hyphens — so no leading or trailing hyphen and no `--` run, which
 * a looser `[a-z0-9-]+` character class would let through.
 */
export const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Specification cap on `name` length. */
export const NAME_MAX_LENGTH = 64;
/**
 * Claude's platform rejects skill names containing these words, so a name
 * carrying one is unusable in the target this library's main projection serves.
 */
export const RESERVED_NAME_WORDS = ["anthropic", "claude"] as const;

/** Skill name / `pairs_with` reference: spec shape, spec length, no reserved word. */
export const SkillNameSchema = z
  .string()
  .max(NAME_MAX_LENGTH, `must be at most ${NAME_MAX_LENGTH} characters`)
  .regex(NAME_RE, "must be kebab-case ([a-z0-9] words joined by single hyphens)")
  .refine(
    (n) => !RESERVED_NAME_WORDS.some((w) => n.includes(w)),
    `must not contain the reserved words ${RESERVED_NAME_WORDS.map((w) => `"${w}"`).join(" or ")}`,
  );

export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const StabilitySchema = z.enum(["stable", "emerging", "contested"]);
export type Stability = z.infer<typeof StabilitySchema>;

/**
 * Skill classes are reusable across domains (Apple, Android, web, …):
 *  - code        → produces compilable code
 *  - design      → produces UX/design critique (e.g. Apple HIG, Material)
 *  - lang-tooling → cross-cutting language/build/test/ship guidance
 *  - overview    → decision-guidance routers
 */
export const SkillClassSchema = z.enum(["code", "design", "lang-tooling", "overview"]);
export type SkillClass = z.infer<typeof SkillClassSchema>;

/** Maps a skill `class` to its directory name within a domain in `skills/<domain>/`. */
export const CLASS_DIR: Record<SkillClass, string> = {
  code: "code",
  design: "design",
  "lang-tooling": "lang-tooling",
  overview: "overviews",
};

/**
 * Our private metadata block. Stripped from every projected output.
 * Domain-agnostic by design: `domain` namespaces a technology ecosystem
 * (apple, android, web, …); `platforms` and `requires` are free-form so each
 * domain defines its own vocabulary (ios/android/wear-os; {ios:"17"} / {android:"14"}).
 */
export const XSkillsMasterSchema = z
  .object({
    domain: z.string().min(1),
    class: SkillClassSchema,
    category: z.string().min(1),
    platforms: z.array(z.string().min(1)).min(1),
    /** domain-defined version requirements, e.g. { ios: "17", swift: "6.0" }. */
    requires: z.record(z.string(), z.string()).optional(),
    pairs_with: z.array(SkillNameSchema).default([]),
    /**
     * Upstream libraries this skill tracks, named as the vendor's release feed
     * names them (`Media3`, `Compose Animation`, `Datastore`).
     *
     * Declared rather than inferred: matching skill names against feed titles
     * guesses `Compose UI → choosing-android-testing`, and a staleness signal
     * built on bad matches is worse than none. The crawl uses these to report
     * when a skill's upstream has shipped since its `snapshot_date`.
     *
     * Optionally pin the version the skill documents — `Glance@1.2` — which is
     * a far better staleness signal than release dates: both refreshes in the
     * 1.1 pilot were "the skill names an old version", and neither was
     * identifiable from how recently something shipped.
     */
    upstream: z.array(z.string().min(1)).optional(),
    /** citation URLs to canonical docs — never verbatim content. */
    sources: z.array(z.url()).default([]),
    snapshot_date: z.string().regex(ISO_DATE_RE, "must be an ISO date (YYYY-MM-DD)"),
    stability: StabilitySchema,
    version: z.string().refine((v) => semver.valid(v) != null, "must be a valid semver version"),
  })
  .strict();
export type XSkillsMaster = z.infer<typeof XSkillsMasterSchema>;

/** `globs` may be authored as a string or array; normalized to an array. */
const GlobsSchema = z
  .union([z.string(), z.array(z.string())])
  .transform((g) => (Array.isArray(g) ? g : [g]))
  .optional();

// Loose: tolerate tool-native extras (e.g. allowed-tools) without failing validation.
export const FrontmatterSchema = z.looseObject({
  name: SkillNameSchema,
  description: z
    .string()
    .min(1, "description is required")
    .max(1024, "description must be <= 1024 characters"),
  /**
   * Spec field, projected verbatim onto the Claude target. Authored per skill
   * rather than stamped by the emitter: an emitter cannot know the license of
   * whatever content root it was pointed at, and inventing one would be a
   * false claim about someone else's work.
   */
  license: z.string().min(1, "license must be a non-empty string").optional(),
  globs: GlobsSchema,
  tags: z.array(z.string()).default([]),
  "x-skills-master": XSkillsMasterSchema,
});
export type Frontmatter = z.infer<typeof FrontmatterSchema>;
