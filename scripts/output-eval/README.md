# Output evals

Does having the skill beat the model's own knowledge?

`scripts/trigger-eval` asks whether a skill *fires*. This asks the harder question the library's mission rests on: when it does fire, is the answer better than the one the model would have given anyway?

```bash
node scripts/output-eval/bin.mjs viewmodel --dry-run    # free
node scripts/output-eval/bin.mjs viewmodel --runs=1 --json=/tmp/out.json

# …and: did refreshing this skill change the answers, or only the file?
node scripts/output-eval/bin.mjs app-widgets-glance --baseline=69b4d2c~1
```

Same prompt, same model, two scratch projects — one with the skill installed, one bare. Each answer is graded against assertions, and the report is the **delta** between the arms. `--baseline=<git-ref>` adds a third arm holding the skill as it was at that ref.

## Results (2026-08-27, 8 skills, 34 sessions, $9.98)

Two skills per class, chosen in pairs: one whose subject is **recent**, one whose subject has been **stable and heavily documented for years**.

| Skill | Class | Subject | With | Without | Delta |
|---|---|---|---:|---:|---:|
| `adopting-liquid-glass` | overview | recent migration | 100% | 50% | **+50** |
| `foundation-models` | code | new framework | 100% | 83% | **+17** |
| `hig-materials-liquid-glass` | design | recent material | 100% | 88% | **+13** |
| `crash-anr-vitals` | lang-tooling | recent + judgment | 100% | 88% | **+13** |
| `viewmodel` | code | stable API | 100% | 92% | +8 |
| `m3-buttons` | design | stable component | 100% | 100% | **0** |
| `unit-testing` | lang-tooling | stable practice | 100% | 100% | **0** |
| `choosing-async-pattern` | overview | stable decision | 100% | 100% | **0** |

**Every stable-subject skill scored zero.** On `m3-buttons`, `unit-testing` and `choosing-async-pattern` the control missed *nothing at all* — the model already knows Material button hierarchy, the JVM-versus-instrumented split, and when to reach for `AsyncStream`. Those skills are not adding knowledge; at best they are saving the model from an off day.

## Refresh evals: did the refresh change the answers, or only the file? (2026-08-27, $10.89)

`--baseline=<git-ref>` installs the skill *as it was* at that ref into a third arm. Run against the two skills PLAN 1.1 refreshed, this was supposed to confirm the refresh loop works. It half-confirmed it and half-caught me.

| Skill | Refreshed | Stale (pre-refresh) | No skill | Verdict |
|---|---:|---:|---:|---|
| `wear-compose` | 100% | 83% | 67% | refresh **moved the answer**, +17 |
| `app-widgets-glance` | 100% | 100% | 100% | refresh moved **nothing** — and introduced an error |

**`wear-compose`: half the refresh mattered.** It added two facts. Only one changed an answer:

- *Navigation 3 on Wear* — only the refreshed arm named `SwipeDismissableSceneStrategy`. The stale skill and the bare model both missed it. A genuine post-cutoff fact, invisible without the skill.
- *`LocalAmbientModeManager`* — the **stale** arm produced it too. The old skill never mentioned it, but its ambient-mode section put the model in the right neighbourhood and it recalled the symbol unaided. Only the no-skill control missed it. Adding the symbol was tidy; it was not load-bearing.

So "2 of 5 queue entries were real" (1.1) becomes, one level down, *1 of 2 facts inside a real refresh was real*. The rate keeps shrinking as you look closer.

**`app-widgets-glance`: the refresh made the skill worse.** 1.1 wrote "reach for `androidx.glance:glance-wear`". That coordinate has never been published. The successor to the deprecated `glance-wear-tiles` is `androidx.glance.wear:wear` + `wear-core` — different group, and still `1.0.0-alpha17`, so "reach for it" was wrong advice even once spelled correctly. The deprecation date was wrong too: `glance-wear-tiles` was deprecated in its own `1.0.0-alpha07` (Aug 2025), not "as of Glance 1.2.0".

Two things make this worth writing down:

- **The stale skill did not mislead.** Its arm said, unprompted: *"The skill guidance I loaded still references it as a live option; it isn't."* It overrode the skill and pointed at the ProtoLayout/Tiles stack. A stale skill was routed around; a **wrong** one was repeated. Wrong is the more expensive failure, and refreshing is how you get it.
- **The bare model was more careful than the refresh.** The control named `androidx.glance:glance-wear` as well — but flagged it: *"I could not confirm that … has actually shipped an artifact … Treat it as announced, not available."* That is very likely where the coordinate came from when the refresh was written. A refresh drafted with model help inherits the model's guesses, minus the hedge.

The skill is corrected here, and the corrected version scores 100% against 88% for the control, with no phantom coordinate.

## The lesson this cost the most to learn

**Assertions written from the refresh diff measure agreement with the refresh, not correctness.**

The first `app-widgets-glance` grading read: refreshed 83%, stale 50%, control 67% — "the refresh moved +33 points". Every number was real and the conclusion was backwards, because I had written the assertions by reading my own diff. The stale arm scored **0% on task 1 for giving the most accurate answer of the three**.

Rewriting the same assertions from the vendor release pages inverted the result. Assertions for a refresh eval must come from the upstream source, which is the one input that cannot be talked into agreeing with the skill.

Two smaller instrument faults, both found by reading answers rather than scores:

- **An empty answer is not a 0%.** `--max-turns 3` was enough for the control but not for an arm that spends turns loading a skill, so both skill arms returned nothing and were graded 0% — a clean, plausible, entirely fictional result. The harness now refuses to score an empty answer, prints `NO ANSWER (<subtype>)`, and reports the delta as unmeasurable rather than inventing one.
- **The negation guard is narrower than English.** It caught "Don't fall back to…" but not "I could not confirm this has shipped — treat it as announced, not available", which it scored as an endorsement. `avoid` patterns now require endorsement context (`use|add|reach for|depend on|implementation("…`) rather than a bare mention.

## The delta has two sources, not one

The obvious reading is "currency wins", and it is mostly right — but the runs contradicted one of my own assumptions, so it is worth being precise.

1. **Post-cutoff specifics.** `adopting-liquid-glass`'s control never named `UIDesignRequiresCompatibility`, never framed the opt-out as temporary, and never warned that content now shows through previously opaque bars. `foundation-models`' control never named `Attachment` or `PrivateCloudComputeLanguageModel`. These are facts a model cannot infer.

2. **Non-obvious judgment, even where the facts are known.** I picked `crash-anr-vitals` expecting its 2026 Play thresholds to be post-cutoff. **They were not** — the control quoted 1.09% and 0.47% correctly. Its delta came from somewhere else: the control never said to prioritise clusters by *affected users* rather than occurrences. Same shape on `hig-materials-liquid-glass`, where the control knew the material system but not "tint sparingly, through the system path".

So a skill earns its keep by carrying **what happened after training** or **what the vendor's docs bury**. A skill that restates a well-documented, long-stable API earns nothing measurable — which is a finding about what to author next, not a reason to delete anything.

## Three lessons that cost real money to learn

**Task selection decides whether an output eval measures anything.** The first `foundation-models` run scored 100% in *both* arms and looked like a null result for a brand-new framework. The tasks were the problem: they probed the 2025-era core API the model already knows. Adding one task about the iOS 27 additions turned a flat zero into a 50-point gap. Write tasks about the part of the subject that is *newer than the model*, or measure nothing.

**Assertions must encode practice, not vocabulary.** An assertion matching a phrase the skill happens to use measures copying. `viewModelScope`, `SavedStateHandle`, "gates on availability" are things a good answer contains however it was arrived at.

**Do not assume you know what is post-cutoff.** I chose `crash-anr-vitals` believing the 2026 Play Console thresholds would be beyond the model. The control quoted them correctly. The eval still found a delta, but from a different place — and had I not read the answers, I would have written up the right number with the wrong explanation.

## The grader is a regex, with one guard

A bad practice *named in order to warn against it* is not a bad practice. The first run flagged a with-skill answer for "reaches for an Activity-scoped ViewModel" because it contained *"**Don't** fall back to `viewModel(LocalContext.current as ComponentActivity)`"*. The grader now looks back for a negation before counting a violation — still a heuristic. **Read the answers (`--json`, `--keep`) before trusting a violation count.**

## Cost

~$0.37 per session; each task costs two. A 2-task skill is ~$1.50, the 8-skill sample the plan describes is ~$12–15 at one run each. Cheap enough to be worth doing, dear enough to `--dry-run` first.
