# skills-master

**Install tool-agnostic, best-practice mobile development "skills" into any AI coding tool** — Claude Code, Cursor, GitHub Copilot, and the cross-tool [`AGENTS.md`](https://agents.md) standard — with one command.

Each skill is authored once and compiled into whatever format a given tool expects, so the same guidance reaches whatever you use. The library covers **433 skills** across two domains — **Apple** (208: SwiftUI, SwiftData, Swift concurrency, the Human Interface Guidelines, build & ship pipelines…) and **Android** (225: Jetpack Compose, Material 3, Kotlin coroutines, Gradle, Play delivery…) — current to the 2026 OS cycle, each with curated documentation, design-guideline, and conference-session links.

## Usage

```bash
# In your project — auto-detects which tools you use and writes the right files:
npx @ichintansoni/skills-master init
npx @ichintansoni/skills-master add swiftui-navigation swiftdata-modeling --with-pairs
npx @ichintansoni/skills-master list --class code            # browse the catalog
npx @ichintansoni/skills-master search navigation
npx @ichintansoni/skills-master update                        # pull newer skill versions
npx @ichintansoni/skills-master remove swiftui-sheets
npx @ichintansoni/skills-master sync                          # re-emit to match the current config
npx @ichintansoni/skills-master status                        # what's installed, and has it drifted?
npx @ichintansoni/skills-master doctor                        # same detection, but fails on drift
```

`update` pulls newer skill content, but only ever re-emits to the targets a skill was *already* installed to. So adding a target to `skills-master.json` after the fact, or changing a `paths` override, leaves config and disk disagreeing with nothing to reconcile them. `sync` is that reconciliation — it treats the configured target set as the source of truth and makes disk match. Local edits are preserved unless you pass `--overwrite`. A target you *dropped* from config is reported but only deleted with `--prune`; a `paths` change is a move, so the old copy is cleaned up straight away rather than left for agents to load twice.

`status` and `doctor` share their drift detection but answer different questions. `status` is an inventory — it lists every installed skill with its version, targets, and whether the output has been edited or deleted, works entirely offline, and always exits 0, so it is safe to pipe (`status --json`, `status --problems`, `status <name>…`). `doctor` is the gate: same findings, but it exits non-zero, which is what you want in CI.

Both answer "is what I installed intact?" — neither answers "is what I installed **current?**", because both compare emitted files against the lockfile and never the lockfile against the source. An install pinned to a release from six months ago is perfectly healthy by that measure. `update --check` is the second gate: it resolves the content, reports which skills are behind, and exits non-zero. It catches the case a version comparison misses — a skill edited upstream *without* a version bump, which is what resource-file and description changes usually are.

`add` writes, per detected tool:

| Tool | Output |
|------|--------|
| Claude Code | `.claude/skills/<name>/SKILL.md` (+ on-demand `examples.md` / `checklist.md`) |
| Cursor | `.cursor/rules/<name>.mdc` (auto-attached on matching files) |
| GitHub Copilot | `.github/instructions/<name>.instructions.md` |
| AGENTS.md | a sentinel-marked block (your hand-written content is preserved) |

Flags: `--target claude,cursor,copilot,agents,agents-skills|all` · `--with-pairs` (also install the paired code↔design skill) · `--dry-run` · `--overwrite` · `--content <dir>` (use a local skills checkout) · `--ref <git-ref>`. An explicit `--target` or `--ref` is remembered in `skills-master.json`, and `--target` widens the configured set rather than replacing it.

Claude Code users can alternatively install via the plugin marketplace:

```
/plugin marketplace add github:iChintanSoni/skills-master
/plugin install skills-master-apple-code@skills-master
```

## Commands

Run `skills-master <command> --help` for the full flag list on any of these.

### Browsing the catalog

| Command | What it does |
|---|---|
| `list` | List available skills. `--domain` · `--class` · `--category` · `--platform` · `--json` |
| `search <query>` | Match a query against names, descriptions, facets, and tags. Spacing, hyphens and case are ignored, so `wear os`, `wear-os` and `WearOS` all find the same skills. `--json` |
| `view <name>` | Show a skill's metadata and body. `--raw` prints the body alone; `--json` returns metadata *and* body in one document |

### Working in a project

| Command | What it does |
|---|---|
| `init` | Detect which tools the project uses and write `skills-master.json`. `--target` · `--commit` · `--ref` · `--force` |
| `add <names…>` | Install skills by name, category, or class |
| `update [names…]` | Re-install skills whose **content** changed upstream. Only touches targets a skill is already installed to. `--check` reports what is behind and exits non-zero |
| `sync [names…]` | Re-emit to match the **current config** — new targets, moved `paths`, deleted files. `--overwrite` · `--prune` · `--dry-run` |
| `remove <names…>` | Remove installed skills. `--target` removes from one tool only |
| `status [names…]` | Inventory: versions, targets, and local-edit state. Offline, always exits 0. `--problems` · `--json` |
| `doctor` | The same detection as `status`, but **exits non-zero** on drift — the CI gate. `--json` |

`update` vs `sync` is the distinction worth knowing: `update` follows *content*, `sync` follows *config*.

### Maintaining the library

These operate on a skills checkout rather than a consuming project.

| Command | What it does |
|---|---|
| `lint` | Validate the library: naming, reciprocal `pairs_with`, body caps, tag and source rules |
| `new <domain/class/category/name>` | Scaffold a skill from the canonical template. `--force` |
| `registry build` | Regenerate `registry.json`. `--check` fails on drift instead of rewriting |
| `marketplace build` | Regenerate the Claude plugin marketplace. `--check` fails on drift |

## How it works

Content lives in the [skills-master repo](https://github.com/iChintanSoni/skills-master) and is fetched on demand; the CLI compiles each skill into your tools' formats and records what it installed in `skills-master.json` + a lockfile so `update`/`remove` stay surgical. Generated files are committed to your repo by default, so teammates' IDEs pick them up without running anything.

MIT licensed. Skill content is original prose that summarizes Apple's and Google's publicly documented best practices and links to the canonical docs — it does not reproduce either vendor's copyrighted text or sample code.
