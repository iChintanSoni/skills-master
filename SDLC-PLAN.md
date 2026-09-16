# SDLC skills plan

Working plan for a new `sdlc` domain: skills that teach a coding agent the GitHub-centric
software-lifecycle mechanics that `apple`/`android` don't cover — branching, commit/merge
conventions, repo governance, CI/CD and release automation, and the Issues/Projects/PR
collaboration surface. Domain is platform-agnostic; `domain` is an open string in the schema,
so no schema change is needed for this wave.

**Why this effort exists.** The library's two existing domains teach an agent how to write
platform code. Nothing teaches it the process layer — which branch to cut, how to configure
required checks, how to file a GitHub Issue an agent can later verify itself against. This
plan scopes that out to a backlog, using the same bar the last effort measured: *every
stable-subject skill in an 8-skill output-eval sample scored a delta of zero against a bare
model.* So every item below was screened for a post-cutoff specific or a buried-judgment angle
before being kept — see each item's "Currency" line, and the [authoring guide](docs/authoring.md#what-earns-a-new-skill)
for the underlying bar.

**Agent-actionability filter.** Every skill in this library describes something a coding agent
*does* while working in a repo, not a human/org process. That filter cut requirements-gathering,
code-review etiquette, and incident-postmortem-facilitation from the raw brainstorm — see
"Deferred / cut" at the bottom.

## Ground rules

Carried forward from `PLAN.md`'s currency effort, which is where this pattern was learned:

- **PR per numbered item.** CI green; Chintan merges. One at a time — open one PR, wait for
  the merge, then start the next.
- **Generated files travel with their cause** — `skills/registry.json`, `docs/taxonomy.md`,
  `.claude-plugin/`/`plugins/`, in the same PR as any skill edit.
- **Content policy holds.** Original prose, summarized from vendor docs, cited via `sources`,
  never pasted.
- **Verify before claiming currency.** A currency claim (post-cutoff or buried-judgment) only
  counts if it came from a vendor page actually opened during that item's PR — not carried
  over unchecked from this planning doc. Several items below already carry a verified source
  (checked 2026-09-16); the rest are marked **unverified** and need a real doc check as part
  of authoring, not before.
- **A skill can still get cut at authoring time.** Items marked *(provisional)* survive to the
  backlog on a plausible angle, not a confirmed one — the output-eval at authoring time makes
  the final call, same as the currency effort's own precedent (`crash-anr-vitals`'s thresholds
  turned out not to be post-cutoff; the skill still worked on buried judgment alone).

## Phase 0 — Bootstrap the domain

- [ ] **0.1 `choosing-branching-strategy` (S).** `sdlc/overview/version-control/`.
  Use when: starting a repo with no established branching convention, or evaluating whether the
  current one fits release cadence/CI maturity. Mirrors the existing `choosing-testing-strategy`
  pattern exactly — first PR, chosen to validate the new domain's registry/taxonomy/marketplace
  plugin-naming plumbing before anything currency-sensitive is on the line.
  Currency: buried judgment, not post-cutoff — trunk-based needs feature flags for incomplete
  work; Git-flow's `develop` branch is often redundant once CI/CD is mature; release-flow suits
  scheduled/cherry-picked releases.

## Phase 1 — Version control & branching

- [ ] **1.1 `choosing-merge-strategy` (S).** `sdlc/overview/version-control/`.
  Use when: configuring a repo's default merge method (merge commit / squash / rebase),
  independent of branching model.
  Currency: squash silently discards per-commit bisectability unless commits are already
  meaningful; rebase requires linear-history discipline and can break commit-signature
  verification if done carelessly.
- [ ] **1.2 `commit-conventions-and-automation` (M).** `sdlc/code/version-control/`.
  Use when: setting up a repo's commit message convention, authoring `.gitmessage`/commitlint
  config, or wiring commit type → automated release version bump.
  Currency: Conventional Commits format alone is likely delta-zero. Real value: type→bump
  mapping differs across semantic-release/release-please/changesets, and GitHub's squash-merge
  silently replaces the real commit with the **PR title** — enforcement has to happen at the
  PR-title level too.

## Phase 2 — Repo governance

- [ ] **2.1 `branch-protection-rulesets` (M).** `sdlc/code/repo-governance/`.
  Use when: configuring required reviews/checks via GitHub Rulesets (the layered replacement
  for classic branch protection — org-level enforcement, bypass lists).
  Currency: **verified, genuinely post-cutoff.** GitHub shipped a one-click branch-protection→
  rulesets auto-migration tool on 2026-08-11 — after this planning session's Jan-2026 cutoff.
  Source: https://github.blog/changelog/2026-08-11-automatically-migrate-branch-protection-rules-to-repository-rulesets/
- [ ] **2.2 `codeowners` (S) — accepted currency risk.** `sdlc/code/repo-governance/`.
  Use when: setting up auto-assigned reviewers via `CODEOWNERS`.
  Currency *(provisional, unverified)*: CODEOWNERS syntax itself is old/well-known — kept
  standalone for granularity over a merge into 2.1. Candidate angle: last-matching-pattern-wins
  ordering (mirrors `.gitignore` semantics, a common footgun); team-based owners silently get no
  review request unless the team has explicit write access. May get cut by output-eval if this
  doesn't clear delta-zero.
- [ ] **2.3 `merge-queue-and-required-checks` (M).** `sdlc/code/repo-governance/`.
  Use when: configuring CI so PRs can't merge without passing checks, and preventing "passed on
  the PR branch, broke after merge."
  Currency: merge queue GA since 2023-07-12 — old, not post-cutoff. Buried judgment: required
  status checks alone don't catch semantic conflicts between two individually-passing PRs;
  merge queue re-tests the hypothetical *combined* state before merging. `pairs_with` 2.1.
- [ ] **2.4 `coverage-gating` (S).** `sdlc/code/repo-governance/`.
  Use when: wiring a coverage tool as a required check, or choosing a flat threshold vs. a
  ratchet.
  Currency: buried judgment — flat thresholds (e.g. "80%") are brittle/gameable on legacy repos
  with uneven coverage; a ratchet (changed code must not decrease overall coverage) is the
  documented-but-underused better default.

## Phase 3 — GitHub automation

- [ ] **3.1 `pinning-third-party-actions` (M).** `sdlc/code/github-automation/`.
  Use when: adding or auditing a third-party Action (`uses: owner/repo@version`) in any
  workflow.
  Currency: verified citation — tj-actions/changed-files compromise (CVE-2025-30066, disclosed
  2025-03-14/15): attacker rewrote *all version tags* to point at malicious code, so tag-pinning
  wasn't safe, only SHA-pinning was. Sources:
  https://www.cisa.gov/news-events/alerts/2025/03/18/supply-chain-compromise-third-party-tj-actionschanged-files-cve-2025-30066-and-reviewdogaction ,
  https://github.com/advisories/ghsa-mrrh-fwg8-r2c3
- [ ] **3.2 `reusable-workflows-and-composite-actions` (M).** `sdlc/code/github-automation/`.
  Use when: DRYing up duplicated CI logic across workflow files or repos.
  Currency *(provisional, unverified)*: judgment — composite action reuses steps within one
  job; reusable workflow (`workflow_call`) reuses whole jobs/pipelines and supports
  `secrets: inherit`. Picking the wrong one is a common source of duplicated pipeline logic.
- [ ] **3.3 `oidc-keyless-publishing` (M).** `sdlc/code/github-automation/`.
  Use when: publishing packages (npm/PyPI/containers) or deploying to cloud providers from
  Actions.
  Currency: verified, confirmed **not** post-cutoff — npm trusted publishing (OIDC) went GA
  2025-07-31. Value is purely buried judgment: eliminating long-lived `NPM_TOKEN`/cloud
  access-key secrets in favor of short-lived OIDC credentials is documented but generated
  workflows still default to static secrets.
  Source: https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/
- [ ] **3.4 `environments-and-required-approvals` (S).** `sdlc/code/github-automation/`.
  Use when: gating a deploy job behind manual approval, or scoping secrets to a specific
  environment (prod vs. staging).
  Currency *(provisional, unverified)*: distinct mechanism from 2.1 (that gates PR merges; this
  gates `deployment` jobs). Judgment: environment-scoped secrets are least-privilege vs.
  repo-wide secrets, but rarely used by default.
- [ ] **3.5 `choosing-release-automation` (M).** `sdlc/overview/github-automation/`.
  Use when: deciding how a repo versions + publishes — semantic-release, release-please,
  changesets, or a hand-rolled tag/commit-keyword scheme. Includes versioning strategy
  (semver/calver/monorepo) as a section rather than a separate skill — decided together in
  practice.
  Currency *(provisional, unverified)*: this repo's own `release.yml` (tag-derived version,
  `#major`/`#minor` in the merge commit, nothing committed back) is a real worked example of
  the hand-rolled option's tradeoffs against release-please's batched-PR model or changesets'
  per-package monorepo model.

## Phase 4 — GitHub collaboration

- [ ] **4.1 `issue-forms-and-templates` (S) — thin angle, verify-or-cut.** `sdlc/code/github-collaboration/`.
  Use when: authoring `.github/ISSUE_TEMPLATE/*.yml` forms + `config.yml`.
  Currency: downgraded on reflection — YAML issue forms shipped years before this session's
  cutoff, likely known mechanically. Only surviving angle: `config.yml`'s
  `blank_issues_enabled: false` forcing template use, and label auto-apply. Real risk of
  delta-zero; carried forward for a real check rather than cut on guesswork.
- [ ] **4.2 `choosing-project-tracking-approach` (S).** `sdlc/overview/github-collaboration/`.
  Use when: deciding how to track work in a repo — Issues+labels only, Milestones, or
  Projects v2.
  Currency *(provisional, unverified)*: Projects v2 shines for cross-repo/org-wide views and
  custom workflows but is overhead a single small repo doesn't need; Milestones are lightweight
  but per-repo only; labels alone give no timeline/board view.
- [ ] **4.3 `automating-github-projects` (M).** `sdlc/code/github-collaboration/`.
  Use when: an agent needs to programmatically add/update items in a GitHub Project (v2).
  Currency: verified, confirmed **not** post-cutoff — Projects v2 has been GraphQL-only for
  years (classic Projects, which had REST, sunset Oct 2025). Buried-practical-gotcha framing
  only: `gh project` CLI wraps a narrower surface than raw GraphQL; field updates need the
  field's *node ID*, not its name. **Discard**: a claim that REST gained partial Projects-v2
  support in Sept 2025 was checked and is false — do not carry it into the skill.
  Sources: https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects ,
  https://github.blog/changelog/2024-05-23-sunset-notice-projects-classic/
- [ ] **4.4 `wiki-vs-repo-docs` (S).** `sdlc/overview/github-collaboration/`.
  Use when: an agent is about to write documentation and needs to decide where it lives.
  Currency *(provisional, unverified)*: the Wiki is a **separate git repo**
  (`<repo>.wiki.git`), not covered by the main repo's branch protection, CODEOWNERS, or
  required PR review — docs placed there silently bypass the review process most teams assume
  applies everywhere.
- [ ] **4.5 `pr-templates` (S).** `sdlc/code/github-collaboration/`.
  Use when: authoring `.github/PULL_REQUEST_TEMPLATE.md`, or multiple templates selectable via
  `?template=` query param.
  Currency *(provisional, unverified)*: multi-template-via-URL-param is genuinely under-known —
  most people/models only know the single default-template case.
- [ ] **4.6 `stacked-prs` (M) — strongest post-cutoff finding.** `sdlc/code/github-collaboration/`.
  Use when: an agent needs to split a large change into a stack of dependent, reviewable PRs.
  Currency: verified — GitHub shipped **native** stacked PRs into public preview on 2026-07-30,
  after this session's cutoff. A model asked today would likely still assert "GitHub has no
  native stacked-PR support, use Graphite/git-spice." Confirmed via a secondary source
  (https://www.infoq.com/news/2026/08/github-stacked-pull-requests/, referencing the GitHub
  changelog) — **re-verify against the primary github.blog/changelog post directly** as part of
  authoring this item.
- [ ] **4.7 `writing-actionable-issues` (M).** `sdlc/code/github-collaboration/`.
  Use when: an agent turns a vague ask into a well-formed GitHub Issue (or a linked set of
  issues) it or another agent can later act on and verify completion against.
  Currency: verified, confirmed **not** post-cutoff — sub-issues went GA 2025-04-30. Skill
  rests entirely on judgment: when a native sub-issue relationship is worth the overhead vs. a
  plain task-list checkbox, and that closing keywords (`Closes #123`) auto-link PR→issue but
  are often skipped unless an agent is told to use them.
  Source: https://github.blog/changelog/2025-04-09-evolving-github-issues-and-projects/

## Deferred / cut from the brainstorm

**Cut outright — human process, not agent-actionable:** requirements gathering / user-story
writing, code review etiquette, incident-postmortem facilitation, Discussions-vs-Issues,
`concurrency-and-caching` (real delta-zero risk, cut rather than carried on guesswork).

**Deferred — no class fits yet.** PR review practices, ADR/design-doc judgment, flaky-test
triage, rollback/hotfix judgment. These are real but don't produce a file (`code`) and aren't
decision-routers (`overview`). Options on the table: leave deferred until a pattern emerges
from this wave; add a 5th class (e.g. `process`) as its own infra PR; or stretch
`lang-tooling`'s "cross-cutting build/test/ship" definition to cover them. Revisit once Phase 4
ships — by then we'll know whether skipping them was actually felt.
