# Contributing

Thanks for helping build `skills-master`. There are two kinds of contributions: **skills** (content) and **CLI/compiler** (code).

## Setup

```bash
corepack pnpm install          # or: pnpm install
pnpm --filter @ichintansoni/skills-master test
```

Node ≥ 20 and pnpm (via Corepack) are required.

## Contributing a skill

Read [docs/authoring.md](docs/authoring.md) first. In short:

```bash
pnpm cli new apple/code/app-frameworks/<name> --content ../../skills   # scaffold
# … write original prose + minimal original code …
pnpm skills:lint                                                  # must be clean
pnpm skills:registry                                             # regenerate registry.json
```

- **Original prose and code only.** Summarize the platform vendor's documented best practices and link to them; never paste vendor text or sample code.
- Cite `sources` and set `snapshot_date` to the day you verified.
- Contested topics present tradeoffs (`stability: contested` + `## Open question`); they never prescribe.
- `pairs_with` is bidirectional — update both skills.
- Commit the regenerated `skills/registry.json` (and `docs/taxonomy.md`, via `node scripts/gen-taxonomy.mjs`) with your skill.

## Contributing to the CLI

```bash
pnpm --filter @ichintansoni/skills-master typecheck
pnpm --filter @ichintansoni/skills-master test
```

- Add an emitter under `packages/cli/src/emitters/` and register it in `emitters/index.ts`; cover it with a snapshot in `test/emitters/`.
- Keep emitter output **deterministic** (stable key order, no timestamps) — the snapshot and e2e tests assert it.
- The lifecycle test (`test/e2e/lifecycle.test.ts`) covers add/update/remove and sentinel-block safety; keep it green.

## CI gates

Every PR runs: typecheck, unit + e2e tests, `skills-master lint` over `skills/`, and a `registry.json` drift check. All must pass.

## Scope

Two domains ship today: `apple` and `android`. The architecture is domain-agnostic — `web` and others can follow. New domains go under `skills/<domain>/` and reuse the same classes (`code`, `design`, `lang-tooling`, `overview`).
