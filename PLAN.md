# Currency plan

Working plan for the 2026-08/09 **currency** effort. The previous plan (the Agent Skills
spec-alignment effort) completed except for its one deliberately-skipped item and is
preserved in git history at `7a3c9f4`.

**Why this effort exists.** The last one ended by measuring something nobody had measured:
whether a skill's presence actually improves an agent's answer. Across 8 skills and 4
classes, **every skill about a stable, well-documented subject scored a delta of zero** —
the control missed nothing at all on three of them. The delta came only from post-cutoff
specifics and from judgment the vendor's own docs bury. So the library's value is not
coverage, and it is not prose quality. It is **currency**, plus the small amount of hard-won
judgment that never made it into a doc page.

**Audit question:** which skills are actually current, how would we know, and what does the
library do about the ones that are not?

**Audit verdict (2026-08-27, 433 skills):** **the library is half-refreshed and cannot tell
which half.** Exactly 216 skills were refreshed in the last effort; the other 217 have not
been looked at since a bulk stamp in May or June, and **not one of them contains any
WWDC 2026 or Android 17 material**. Nothing in the toolchain relates a skill's snapshot date
to what its upstream library has shipped since, so staleness is currently a date on a file
rather than a claim about the world.

## Ground rules

Carried forward, because they worked:

- **PR per numbered item.** CI green; Chintan merges. Suggest `#minor` only where noted.
- **One at a time.** Open one PR, wait for the merge, then start the next. Parallel branches
  all edit this file and conflict the moment the first lands.
- **Generated files travel with their cause** — `registry.json`, `docs/taxonomy.md`,
  `plugins/`, in the same PR as any skill edit.
- **Content policy holds.** Original prose, summarized from vendor docs, cited via `sources`,
  never pasted. A refresh bumps `snapshot_date` **and** a `version` patch.

Two added from what the last effort learned the hard way:

- **Run it, don't reason about it.** Three of that effort's assumptions were wrong and each
  was caught only by executing something: the canonical tree fails the spec validator on its
  YAML *dialect* before its extra fields; `cli new` scaffolded a description its own linter
  rejected; and Play Console thresholds picked as a "post-cutoff" test turned out to be
  known to the model. Verify against the artifact, not the belief.
- **A refresh must change something or say why not.** Bumping `snapshot_date` on a skill
  whose subject has not moved is how a library looks maintained while going stale. If a
  re-verification finds nothing, that is a finding — record it and move on.

## Baseline audit findings (2026-08-27)

### The library is two libraries

| | skills | carrying post-cutoff content | oldest snapshot |
| --- | ---: | ---: | --- |
| Refreshed in the last effort | 216 | **118** (55%) | 2026-08-25 |
| Untouched since the bulk stamp | 217 | **0** | 2026-05-30 |

Every snapshot date in the library is one of three values — `2026-05-30` (89),
`2026-06-06` (128), `2026-08-25` (216). Not one skill carries a date of its own, so the
field currently records *when a batch ran*, not when anyone checked that skill. 383 of 433
are still on `version` 1.0.x.

The untouched 217 break down as: `android/design` 51, `android/code` 45, `apple/design` 39,
`apple/code` 25, `android/lang-tooling` 24, `apple/lang-tooling` 20, `android/overview` 8,
`apple/overview` 5.

### Cross-referenced with what the evals found

The output evals say a skill earns its keep through post-cutoff specifics or buried
judgment. The 217 untouched skills contain **zero** post-cutoff specifics by measurement.
That does not prove they are worthless — `viewmodel` scored +8 on judgment alone — but it
does mean the library's least-evidenced half is also its least-current half, and they are
the same skills.

### Upstream is a change feed nobody diffs

The weekly crawl already snapshots vendor endpoints. What it produces:

- **androidx releases:** 124 libraries with releases in the feed; **48 of them map to skills
  we ship** (Media3 → `media3-exoplayer`, Appfunctions → `app-functions`, Datastore →
  `datastore`, …).
- **Apple technologies:** a 407-entry framework index.
- **Android developers blog:** 25 recent posts.

All three are *change* signals, and nothing relates them to a skill's `snapshot_date`. The
crawl reports that a skill is 89 days old; it cannot report that the library the skill is
about shipped four releases in those 89 days. That gap is the first thing to close, because
without it "refresh the stale ones" means "refresh 217 skills by hand and hope".

### What is no longer a problem

Recorded so this effort does not re-solve them: every category now fits the agent listing
budget (44 of 44, worst 0.98×); both "is the install intact" and "is the install current"
are gateable in CI; the emitted projections are validated against the spec's own reference
implementation on every PR; and the trigger/output eval harnesses exist and are cheap to
run (~$0.22 and ~$0.37 a session).

---

## Phase 0 — Make staleness mean something

- [x] **0.1 Relate skills to upstream releases (M).** Extend the crawl so each skill can be
  matched to the upstream libraries it is about, and report, per skill: snapshot date, the
  latest upstream release seen, and whether that release post-dates the snapshot. The
  matching will be imperfect — `Compose UI → choosing-android-testing` is a false positive
  in today's naive version — so the mapping belongs in the skill (`x-skills-master.upstream`,
  a list of feed keys or library names) rather than in a guessing heuristic. Report-only.
  **Landed.** `x-skills-master.upstream` is a declared list of library names as the vendor's
  feed prints them; the crawl joins it to the feeds and writes `reports/currency.json`, and
  the report renders the queue worst-first. Seeded on 20 skills to prove the join.
  **The missing piece was dates, not matching.** The feed nests a day's releases inside one
  dated `<entry>`, and the parser was extracting the inner links while discarding the
  wrapper's `<updated>` — so the crawl could say *what* shipped but never *when*. Carrying
  the entry date down to each link is what makes "behind" computable at all.
  **Declared beats inferred, confirmed by trying it:** naive title matching pairs
  `Compose UI` with `choosing-android-testing` and `Browser` with `car-media-messaging`.
  114 such "matches" for stale Android skills, mostly noise.
  **The uncomfortable first result: the primary Android feed has gone quiet.**
  `androidx-release-notes.xml` carries 658 dated entries from 2025-01-14 to **2026-07-07**,
  and its recent volume is 83 (Feb), 109 (Mar), 78 (Apr), 53 (May), **1 (Jun), 1 (Jul)** —
  with the feed's own `<updated>` timestamp being yesterday, so this is not a fetch failure.
  Exactly **one** library (Media3) has shipped since 2026-05-25, and the skills tracking it
  were refreshed in August. So the queue is legitimately empty today, and that says more
  about the signal source than about the library.
  **What that means for 0.2:** an empty queue built on one feed is not evidence of currency.
  Before ranking anything, 0.2 has to widen the sources — per-library release pages rather
  than the roll-up feed, the Android developers blog (25 recent posts, currently unused for
  this), and an Apple equivalent, since Apple's endpoints are a framework *index* with no
  dates at all. Until then the honest report is "we cannot tell", which is what it now says.
- [x] **0.2 Rank the refresh queue by evidence, not date (S).** With 0.1 in place, produce a
  ranked list: skills whose upstream moved since their snapshot, worst first. That list —
  not the 217 — is the actual work queue. Publish it in the weekly report.
  **Landed for Android; Apple is still blind (see 0.3).** The ranking was already written in
  0.1 — what was missing was a source telling the truth. Two bugs, both silent:
  **(1) The androidx feed is stalled, and the real page is fine.** `all-channel` lists
  releases every week through 26 August while `androidx-release-notes.xml` stops at 7 July.
  The crawl now parses the page (dated `<h2>` headings, one `<ul>` of library links each),
  and endpoints carry a `format` so a source can be HTML rather than a feed.
  **(2) The fetch was being served Arabic.** Node's `fetch` sends no `Accept-Language`, the
  CDN content-negotiated, and the date headings came back as `أحدث إصدار` — which
  `Date.parse` rejects, so the parser found *zero* releases and reported everything current.
  A localization bug that presents as good news is the worst kind. Fixed with `?hl=en` plus
  an explicit header, and both are commented as load-bearing.
  **The queue, first real run:** 5 of the 20 seeded skills are behind —
  `app-widgets-glance` (80 days, **8 releases**), `wear-compose` (80 days, **14**), `paging`,
  `datastore`, `hilt-di`. That is Phase 1's input, and it is evidence rather than a date.

- [x] **0.3 Give Apple a dated source (M).** Nothing here can flag an Apple skill: the three
  Apple endpoints are a framework *index* and two taxonomies, with **no dates at all**, so
  every `hig-*` and Swift skill is invisible to the currency report no matter how stale.
  Candidates to evaluate, cheapest first: the per-framework "Updates" pages Apple publishes
  under `developer.apple.com/documentation/updates`, the release-notes RSS, and WWDC session
  metadata. Until one lands, the report should say Apple is unmeasured rather than imply it
  is current — the same honesty 0.2's Arabic bug argues for.
  **Landed: Apple's per-framework "updates" pages.** `/documentation/updates/<framework>`
  carries dated `## June 2026` headings — the only dated Apple content found. The index
  lists 208 such pages; the crawl fetches only the ones skills declare, because a crawl
  making 208 requests to answer a question about 20 skills is one somebody eventually turns
  off. 21 Apple skills seeded, resolving to **12** dated framework pages.
  **Month granularity, not day.** A heading says "June 2026", so the report reads it as the
  1st and cannot say *how far* behind — only whether. That is enough for a queue and is
  stated rather than smoothed over.
  **Two bugs found by looking at the output instead of the summary.** (1) `upstream.json`
  was written *before* the Apple topics were merged in, so the report used them and the
  artifact on disk never had them — invisible unless you opened the file. (2) `Date.parse
  ("June 2026 01")` yields **local** midnight, which `toISOString` renders as **31 May** in
  any timezone east of UTC; every Apple date was silently a day early. Both fixed, the
  second with an explicit `Date.UTC`.
  **Still unmeasured, and now named in the report rather than implied current:** `CloudKit`
  and `Observation` have no updates page at all, and every `hig-*` design skill tracks a
  guideline rather than a framework, so nothing dates them. That is roughly half the Apple
  library still invisible — better than all of it, and worth stating plainly.

## Phase 1 — Refresh what the evidence names

- [x] **1.1 Pilot the refresh loop on ~10 skills (M).** Take the top of 0.2's queue, verify
  against current vendor docs, update prose, bump `snapshot_date` + `version`. Record for
  each: what changed, or that nothing did. The point of the pilot is to measure the hit rate
  — if half the queue turns out to need no change, the ranking is wrong and 0.1 needs work
  before anyone refreshes 200 skills.
  **Piloted on the whole queue — all 5, since that is what Phase 0 produced. Hit rate: 2 of
  5.** Two carried material change and were refreshed; three did not, and the reason is
  visible in the version string.
  **Refreshed — `app-widgets-glance`** (8 releases behind): Glance 1.2.0 went stable and
  raised its own `minSdk` from 21 to 23, and `glance-wear-tiles` is deprecated in favour of
  `androidx.glance:glance-wear` — the skill was recommending the deprecated artifact by
  name. It also carried a confusing "with `minSdk 16`" phrasing that read as API 16 when it
  meant the Android 16 baseline; rewritten.
  **Refreshed — `wear-compose`** (14 releases behind): the skill pinned 1.5 while stable had
  moved to 1.6.2 with 1.7 in beta, and it had no mention of the Wear Compose **Navigation 3**
  integration (`SwipeDismissableSceneStrategy`) or `LocalAmbientModeManager`. Both added,
  `requires` moved to 1.6.
  **Not refreshed, and this is the useful half of the result:** `paging` (3.5.1, a patch),
  `datastore` (1.3.0-**alpha**10), `hilt-di` (1.4.0 — checked rather than assumed: a
  stabilisation release whose only developer-facing change, the simplified
  `rememberHiltViewModelFactory()`, shipped in April, *before* the skill's June snapshot).
  Bumping `snapshot_date` on these would be exactly the "looks maintained while going stale"
  move this plan's ground rules forbid.
  **So the queue needs a materiality filter, not just recency** — see 1.4. Ranking by
  "something shipped" put an alpha and a patch alongside a new stable major.
- [x] **1.2 Spot-check the refresh with an output eval (S).** Pick two refreshed skills whose
  subject moved and run `scripts/output-eval` before and after. If a refresh does not move
  the delta, the refresh was cosmetic. ~$3.
  **Landed. One refresh moved the answer; the other moved it backwards.** `--baseline=<ref>`
  now adds a third arm holding the skill as of a git ref, so the same harness answers "did
  this refresh change anything".
  `wear-compose`: **100% refreshed / 83% stale / 67% no skill**, +17. But only one of its two
  added facts did the work — the Navigation 3 integration was invisible without the skill,
  while `LocalAmbientModeManager` came out of the **stale** arm too, because the old skill's
  ambient section got the model to the right neighbourhood unaided. 1.1's "2 of 5 entries
  were real" becomes "1 of 2 facts inside a real refresh was real" a level down.
  `app-widgets-glance`: **all three arms 100%** — the refresh moved nothing — **and it
  introduced an error.** 1.1 wrote "reach for `androidx.glance:glance-wear`", a coordinate
  that has never been published; the real successor is `androidx.glance.wear:wear` +
  `wear-core`, still `1.0.0-alpha17`, so the advice was wrong even spelled correctly. Fixed
  here, and the corrected skill scores 100% against 88% for the control.
  **The finding that outranks both numbers:** the *stale* arm was not misled — it said "the
  skill guidance I loaded still references it as a live option; it isn't" and routed around
  it — while the *refreshed* arm repeated the error. And the bare model had already named
  that coordinate **with a hedge** ("could not confirm it has shipped; treat it as announced,
  not available"), which is almost certainly where the refresh got it, minus the hedge. A
  refresh drafted with model help inherits the model's guesses. **Stale is a slow leak;
  wrong is a hole, and refreshing is how you make one.**
  **And the method nearly lied.** The first grading said "refresh moved +33" because I wrote
  the assertions from my own diff — measuring agreement, not correctness; the stale arm
  scored 0% for the most accurate answer of the three. Rewriting them from the vendor release
  pages inverted the result. Two instrument faults fixed alongside: an empty answer was being
  graded 0% (the skill arms starved on `--max-turns 3`), and the grader's negation guard read
  a hedge as an endorsement. ~$10.89, not ~$3 — a wasted run before the empty-answer fix, a
  third arm, and a confirmation pass after the correction.
- [ ] **1.3 Work the queue (L, scope from 1.1).** Only after the pilot says the queue is real.
  1.1 says it is **partly** real — 2 of 5 — so this waits on 1.4 rather than starting now.
  1.4 has landed, so this is unblocked. But 1.2 changed what it should look like: a refresh
  can make a skill **wrong**, and today's queue (`hilt-di` new-minor, `paging` patch,
  `datastore` pre-release) contains nothing 1.1 did not already judge immaterial. Working it
  now would spend edits to change nothing, at the one risk this plan has evidence for. Every
  claim a refresh adds needs a vendor page open next to it, not a model's recollection.

- [x] **1.4 Rank by materiality, not just recency (S).** 1.1's three misses are all
  identifiable from the version string alone: `3.5.1` is a patch, `1.3.0-alpha10` is an
  alpha, and a stable whose changes all predate the skill's snapshot brings nothing new.
  Weight the queue accordingly — a new stable minor or major outranks a patch, and a
  pre-release ranks last or is excluded outright. Cheap, mechanical, and it roughly doubles
  the hit rate before anyone spends time on a refresh that changes nothing.
  Worth checking at the same time: `releasesSince` currently counts *entries*, so a library
  shipping alpha weekly outranks one that shipped a considered stable release. Count what
  matters instead.
  **Landed — but the filter this item proposed would have been wrong 2 times in 5, so it is
  not what shipped.** Modelling it against 1.1's own results first: it would have **dropped
  `wear-compose`**, the biggest real defect, because everything Wear Compose shipped after
  the snapshot was a pre-release — its 1.6.2 stable landed *before* the bulk-stamped date.
  And it would have **promoted `hilt-di`**, which had nothing, because 1.4.0 looks like a
  minor release. Version strings are a weak proxy for materiality in both directions.
  **What shipped instead: version lag, which is what both successful refreshes actually
  were.** `upstream` entries may now pin the documented version — `Glance@1.2` — and a skill
  whose pinned version trails current stable is ranked above everything else. That signal is
  independent of dates, which is why it catches staleness a bulk `snapshot_date` hides —
  exactly the `wear-compose` case.
  Below it, rows are ranked and **labelled** by why they are in the queue: `new minor/major`
  > `patch only` > `pre-release only`. Pre-releases are ranked last rather than filtered
  out, because a queue that silently drops things is a queue that starts lying.
  **Honest limit:** `hilt-di` still ranks top today under `new minor/major`, and 1.1 showed
  1.4.0 was a stabilisation release with nothing new. The label says what the ranking is
  based on so a reader can discount it — a cheap proxy that shows its working, not an
  oracle.

## Phase 2 — Stop the bulk stamp from coming back

- [x] **2.1 A snapshot date must mean one skill (S).** State it in `docs/authoring.md`: a
  `snapshot_date` records when *this* skill was checked against *its* sources, and a refresh
  sets it per skill as it goes. Deliberately **not** a lint rule — "these 128 dates are
  identical" is indistinguishable from "these 128 skills were genuinely checked on the same
  day", so a rule would fire on honest work and miss the dishonest kind a week later. The
  enforcement that does work is 0.1: a date the upstream evidence contradicts.
  **Landed** as "A snapshot date means one skill", placed immediately before the `upstream`
  section it hands off to. Written against the library's actual state rather than in the
  abstract: **all 433 skills carry four distinct dates** — 216 / 126 / 89 from bulk stamps,
  and **2** set per skill by the refresh loop. So a date here mostly records when a batch
  ran; the doc says that outright, because a rule that pretends the library already complies
  is a rule nobody believes. The "not a lint rule" reasoning is stated with both failure
  directions — it fires on honest bulk re-verification, and is defeated by stamping the
  dishonest kind a day apart.
  Extended past the item with 1.2's finding: a bump is a *claim*, and the cheap half is
  editing the field. A date bumped without re-reading the sources is worse than a stale one,
  which is not a hypothetical — 1.2 caught exactly that, on a skill that looked maintained.
- [x] **2.2 Currency-first authoring guidance (S).** Fold 4.1's finding into
  `docs/authoring.md`: a new skill earns its place by carrying post-cutoff specifics or
  judgment the vendor's docs bury. Restating a stable, well-documented API measurably adds
  nothing — and still costs listing budget.
  **Landed** as "What earns a new skill", ahead of the scaffold section, because it decides
  whether to scaffold at all. It opens on the question the evidence supports — *what does the
  model get wrong today without this skill?* — and carries the numbers rather than the
  slogan: every stable-subject skill in the 8-skill sample scored a **zero** delta, and
  `crash-anr-vitals` is written up as the case where my guess about *why* a skill wins was
  wrong even though the delta was real.
  Two guards added that 4.1 alone would not have justified. **It is not a delete argument** —
  3.1 is open and a skill worth nothing to a frontier model may still be worth something to a
  smaller one. And **it is not a licence to guess at what is new**: 1.2 caught a refresh
  inventing an artifact, so the section says a currency claim is only worth carrying if it
  came from a vendor page you had open. Mirrored as a "Currency policy" paragraph in
  `CLAUDE.md`, next to the content and trigger policies, since that is the file agents
  actually read before authoring.

## Phase 3 — The zero-delta question (evidence first, and genuinely open)

- [x] **3.1 Measure the zero-delta population (M) — decision item.** 4.1 sampled 8 skills.
  Before concluding anything about the ~300 whose subjects are stable, sample more widely and
  cheaply: 15–20 skills, one task each, one run. ~$12. If the zero-delta rate is as high as
  the pilot suggests, the library has a real question to answer — and it is **not** obviously
  "delete them": a skill that adds nothing to a frontier model may still help a smaller one,
  and it still occupies listing budget either way. Record the numbers; decide after.
  **Landed. 15 skills by even stride across the path-sorted library, one task each: 14 zero,
  1 positive, 0 negative. $9.74.** The one winner (`compose-custom-layouts`, +25) is the
  hardest *construction* task in the set — the control got the structure right and botched
  the constraint relaxation. Note what did **not** win: `car-app-library` and
  `tvos-media-playback` are niche framework surfaces and the control handled both, so the
  predictor is task difficulty and recency, **not** how specialised the topic is.
  Sampling matters here and is the reason this is a separate item from 4.1: that sample was
  stratified to over-represent recent subjects, which is right for "where does the delta come
  from" and wrong for "how much of the library has one".
  **Four caveats, all cutting against over-reading it,** are in the README: one task cannot
  characterise a skill; the grader scores *concept coverage*, not prioritisation or code
  quality, and saturates exactly where controls are strong; several assertion sets were drawn
  partly from the skills' own guidance, so the bias favours the skill and the zero rate is if
  anything understated; and two skills scored below 100% in **both** arms, which is the
  evidence that the ties are real rather than a loose regex handing out full marks.
  **The decision stays open, as designed.** What this settles is that the library's value is
  **concentrated, not evenly spread** — about one skill in seven changes what a frontier model
  produces. What it does not settle is the trade between listing budget (argues for pruning)
  and the readers this did not measure: smaller models, agents with less context, humans
  (argues against). That needs its own evidence rather than an inference from this table.

## Carried forward, undone on purpose

- **3.2 from the previous plan — the trigger-eval pilot (~$130).** Still unrun. The budget
  work removed the confound that would have muddied it, and 3.3/3.4 acted on the parts that
  did not need it. Run it only if a specific description is suspected, not for completeness.

## Deliberate non-goals

- **Refreshing all 217 by date.** That is the bulk stamp again, wearing a different hat. The
  queue comes from evidence of upstream change (Phase 0) or it does not exist.
- **Deleting zero-delta skills before 3.1 reports.** The sample is 8 skills deep.
- **Re-opening packaging.** 44 of 44 categories fit the listing budget; adding skills is what
  will break that, and the crawl already reports it.
