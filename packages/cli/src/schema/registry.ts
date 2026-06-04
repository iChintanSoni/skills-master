import { z } from "zod";
import { SkillClassSchema, StabilitySchema } from "./frontmatter";

/** One catalog entry. Generated from the skill tree by `registry build`. */
export const RegistryEntrySchema = z.object({
  name: z.string(),
  domain: z.string(),
  class: SkillClassSchema,
  category: z.string(),
  description: z.string(),
  platforms: z.array(z.string()),
  stability: StabilitySchema,
  version: z.string(),
  tags: z.array(z.string()).default([]),
  pairs_with: z.array(z.string()).default([]),
  /** path relative to the skills root. */
  path: z.string(),
  /** which on-demand resource files exist. */
  resources: z.object({
    reference: z.boolean(),
    examples: z.boolean(),
    checklist: z.boolean(),
  }),
});

export const RegistrySchema = z.object({
  $schema: z.string().optional(),
  /** aggregate library version (bumped on release). */
  version: z.string().default("0.1.0"),
  generatedAt: z.string().optional(),
  skills: z.array(RegistryEntrySchema).default([]),
});

export type RegistryEntry = z.infer<typeof RegistryEntrySchema>;
export type Registry = z.infer<typeof RegistrySchema>;

export const REGISTRY_FILENAME = "registry.json";
