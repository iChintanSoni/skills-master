import { z } from "zod";
import semver from "semver";

/** kebab-case, used for skill `name` and `pairs_with` references. */
export const NAME_RE = /^[a-z0-9-]{1,64}$/;
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
export const SkillClassSchema = z.enum([
  "code",
  "design",
  "lang-tooling",
  "overview",
]);
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
    pairs_with: z.array(z.string().regex(NAME_RE)).default([]),
    /** citation URLs to canonical docs — never verbatim content. */
    sources: z.array(z.string().url()).default([]),
    snapshot_date: z.string().regex(ISO_DATE_RE, "must be an ISO date (YYYY-MM-DD)"),
    stability: StabilitySchema,
    version: z
      .string()
      .refine((v) => semver.valid(v) != null, "must be a valid semver version"),
  })
  .strict();
export type XSkillsMaster = z.infer<typeof XSkillsMasterSchema>;

/** `globs` may be authored as a string or array; normalized to an array. */
const GlobsSchema = z
  .union([z.string(), z.array(z.string())])
  .transform((g) => (Array.isArray(g) ? g : [g]))
  .optional();

export const FrontmatterSchema = z
  .object({
    name: z.string().regex(NAME_RE, "must be kebab-case ([a-z0-9-], <=64 chars)"),
    description: z
      .string()
      .min(1, "description is required")
      .max(1024, "description must be <= 1024 characters"),
    globs: GlobsSchema,
    tags: z.array(z.string()).default([]),
    "x-skills-master": XSkillsMasterSchema,
  })
  // Tolerate tool-native extras (e.g. allowed-tools) without failing validation.
  .passthrough();
export type Frontmatter = z.infer<typeof FrontmatterSchema>;
