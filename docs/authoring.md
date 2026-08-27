# Authoring a skill

A skill encodes **best-practice judgment** for a topic — not a copy of the docs. Quality and currency matter more than coverage.

## What earns a new skill

Before scaffolding, answer one question: **what does the model get wrong today without this skill?** If you cannot name it, the skill will not measurably help — and it will still cost listing budget.

That is measured, not assumed. `scripts/output-eval` ran eight skills against a control with no skill installed, and **every stable-subject skill scored a delta of zero**. On `m3-buttons`, `unit-testing` and `choosing-async-pattern` the control missed *nothing at all*: the model already knows Material button hierarchy, the JVM-versus-instrumented split, and when to reach for `AsyncStream`. Restating a well-documented, long-stable API adds nothing you can detect.

The skills that did win won in one of two ways:

- **Post-cutoff specifics** — facts training could not contain. `adopting-liquid-glass`'s control never named `UIDesignRequiresCompatibility` nor warned that content now shows through previously opaque bars; `foundation-models`' control never named `Attachment`.
- **Judgment the vendor's docs bury** — true, documented, and not what the model reaches for. `crash-anr-vitals` was picked expecting its 2026 Play thresholds to be post-cutoff; **they were not**, and the control quoted them correctly. Its delta came from "prioritise clusters by *affected users*, not occurrences" — which is in the docs, several pages deep.

So aim a new skill at the part of its subject that is newer than the model, or at the judgment call its docs make you dig for. Where a topic is mostly settled, scope the skill to the unsettled part rather than covering it evenly.

Two things this does **not** mean. It is not a reason to delete existing skills — a skill that adds nothing to a frontier model may still help a smaller one, and that question is open. And it is not a licence to guess at what is new: a currency claim is only worth carrying if it came from a vendor page you had open. A skill that confidently names an artifact that does not exist is worse than one that quietly went stale — the stale one gets routed around, the wrong one gets repeated. See [`scripts/output-eval/README.md`](../scripts/output-eval/README.md) for both results and the ~$1.50 it costs to check a new skill in crowded territory before merging it.

## Scaffold

```bash
pnpm cli new apple/code/swiftui-views/swiftui-grids --content ../../skills
```

This creates `skills/apple/code/swiftui-views/swiftui-grids/SKILL.md` from a template (today's date, `version: 0.1.0`, `stability: emerging`). The spec is `domain/class/category/name`.

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
  category: swiftui-views
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

### This is a superset of the spec, on purpose

Three of those keys — `globs`, `tags`, `x-skills-master` — are **not** Agent Skills spec fields, and the spec's reference validator rejects a file carrying them. That is expected: `skills/` is the authoring format, and the compiler strips or translates every non-spec key on the way out. Conformance is enforced on the **emitted** projections, never here. Don't "fix" a skill to satisfy a spec validator pointed at the source tree — see [architecture.md](architecture.md#the-spec-boundary).

Two authored facts do reach consumers as spec-legal fields: `license` passes through verbatim, and `version` + `snapshot_date` are re-emitted inside the spec's `metadata` map.

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

## Point at a resource with a condition, not a label

A bare pointer tells a reader the file exists. It doesn't tell them when opening it would be worth the tokens — which is the decision they're actually making. So every resource link carries a trailing clause saying *when* to follow it:

```markdown
- **Worked examples:** [examples.md](examples.md) — read when you want working SwiftUI navigation code to adapt
- **Review checklist:** [checklist.md](checklist.md) — run before merging changes to SwiftUI navigation
```

Name the skill's subject in the clause — "run before a design review of onboarding" beats "run before a design review". The natural condition differs by class: `code`/`lang-tooling` resources are things you *adapt* and *run before merging*; `design` examples are scenarios you *compare a design against*; an `overviews` router's examples are the *comparisons behind a decision*.

**Keep the `(examples.md)` link shape exactly.** `condense.ts`'s `L3_LINK_RE` and the linter's resource-linked rule both match on it, so `[examples.md](./examples.md — foo)` or a reworded target silently drops the resource from every projection. Put the hint *after* the closing paren.

In condensed targets (Cursor, Copilot) the link flattens to plain text and the file isn't shipped — the hint then reads alongside the "full Claude Code skill" pointer note, which is what makes it coherent there rather than a dead reference.

## Declare the upstream a skill tracks

`snapshot_date` records when you checked. It cannot tell anyone whether the thing you checked has moved since — so a skill that documents a shipping library also declares it:

```yaml
x-skills-master:
  upstream:
    - Media3
```

Name the library **exactly as the vendor's release feed prints it** ("Media3 Version 1.11.0-beta01" → `Media3`). Pin the version the skill documents when it names one — `Glance@1.2` — because that is the strongest staleness signal there is: both refreshes in the first pilot were "the skill names an old version", and neither was visible from how recently something shipped. The weekly crawl joins these to the feeds and reports which skills have an upstream that shipped after their snapshot — that list is the refresh queue.

It is **declared, not inferred**, because inference is wrong often enough to be useless: matching skill names against feed titles pairs `Compose UI` with `choosing-android-testing` and `Browser` with `car-media-messaging`. A staleness signal built on bad matches is worse than no signal, because people stop trusting it.

Omit it for skills with no single upstream — design critique, decision routers, anything tracking a guideline rather than a release.

## Resource files over 100 lines need a `## Contents`

An agent that opens `examples.md` often previews it — `head -100`, or a partial read — and sees the first section plus no evidence that four more exist. So any `reference.md` / `examples.md` / `checklist.md` past **100 lines** opens with a table of contents, and the linter warns when one is missing (it looks only at the first 15 lines: a ToC below the fold is a ToC nobody reads).

```markdown
## Contents

- [Streaming text summarization in a Compose screen](#streaming-text-summarization-in-a-compose-screen)
- [Proofreading with diff highlights](#proofreading-with-diff-highlights)
```

List the file's `##` sections. If it has fewer than two of those but several `###` ones — a single `## Examples` over five numbered cases, say — list the `###`s instead, since those are the real sections. Anchors follow GitHub's slug rules: lowercase, punctuation dropped, spaces to hyphens (so `Example 1 — Foo` becomes `#example-1--foo`, with the doubled hyphen left by the em dash).

Adding or updating a ToC is a metadata-only edit: it does not move `version` or `snapshot_date`, but it **does** change emitted bytes, so regenerate `plugins/`.

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

## Keep a description under ~450 characters, and lead with the trigger

Not for elegance — for survival. Every installed skill contributes one `- <name>: <description>` line to the agent's always-on listing, and that listing is **budgeted**: roughly 8 KB on a 200k-context model, on Claude Code *and* Codex. Past the budget the agent does not shorten descriptions, it **drops** them, leaving a bare `- <name>`. So a category whose descriptions overrun costs its skills the descriptions entirely.

Two rules follow, and Codex states the second outright — *"front-load the key use case and trigger words so a host can still match the skill if descriptions are shortened"*:

1. **Stay under ~450 characters.** The spec allows 1024 and the linter enforces that ceiling, but a library of 1024-character descriptions is a library whose descriptions get discarded.
2. **Lead with "Use when …".** Put the situations a reader would recognise first, and the API nouns after. If the tail gets cut, the trigger should not be in the tail.

Trim by cutting **tail enumerations**, not distinguishing detail. This:

> Use when building an Android TV app with Compose, migrating a Leanback app, designing browse and detail screens, or wiring D-pad focus across a composable hierarchy. Covers androidx.tv.material3: Cards, ImmersiveList, Carousel and TvNavigationDrawer.

says everything its 425-character predecessor did in 250.

`pnpm crawl` reports which categories are over budget, so this is measurable rather than a matter of taste. A description edit is a patch `version` bump; `snapshot_date` does not move, because nothing was re-verified.

## A new skill in crowded territory ships with a query set

A description is a claim that a model will reach for this skill in a particular situation, and the linter cannot check that claim — a "Use when …" clause satisfies the grep whether or not it triggers. For most new skills that is fine. It is not fine when the new skill overlaps one that already exists, because the failure mode is not "never triggers", it is "the wrong sibling triggers" and nobody notices.

**The test for "crowded":** before writing the description, run

```bash
pnpm cli search <the topic> --content ../../skills
```

If a result comes back whose description could plausibly match a prompt your new skill is meant to answer — a `code` ↔ `design` twin, a `choosing-*` router and one of its destinations, two components with overlapping names — you are in crowded territory. Then the PR carries three extra things:

1. **A query set** at `scripts/trigger-eval/<name>/eval.json` — roughly 10 prompts that should trigger the new skill and 6 that should not. The should-not set is the neighbour's territory, written the way a user would phrase it. `install` names the whole neighbourhood so the run measures discrimination, not recognition.
2. **A harness run pasted into the PR.** `node scripts/trigger-eval/bin.mjs <name> --runs=1` is enough for review (~$3.50 at the measured per-session cost); `--dry-run` first is free.
3. **The numbers, honestly.** Aim for should-trigger ≥ 80% and false-fire ≤ 20%. Below that, fix the **description** — not the query set. A query set edited until it passes measures nothing.

See [scripts/trigger-eval/README.md](../scripts/trigger-eval/README.md) for what the harness does and what it cannot see.

There is deliberately **no lint rule** behind this. "Overlaps an existing skill" is a judgment about meaning, and a rule that guessed at it — shared name stems, same category — would fire on the many legitimate siblings this library is built from (`m3-*` and `hig-*` pairs are *supposed* to cover the same topic from two sides) while missing the genuine collisions. A policy a reviewer applies beats a rule that cries wolf.

## Verify before committing

```bash
pnpm skills:lint        # name/description/required fields, pairs_with integrity, body cap, headings
pnpm skills:registry    # regenerate registry.json
node scripts/gen-taxonomy.mjs   # regenerate docs/taxonomy.md from the registry
```

CI runs all three; `registry.json` and `docs/taxonomy.md` must both be regenerated and committed when skills change. Both are generated — never hand-edit them.
