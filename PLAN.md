# Agent Skills spec alignment plan

Working plan for the 2026-08/09 **Agent Skills specification alignment** effort. The previous
plan (the 2026-08 improvement effort, phases 0–10) completed in full and is preserved in git
history at `22d24b4`; its one unfinished leftover is carried forward as item 0.4 below.

**Audit question:** do the skills in this repo follow the Agent Skills specification
([agentskills.io/specification](https://agentskills.io/specification)) and the authoring
guidance from agentskills.io and Anthropic
([platform.claude.com — Agent Skills](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview))?

**Audit verdict (2026-08-26, 433 skills):** **yes on every hard requirement — with caveats.**
The canonical `skills/` library is deliberately a *superset* format that the CLI compiles down,
and the compiled projections (`.claude/skills/`, `plugins/`) are what an agent actually reads.
Those projections carry exactly the spec's required fields and nothing else. The gaps are:
the linter enforces a *looser* name rule than the spec, so compliance is currently a fact
about the content rather than a guarantee; one description contains XML-tag-shaped text that
Claude's upload validator rejects; and several best practices from the two authoring guides
(reference-file tables of contents, conditional load hints, the spec's `license`/`metadata`
fields, description trigger evals) are unexploited. None are emergencies; all are cheap
relative to their value.

## Ground rules

- **PR per numbered item.** CI green; Chintan merges. Suggest `#minor` only where noted.
- **Tooling gates before content edits** (Phase 0 lands before Phases 1–2 touch skills),
  so every content change is machine-checked — same discipline as the last effort.
- **Generated files travel with their cause.** Any skill edit regenerates `registry.json`,
  `docs/taxonomy.md`, and `plugins/` in the same PR.
- **Docs stay in sync.** Items that change the pipeline update `docs/architecture.md` /
  `docs/authoring.md` / `docs/emitters.md` in the same PR.
- **Evidence before rewrites.** Description/content changes at library scale (Phase 3) are
  gated on eval data, not taste. A 433-skill rewrite on an untested hypothesis is how a
  library gets worse while its diffs look busy.

## Baseline audit findings (2026-08-26)

Measured over all 433 `SKILL.md` files plus the emitted projections.

### What already conforms (the spec's hard requirements)

| Spec requirement | Status in this repo |
| --- | --- |
| Skill = directory containing `SKILL.md` | ✅ all 433, `domain/class/category/name/SKILL.md` |
| `name` ≤ 64 chars, lowercase `[a-z0-9-]` | ✅ longest name is 37 chars; zero violations |
| `name`: no leading/trailing/consecutive hyphens | ✅ zero violations **in content** — but see gap G1: the linter does not enforce this |
| `name` = parent directory name | ✅ linter error since day one |
| `description` non-empty, ≤ 1024 chars | ✅ max is 747 chars (mean 424); schema-enforced |
| Description says what + when | ✅ all 433 contain a "Use when …" clause (linted) |
| Body ≤ 500 lines / < 5k tokens recommended | ✅ max body is 246 lines / ~4.7k tokens (mean 90 lines / ~2.0k tokens); 500 is a lint **error** |
| File references relative, one level deep | ✅ all L3 links are `(examples.md)`-style; **zero** resource files link onward to another file |
| Resource files linked from `SKILL.md` | ✅ linted (warn) since the last effort's 2.2/3.2 |
| No Windows-style paths | ✅ none |
| Emitted frontmatter = spec fields only | ✅ Claude emitter writes exactly `name` + `description`; `x-skills-master`, `globs`, `tags` stripped (snapshot-tested for every emitter) |
| Deterministic output | ✅ byte-identical repeat runs asserted by e2e tests |
| Claude-specific: no reserved words "claude"/"anthropic" in `name` | ✅ zero violations in content — but not enforced (G1) |
| Claude-specific: no XML tags in `name`/`description` | ⚠️ one violation — see G2 |

Two structural notes that are **by design, not gaps**, and should stay that way:

- **The canonical `skills/` tree is not itself a spec-conformant skills directory.** Authored
  frontmatter carries three top-level keys the spec does not define (`globs`, `tags`,
  `x-skills-master`); the spec's stated home for non-spec properties is the `metadata` map,
  which is string→string and cannot hold our structured block. This is the whole point of the
  compile step: agents consume the projections, never `skills/` directly. Item 1.4 documents
  this boundary explicitly so nobody points a spec validator (or an agent) at the source tree
  and files a bug.
- **`scripts/` is unused (0 directories).** Both guides' script guidance (PEP 723 inline deps,
  `--help` design, validation loops) targets skills that *execute* things. This is a prose
  knowledge library; its "executable" analogue is the checklist file, which we already have.
  No action — revisit only if a skill ever genuinely needs a deterministic tool.

### Gaps (ordered by risk)

- **G1 — The linter's name rule is looser than the spec.** `NAME_RE` is
  `/^[a-z0-9-]{1,64}$/`, which accepts `-pdf`, `pdf-`, and `pdf--processing`; the spec
  forbids all three. Claude's platform additionally rejects names containing the reserved
  words "anthropic"/"claude". Zero current violations — meaning compliance is luck plus
  convention, and nothing stops skill 434 from breaking it.
- **G2 — One description contains XML-tag-shaped text.** `storekit`'s description includes
  `VerificationResult<Transaction>`. Claude's platform validation states descriptions
  "cannot contain XML tags", and tag-shaped generics are exactly what a naive validator
  matches — a claude.ai zip upload or Skills API upload of this projection can be rejected.
  Nothing lints for this.
- **G3 — No conformance gate against the spec's reference validator.** The spec ships
  `skills-ref validate`. Nothing in CI validates the *emitted* projections (the dogfood
  `.claude/skills/` or the 8 plugins' 433 skill dirs) against it, so a future emitter change
  could silently drift off-spec. Our snapshot tests pin our own expectations, not the spec's.
- **G4 — 46 of 176 resource files exceed 100 lines with no table of contents.** Claude's
  best-practices guide: reference files > 100 lines should open with a ToC so an agent that
  previews with a partial read (`head -100`) still sees the full scope. Worst offenders are
  android `examples.md` files (up to 436 lines).
- **G5 — Resource links carry no load-time guidance.** Bodies point at resources as
  bare `- **Worked examples:** [examples.md](examples.md)` list entries. Both guides are
  explicit that the useful form is conditional — "read X *when* Y" — because that is what
  makes progressive disclosure work at decision time rather than as an afterthought.
- **G6 — The spec's `license` and `metadata` fields are unused in projections.** Emitted
  skills carry no license (the repo is MIT, and plugins are distributed artifacts) and no
  provenance — a consumer looking at an installed skill cannot see its version,
  snapshot date, or source without the lockfile. `metadata` (string→string) fits
  `version`/`snapshot-date`/`source` exactly; the last effort's item 1.8 already flagged
  this as spec-legal and deferred it.
- **G7 — Description quality is asserted, never measured.** agentskills.io's
  optimizing-descriptions guide defines a trigger-eval loop (should-trigger /
  should-not-trigger query sets, trigger rates, train/validation split). We have 433
  hand-written descriptions, 19 of which lead with the trigger clause, and zero eval
  queries. The 1.8 audit judged them "all carry use-when" by grep, which checks the
  *letter* of the guidance, not whether skills actually activate on realistic prompts —
  especially for near-miss discrimination between our own sibling skills
  (`swiftui-sheets` vs `hig-sheets` vs `choosing-navigation-pattern`), which is precisely
  the hard case the guide says descriptions must solve.
- **G8 — Always-loaded metadata cost at plugin scale.** Every installed skill's
  name+description sits in the consumer's system prompt permanently. Measured today:
  `skills-master-android-code` ≈ 10.3k tokens of descriptions across 107 skills;
  `apple-code` ≈ 9.7k over 88; installing one full domain ≈ 21–23k tokens *before any skill
  triggers*. Each description is individually within guidance (mean ~106 tokens); the
  aggregate is a real cost the guides' per-skill advice never has to confront, and nothing
  in the repo reports it.

---

## Phase 0 — Conformance gates (tooling only, no content)

- [x] **0.1 Tighten the name rule to the spec (S).** Extend schema/lint so `name` (and
  `pairs_with` entries) must not start/end with a hyphen or contain `--`, and error on the
  reserved words "claude"/"anthropic" anywhere in the name (Claude platform rule). Update
  the `NAME_RE` doc comment to cite the spec. Zero content changes expected — this converts
  observed compliance into enforced compliance. Unit tests per the 2.3 pattern. *(G1)*
  **Landed:** `NAME_RE` is now `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` and the 64-char cap plus the
  reserved-word check live in a shared `SkillNameSchema`, used by both `name` and
  `pairs_with` — so violations surface as lint errors through the existing frontmatter
  validation path, with no new lint plumbing. `cli new` validates the leaf name up front
  too, because that name becomes the folder: catching it at lint time would mean moving a
  directory rather than fixing a line. All 433 skills still lint clean (0 errors,
  0 warnings), confirming the audit's "zero violations in content" finding.
- [x] **0.2 XML-tag lint rule (S).** Warn (error?) when `name` or `description` matches an
  XML/HTML-tag-shaped pattern (`<[A-Za-z/]`). Generic types are the known trap
  (`VerificationResult<Transaction>`, `Result<T, E>`); the fix at authoring time is to
  reword ("verifying the transaction's VerificationResult"), the same policy authoring.md
  already applies to the ` #` YAML hazard — document it alongside. *(G2)*
  **Landed as a warn, deliberately.** Error level would turn CI red on `main` for the
  window between this gate and 1.1's content fix, which is exactly the "red build everyone
  learns to ignore" failure the crawl workflow already avoids; 1.1 promotes it to an error
  in the same PR that removes the last violation. Checks `description` only: `name` is held
  to `[a-z0-9-]` by the schema, so it cannot carry a tag, and a second unreachable branch
  would be dead surface. The rule fires on exactly one skill today — `storekit`, as the
  audit predicted — so the library lints at 0 errors, 1 warning until 1.1.
- [x] **0.3 `skills-ref validate` in CI (M).** Add a CI step that runs the spec's reference
  validator over emitted output: the committed dogfood `.claude/skills/` and every skill dir
  under `plugins/*/skills/`. Vendor or pin the tool (it lives in
  `github.com/agentskills/agentskills/skills-ref`); if running it proves impractical in CI,
  port its checks into a small script — the point is an *external* definition of conformance
  guarding the emitters, not our own snapshots agreeing with themselves. Document in
  `docs/emitters.md` that the Claude projection tracks the Agent Skills spec and this gate
  is what holds it. *(G3)*
  **Landed:** no vendoring and no port were needed — the tool ships to PyPI as
  `skills-ref`, pinned at `0.1.1`, and a new `Agent Skills spec conformance` CI job runs
  `scripts/spec-validate.py` over all 434 committed skill dirs (**0 invalid** today).
  Three findings worth carrying forward: PyPI 0.1.1 and the repo's HEAD source are
  byte-identical apart from an explicit `encoding='utf-8'`, so the pin costs no fidelity;
  0.1.1 renamed the console script from `skills-ref` to **`agentskills`**, so the driver
  imports the Python API instead, which did not move; and the validator treats **any**
  non-spec frontmatter key as an error (`ALLOWED_FIELDS` = name, description, license,
  allowed-tools, metadata, compatibility) — which is the gate 1.2/1.3 must satisfy, and
  confirms 1.4's boundary from the other side: pointed at `skills/`, it fails on the first
  skill's `tags`.
- [x] **0.4 Dead-surface deletion, carried over (S).** From the previous plan (found during
  7.5): `CondenseOptions.openQuestion: "summarize"` and `summarizeOpenQuestion()` are
  exercised only by their own tests — no emitter has passed that option since the 1.9 digest
  landed. Delete both, plus their tests, per the 1.5-style rule.
  **Landed:** the option, the function, its three tests, and the `openQuestion: "keep"`
  arguments the cursor/copilot emitters were passing (the default, so a no-op) are gone;
  `CondenseOptions` is down to `hadResources`. Emitted bytes are unchanged — every snapshot
  and the e2e determinism assertions pass untouched. The behaviour that survives is now
  stated as intent rather than as a default: condensed targets carry `## Open question` as
  authored, and one test pins that. `docs/emitters.md` no longer advertises a mode that
  does not exist.

## Phase 1 — Spec-surface fixes (small, concrete, land fast)

- [x] **1.1 Reword the `storekit` description (S).** Remove `VerificationResult<Transaction>`
  (and re-grep the library for any other tag-shaped text 0.2's rule surfaces). Patch-bump
  the skill's `version`; `snapshot_date` does not move (no re-verification happened).
  Regenerate registry/taxonomy/plugins. Blocked on 0.2 so the fix lands with its gate.
  Promote 0.2's rule from warn to **error** in the same PR — with the last violation gone,
  the gate can hold the line instead of describing it. *(G2)*
  **Landed:** "verifying `VerificationResult<Transaction>`" → "verifying each transaction's
  VerificationResult" — same meaning, no tag shape; `version` 1.1.0 → 1.1.1,
  `snapshot_date` held at 2026-08-25 since nothing was re-verified. 0.2's rule is now an
  **error**, and the library lints at 0 errors, 0 warnings — the re-grep, done by the rule
  itself rather than by eye. Generated output moved by exactly two lines (the plugin
  projection's description and the registry entry); `docs/taxonomy.md` does not carry
  descriptions, so it did not move at all. G2 is closed on both sides: the violation is
  gone and the gate now refuses the next one.
- [x] **1.2 Emit `license` (S).** Add `license: MIT` to the Claude-emitter frontmatter
  (spec-legal optional field), flowing to `.claude/skills/` installs and all 8 plugins.
  One emitter line + snapshot updates + a note in `docs/emitters.md`. Decision to record:
  either bare `MIT` or `MIT (see repository LICENSE)` — keep it short per the spec. *(G6)*
  **Landed, but not as written — the license is authored per skill, not stamped by the
  emitter.** Bare `MIT` (SPDX, per the spec's "keep it short"), on all 433 skills; the
  emitter passes the field through when present and emits nothing when absent. The reason
  is that a hardcoded constant would be a false claim the moment the CLI is pointed at
  another content root, which `--content` and `SKILLS_MASTER_REPO` both support — an
  emitter cannot know the terms of content it did not author. Cost of the honest version is
  a 433-line source diff (+433 emitted) and an ongoing authoring rule, paid for by a lint
  warn, the `cli new` template, and a test that a scaffolded skill lints clean. Only the
  Claude target carries it: `.mdc` / `.instructions.md` / `AGENTS.md` frontmatter is
  Cursor's and Copilot's vocabulary, not the spec's. `registry.json` does not move —
  it never carried `license`.
  **Found in passing:** the `cli new` template's description read `Use when <triggers go
  here>`, which 1.1 had just made a lint **error** — every scaffolded skill would have
  failed lint on creation. Fixed here, with a regression test that scaffolds and lints.
  **Also noticed, deliberately not fixed here:** the dogfood install under `packages/cli/`
  is pinned at `swiftui-navigation` 1.0.1 while the source is 1.1.1, and `doctor` calls it
  healthy because it compares emitted files against the lockfile, not the lockfile against
  the source. Pre-existing and unrelated to this change; refreshing it here would drag two
  unrelated content revisions into the diff. Worth its own item — `doctor` arguably should
  report a lockfile that has fallen behind the content.
- [x] **1.3 Provenance via the spec's `metadata` map (M) — decision item.** Optionally emit
  `metadata: {version, snapshot-date, source}` (string→string, spec-legal, clients ignore
  what they don't know) on the Claude projection, so an installed skill self-describes its
  currency — today that information dies with the strip of `x-skills-master`, and staleness
  is invisible to the consumer without our lockfile. Costs ~3 frontmatter lines per emitted
  skill (zero context cost until triggered — frontmatter beyond name/description is not
  what's preloaded; verify that claim against Claude Code's actual loader before landing).
  If accepted: emitter + snapshots + emitters.md. If rejected: record why here, per the
  6.4/7.4 precedent of documenting non-changes. *(G6)*
  **Accepted, minus `source`.** The Claude projection now emits
  `metadata: {version, snapshot-date}`. Both are authored facts passed through from
  `x-skills-master`; `source` was dropped because nothing authored says where a skill came
  from, and synthesizing a repo URL would be the same false claim 1.2 rejected for
  `license` — plugin consumers already get origin from the marketplace manifest. Values are
  **double-quoted**: js-yaml (so gray-matter) reads a bare `2026-08-25` as a `Date`, which
  would break the spec's string→string contract depending on the consumer's parser.
  `core/yaml.ts` gained `quoted()` for this, and a round-trip test asserts both keys come
  back as strings. The spec's own `read_properties` confirms it: `{'version': '1.1.1',
  'snapshot-date': '2026-08-25'}`, both `str`, all 434 skills valid.
  **The zero-context-cost claim is verified, not assumed** (the item asked for this).
  Claude Code 2.1.231 formats each listed skill as exactly `- <name>: <description>` and
  reads no other frontmatter until the skill is invoked — so `metadata` costs nothing
  until it is deliberately looked at. See the G8 finding below, which came out of the
  same read.
  **Found while verifying — the skill listing is budgeted, and this library is far past
  it.** The same loader caps the listing at
  `contextWindow × 4 bytes/token × skillListingBudgetFraction` (default `0.01`) — about
  **8,000 characters** on a 200k-token model, 40,000 on a 1M one. Over budget it keeps the
  highest-priority entries whole and degrades the rest to a bare `- <name>`, description
  dropped entirely. Measured listing sizes today: `android-code` 41.2k chars (107 skills),
  `apple-code` 38.9k (88), `apple-design` 36.1k (64); the whole library is 192k chars. So a
  single-domain install already blows a 200k-context budget by ~5×, and for most skills the
  model sees a bare name. Individual descriptions are safe from the *other* cap
  (`skillListingMaxDescChars`, default 1536; our longest is 747). This reframes G7/G8 from
  "aggregate token cost" to "most descriptions never reach the model at all", and makes
  description **length** a measurable lever rather than a stylistic one — inputs for 2.3
  and 3.3.
- [x] **1.4 Document the spec boundary (S).** `docs/architecture.md` gains a short section:
  the canonical `skills/` format is a superset of the Agent Skills spec (extra top-level
  keys by design; the spec's `metadata` map can't hold structured facets); projections are
  the conformance surface; `skills-ref validate` is not expected to pass on `skills/` and
  is enforced on emitted output (0.3). Cross-link from authoring.md's frontmatter section.
  **Landed:** `## The spec boundary` in architecture.md, promoted out of a stray paragraph
  that had been sitting at the end of the *Categories mirror the vendor* section — the one
  place nobody would look for it. Cross-linked from authoring.md's frontmatter block and
  from CLAUDE.md, both phrased as an instruction not to "fix" a skill to satisfy a
  validator pointed at the source tree, since that is the mistake the section exists to
  prevent.
  **Worth recording: the source tree fails the spec validator for *two* independent
  reasons, not one.** The audit assumed it was the extra top-level keys. Run it and the
  first failure is actually the parser: the reference implementation uses **strictyaml**,
  which rejects flow sequences outright, so `tags: [swiftui, monetization]` and
  `platforms: [apple, ios]` are refused before any field is inspected. Rewrite those in
  block style and *then* you get `Unexpected fields in frontmatter: globs, tags,
  x-skills-master`. Both are quoted verbatim in the section, run rather than remembered.
  This strengthens the "Making canonical `skills/` spec-valid" non-goal below: conforming
  would mean not just relocating facets but reformatting every list in the library to suit
  a parser dialect nothing in our pipeline uses.

## Phase 2 — Progressive-disclosure polish (content, machine-checked by Phase 0)

- [x] **2.1 Tables of contents for long resource files (M).** Add a short `## Contents`
  block to the 46 resource files over 100 lines (android examples files are the bulk).
  Mechanical, high-leverage for partial reads; add a lint warn (>100 lines, no ToC within
  the first ~15 lines) so the rule outlives the pass. Metadata-only edits do not bump
  `version`/`snapshot_date` (nothing was re-verified) — but note these edits *do* change
  emitted claude-target bytes, so regenerate plugins. *(G4)*
  **Landed:** lint rule first (Phase 0 discipline), and it fired on exactly the 46 files the
  audit named — then all 46 were fixed and the library is back to 0 warnings. Sections are
  the `##` headings where a file has at least two, else the `###`s: `gradle-kotlin-dsl`'s
  H3s are *filenames inside* two examples, so listing them would have been worse than
  listing the examples. Anchors follow GitHub's slug algorithm including its double-hyphen
  artifact for em dashes, and a verification pass confirmed **182 anchors, 0 dead** — a ToC
  with broken links is worse than no ToC. 5 stray leading blank lines were normalized away.
  **One file was not a ToC problem at all.** `modularization/examples.md` was 140 lines of
  raw Kotlin with **no headings and no code fences** — separated by `// ===== EXAMPLE N =====`
  comments, so every consumer has been rendering it as prose since it was written. Restructured
  into six fenced `##` sections; a line-by-line diff confirms the code is byte-identical, only
  the marker comments became headings. Worth noting the linter could not have caught this:
  it checks that resources are linked and now that they are navigable, but nothing asserts
  that a file which is entirely code is *marked up* as code.
- [x] **2.2 Conditional load hints on resource links (M).** Rephrase the `## References`
  resource entries from bare pointers to trigger-bearing ones, e.g.
  `[examples.md](examples.md) — read when you need full working implementations` /
  `[checklist.md](checklist.md) — run before merging navigation changes`. One line each,
  90 skills. Keep the `(examples.md)` link shape exactly — `condense.ts`'s `L3_LINK_RE`
  and the lint rule key on it; verify emitted output for both modes afterwards (the 3.2
  lesson). Wording guidance goes into authoring.md. *(G5)*
  **Landed:** 175 links across all 90 skills. The condition is class-shaped, because the
  reason to open a file differs by what the file is: `code`/`lang-tooling` examples are
  code you *adapt* and checklists you *run before merging*; `design` examples are scenarios
  you *compare a design against*; an `overviews` router's examples are the *comparisons
  behind a decision*. Each hint names the skill's own subject, from a hand-written phrase
  per skill — `titleFromName` alone yields "Bluetooth Ble", "SwiftUI State Data Flow",
  "Kmp", which read like filenames rather than something a reader recognises their
  situation in. Nine lines the templates mangled ("working a Play Console release code to
  adapt") were rewritten individually.
  **The 3.2 lesson, applied:** link shape verified intact (176 `](examples.md)`-style links,
  lint still 0/0) and emitted output inspected for **all four** targets, not just Claude.
  Worth recording what condensation does with it: Cursor and Copilot flatten the link to
  bare text and never ship the file, so the hint lands next to the "full Claude Code skill"
  pointer note. That reads as a coherent "here's what you're missing and when it matters"
  rather than a dead reference — better than the bare pointer it replaces, but it is a
  behaviour to keep in mind when wording future hints. The AGENTS.md digest drops these
  lines entirely, as designed.
- [x] **2.3 Metadata-footprint report (S).** Extend the weekly crawl report (or
  `registry build`) with per-plugin totals: skill count, description tokens, worst-10
  longest descriptions. This makes G8 visible and continuously measured rather than a
  one-off audit figure, the same move 10.1 made for staleness. No content edits here —
  trimming, if any, happens in Phase 3 with eval evidence. *(G8)*
  **Scope sharpened by 1.3's loader read — report against the real budget, not a raw
  total.** Claude Code caps the always-on listing at
  `contextWindow × 4 bytes/token × skillListingBudgetFraction` (default `0.01`): ~8,000
  chars at 200k context, ~40,000 at 1M. Past that it keeps the highest-priority entries
  whole and drops the rest to a bare `- <name>`. Every plugin should therefore report
  `listing chars` and `× over budget` at both context sizes, not just token totals —
  today `android-code` is 41.2k chars (5.2× over at 200k), `apple-code` 38.9k, whole
  library 192k. The per-description cap (`skillListingMaxDescChars`, 1536) is not binding
  for us: longest description is 747.
  **Landed (taken out of order, ahead of 2.1/2.2, deliberately).** Both of those are content
  sweeps whose payoff assumes skills trigger at all; this measures whether they do. The crawl
  now writes `reports/footprint.json` and the report renders an **Always-on listing
  footprint** section — per-plugin listing bytes, approximate tokens, and `× over budget` at
  both 200k and 1M context, plus the whole-library row and the 10 longest descriptions.
  Measured in **bytes, not characters**: the budget is derived from bytes-per-token, and our
  descriptions are full of em dashes at 3 bytes each. First run:

  | | skills | listing | ×@200k | ×@1M |
  | --- | ---: | ---: | ---: | ---: |
  | `android-code` | 107 | 41,532 B | **5.19×** | **1.04×** |
  | `apple-code` | 88 | 38,998 B | 4.87× | 0.97× |
  | whole library | 433 | 193,175 B | **24.15×** | **4.83×** |

  **Seven of eight plugins blow the 200k budget on their own**, and `android-code` exceeds it
  even at 1M context. The per-description cap is not the constraint (longest is 747 of 1536
  allowed) — the aggregate is. Practical read for Phase 3: for a single-domain install most
  descriptions are already replaced by bare names, so "write a better description" is
  worthless for those skills until either the install is narrower or the listing is smaller.
  That makes **install granularity** (per-category plugins? a curated core?) a candidate
  lever the plan has not considered, alongside 3.3's trimming.

## Phase 3 — Description optimization, eval-driven (the expensive one — evidence first)

The guides' loop (agentskills.io "Optimizing skill descriptions"): ~20 labeled queries per
skill, 3 runs each, trigger-rate threshold, 60/40 train/validation split. At 433 skills that
is ~26k agent invocations per iteration — not a thing to run wholesale. Sample instead:

- [ ] **3.1 Build the trigger-eval harness (M).** A script (per the guide's
  `claude -p --output-format json` pattern) that takes `eval_queries.json` for a skill,
  computes trigger rates against a project with the relevant plugin installed, and reports
  pass/fail per query. Store query sets in-repo (e.g. `scripts/trigger-evals/<skill>/`).
  `#minor` if it lands as a CLI command; a repo script is fine too.
- [ ] **3.2 Pilot on the hard cases (M).** Pick ~10 skills where triggering is genuinely
  ambiguous — sibling pairs the near-miss guidance warns about (`swiftui-sheets` vs
  `hig-sheets`, `choosing-*` routers vs their destinations, `m3-*` design vs compose code
  twins) — write ~20 queries each with should/should-not labels, and measure. The
  should-not sets come free: the sibling's should-trigger queries.
- [ ] **3.3 Act on the data (M/L, scope unknown until 3.2).** Only rewrite what measurably
  misfires. **Test the front-loading hypothesis first** — 5.2 found Codex instructing
  authors to "front-load the key use case and trigger words so a host can still match the
  skill if descriptions are shortened", which means hosts truncate and the first clause is
  what survives. Candidate hypotheses to test, not presume: leading with "Use when" (the
  agentskills.io imperative-lead recommendation — currently 19/433 do; Anthropic's own
  examples are what-then-when, so the *style* is open even though truncation now argues for
  triggers-first); adding "even if the user doesn't
  mention X" pushiness for under-triggering skills; trimming p90+ descriptions (≥573 chars)
  if length shows no trigger benefit — which would also buy back G8 tokens. Whatever wins
  becomes an authoring.md rule with a rationale; whatever loses gets recorded here as
  rejected, with numbers.
- [ ] **3.4 Description policy for new skills (S).** authoring.md: new skills in ambiguous
  territory ship with a query set and a harness run in the PR. Cheap at one-skill scale,
  and it stops the library from re-accumulating unmeasured descriptions.

## Phase 4 — Output-quality evals (policy, not blanket coverage)

- [ ] **4.1 Sampled output evals (L) — decision item.** The guides' with-skill vs
  without-skill benchmark answers one question these docs never ask of a *knowledge*
  library: does having the skill measurably beat the model's raw knowledge? For a library
  whose whole mission is "give coding agents an edge", that is worth answering honestly on
  a sample: ~2 skills per class (code / design / lang-tooling / overview), 2–3 eval tasks
  each, assertions after first outputs per the guide. If the delta is zero on some class
  (plausible for well-trodden stable APIs, unlikely for post-cutoff iOS 27 / Android 17
  content), that finding should reshape what we author next — currency-first — and is
  worth more than any compliance polish in this file. If run: results and per-class
  verdicts get recorded here.

## Phase 5 — Agent reach: the `.agents/skills/` standard directory

*Added 2026-08-26 after surveying the current agent landscape.* The top five coding agents
by adoption today are **Claude Code, GitHub Copilot, Cursor, OpenAI Codex, and Gemini CLI**
(JetBrains' 2026 adoption research has Claude Code as the most-adopted agent at work;
Copilot holds the largest cumulative install base). How this library reaches each of them
today:

| Agent | Served today via | Quality of what it sees |
| --- | --- | --- |
| Claude Code | `.claude/skills/` emitter + 8 plugins | **Full** — lossless, progressive disclosure |
| Cursor | `.cursor/rules/*.mdc` + reads AGENTS.md | **Good** — condensed body, description-triggered |
| GitHub Copilot | `.github/instructions/` + reads AGENTS.md | **Good** — condensed body, `applyTo`-scoped |
| OpenAI Codex | AGENTS.md digest only | **Weakest** — ~584-token digest; no code examples, no platform notes, no L3 resources |
| Gemini CLI | nothing by default (AGENTS.md only if the user sets `context.fileName`) | **None** out of the box |

The mission statement has named Codex since the last effort, yet Codex is the *least*-served
of the four named agents. What changed externally: the Agent Skills format this plan aligns
to is no longer Claude-only. Codex reads skills from `.agents/skills/` (since Dec 2025),
VS Code Copilot's default skills directory is `.agents/skills/`, and Gemini CLI reads
`.gemini/skills/` with `.agents/skills/` as an alias. One emitter therefore upgrades three
of the top five from digest-or-nothing to full progressive-disclosure skills.

- [x] **5.1 `agents-skills` emitter → `.agents/skills/<name>/` (M).** Same projection as the
  Claude emitter (spec frontmatter + verbatim body + co-located resource files) at the
  standard path — mostly a shared-code, second-mount-point change. Per-emitter details:
  detection heuristic (`.agents/` dir, or Codex/VS Code markers — apply the 1.7 rebalancing
  lessons); lockfile/`doctor`/`update`/`remove` come free (generic over the interface);
  snapshot + e2e tests; `docs/emitters.md`. Two decisions to record in the PR: (a) dedupe
  policy when a consumer enables both `claude` and `agents-skills` and an agent reads both
  roots — verify what Claude Code, Codex, and Gemini each scan before choosing defaults;
  (b) whether the AGENTS.md digest block should shrink to a pointer for consumers who also
  emit full skills to `.agents/skills/`. Covered by the 0.3 conformance gate automatically.
  `#minor`.
  **Landed, pulled forward ahead of Phases 3–4** on the merit note below. `core/spec-skill.ts`
  now holds the projection and both `claude` and `agents-skills` mount it; a test asserts the
  two stay byte-identical, since drift between them would be silent.
  **Who reads what, verified against each tool's own docs rather than assumed:** Codex scans
  `.agents/skills` (project → parent → repo root → user) and *not* `.claude/skills`; Gemini
  CLI the same, where `.agents/skills` outranks its own `.gemini/skills`; VS Code Copilot
  reads `.github/skills`, `.claude/skills` **and** `.agents/skills`. And the decisive one,
  read out of the binary rather than the docs: **Claude Code 2.1.231 contains zero references
  to `.agents/skills`** — it scans `.claude/skills` only. So the two roots are complementary,
  not redundant, and a project using Claude Code *and* Codex genuinely needs both.
  **(a) Dedupe policy — narrow by default, explicit when asked.** VS Code Copilot is the one
  consumer that reads both roots, so enabling both shows it every skill twice, which 2.3's
  budget finding makes actively harmful rather than merely untidy. Therefore: a new
  `DEFAULT_TARGETS` (the original four) is what `init`/`add` fall back to when they detect
  nothing, while `ALL_TARGETS` keeps all five for `--target all` — an explicit request, not a
  guess. Detection is `.agents/` or `.gemini/` only. `AGENTS.md` is deliberately **not**
  evidence, even though it is the clearest sign of a Codex project, because it is the
  `agents` target's evidence and claiming both would hand Codex the same content twice.
  **(b) AGENTS.md digest — left alone, deliberately.** Shrinking it to a pointer when
  `agents-skills` is enabled would make one emitter's output depend on another's being
  enabled, breaking the property that each target owns its files independently — which is
  exactly what makes the lockfile, `sync`, and `remove` generic over the interface. A
  consumer who now gets full skills can simply not enable `agents`.
- [x] **5.2 Re-run the 1.8-style consumption audit for the new target (S).** Verify against
  current docs how Codex, VS Code, and Gemini actually discover/trigger `.agents/skills/`
  (metadata preload? `$name` mention? description matching?), and whether our description
  format triggers well there — feed anything surprising into the Phase 3 eval harness
  rather than guessing.
  **Landed.** All four consumers audited against their own current docs (`docs/emitters.md`
  carries the table). The uniform answer: **every one preloads `name` + `description` and
  nothing else**, loading the body only on activation — so 1.3's zero-cost finding
  generalizes, and the description is the entire trigger surface everywhere.

  | Agent | Skills-list budget | Explicit invocation |
  | --- | --- | --- |
  | Claude Code | `contextWindow × 4 B/token × 1%` ≈ 8,000 B at 200k; over budget → bare `- <name>` | Skill tool / `/name` |
  | Codex CLI | "at most **2% of the model's context window, or 8,000 characters** when unknown" | `$skill-name` |
  | Gemini CLI | none documented | `activate_skill`, with approval |
  | VS Code Copilot | none documented; `name` ≤ 64, `description` ≤ 1024 | `/` menu, `disable-model-invocation` |

  **Two surprises, both feeding Phase 3.**
  1. **The listing budget is an ecosystem norm, not a Claude Code quirk.** Two independent
  vendors land on ~8,000 characters. G8 is therefore not "we are expensive on one host" but
  "a single-domain install overruns the documented budget on at least two of them", which
  raises 2.3's finding from a measurement to a design constraint.
  2. **Codex tells authors to front-load triggers, and says why:** *"Front-load the key use
  case and trigger words so a host can still match the skill if descriptions are shortened."*
  That is vendor-side evidence for 3.3's open "lead with Use when" question — which the plan
  framed as genuinely undecided, since agentskills.io recommends the imperative lead while
  Anthropic's own examples are what-then-when. It does not settle whether front-loading
  improves trigger rates, but it changes the prior: descriptions are *expected to be
  truncated by the host*, so whatever survives the first clause is what matches. Only 19 of
  433 of ours lead with the trigger. 3.3 should test this first, not last.

  **No action needed on format.** We emit spec fields only, which all four accept. VS Code
  additionally understands `argument-hint`, `user-invocable`, `disable-model-invocation` and
  `context` — none are in the spec's allowed set, so emitting them would fail the 0.3 gate,
  and a prose library has no use for them. Our longest description (747) sits inside VS
  Code's 1024 cap and Claude Code's 1536 per-description cap.

**Priority note:** this phase is listed after the spec-alignment phases but ahead of
Phase 6 on merit — it is the single highest-leverage reach item because it serves Codex,
which the mission already names. It does not depend on Phases 1–4; only 0.1–0.3 (the
gates) should land first. Pull it forward if Codex reach matters sooner.

## Phase 6 — Long-tail agents (explicitly last priority)

The remaining agent ecosystem — Windsurf (`.windsurf/rules/`), Cline/Roo Code
(`.clinerules/`), JetBrains Junie (`.junie/guidelines.md`), Amazon Q / Kiro
(`.amazonq/rules/`), Aider (conventions file) — is deliberately **not** targeted now.
Rationale, recorded so it stays decided:

- Most of these already read AGENTS.md natively or by configuration, so they get the
  digest today without any new code.
- Several are adopting the Agent Skills standard, in which case 5.1 covers them for free
  the moment they ship it — building per-tool rule emitters now would be writing code the
  ecosystem is in the middle of obsoleting.
- The emitter interface makes any one of them a small, independent addition (new file in
  `src/emitters/`, one registry line, one snapshot) if demand shows up.

- [ ] **6.1 (unscheduled) Per-tool emitters on demand (S each).** Only when a real consumer
  asks, and only for tools that have not adopted `.agents/skills/` by then. Until that
  happens, the answer to "does skills-master support tool X?" is: point X at AGENTS.md
  (most support it), or at `.agents/skills/` once 5.1 lands.

## Deliberate non-goals (recorded so they stay decided)

- **Gerund renames** (`swiftui-navigation` → `navigating-swiftui`): Anthropic lists noun
  phrases as an acceptable convention; renames would break every installed lockfile,
  `pairs_with` edge, and registry key for zero measured trigger benefit. Rejected.
- **Dropping `## When to use` as description-redundant:** after activation the section costs
  ~50–80 tokens repeating the trigger, *but* the condensed Cursor/Copilot/AGENTS-adjacent
  projections inject bodies into contexts where the frontmatter description isn't
  necessarily surfaced — there the section is the scoping statement. Keep, unless Phase 3/4
  evals show otherwise.
- **`compatibility` frontmatter:** the spec says most skills don't need it; prose skills
  have no environment requirements. Skip.
- **`allowed-tools`:** experimental in the spec, and meaningless for knowledge skills that
  invoke nothing. Skip.
- **Making canonical `skills/` spec-valid** (folding `globs`/`tags`/`x-skills-master` into
  `metadata`): the spec's `metadata` is flat string→string; our facets are structured, and
  flattening them to strings to satisfy a validator agents never run against the source
  tree is compliance theater. The projections are the conformance surface (1.4). Rejected.
