# Trigger evals

Does a skill actually activate on prompts a real user would write?

The library has always *asserted* description quality — every description carries a "Use when …" clause and the linter checks for it — but a grep proves the letter of the guidance, not that a model reaches for the right skill. This measures the latter.

```bash
node scripts/trigger-eval/bin.mjs swiftui-sheets --dry-run     # free: prints the plan
node scripts/trigger-eval/bin.mjs swiftui-sheets --runs=1 --limit=2   # ~4 sessions
node scripts/trigger-eval/bin.mjs swiftui-sheets --json=/tmp/out.json # the full set
```

## What it does

1. Installs the skill **and its near-miss siblings** into a scratch project.
2. Runs each labelled prompt through headless Claude Code (`claude -p --output-format stream-json`), with `Skill` as the only permitted tool.
3. Parses the tool-use trace for which skill the model chose, if any.
4. Reports the trigger rate on should-trigger queries and the false-fire rate on should-not.

**Siblings are the point.** `swiftui-sheets` firing on "how do I show a sheet in SwiftUI" proves little if `hig-sheets` fires on it too. The hard case is discrimination between our own overlapping skills, so each query set names the whole neighbourhood and the run installs all of it. A should-not-trigger set is usually a sibling's should-trigger set.

## Cost — read this before scaling up

Every query is a real headless session. Measured on the first run: **~$0.22 per session**.

| Scope | Sessions | Approx cost |
|---|---:|---:|
| Smoke (`--runs=1 --limit=2`) | 4 | $0.90 |
| One skill, full set, 3 runs | ~48 | ~$11 |
| The 10-skill pilot in PLAN.md 3.2 | ~600 | **~$130** |

So: `--dry-run` first, then one skill, and read the printed cost before committing to a pilot. `--concurrency` exists but hosts rate-limit; raise it carefully.

## When a query set is expected

Not for every skill — for every skill in **crowded territory**. `docs/authoring.md` has the test: search the topic first, and if an existing skill could plausibly match the same prompts, the PR ships a set and a run. The failure this catches is not "never triggers" but "the wrong sibling triggers, and nobody notices".

## Writing a query set

`scripts/trigger-eval/<skill>/eval.json`:

```json
{
  "skill": "swiftui-sheets",
  "install": ["swiftui-sheets", "hig-sheets", "swiftui-navigation", "hig-modality"],
  "notes": "why these siblings, and what the should-not set is really testing",
  "shouldTrigger": ["How do I present a sheet in SwiftUI?"],
  "shouldNotTrigger": ["Should this flow be a sheet or full-screen? Review the UX."]
}
```

Write prompts the way a user actually types them — including the vague ones. A query set full of prompts that name the skill's own vocabulary will report a flattering number and teach you nothing.

## Interpreting a result

A skill that under-triggers has a description that does not sound like the situation the user is in. A skill that false-fires is claiming a neighbour's territory. Both are description bugs, and both are fixed in the description — not by adding keywords to `tags`, which only feed `skills-master search`.

One caveat this harness cannot see: on a real install the skills list is [budgeted](../../docs/emitters.md#how-each-agent-triggers-a-skill), and descriptions past the cap are replaced by a bare `- <name>`. These evals install a handful of skills, so every description is intact. A skill that triggers perfectly here may still never trigger inside a full-domain install.
