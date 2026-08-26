# Authoring a skill

A skill encodes **best-practice judgment** for a topic — not a copy of the docs. Quality and currency matter more than coverage.

## Scaffold

```bash
pnpm cli new apple/code/app-frameworks/swiftui-grids --content ../../skills
```

This creates `skills/apple/code/app-frameworks/swiftui-grids/SKILL.md` from a template (today's date, `version: 0.1.0`, `stability: emerging`). The spec is `domain/class/category/name`.

## Frontmatter

```yaml
---
name: swiftui-navigation            # kebab-case, == folder name; see "Naming"
description: >-                      # third person, <=1024 chars, includes "Use when …"
  Implements modern SwiftUI navigation … Use when building stacks, split views, or deep links.
license: MIT                        # every skill in this library; see "Why the license is per skill"
globs:                              # optional; include only for file-scoped code skills
  - "**/*.swift"
tags: []                            # usually empty; see "What `tags` are for"
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

### Why the license is per skill

A skill installs as a **standalone directory** — a plugin's `skills/<name>/`, a zip uploaded to claude.ai, a folder copied into someone's `.claude/skills/`. The repository `LICENSE` sits next to the source tree and is not part of what ships, so the terms have to travel inside the skill. `license` is a spec field, and the Claude projection carries it verbatim.

Every skill in this library is `MIT`. The linter warns when one is missing, and `pnpm cli new` scaffolds it — but the *value* is yours to state, not the compiler's: the CLI can be pointed at any content root (`--content`, `SKILLS_MASTER_REPO`), and an emitter that stamped a license would be asserting terms for content it did not author. A skill contributed under different terms simply says so.

### Naming

`name` follows the [Agent Skills specification](https://agentskills.io/specification) exactly, because it is emitted verbatim into every projection: lowercase `[a-z0-9]` words joined by **single** hyphens, at most 64 characters. No leading or trailing hyphen, no `--` run, no underscores or capitals. Claude's platform additionally rejects names containing `claude` or `anthropic`, so those are errors here too. The same rule applies to `pairs_with` entries, and `pnpm cli new` refuses a bad name before it scaffolds a folder you would have to move.

## Body sections

In this order: `## When to use` · `## Core guidance` · `## Platform notes` · `## Pitfalls` · `## Open question` (only if `stability: contested`) · `## References` · `## See also`.

- Keep the body under ~500 lines (the linter errors above that). Push depth into Level-3 files.
- `## Core guidance` is the heart: tight do/don't bullets and idioms.
- One short, original code snippet is fine; longer examples belong in `examples.md`.

### `## References` — curated helpful links

Every skill ends with a `## References` section of current, authoritative links so a reader can go deeper. Group them and keep them tight:

```markdown
## References

- **Documentation:** [SwiftData](https://developer.apple.com/documentation/swiftdata)
- **Human Interface Guidelines:** [Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)
- **WWDC:** [Meet SwiftData (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10187/)
- **Sample Code:** [Adopting SwiftData…](https://developer.apple.com/documentation/swiftdata/adopting-swiftdata-for-a-core-data-app)
```

The primary Documentation/HIG URLs should also appear in the `sources` frontmatter (the machine-readable citation list). External `https` links survive compilation to every tool — only links to the Level-3 resource files are condensed away.

## Rules

1. **Original prose only.** Summarize and synthesize; never paste Apple documentation or sample code. Cite via `sources` and link, don't quote.
2. **Original, minimal code.** Write snippets from first principles to show an idiom. Use Apple samples only to verify currency.
3. **Cite + snapshot.** Every skill carries `sources` and a `snapshot_date`. Bump `snapshot_date` (and a `version` patch) whenever you re-verify against changed docs.
4. **Contested topics present tradeoffs.** For genuinely debated choices (MV vs MVVM, SwiftUI vs UIKit), set `stability: contested`, add a `## Open question` section, and do **not** prescribe a single answer. Route the decision through an `overviews/` skill.
5. **Pairing is bidirectional.** If A lists B in `pairs_with`, B must list A. The linter enforces this. See [What earns a pair](#what-earns-a-pair) for what belongs in the list.
6. **L2/L3 split.** When the body grows past ~500 lines, move long examples → `examples.md`, step lists → `checklist.md`, and deep reference tables → `reference.md` (a defined slot no skill currently uses — prefer the first two unless a true lookup table outgrows them), and link them from the body. Every resource file you ship **must** be linked from the body (the linter warns otherwise) — the compiler keys on those links, so an unlinked resource is dropped from every emit target.

## What `tags` are for

`tags` feed exactly one thing: `skills-master search`, which matches a query against the
skill's name, description, domain, category, class **and** tags. Nothing else reads them —
they reach no emit target, and `domain`/`class`/`category`/`platforms` already carry the
faceting. So a tag has one job: **add a search term the skill is not already findable by.**

Search compares on letters and digits alone, so spelling is not a reason for a tag.
"wear os", "wear-os" and "WearOS" all already find prose that says "Wear OS", and "ios17"
finds "iOS 17". What a tag can add is a *word the skill never says*:

```yaml
# cryptokit — description covers hashing, HMAC, AES-GCM, Secure Enclave
tags: [security, keychain, signing]   # none of these words appear in the prose
```

A tag echoing the name or description is dead weight — it cannot change a single search
result. The linter warns on those. Most skills need **none**: 186 of 433 carry no tags,
because a good "Use when …" description already contains every word you would search for.
Reach for a tag only when you can name the query it rescues — `i18n` for localization,
`nlp` for the Natural Language framework, `monetization` for StoreKit.

## What `platforms` means

`platforms` is the facet behind `skills-master catalog --platform <p>`, so it answers one
question: **for which platforms does this skill carry guidance you would act on?** It is not
an availability matrix — "this API also compiles on tvOS" is not guidance, and listing every
platform a framework happens to ship on makes the filter useless.

- **List a platform** when the skill says something specific about it: a `## Platform notes`
  bullet, a behavioral difference, a capability that is missing there. `swiftui-concurrency`
  lists `watchos` because `refreshable` is unavailable on most watch layouts — that changes
  what you write.
- **Do not list a platform** just because the code runs there. Availability belongs in
  `requires` and in prose.
- **A domain-wide skill with nothing platform-specific to say** uses the domain as its only
  value: `platforms: [apple]`. `swift-concurrency` is identical on all six Apple platforms,
  so that is the honest entry — and `catalog --platform apple` is how you find that set.
- **A subset is already a statement.** `[ios, ipados]` says "not on Mac, watch, or TV", which
  is worth knowing; leave such lists alone rather than collapsing them to the baseline.

The two domains use different vocabularies on purpose, the same way their categories do (see
`docs/architecture.md`, "Categories mirror the vendor, not each other"). Apple has six
co-equal OSes, so it enumerates them and falls back to `apple`. Android has one dominant OS
plus form factors, so `android` is the handset baseline and `large-screen`, `wear-os`,
`android-tv`, `android-auto`, `automotive-os`, `chromeos`, `xr`, and `glasses` mark the
form-factor-specific guidance.

## What `stability` means

`stability` describes **the subject, not the skill**. It answers: can a reader act on this
guidance as settled, or should they expect it to move?

- **`stable`** — the API has been through at least one full OS cycle and the vendor is not
  reshaping it. A stable skill may still *mention* current-cycle additions; keeping up with
  the platform is currency, not instability. `uikit-core` cites iOS 27 changes and is stable.
- **`emerging`** — any one of: the primary API is pre-1.0 (alpha, beta, developer preview) at
  `snapshot_date`; the framework shipped in the current cycle and has not been revised once;
  or the vendor is visibly still moving it (renames, a successor already announced). Guidance
  is current but provisional — say so in the body. `xr-scenecore` is emerging because
  SceneCore is at `1.0.0-beta02` and `AnchorEntity` was just renamed.
- **`contested`** — practitioners genuinely disagree and the vendor does not prescribe.
  Requires `## Open question`, and the skill must lay out both cases without picking a
  winner (the linter enforces the section; the no-prescription part is on you).

The distinction that matters most: a skill that **prescribes a default with a clear rule is
not contested**, however much people argue about it online. `choosing-http-client` names
Retrofit + OkHttp as the default and gives one axis (KMP or not) for departing from it — so
it is `stable`, not `contested`.

Unlike the other facets, **`stability` changes what an agent reads.** The field itself is
stripped with the rest of `x-skills-master`, so the compiler turns a non-`stable` label into a
one-line banner at the top of the emitted body, in every projection:

```markdown
> **Emerging** — this covers an API that was pre-1.0, newly shipped, or still moving as of
> 2026-08-25. Treat the specifics as provisional and confirm against current documentation
> before relying on them.
```

`stable` skills get nothing. So setting `emerging` or `contested` is a content decision, not
bookkeeping — it puts a caveat in front of every reader. Say the same thing in the body prose
too where it helps, but you no longer have to for the signal to survive.

## What earns a pair

`pairs_with` is not a "related reading" list — it drives `skills-master add --with-pairs`,
which installs a skill's partners alongside it. So the bar is: **someone who loaded A for a
task will almost certainly need B for that same task.** Three shapes clear it:

- **Design ↔ code twin.** The HIG or Material skill for a component and the skill that
  implements it — `hig-sheets` ↔ `swiftui-sheets`, `hig-motion` ↔ `swiftui-animations-transitions`.
- **Overview ↔ the implementations it routes to.** A `choosing-*` / `adopting-*` router pairs
  with the two to four skills that are its actual destinations, not with everything it mentions.
- **Tight couples.** Two skills that are half-answers apart — `cryptokit` ↔ `keychain-security`,
  `swiftdata-modeling` ↔ `swiftdata-queries-migration`, `uikit-core` ↔ `uikit-swiftui-interop`.

Keep the list to roughly **1–4 partners**; the linter warns past four. Hub skills
(`swiftui-sheets`, `choosing-testing-strategy`) sit at the top of that range because several
design skills legitimately point at them — that is the ceiling, not the target. A skill with no
genuine partner keeps `pairs_with: []`; padding it costs the facet its meaning.

Broader "you might also want to read" cross-references belong in `## See also`, which has no
cap and no reciprocity requirement.

Editing pairs is metadata-only: `x-skills-master` is stripped from every projection, so the
emitted output is byte-identical and neither `version` nor `snapshot_date` should move.

## YAML hazard: `#` in scalars

An unquoted YAML scalar treats ` #` (space then hash) as a **comment** and silently truncates the value. Descriptions mentioning macros (`#expect`, `#Preview`) are a common trap. Either avoid `#` (write "the expect macro") or quote the whole value. The linter warns when it detects this, but prefer to avoid it.

## Description hazard: XML-tag-shaped text

Claude's skill validation rejects a `name` or `description` containing XML tags, and a generic type written the natural way is indistinguishable from markup: `VerificationResult<Transaction>`, `Result<T, E>`, `Flow<UiState>`. A projection carrying one can be refused on upload to claude.ai or the Skills API — a broken projection, so this is a lint **error**.

Reword rather than escape — the description is read by a model, not rendered. Write "a VerificationResult of Transaction", "the Result type", or "a Flow of UI state". Angle brackets that are not tag-shaped (`<16ms`) are fine.

## Verify before committing

```bash
pnpm skills:lint        # name/description/required fields, pairs_with integrity, body cap, headings
pnpm skills:registry    # regenerate registry.json
node scripts/gen-taxonomy.mjs   # regenerate docs/taxonomy.md from the registry
```

CI runs all three; `registry.json` and `docs/taxonomy.md` must both be regenerated and committed when skills change. Both are generated — never hand-edit them.
