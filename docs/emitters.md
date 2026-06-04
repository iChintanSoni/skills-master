# Emitters

An emitter projects one canonical skill into the files a specific AI tool reads. All emitters implement the `Emitter` interface (`packages/cli/src/emitters/Emitter.ts`) and are registered in `emitters/index.ts`. The `x-skills-master` block is stripped from every output.

| Emitter | Output(s) | Frontmatter emitted | Body | Fidelity |
|---------|-----------|---------------------|------|----------|
| `claude` | `.claude/skills/<name>/SKILL.md` + verbatim copies of `reference.md`/`examples.md`/`checklist.md` | `name`, `description` | verbatim (Level-3 links resolve) | **lossless** |
| `cursor` | `.cursor/rules/<name>.mdc` | `description`, `globs` (if any), `alwaysApply: false` | condensed | single-file |
| `copilot` | `.github/instructions/<name>.instructions.md` **and** a pointer block in `.github/copilot-instructions.md` | `applyTo` (← globs, default `**`), `description` | condensed | single-file |
| `agents` | `AGENTS.md` (a `### <Title>` block) | none (plain Markdown) | condensed + summarized | broad, lossy |

## Whole vs block mode

- **whole** — the emitter owns the entire file (`.mdc`, `.instructions.md`, `.claude/.../SKILL.md`). Updates overwrite it as a unit.
- **block** — the emitter owns only a sentinel-delimited region inside a shared file (`AGENTS.md`, `copilot-instructions.md`). Updates replace just that region; everything else is preserved.

## Condensation

Single-file targets cannot carry Level-3 resources, so `core/condense.ts`:

1. flattens links to `reference.md`/`examples.md`/`checklist.md` to plain text,
2. appends a one-line pointer to the full Claude Code skill,
3. (for `agents`) summarizes the `## Open question` section to a single tradeoff line.

**External links are preserved.** Condensation only rewrites links to the skill's own Level-3 files; `https` links in the `## References` section (Apple Documentation, HIG, WWDC, Sample Code) flow through to every target unchanged.

## Activation semantics

- **Cursor** — a skill with `globs` becomes an *Auto-Attached* rule; without globs it is *Agent-Requested* (description-driven). A skills library never sets `alwaysApply: true`.
- **Copilot** — `applyTo` globs scope the per-skill instructions file; the root `copilot-instructions.md` only holds short pointers so it stays small.
- **AGENTS.md** — no per-skill activation; proximity/whole-file context only, so it suits a curated always-on core.

## Adding a target

1. Create `emitters/<tool>.ts` exporting an `Emitter`.
2. Add it to `EMITTERS` in `emitters/index.ts`.
3. Add a snapshot expectation in `test/emitters/emit.test.ts`.

No other code changes — detection, conflict handling, the lockfile, and `update`/`remove` are all generic over the interface.
