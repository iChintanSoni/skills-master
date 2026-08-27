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
- [ ] **0.2 Rank the refresh queue by evidence, not date (S).** With 0.1 in place, produce a
  ranked list: skills whose upstream moved since their snapshot, worst first. That list —
  not the 217 — is the actual work queue. Publish it in the weekly report.

## Phase 1 — Refresh what the evidence names

- [ ] **1.1 Pilot the refresh loop on ~10 skills (M).** Take the top of 0.2's queue, verify
  against current vendor docs, update prose, bump `snapshot_date` + `version`. Record for
  each: what changed, or that nothing did. The point of the pilot is to measure the hit rate
  — if half the queue turns out to need no change, the ranking is wrong and 0.1 needs work
  before anyone refreshes 200 skills.
- [ ] **1.2 Spot-check the refresh with an output eval (S).** Pick two refreshed skills whose
  subject moved and run `scripts/output-eval` before and after. If a refresh does not move
  the delta, the refresh was cosmetic. ~$3.
- [ ] **1.3 Work the queue (L, scope from 1.1).** Only after the pilot says the queue is real.

## Phase 2 — Stop the bulk stamp from coming back

- [ ] **2.1 A snapshot date must mean one skill (S).** State it in `docs/authoring.md`: a
  `snapshot_date` records when *this* skill was checked against *its* sources, and a refresh
  sets it per skill as it goes. Deliberately **not** a lint rule — "these 128 dates are
  identical" is indistinguishable from "these 128 skills were genuinely checked on the same
  day", so a rule would fire on honest work and miss the dishonest kind a week later. The
  enforcement that does work is 0.1: a date the upstream evidence contradicts.
- [ ] **2.2 Currency-first authoring guidance (S).** Fold 4.1's finding into
  `docs/authoring.md`: a new skill earns its place by carrying post-cutoff specifics or
  judgment the vendor's docs bury. Restating a stable, well-documented API measurably adds
  nothing — and still costs listing budget.

## Phase 3 — The zero-delta question (evidence first, and genuinely open)

- [ ] **3.1 Measure the zero-delta population (M) — decision item.** 4.1 sampled 8 skills.
  Before concluding anything about the ~300 whose subjects are stable, sample more widely and
  cheaply: 15–20 skills, one task each, one run. ~$12. If the zero-delta rate is as high as
  the pilot suggests, the library has a real question to answer — and it is **not** obviously
  "delete them": a skill that adds nothing to a frontier model may still help a smaller one,
  and it still occupies listing budget either way. Record the numbers; decide after.

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
