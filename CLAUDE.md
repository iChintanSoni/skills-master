# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A **content library + compiler**. Skills are authored once in a canonical `SKILL.md` format under `skills/<domain>/<class>/<category>/<name>/`, and the TypeScript CLI in `packages/cli` projects ("emits") each skill into whatever format a given AI coding tool reads (Claude Code, Cursor, Copilot, `AGENTS.md`).

Two independent halves, and most tasks touch only one:

- **Content** (`skills/`) — 393 skills across the `apple` and `android` domains. Prose, not code.
- **CLI/compiler** (`packages/cli/`) — the `@ichintansoni/skills-master` npm package.

`docs/architecture.md`, `docs/authoring.md`, and `docs/emitters.md` are the design docs; keep them in sync when changing the pipeline. `docs/taxonomy.md` is the generated catalog.

The authored `skills/` format is a deliberate **superset** of the Agent Skills spec (`globs`, `tags`, `x-skills-master` are ours). The spec's own validator is expected to reject it and is enforced in CI on the *emitted* projections only — don't "fix" a skill to satisfy a validator pointed at the source tree.

## Commands

pnpm workspace, Node ≥ 22, pnpm via Corepack. Run these from the repo root.

```bash
corepack pnpm install

pnpm build          # tsup bundle → packages/cli/dist/bin.js
pnpm typecheck      # tsc --noEmit
pnpm test           # vitest run (unit + e2e)
pnpm test:coverage  # same, plus a v8 coverage report (reported in CI, never gated)

pnpm skills:lint       # validate the whole skill library — must be clean
pnpm skills:registry   # regenerate skills/registry.json (commit the result)
pnpm skills:marketplace # regenerate .claude-plugin/ + plugins/

pnpm cli <args>     # run the CLI from source via tsx (cwd is packages/cli)
```

Single test / watch mode (the `--filter` sets cwd to `packages/cli`, so test paths are relative to it):

```bash
pnpm --filter @ichintansoni/skills-master exec vitest run test/emitters/emit.test.ts
pnpm --filter @ichintansoni/skills-master exec vitest run -t "condense"
pnpm --filter @ichintansoni/skills-master test:watch
pnpm --filter @ichintansoni/skills-master exec vitest run -u   # update emitter snapshots
```

Because `pnpm cli` runs with cwd `packages/cli`, local content is addressed as `--content ../../skills`:

```bash
pnpm cli new apple/code/app-frameworks/swiftui-grids --content ../../skills
pnpm cli view swiftui-navigation --content ../../skills
node scripts/check-links.mjs skills            # report-only link checker (--strict to fail)
node scripts/check-links.mjs skills --json=scripts/crawl/reports/links.json
pnpm spec:validate                             # emitted projections vs the Agent Skills spec
                                               # (needs `pip install skills-ref==0.1.1`)
pnpm crawl                                     # report-only staleness/coverage crawl
pnpm crawl -- --fetch                          # …also snapshot upstream vendor topics
pnpm crawl:report                              # render the JSON reports as Markdown
```

The weekly crawl (`.github/workflows/crawl.yml`) runs the crawl plus the link check, renders
`scripts/crawl/report.mjs` into the **job summary**, and rewrites a single **`crawl-report`-labelled
issue** so the repo carries one live dashboard rather than a stack of weekly duplicates. The raw
JSON stays as a run artifact. The link check is deliberately **not** `--strict` there: vendor
hosts rate-limit under concurrency and return one-off 404s for live URLs, so a red weekly run
would just train everyone to ignore it. Re-check any reported dead link by hand before editing.

The report also tracks the **always-on listing footprint**: every installed skill puts one
`- <name>: <description>` line in the agent's system prompt, and Claude Code caps that listing at
`contextWindow × 4 × 0.01` (8 KB at 200k context). Past the cap it drops lower-priority entries to a
bare `- <name>` — description gone. Seven of eight plugins exceed that on their own today, so a
description's value depends on the listing fitting, not just on how it is written.

The CLI auto-resolves content in priority order: `--content` → `SKILLS_MASTER_CONTENT` → walk upward for this repo (`package.json` name `skills-master-monorepo` + a `skills/` dir) → remote fetch via `giget`. So inside this repo `--content` is usually optional; the root scripts pass it because their cwd is `packages/cli`.

## Compiler pipeline

`discover → parse → validate → compile (per emitter) → write`, in `packages/cli/src/core/`:

- `discover.ts` finds every `SKILL.md`; `parse.ts` splits frontmatter/body via gray-matter and reads Level-3 resources.
- `schema/frontmatter.ts` (zod) validates and normalizes; `core/lint.ts` layers content rules on top.
- `core/compile.ts` fans out to `emitters/`; `core/writer.ts` applies `EmittedFile[]` to disk.

Files land in one of two modes (`types.ts`):

- **whole** — emitter owns the entire file (`.claude/skills/<n>/SKILL.md`, `.cursor/rules/<n>.mdc`, `.github/instructions/<n>.instructions.md`).
- **block** — emitter owns only a sentinel region inside a shared file (`AGENTS.md`, `.github/copilot-instructions.md`), delimited by `<!-- BEGIN skills-master:<name> v<ver> -->` / `<!-- END … -->` (`core/markers.ts`). Everything outside the markers must survive an update — the e2e test asserts this.

Install state in a consuming project: `skills-master.json` (config) + `skills-master.lock.json` (per-skill `version`, `sourceHash`, per-target emitted files and a disk-computed `hash` used to detect local edits). `core/install.ts` computes both hashes; `doctor`/`update` reconcile against them.

### Adding an emitter

New file in `src/emitters/` exporting an `Emitter` (interface in `src/types.ts`), one line in `emitters/index.ts`, and a snapshot in `test/emitters/emit.test.ts`. Nothing else changes — detection, lockfile, `update`, and `remove` are generic over the interface.

**Emitter output must be deterministic** — stable key ordering, no timestamps, no absolute paths. Snapshot and e2e tests assert byte-identical repeat runs. The `x-skills-master` frontmatter block must be stripped from every projection (tested for all emitters). Single-file targets get the body run through `core/condense.ts`: links to `reference.md`/`examples.md`/`checklist.md` are flattened, a pointer note is appended, and external `https` links are preserved.

## Authoring skills

Read `docs/authoring.md` first. Hard rules the linter enforces (errors):

- Frontmatter `name` must equal the leaf folder name and be **globally unique** across all domains (`add` and the registry key on bare name). Shape is the Agent Skills spec rule: `[a-z0-9]` words joined by single hyphens, ≤ 64 chars — no leading/trailing hyphen, no `--` — and no `claude`/`anthropic` (Claude platform rule). Same rule for `pairs_with` entries.
- `pairs_with` is **bidirectional** — if A lists B, B must list A. Always edit both skills.
- `SKILL.md` body ≤ 500 lines (warns at 450); push depth into `reference.md` / `examples.md` / `checklist.md`.
- `stability: contested` requires an `## Open question` section, and such skills present tradeoffs rather than prescribing.
- `snapshot_date` must not be in the future.

Warnings worth honoring: a `reference.md`/`examples.md`/`checklist.md` over 100 lines should open with a `## Contents` block (agents preview long resources with a partial read); description should contain a "Use when …" clause; every skill should carry `license: MIT` (it ships as a standalone directory, so the repo `LICENSE` does not travel with it — the Claude projection passes the field through, never invents it); `sources` should carry ≥1 canonical https doc URL; canonical headings (`## When to use`, `## Core guidance`, `## Pitfalls`, `## References`, `## See also`) should all be present.

**YAML hazard:** an unquoted scalar containing ` #` is silently truncated as a comment (`#expect`, `#Preview` in descriptions are the classic trap). Quote the value or reword. The linter warns.

**Description hazard:** Claude's skill validation rejects XML tags in `name`/`description`, and a generic type reads as one (`VerificationResult<Transaction>`, `Flow<UiState>`). Reword ("a VerificationResult of Transaction") — escaping does not help, since the description is read, not rendered. The linter errors.

**Content policy:** original prose and original minimal code only. Summarize Apple's / Google's documented best practices and link to them via `sources` + the `## References` section; never paste vendor text or sample code. Bump `snapshot_date` (and a `version` patch) whenever you re-verify against changed docs.

`class` maps to a directory via `CLASS_DIR` — note `overview` → `overviews/` on disk.

## Generated files — never hand-edit

- `skills/registry.json` — regenerate with `pnpm skills:registry` and **commit it in the same change** as any skill edit. CI fails on drift (`registry build --check`).
- `docs/taxonomy.md` — regenerate with `node scripts/gen-taxonomy.mjs` after the registry. CI fails on drift (`gen-taxonomy.mjs --check`).
- `.claude-plugin/marketplace.json` and everything under `plugins/` — regenerated by `pnpm skills:marketplace` (one plugin per `(domain, class)`, e.g. `skills-master-apple-code`) and **committed in the same change** as any skill edit. CI fails on drift (`marketplace build --check`). The build prunes output it no longer owns, so a skill that moves class does not keep shipping from its old plugin. Release CI rebuilds and zips these as a release asset.

## CI and release

PRs run three jobs: CLI typecheck + tests; skills lint + registry/taxonomy/marketplace drift checks; and Agent Skills spec conformance (the spec's own reference validator over the committed projections — see `docs/emitters.md`). All must pass.

**Every push to `main` publishes.** `.github/workflows/release.yml` reruns CI, then computes the next version from the latest `v*` git tag plus the head commit message — `#major` > `#minor` > default patch — writes it into `packages/cli/package.json` on the runner only (git tags are the source of truth, nothing is committed back), publishes to npmjs **and** GitHub Packages, then tags and creates the release. Include `#minor`/`#major` in a merge commit message when the change warrants it.
