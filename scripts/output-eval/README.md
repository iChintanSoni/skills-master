# Output evals

Does having the skill beat the model's own knowledge?

`scripts/trigger-eval` asks whether a skill *fires*. This asks the harder question the library's mission rests on: when it does fire, is the answer better than the one the model would have given anyway?

```bash
node scripts/output-eval/bin.mjs viewmodel --dry-run    # free
node scripts/output-eval/bin.mjs viewmodel --runs=1 --json=/tmp/out.json
```

Same prompt, same model, two scratch projects — one with the skill installed, one bare. Each answer is graded against assertions, and the report is the **delta** between the arms.

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
