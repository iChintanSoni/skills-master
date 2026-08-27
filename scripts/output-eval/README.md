# Output evals

Does having the skill beat the model's own knowledge?

`scripts/trigger-eval` asks whether a skill *fires*. This asks the harder question the library's mission rests on: when it does fire, is the answer better than the one the model would have given anyway?

```bash
node scripts/output-eval/bin.mjs viewmodel --dry-run    # free
node scripts/output-eval/bin.mjs viewmodel --runs=1 --json=/tmp/out.json
```

Same prompt, same model, two scratch projects — one with the skill installed, one bare. Each answer is graded against assertions, and the report is the **delta** between the arms.

## First results (2026-08-27, 10 sessions, $3.66)

| Skill | Class | With | Without | Delta |
|---|---|---:|---:|---:|
| `viewmodel` | android/code — long-stable API | 100% | 92% | **+8** |
| `foundation-models` | apple/code — new framework | 100% | 83% | **+17** |

The averages hide the real finding, which is **per task**:

| Task | With | Without |
|---|---:|---:|
| Foundation Models — summarise an article (2025-era API) | 100% | **100%** |
| Foundation Models — session structure and streaming (2025-era API) | 100% | **100%** |
| Foundation Models — iOS 27 multimodal + Private Cloud Compute | 100% | **50%** |

Without the skill, the model never named `Attachment`/`ImageReference` or `PrivateCloudComputeLanguageModel` — the two genuinely post-cutoff APIs. With it, both. On the parts of the same framework that predate the model's training, the delta is exactly zero.

**So the library's edge is concentrated in currency, not coverage** — which is what the plan hypothesised and what these numbers, on a small sample, support.

## Two lessons that cost real money to learn

**Task selection decides whether an output eval measures anything.** The first `foundation-models` run scored 100% in *both* arms and looked like a null result for a brand-new framework. The tasks were the problem: they probed the 2025-era core API the model already knows. Adding one task about the iOS 27 additions turned a flat zero into a 50-point gap. Write tasks about the part of the subject that is *newer than the model*, or measure nothing.

**Assertions must encode practice, not vocabulary.** An assertion matching a phrase the skill happens to use measures copying. `viewModelScope`, `SavedStateHandle`, "gates on availability" are things a good answer contains however it was arrived at.

## The grader is a regex, with one guard

A bad practice *named in order to warn against it* is not a bad practice. The first run flagged a with-skill answer for "reaches for an Activity-scoped ViewModel" because it contained *"**Don't** fall back to `viewModel(LocalContext.current as ComponentActivity)`"*. The grader now looks back for a negation before counting a violation — still a heuristic. **Read the answers (`--json`, `--keep`) before trusting a violation count.**

## Cost

~$0.37 per session; each task costs two. A 2-task skill is ~$1.50, the 8-skill sample the plan describes is ~$12–15 at one run each. Cheap enough to be worth doing, dear enough to `--dry-run` first.
