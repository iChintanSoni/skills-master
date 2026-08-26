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
npx @ichintansoni/skills-master status                        # what's installed, and has it drifted?
npx @ichintansoni/skills-master doctor                        # same detection, but fails on drift
```

`status` and `doctor` share their drift detection but answer different questions. `status` is an inventory — it lists every installed skill with its version, targets, and whether the output has been edited or deleted, works entirely offline, and always exits 0, so it is safe to pipe (`status --json`, `status --problems`, `status <name>…`). `doctor` is the gate: same findings, but it exits non-zero, which is what you want in CI.

`add` writes, per detected tool:

| Tool | Output |
|------|--------|
| Claude Code | `.claude/skills/<name>/SKILL.md` (+ on-demand `examples.md` / `checklist.md`) |
| Cursor | `.cursor/rules/<name>.mdc` (auto-attached on matching files) |
| GitHub Copilot | `.github/instructions/<name>.instructions.md` |
| AGENTS.md | a sentinel-marked block (your hand-written content is preserved) |

Flags: `--target claude,cursor,copilot,agents|all` · `--with-pairs` (also install the paired code↔design skill) · `--dry-run` · `--overwrite` · `--content <dir>` (use a local skills checkout) · `--ref <git-ref>`.

Claude Code users can alternatively install via the plugin marketplace:

```
/plugin marketplace add github:iChintanSoni/skills-master
/plugin install skills-master-apple-code@skills-master
```

## How it works

Content lives in the [skills-master repo](https://github.com/iChintanSoni/skills-master) and is fetched on demand; the CLI compiles each skill into your tools' formats and records what it installed in `skills-master.json` + a lockfile so `update`/`remove` stay surgical. Generated files are committed to your repo by default, so teammates' IDEs pick them up without running anything.

MIT licensed. Skill content is original prose that summarizes Apple's publicly documented best practices and links to the canonical docs — it does not reproduce Apple's copyrighted text or sample code.
