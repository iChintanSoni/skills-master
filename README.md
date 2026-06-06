# skills-master

**Tool-agnostic best-practice "skills" for mobile development — authored once, installed into any AI coding tool.**

Every AI coding tool has its own way of carrying project context — Claude Code has Agent Skills (`SKILL.md`), Cursor has `.cursor/rules/*.mdc`, GitHub Copilot has `.github/instructions/*.instructions.md`, and the cross-tool [`AGENTS.md`](https://agents.md) standard is read by many others. `skills-master` lets you author a skill **once** in a single canonical format and **compile** it into whatever a given tool expects, then install it into your project with one command.

Two domains ship today — **Apple** and **Android** platform development — distilled into original best-practice guidance (not copied from the vendors' docs):

- **Apple** — SwiftUI, SwiftData, Swift concurrency, the Human Interface Guidelines, build & ship pipelines.
- **Android** — Jetpack Compose, Material 3, Kotlin & coroutines, the full Jetpack stack, build & ship on Google Play.

## What's covered

**384 skills across two domains**, each with a curated `## References` section of verified, vendor-canonical links (Documentation / design guidelines / WWDC or Android Dev sessions / Sample Code). Every skill carries one of four classes:

| Class | What it produces |
|------|------------------|
| `code` | compilable code for frameworks & APIs |
| `design` | design-system critique (Apple HIG / Material 3) |
| `lang-tooling` | language, app architecture, testing, build/packaging, ship & CI |
| `overview` | decision routers ("which technology should I use?") |

### Apple — 183 skills

Current to the 2026 "26" OS cycle, Swift 6.x.

| Class | What it produces | Count |
|------|------------------|------:|
| `code` | SwiftUI, UIKit/AppKit, SwiftData, CloudKit, StoreKit, Core ML, MapKit, RealityKit/ARKit, AVFoundation, CryptoKit, WidgetKit, App Intents… | 71 |
| `design` | Human Interface Guidelines — foundations, components, patterns, inputs, per-platform, technologies | 62 |
| `lang-tooling` | Swift language, app architecture, testing, build/packaging, ship & CI | 37 |
| `overview` | decision routers | 13 |

### Android — 201 skills

Current to Android 16 / API 36, Kotlin 2.2, Jetpack Compose & Material 3.

| Class | What it produces | Count |
|------|------------------|------:|
| `code` | Jetpack Compose, Material 3, app architecture (ViewModel/Hilt/Navigation), Room/DataStore, CameraX, Media3/ExoPlayer, ML Kit/Gemini Nano, WorkManager, form factors (Wear/TV/Auto/XR/foldables)… | 88 |
| `design` | Material 3 — foundations, components, patterns, styles, per-platform, technologies | 62 |
| `lang-tooling` | Kotlin language, app architecture, testing, Gradle/build variants, ship & Play Console | 34 |
| `overview` | decision routers | 17 |

90 flagship skills also ship Level-3 `examples.md` / `checklist.md`, and code↔design counterparts are cross-linked (Apple: `hig-tab-bars` ↔ `swiftui-tab-views`; Android: `m3-navigation` ↔ `navigation-compose`) so `--with-pairs` installs both. See **[docs/taxonomy.md](docs/taxonomy.md)** for the full catalog.

## Quick start

```bash
# In your app project:
npx skills-master init                         # detect your tools, write skills-master.json
npx skills-master add swiftui-navigation        # install an Apple skill into every detected tool
npx skills-master add compose-state room        # …or Android skills (names are unique across domains)
npx skills-master add m3-navigation --target cursor,claude
npx skills-master list --domain android --class code   # browse one domain
npx skills-master update                         # pull newer skill versions
```

Claude Code users can alternatively install via the plugin marketplace. Each domain is split into four installable plugins (`code`, `design`, `lang-tooling`, `overviews`):

```
/plugin marketplace add github:<owner>/skills-master
/plugin install skills-master-apple-code@skills-master
/plugin install skills-master-android-code@skills-master
```

## How it works

```
                          ┌─────────────► .claude/skills/<name>/SKILL.md   (lossless)
  skills/<domain>/        │
  <class>/<category>/     ├─ compile ───► .cursor/rules/<name>.mdc
  <name>/                 │
    SKILL.md  ────────────┤─────────────► .github/instructions/<name>.instructions.md
    reference.md          │
    examples.md           │
    checklist.md          └─────────────► AGENTS.md   (managed block)
```

- **Canonical format** — Claude Agent Skills `SKILL.md` treated as a strict superset. A namespaced `x-skills-master:` frontmatter block carries our metadata and is stripped when compiling.
- **Emitters** — one per target tool, behind a common interface, so new tools plug in without touching the core.
- **Progressive disclosure** — a focused `SKILL.md` body plus optional on-demand `reference.md` / `examples.md` / `checklist.md`. Single-file targets get a condensed body.
- **Safe installs** — generated files are committed to your repo; shared files (`AGENTS.md`, `.github/copilot-instructions.md`) use `<!-- BEGIN/END skills-master:<name> -->` markers so updates touch only managed regions.

See [docs/architecture.md](docs/architecture.md) for the full design and [docs/authoring.md](docs/authoring.md) to write a skill.

## Repository layout

| Path | What |
|------|------|
| `packages/cli/` | the `skills-master` npm package (CLI + compiler + emitters) |
| `skills/` | the skill content library, organized `skills/<domain>/<class>/<category>/<name>/` (domains: `apple/`, `android/`) |
| `scripts/crawl/` | report-only crawler that flags new/stale platform topics |
| `docs/` | architecture, authoring, and emitter documentation |

## License

Tooling is MIT (see [LICENSE](LICENSE)). Skill content is original prose that **summarizes** the publicly documented best practices of Apple and Google/Android and **links** to the canonical vendor documentation; it does not reproduce their copyrighted text or sample code.
