# Emitters

An emitter projects one canonical skill into the files a specific AI tool reads. All emitters implement the `Emitter` interface (`packages/cli/src/types.ts`) and are registered in `emitters/index.ts`. The `x-skills-master` block is stripped from every output.

| Emitter | Output(s) | Frontmatter emitted | Body | Fidelity |
|---------|-----------|---------------------|------|----------|
| `claude` | `.claude/skills/<name>/SKILL.md` + verbatim copies of `reference.md`/`examples.md`/`checklist.md` | `name`, `description` | verbatim (Level-3 links resolve) | **lossless** |
| `cursor` | `.cursor/rules/<name>.mdc` | `description`, `globs` (if any), `alwaysApply: false` | condensed | single-file |
| `copilot` | `.github/instructions/<name>.instructions.md` **and** a pointer block in `.github/copilot-instructions.md` | `applyTo` (← globs; omitted when the skill has none, so glob-less guidance stays manual-attach instead of always-on), `description` | condensed | single-file |
| `agents` | `AGENTS.md` (a `### <Title>` block) | none (plain Markdown) | digest: description + top guidance/pitfall bullets | broad, lossy |

## Whole vs block mode

- **whole** — the emitter owns the entire file (`.mdc`, `.instructions.md`, `.claude/.../SKILL.md`). Updates overwrite it as a unit.
- **block** — the emitter owns only a sentinel-delimited region inside a shared file (`AGENTS.md`, `copilot-instructions.md`). Updates replace just that region; everything else is preserved.

## Condensation

Single-file targets cannot carry Level-3 resources, so `core/condense.ts`:

1. flattens links to `reference.md`/`examples.md`/`checklist.md` to plain text,
2. appends a one-line pointer to the full Claude Code skill.

`agents` goes further: `digestBody` keeps only the description, the leading six Core guidance bullets and three Pitfalls bullets, because consumers inject `AGENTS.md` in full on every request. (`CondenseOptions.openQuestion: "summarize"` predates that digest and no emitter passes it today.)

**External links are preserved.** Condensation only rewrites links to the skill's own Level-3 files; `https` links in the `## References` section (Apple Documentation, HIG, WWDC, Sample Code) flow through to every target unchanged.

## Stability banner

`stability` lives in `x-skills-master`, which every emitter strips — so a skill that is `emerging` or `contested` would otherwise read as settled fact in every projection. `core/stability-note.ts` turns the label into a one-line blockquote at the top of the emitted body, and all four emitters carry it. `stable` skills get nothing, so most output is unchanged.

This matters most for **AGENTS.md**: its digest drops `## Open question` along with every other section, so before this the banner was the only way a contested skill could be recognized there. The banner's only variable is the authored `snapshot_date`, so output stays byte-reproducible.

## Activation semantics

- **Cursor** — a skill with `globs` becomes an *Auto-Attached* rule; without globs it is *Agent-Requested* (description-driven). A skills library never sets `alwaysApply: true`.
- **Copilot** — `applyTo` globs scope the per-skill instructions file; the root `copilot-instructions.md` only holds short pointers so it stays small.
- **AGENTS.md** — no per-skill activation; proximity/whole-file context only, so it suits a curated always-on core.

## Adding a target

1. Create `emitters/<tool>.ts` exporting an `Emitter`.
2. Add it to `EMITTERS` in `emitters/index.ts`.
3. Add a snapshot expectation in `test/emitters/emit.test.ts`.

No other code changes — detection, conflict handling, the lockfile, and `update`/`remove` are all generic over the interface.

## Auto-detection

Each emitter's `detect(root)` claims a project only on evidence that its tool is actually in use: `.claude/` (Claude Code), `.cursor/` (Cursor), `.github/copilot-instructions.md` or `.github/instructions/` (Copilot — a bare `.github/` full of workflows proves nothing), and an existing `AGENTS.md` (the standard is opt-in by the file's presence). When nothing is detected, `init`/`add` fall back to all targets, so a fresh project still gets everything.
