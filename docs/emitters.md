# Emitters

An emitter projects one canonical skill into the files a specific AI tool reads. All emitters implement the `Emitter` interface (`packages/cli/src/types.ts`) and are registered in `emitters/index.ts`. The `x-skills-master` block is stripped from every output.

| Emitter | Output(s) | Frontmatter emitted | Body | Fidelity |
|---------|-----------|---------------------|------|----------|
| `claude` | `.claude/skills/<name>/SKILL.md` + verbatim copies of `reference.md`/`examples.md`/`checklist.md` | `name`, `description`, `license` (when authored), `metadata` (version + snapshot date) | verbatim (Level-3 links resolve) | **lossless** |
| `cursor` | `.cursor/rules/<name>.mdc` | `description`, `globs` (if any), `alwaysApply: false` | condensed | single-file |
| `copilot` | `.github/instructions/<name>.instructions.md` **and** a pointer block in `.github/copilot-instructions.md` | `applyTo` (← globs; omitted when the skill has none, so glob-less guidance stays manual-attach instead of always-on), `description` | condensed | single-file |
| `agents` | `AGENTS.md` (a `### <Title>` block) | none (plain Markdown) | digest: description + top guidance/pitfall bullets | broad, lossy |
| `agents-skills` | `.agents/skills/<name>/SKILL.md` + verbatim resource copies | same as `claude` | verbatim | **lossless** |

## Two skills roots, because no agent reads both

`claude` and `agents-skills` emit the **same bytes** (`core/spec-skill.ts`) to two different roots. That is not redundancy — it is what the ecosystem currently requires:

| Agent | `.claude/skills` | `.agents/skills` |
|---|---|---|
| Claude Code | ✅ only this | ❌ — the 2.1.231 binary contains no reference to it |
| Codex CLI | ❌ | ✅ project → parent → repo root → user |
| Gemini CLI | ❌ | ✅ takes precedence over `.gemini/skills` |
| VS Code Copilot | ✅ | ✅ (also `.github/skills`) |

So a project that uses Claude Code *and* Codex genuinely needs both roots, and a test asserts the two projections stay byte-identical.

**VS Code Copilot is the one consumer that reads both**, and it will list every skill twice when both targets are enabled — which is worse than it sounds, because the always-on listing is budgeted (see above) and duplication spends that budget twice. Two consequences, both deliberate:

- **`agents-skills` is not in `DEFAULT_TARGETS`.** When `init`/`add` detect nothing, they emit the original four. Writing a second full copy of every skill is not something to do on a guess.
- **Detection is narrow**: `.agents/` (the standard root) or `.gemini/` (a tool that reads it). `AGENTS.md` is deliberately *not* evidence, even though it is the clearest sign of a Codex project — it is what the `agents` target already claims, and detecting both would hand Codex the same content twice, once as a digest and once as a full skill.

`--target all` still means all five: that is an explicit request, not a guess.

**The AGENTS.md digest is left alone** when both are enabled. Making one emitter's output depend on another's being enabled would break the property that each target owns its files independently — the thing that makes the lockfile, `sync`, and `remove` generic. A consumer who now gets full skills in `.agents/skills/` and doesn't want the digest too can simply not enable `agents`.

## Whole vs block mode

- **whole** — the emitter owns the entire file (`.mdc`, `.instructions.md`, `.claude/.../SKILL.md`). Updates overwrite it as a unit.
- **block** — the emitter owns only a sentinel-delimited region inside a shared file (`AGENTS.md`, `copilot-instructions.md`). Updates replace just that region; everything else is preserved.

## Condensation

Single-file targets cannot carry Level-3 resources, so `core/condense.ts`:

1. flattens links to `reference.md`/`examples.md`/`checklist.md` to plain text,
2. appends a one-line pointer to the full Claude Code skill.

`agents` goes further: `digestBody` keeps only the description, the leading six Core guidance bullets and three Pitfalls bullets, because consumers inject `AGENTS.md` in full on every request.

Everything else passes through as authored — including `## Open question`, so a contested skill never reads as settled in a condensed target. (An `openQuestion: "summarize"` mode predated the digest and was never used by an emitter; it was deleted in 0.4.)

**External links are preserved.** Condensation only rewrites links to the skill's own Level-3 files; `https` links in the `## References` section (Apple Documentation, HIG, WWDC, Sample Code) flow through to every target unchanged.

## Stability banner

`stability` lives in `x-skills-master`, which every emitter strips — so a skill that is `emerging` or `contested` would otherwise read as settled fact in every projection. `core/stability-note.ts` turns the label into a one-line blockquote at the top of the emitted body, and all four emitters carry it. `stable` skills get nothing, so most output is unchanged.

This matters most for **AGENTS.md**: its digest drops `## Open question` along with every other section, so before this the banner was the only way a contested skill could be recognized there. The banner's only variable is the authored `snapshot_date`, so output stays byte-reproducible.

## Activation semantics

- **Cursor** — a skill with `globs` becomes an *Auto-Attached* rule; without globs it is *Agent-Requested* (description-driven). A skills library never sets `alwaysApply: true`.
- **Copilot** — `applyTo` globs scope the per-skill instructions file; the root `copilot-instructions.md` only holds short pointers so it stays small.
- **AGENTS.md** — no per-skill activation; proximity/whole-file context only, so it suits a curated always-on core.

## Spec conformance

The `claude` projection tracks the [Agent Skills specification](https://agentskills.io/specification): a directory named for the skill, a `SKILL.md` whose frontmatter carries only spec-defined fields (`name`, `description`, plus the optional `license` / `metadata` / `compatibility` / `allowed-tools`), and relative one-level links to co-located resource files. Snapshot tests pin what *we* expect the emitters to write; they cannot notice the spec moving out from under us.

So CI runs the spec's own reference implementation over the committed output:

```bash
pip install skills-ref==0.1.1
pnpm spec:validate            # → scripts/spec-validate.py plugins + .claude/skills
```

Notes for whoever touches this next:

- **Emitted output only.** Canonical `skills/` carries `globs`, `tags`, and `x-skills-master` as top-level keys, which the validator rejects as unexpected fields — by design, and the reason the compile step exists. Pointing this script at `skills/` is expected to fail.
- **The validator is pinned.** Unpinned, an upstream edit becomes a red build on an unrelated PR. Bumping the pin is a deliberate, reviewed change.
- **Imported, not shelled out to.** `skills-ref` 0.1.1 renamed its console script to `agentskills`; the Python API is the part that did not move.
- Anything an emitter adds to frontmatter must be a spec field or this gate fails — which is the point.

Beyond `name`/`description`, the Claude projection carries two spec fields:

- **`license`** — **passed through from authored frontmatter, never invented**. The CLI can be pointed at any content root (`--content`, `SKILLS_MASTER_REPO`), and an emitter that stamped a constant would assert terms for content it did not author. A skill with no `license` emits no `license` line.
- **`metadata`** — the spec's string→string map, carrying `version` and `snapshot-date` from `x-skills-master`. Without it a consumer cannot tell which release of a skill they installed or when it was last checked against the vendor docs: `x-skills-master` is stripped, and a plugin install has no lockfile to recover it from. Both values are **double-quoted deliberately** — js-yaml (so gray-matter) reads a bare `2026-08-25` as a `Date`, which would break the string→string contract depending on which parser a consumer uses. `core/yaml.ts`'s `quoted()` forces the scalar style.

The tool-specific targets (`.mdc`, `.instructions.md`, `AGENTS.md`) carry neither — their frontmatter vocabularies are Cursor's and Copilot's, not the spec's.

### What the preload actually costs

Frontmatter beyond `name`/`description` costs **no** always-on context. Verified against Claude Code 2.1.231's loader, which formats each listed skill as exactly `- <name>: <description>` and reads nothing else from the file until the skill is invoked.

The same code path holds a warning for this library: that listing is **budgeted**, at `contextWindow × 4 bytes/token × skillListingBudgetFraction` (default `0.01`) — about **8,000 characters** on a 200k-token model. Over budget, Claude Code keeps the highest-priority entries whole and degrades the rest to a bare `- <name>`, description dropped. Today `skills-master-android-code` alone is ~41k characters of listing, so a full-domain install is well past the point where descriptions stop reaching the model. This is gap **G8** in PLAN.md, and it is why item 2.3 measures the footprint rather than trusting per-skill advice.

## Adding a target

1. Create `emitters/<tool>.ts` exporting an `Emitter`.
2. Add it to `EMITTERS` in `emitters/index.ts`.
3. Add a snapshot expectation in `test/emitters/emit.test.ts`.

No other code changes — detection, conflict handling, the lockfile, and `update`/`remove` are all generic over the interface.

## Auto-detection

Each emitter's `detect(root)` claims a project only on evidence that its tool is actually in use: `.claude/` (Claude Code), `.cursor/` (Cursor), `.github/copilot-instructions.md` or `.github/instructions/` (Copilot — a bare `.github/` full of workflows proves nothing), an existing `AGENTS.md` (the standard is opt-in by the file's presence), and `.agents/` or `.gemini/` (the cross-agent skills root). When nothing is detected, `init`/`add` fall back to `DEFAULT_TARGETS` — the four original targets, not all five, for the duplication reason above.
