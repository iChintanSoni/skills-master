# Authoring a skill

A skill encodes **best-practice judgment** for a topic — not a copy of the docs. Quality and currency matter more than coverage.

## Scaffold

```bash
pnpm cli new apple/code/app-frameworks/swiftui-grids --content skills
```

This creates `skills/apple/code/app-frameworks/swiftui-grids/SKILL.md` from a template (today's date, `version: 0.1.0`, `stability: emerging`). The spec is `domain/class/category/name`.

## Frontmatter

```yaml
---
name: swiftui-navigation            # kebab-case, == folder name
description: >-                      # third person, <=1024 chars, includes "Use when …"
  Implements modern SwiftUI navigation … Use when building stacks, split views, or deep links.
globs:                              # optional; include only for file-scoped code skills
  - "**/*.swift"
tags: [swiftui, navigation]
x-skills-master:
  domain: apple                     # ecosystem: apple | android | web | …
  class: code                       # code | design | lang-tooling | overview
  category: app-frameworks
  platforms: [ios, ipados, macos]   # free-form per domain (>= 1)
  requires:                         # optional, domain-defined version map
    ios: "17"
    swift: "6.0"
  pairs_with: [hig-navigation]      # bidirectional — the partner must list this skill too
  sources:                          # 1-3 https://developer.apple.com citation URLs
    - https://developer.apple.com/documentation/swiftui/navigationstack
  snapshot_date: "2026-05-30"       # the date you verified against the sources
  stability: stable                 # stable | emerging | contested
  version: 1.0.0                    # per-skill semver
---
```

## Body sections

In this order: `## When to use` · `## Core guidance` · `## Platform notes` · `## Pitfalls` · `## Open question` (only if `stability: contested`) · `## See also`.

- Keep the body under ~500 lines (the linter errors above that). Push depth into Level-3 files.
- `## Core guidance` is the heart: tight do/don't bullets and idioms.
- One short, original code snippet is fine; longer examples belong in `examples.md`.

## Rules

1. **Original prose only.** Summarize and synthesize; never paste Apple documentation or sample code. Cite via `sources` and link, don't quote.
2. **Original, minimal code.** Write snippets from first principles to show an idiom. Use Apple samples only to verify currency.
3. **Cite + snapshot.** Every skill carries `sources` and a `snapshot_date`. Bump `snapshot_date` (and a `version` patch) whenever you re-verify against changed docs.
4. **Contested topics present tradeoffs.** For genuinely debated choices (MV vs MVVM, SwiftUI vs UIKit), set `stability: contested`, add a `## Open question` section, and do **not** prescribe a single answer. Route the decision through an `overviews/` skill.
5. **Pairing is bidirectional.** If A lists B in `pairs_with`, B must list A. The linter enforces this. Pairs link a `design` skill to its `code` counterpart.
6. **L2/L3 split.** When the body grows past ~500 lines, move reference tables → `reference.md`, long examples → `examples.md`, step lists → `checklist.md`, and link them from the body.

## YAML hazard: `#` in scalars

An unquoted YAML scalar treats ` #` (space then hash) as a **comment** and silently truncates the value. Descriptions mentioning macros (`#expect`, `#Preview`) are a common trap. Either avoid `#` (write "the expect macro") or quote the whole value. The linter warns when it detects this, but prefer to avoid it.

## Verify before committing

```bash
pnpm skills:lint        # name/description/required fields, pairs_with integrity, body cap, headings
pnpm skills:registry    # regenerate registry.json
```

CI runs both; `registry.json` must be regenerated and committed when skills change.
