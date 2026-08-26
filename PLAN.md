# Improvement Plan

Working plan for the 2026-08 improvement effort. Each numbered item is one branch + PR;
check items off as they merge. Baseline audit date: **2026-08-25** (lint clean, typecheck
clean, 24/24 tests passing, 393 skills).

**Mission:** this library exists to give coding agents (Claude Code, Codex, Cursor,
Copilot) an edge. Every decision below optimizes for that: content must be current and
high-signal, emitted output must actually reach agent context intact, and skill
descriptions must trigger reliably. Content that an agent never sees (orphaned resources,
broken emit formats) is a bug, not a nice-to-have.

## Ground rules

- **PR per item.** One branch + PR per numbered item below; CI must be green; Chintan merges.
- **Tooling gates before content.** Phases 0–2 land before bulk content edits so every
  content change is machine-checked.
- **Generated files travel with their cause.** Any skill edit regenerates
  `registry.json`, `docs/taxonomy.md`, and `plugins/` in the same PR.
- **Content policy holds.** New/refreshed prose is original, summarized from official
  vendor docs, linked via `sources` — never pasted. Every re-verified skill bumps
  `snapshot_date` and `version` (patch for re-verify, minor for substantive rewrite).
- **Release tags.** Suggest `#minor` in the merge commit for PRs that add CLI commands
  (9.1, 9.2); everything else defaults to patch.

## Baseline findings (2026-08-25)

- **Staleness:** whole library carries two bulk stamps — apple `2026-05-30` (9 days
  before WWDC 2026), android `2026-06-06`. All 393 skills still `version: 1.0.0`;
  zero mentions of iOS 27 / WWDC 2026 / Android 17. 6 dead URLs (9 occurrences).
- **Structure:** 175/176 Level-3 files unlinked from bodies (invisible to non-claude
  emitters); `reference.md` documented everywhere, zero on disk; 5 skills at wrong
  directory depth; 303/393 with empty `pairs_with`; only 3 `emerging` skills.
- **Coverage:** android has no graphics/games category; apple has no code-side
  watchOS/tvOS/CarPlay skills while 123 apple skills claim `watchos`; 7 overviews
  missing their sibling-domain counterpart.
- **CLI:** `add --no-commit` poisons consumer `.gitignore` with `.github`/`AGENTS.md`;
  `doctor` always exits 0; AGENTS.md emit nests h2 under h3; "Swiftui Navigation"
  title-casing; committed `registry.json` never read at runtime (architecture.md says
  it is); dead programmatic API + dead conflict plumbing; 7 silent `catch {}` sites.
- **Tests:** `core/lint.ts` (the CI gate for all content) has zero coverage; so do
  `bin.ts`, `init`, `catalog`, `content/source.ts`; `update`'s source-changed path
  untested; no coverage reporting.
- **Infra:** `corepack pnpm` (the documented invocation) fails on the 11.5.1 pin;
  no TS formatter/linter; weekly crawl uploads an artifact nobody reads; `LICENSE`
  absent from npm tarball; Node engine ranges disagree (`>=20` vs `>=22` vs CI 22).

---

## Phase 0 — Infra unblockers

- [x] **0.1 Fix pnpm invocation + engines (S).** Make `corepack pnpm install` work again
  (align `packageManager` with what corepack resolves, or add `devEngines.packageManager`);
  align Node engines to `>=22` across root, CLI `package.json`, and `tsup` target;
  update CLAUDE.md if the documented command changes.
- [x] **0.2 Publish metadata (S).** Ship `LICENSE` in the npm tarball; drop shipped
  sourcemaps or include them deliberately; fix Zod deprecations (`z.string().url()` →
  `z.url()`, `.passthrough()` → `z.looseObject()`).
- [x] **0.3 TS formatter/linter (M).** Add Biome (single tool: format + lint), format the
  package once, wire a CI check. Keep rules light — codify the existing style.

## Phase 1 — CLI correctness

- [x] **1.1 `.gitignore` poisoning (S).** `add` with `commit: false` writes target *roots*
  (`.github`, `AGENTS.md`) to consumer `.gitignore` (`commands/add.ts:114`). Introduce
  per-emitter ignorable paths; only ignore files the emitter owns. Add regression test.
- [x] **1.2 Exit codes & help-text correctness (S).** `doctor` gets `exitOnFalse` so drift
  fails CI (`bin.ts:172`); fix `new`'s help string (says 3 segments, parser needs 4);
  rename value-taking `--version` on `registry build`/`marketplace build` to
  `--set-version`; add the ~17 missing option descriptions; add `.catch()` on
  `parseAsync`.
- [x] **1.3 Emitter output bugs (S).** Demote body headings under the `###` title in the
  AGENTS.md emitter; teach `titleFromName` compound tokens (SwiftUI, SwiftData, watchOS…);
  re-record snapshots; refresh the committed dogfood outputs under `packages/cli/`.
- [x] **1.4 Error handling honesty (M).** `update` must distinguish "skill deleted
  upstream" from load errors; `resolveContent` errors on nonexistent `--content` path;
  config/lockfile parse failures name the file instead of dumping raw Zod; wrap
  `fetchRemote` failures with actionable hints; guard the cache-dir wipe on empty ref;
  fix `remove` over-reporting when target filtering empties the set.
- [x] **1.5 Delete dead surface (S).** Remove `src/index.ts` (unbuilt programmatic API),
  `onConflict` plumbing, `setQuiet`, `readBlock`/`readBlockVersion`,
  `DetailedWriteResult.before/after`, `CondenseOptions.fullSkillNote`, unused
  `scope`/`generatedAt` schema fields. (Decision: CLI-only package, per Chintan.)
- [x] **1.6 Registry fast path + perf (M).** Make `ContentSource` actually read the
  committed `registry.json` (falling back to a scan), as `docs/architecture.md` already
  claims; memoize `skillDirs()` (kills the O(n²) walk in `marketplace build`); update
  architecture.md if behavior ends up differing.
- [x] **1.7 Auto-detect heuristics (S).** Copilot currently triggers on `.github` existing
  (nearly always true); AGENTS.md only on the file pre-existing (nearly always false).
  Rebalance and document detection rules.
- [x] **1.8 Agent-consumption audit (M).** Verify each emitted format against what the
  consuming agent actually reads today: Claude Code skill frontmatter + description-based
  triggering, Cursor `.mdc` rule fields and glob semantics, Copilot `applyTo` instructions,
  AGENTS.md conventions. Check emitted block token weight is proportionate. Audit skill
  `description` fields as trigger phrases ("Use when…" quality) since that is what makes
  an agent load the skill at the right moment. Findings feed Phases 3–7.
  **Findings (2026-08-25):** cursor emitter fully current (comma-string globs,
  `alwaysApply: false` + description = "Apply Intelligently"); claude emitter
  spec-portable (x-skills-master stripped; name/description caps match the Agent
  Skills spec; optional future: spec-legal `metadata` map for provenance);
  copilot `applyTo` string format correct, `excludeAgent`/`description` newly
  available; AGENTS.md now read natively by Cursor and Copilot, nesting is
  standard. Two defects found → items 1.9/1.10. Description audit: all 393
  carry "use when", only 18 lead with it → fold into 7.2/7.3 passes.
- [x] **1.9 AGENTS.md digest (M).** Blocks averaged ~1.9k tokens (755k for a
  full install) in a file consumers inject wholesale on every request; the
  emitter's "summarized aggressively" comment was aspirational. Blocks now
  carry description + top-6 Core guidance bullets + top-3 Pitfalls + pointer
  (mean ~584 tokens, 3.3x lighter), with L3 links flattened.
- [x] **1.10 Copilot applyTo scoping (S).** 176 glob-less skills emit
  `applyTo: "**"`, attaching them to every Copilot request. Omit `applyTo`
  for glob-less skills (manual attach + always-loaded pointer line instead).

## Phase 2 — Linter gates (protect all later content work)

- [x] **2.1 Taxonomy-depth lint rule (S).** Error when a skill's on-disk path isn't
  `domain/class/category/name` or the directory doesn't match frontmatter
  `class`/`category`. (Catches the 5 current offenders.)
- [x] **2.2 Rule tightening (S).** Error on `## Open question` in non-`contested` skills
  (reverse direction of existing rule); warn on >3 `sources` (authoring.md says 1–3);
  warn on L3 files present but unlinked from the body.
- [x] **2.3 lint.ts test suite (M).** Unit tests for every rule in `core/lint.ts` —
  duplicate names, `pairs_with` reciprocity, future `snapshot_date`, YAML `" #"`
  truncation, body caps, canonical headings, plus the new 2.1/2.2 rules. Add fixture
  skills as needed.

## Phase 3 — Content structural fixes

- [x] **3.1 Re-home the 5 mis-placed skills (S).** Move 4 apple overviews to
  `apple/overviews/overviews/<name>` and `hig-sheets` up to `design/components/`;
  regenerate registry/taxonomy/marketplace (marketplace build prunes old plugin paths).
- [x] **3.2 Link all orphaned L3 files (M).** Add body links (`## References` or inline)
  to `examples.md`/`checklist.md` in all ~90 affected skills so condense/pointers work
  in every emitter; spot-check emitted output for both modes.
- [x] **3.3 Dead links + small conformance (S).** Replace the 6 dead URLs; fix the 2
  `stable` skills carrying `## Open question`; add "Use when" to the 3 noncompliant
  descriptions; add `globs` to the 2 bare `code` skills; trim the 39 skills with >3
  sources.
- [x] **3.4 `reference.md` decision (S).** Either author `reference.md` where depth
  genuinely exists to be split out, or remove it from authoring.md/emitters.md/registry
  schema so docs stop promising a file type with zero instances. (Default: remove from
  docs now; reintroduce when a real one exists.)

## Phase 4 — Targeted staleness refresh (WWDC 2026 / I/O 2026)

- [x] **4.1 Apple refresh shortlist (S).** From the WWDC26 guides, map announcements to
  affected skills (expect: swiftui lists/toolbars/navigation/sheets/error-handling,
  liquid-glass adoption, app-intents/Siri, documents, Xcode/tooling). Commit the
  shortlist into this file under 4.2.
- [x] **4.2 Apple re-verification pass (L).** Re-verify each shortlisted skill against
  current docs; note iOS 27 changes where behavior shifted; mark moved-fast areas
  `emerging`; bump `snapshot_date`/`version`. Batch PRs by category.
- [x] **4.3 Android refresh pass (L).** Compose-first is now official policy: revisit
  Views-adjacent guidance and stability labels; fold in Android 17 behavior changes
  (mandatory large-screen resizability, local-network restrictions, certificate
  transparency) into the affected skills; bump stamps/versions. Batch by category.
- [x] **4.4 Refresh the rest honestly (S).** Skills reviewed and found unchanged get a
  `snapshot_date` bump only when actually re-verified — never a blind bulk stamp.

## Phase 5 — New skills: headline APIs (all `emerging`)

- [x] **5.1 iOS 27 SwiftUI additions (M).** ~4–6 skills: new Document API
  (ReadableDocument/WritableDocument family), toolbar overflow/priority model,
  list reordering, error-presentation bindings; update `adopting-liquid-glass` for
  automatic adoption.
- [x] **5.2 Android 17 / Compose-first additions (M).** ~3–5 skills: Android 17
  migration/behavior changes, media lifecycle toolkit (CameraX Viewfinder composable,
  Media3 AI Effects), Compose-first architecture implications; update relevant overviews.

## Phase 6 — New skills: structural gaps

- [x] **6.1 `android/code/graphics-games` (L).** ~8 skills mirroring apple's category:
  Vulkan, AGDK, game loops/input, Play Games Services, Play Asset Delivery, performance
  (ADPF), etc.
- [x] **6.2 `apple/code/form-factors` (L).** ~8–12 skills: watchOS apps + complications +
  workout/health patterns, tvOS apps + focus engine, CarPlay, visionOS spatial patterns.
  Resolves the 123-skills-claim-watchos contradiction together with 7.3.
- [x] **6.3 Overview parity (M).** 7 `choosing-X` overviews: apple gains di,
  background-work, form-factors, image-loading, web-integration counterparts; android
  gains graphics-tech and widget-tech.
- [x] **6.4 Design gaps (M).** **Resolved as not-a-gap — no skills added.** Both halves
  assumed the two domains should carry matching `design` categories; they should not.
  Apple's HIG has an **Inputs** section and folds color/typography/motion/icons into
  **Foundations**; Material 3 is **foundations/styles/components**, with a **Styles**
  section and no Inputs section. So `apple/design` correctly lacks `styles`, and
  `android/design` correctly lacks `inputs` — its input guidance already lives, with real
  depth, in `design/platforms/m3-{wear,tv,large-screens,chromeos-desktop}`,
  `design/patterns/m3-gestures`, and `design/foundations/m3-interaction-states`. Adding
  ~6 `android/design/inputs` skills would have duplicated that coverage and misrepresented
  Material's structure. Rationale documented in `docs/architecture.md`
  ("Categories mirror the vendor, not each other").

## Phase 7 — Metadata full sweep (after content lands)

The library grew to **433 skills** across phases 5–6, so the baseline counts below are
restated against that total.

- [x] **7.1 `pairs_with` build-out (L).** Dedicated pass over all 433: design↔code twins,
  overview↔implementation links, lang-tooling pairs. Keep the bidirectional invariant;
  land per-domain PRs.
  - [x] **apple** — 46 → 188 edges; unpaired 139/208 → 1 (`core-bluetooth`, which has no
    genuine partner). What earns a pair is now written down in `docs/authoring.md`
    ("What earns a pair"): design↔code twin, overview↔its destinations, or a tight couple —
    with wider cross-references left to `## See also`. A new linter warning caps the list
    at 4 so the facet stays a signal rather than a dump. Metadata-only: `x-skills-master`
    is stripped from every projection, so no `version`/`snapshot_date` moved.
  - [x] **android** — 50 → 232 edges; unpaired 136/225 → 2 (`m3-sharing`, `nfc`). Material
    has no single "M3 components" code skill the way SwiftUI has `swiftui-forms-controls`,
    so the 25 `m3-*` component skills pair to the design siblings you actually need
    alongside them (`m3-icon-buttons` ↔ `m3-icons` + `m3-tooltips`) rather than to a code
    twin that does not exist. Worth a future coverage item, not a pairing fudge.
- [x] **7.2 Stability re-audit (M).** Re-judge `stable` vs `emerging` per skill (17/433
  `emerging` is implausible); `contested` skills present tradeoffs per authoring.md.
  The label had no written definition — only `contested` did — so the pass began by
  defining all three in `docs/authoring.md` ("What `stability` means"): `emerging` tracks
  **the subject**, not the skill's age, and means pre-1.0 at `snapshot_date`, first cycle
  unrevised, or visibly still moving. 11 changes on that rule: 9 stable → emerging (the
  four Jetpack XR skills and `m3-ai-glasses`/`m3-xr`, all on the Developer Preview 4 /
  `1.0.0-beta02` track; `uwb-ranging` at `1.0.0-alpha09`; `gemini-nano-aicore` and
  `choosing-ml` for the beta Prompt API) and 2 emerging → stable (`media3-transformer`,
  mature since 1.0; `controls-widgets`, two full cycles old). 17 → 24 emerging.
  All 9 newly-emerging skills already flagged provisionality in prose, so label and body
  agree. Contested set verified and unchanged at 7 — each carries a real `## Open question`
  laying out both cases. `choosing-http-client` was considered and rejected: it prescribes
  a default with a clear rule, which is settled, not contested.
- [x] **7.3 Platforms honesty pass (M).** Stop claiming watchOS/tvOS/visionOS on skills
  with no form-factor content; make the facet discriminating again (watchos 137, tvos 150,
  visionos 174 of 433 today). Like `stability`, the facet had no written meaning
  ("free-form per domain"), so `docs/authoring.md` now defines it ("What `platforms`
  means"): it answers *for which platforms does this skill carry guidance you would act
  on*, not where the API happens to compile. Availability stays in `requires` and prose.
  A domain-wide skill with nothing platform-specific to say gets `platforms: [apple]`.
  Apple: **56 skills changed** — watchos 137 → 100, tvos 150 → 99, visionos 174 → 127,
  ios 187 → 148, ipados 188 → 135, macos 171 → 136, with 56 gaining the new `apple` value.
  Android: **13 changed** — large-screen 154 → 145, android-tv 8 → 6, chromeos 9 → 7,
  xr 6 → 5. Android's convention was already sound (its large-screen notes are real
  guidance: "ensure `contentIntent` opens the correct split-pane destination"), so the
  disease was almost entirely apple's — 121 of 208 skills claimed all six OSes.
  The vocabularies stay different on purpose, per `docs/architecture.md`: apple has six
  co-equal OSes, android has one baseline plus form factors.
  **A linter rule was considered and rejected.** A domain-agnostic check ("claimed platform
  must appear in the body") false-positives badly, because bodies use product names —
  `hig-charts`, `hig-sheets` and `hig-toolbars` all say "iPhone", never "iOS". Getting it
  right needs a per-domain synonym map, which would hardcode domain vocabulary into a
  linter the schema deliberately keeps domain-agnostic.
- [x] **7.4 Tag consolidation (M).** 543 of 887 tags are used once. Define a canonical
  vocabulary (or drop tags), lint against it. **Neither, on the evidence.** `tags` reach no
  emit target and nothing groups by them — `domain`/`class`/`category`/`platforms` already
  do the faceting — so their one job is feeding `search`. Measured against that job, 76% of
  tag instances were already findable via the skill's own name/description/facets, and of
  the 165 terms that would have gone dead without tags, **118 were pure spelling variants**
  (`wear-os` ← "Wear OS", `ios17` ← "iOS 17", `async-await` ← "async/await").
  So the fix was mostly in the matcher, not the vocabulary: `search` now compares on letters
  and digits alone (`core/search-text.ts`), which makes "wear os", "wear-os" and "WearOS"
  equivalent for every query, not just tagged ones. Tags are then redefined as what is left
  — **a search term the skill is not already findable by** — and pruned to it:
  887 → 204 distinct, 2307 → 343 instances, 186 skills now carry none.
  Survivors are real synonyms no normalization would produce: `i18n`, `nlp`, `cryptography`,
  `biometrics`, `monetization`. A linter warning holds the rule (three tests), and unlike
  7.3's rejected rule this one needs no vocabulary map — it compares the tag against the
  skill's own text. Verified no recall was lost: replaying all 896 former tag and facet
  terms as queries, **0 lost a hit and 234 returned strictly more**.
- [x] **7.5 Surface `stability` to the agent (S)** *(found during 7.2)*. `stability` is
  stripped with the rest of `x-skills-master`, so it reached no emit target — an agent
  could not tell `emerging` guidance from settled guidance. `core/stability-note.ts` now
  turns a non-`stable` label into a one-line blockquote at the top of the emitted body, and
  all four emitters carry it; `stable` skills are untouched, so the committed dogfood output
  (`swiftui-navigation`, stable) does not move. The AGENTS.md digest was the worst case and
  is the biggest win: it drops `## Open question` along with every other section, so a
  contested skill previously read there as settled fact. 31 skills gain a banner (24
  emerging + 7 contested) for about 1.5k tokens across a full AGENTS.md install — roughly
  0.6% on top of what 1.9 brought it down to. Deterministic: the only variable is the
  authored `snapshot_date`. Docs corrected in three places — `authoring.md` asserted the
  opposite ("`stability` never reaches the consuming agent today"), and `emitters.md`
  claimed the agents emitter summarizes `## Open question`, which stopped being true at 1.9.
  - [ ] **Dead surface found:** `CondenseOptions.openQuestion: "summarize"` and
    `summarizeOpenQuestion()` are exercised only by their own tests — no emitter has passed
    that option since the 1.9 digest landed. Candidate for the 1.5-style deletion pass;
    left in place here to keep this PR to one concern.

## Phase 8 — CLI test depth

- [ ] **8.1 E2E gaps (M).** `init` end-to-end; `update` with an actually-changed source;
  `doctor`'s three failure modes; conflict/skip path (hand-edited file, no
  `--overwrite`); `remove --target` subset; `commit: false` gitignore behavior;
  multi-skill AGENTS.md block composition.
- [ ] **8.2 Unit gaps + coverage reporting (M).** `catalog` filters/`--json`,
  `content/source.ts` resolution chain, `markers.ts`, `project.ts` round-trip,
  `parseTargets`; add `@vitest/coverage-v8` with a CI summary so gaps stay visible.

## Phase 9 — CLI UX

- [ ] **9.1 `status` command (M).** Show installed skills from lockfile: versions, targets,
  edited/drifted state (shares doctor's detection). `#minor`.
- [ ] **9.2 `sync` command (M).** Re-emit from current config — covers added targets and
  edited paths that `update` never repopulates. `#minor`.
- [ ] **9.3 Scripting + docs polish (S).** `--json` on `search`/`view`/`doctor`; persist
  `--target`/`--ref` on `add` into existing config; document all 12 commands in the CLI
  README.

## Phase 10 — Staleness that surfaces itself

- [ ] **10.1 Crawl → visible report (M).** Weekly crawl writes a GitHub job summary and
  opens/updates a pinned issue with staleness top-N + link-check results (fold
  `check-links.mjs --strict` into the crawl job); artifact stays for the raw JSON.

---

## Status log

| Date | Item | PR | Notes |
|------|------|----|-------|
