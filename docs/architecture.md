# Architecture

`skills-master` has two halves: a **content library** (`skills/`) and a **compiler CLI** (`packages/cli`). You author a skill once in a canonical format; the CLI projects it into whatever each AI tool expects and installs it into a project.

## The canonical unit: a skill

A skill is a directory:

```
skills/<domain>/<class>/<category>/<name>/
├── SKILL.md        # frontmatter + body (Level 1 metadata + Level 2 instructions)
├── reference.md    # optional Level 3 — deep reference, loaded on demand (defined but currently unused by all skills)
├── examples.md     # optional Level 3 — worked snippets
└── checklist.md    # optional Level 3 — review/migration rubric
```

- **domain** namespaces a technology ecosystem (`apple` and `android` today; `web` and others can follow).
- **class** is one of `code` (produces code), `design` (produces UX critique), `lang-tooling` (cross-cutting language/build/test/ship), `overview` (decision routers). `class` maps to a directory via `CLASS_DIR` (`overview` → `overviews`).
- **category** groups skills within a class. It is a free string validated only against the on-disk path, and it deliberately **follows each vendor's own information architecture rather than a shared cross-domain schema** — see below.
- The folder name **is** the skill `name` (kebab-case), enforced by the linter.

### Categories mirror the vendor, not each other

Under `design`, the two domains do not carry the same category set, and that asymmetry is intentional:

| | `apple/design` | `android/design` |
|---|---|---|
| has | `inputs` | `styles` |
| lacks | `styles` | `inputs` |

Apple's Human Interface Guidelines has an **Inputs** section (Action button, Apple Pencil, Digital Crown, gestures, keyboards, pointing devices) and folds color, typography, motion, icons, and materials into **Foundations**. Material Design 3 is organized as **foundations / styles / components** — it has a **Styles** section and no Inputs section, distributing input guidance across its platform and pattern pages instead.

So `apple/design/foundations` legitimately holds what Android splits into `design/styles`, and Android's input guidance legitimately lives in `design/platforms/m3-{wear,tv,large-screens,chromeos-desktop}`, `design/patterns/m3-gestures`, and `design/foundations/m3-interaction-states` rather than a dedicated `inputs` category.

Forcing symmetry here would misrepresent both design systems and duplicate substantive existing coverage. When adding a category, match the vendor's published structure; do not add one solely because the other domain has it.

`code` categories diverge for the same reason, though less sharply — they track each platform's framework boundaries. Genuine coverage gaps (a topic neither the vendor's structure nor ours accounts for) are still worth closing; mirror-image category names are not.

## The spec boundary

`skills/` is a superset; the projections are the conformance surface.

The canonical format is the [Agent Skills specification](https://agentskills.io/specification)'s `SKILL.md` treated as a **strict superset**. Authored frontmatter carries three top-level keys the spec does not define — `globs`, `tags`, and the namespaced `x-skills-master:` block — all of which are stripped or translated on the way out. See [authoring.md](authoring.md) for the full schema.

**So the canonical tree does not validate against the spec, by design.** Point the spec's reference validator at `skills/` and it fails on the very first skill — twice over, for two independent reasons:

```
$ python3 scripts/spec-validate.py skills
✗ skills/android/code/architecture/android-activities
    - Invalid YAML in frontmatter: … line 7, column 7:
        tags: [task-affinity]
      Found ugly disallowed JSONesque flow mapping
```

The reference implementation parses with **strictyaml**, a restricted dialect that rejects flow sequences outright — so `tags: [swiftui, monetization]` and `platforms: [apple, ios]` are refused before any field is inspected. Rewrite those in block style and the second reason surfaces:

```
    - Unexpected fields in frontmatter: globs, tags, x-skills-master.
      Only ['allowed-tools', 'compatibility', 'description', 'license',
      'metadata', 'name'] are allowed.
```

Both are the expected result, not bugs to file. The spec's stated home for non-spec properties is its `metadata` map, which is flat **string→string** — it cannot hold `platforms: [ios, ipados]`, `requires: {ios: "17"}`, `pairs_with`, or `sources` without flattening structured facets into strings to satisfy a validator no agent ever runs against the source tree. The whole point of the compile step is that agents consume the **projections**, never `skills/`.

What the projections carry is exactly what the spec defines:

| | canonical `skills/` | emitted `.claude/skills/`, `plugins/` |
|---|---|---|
| spec fields | `name`, `description`, `license` | `name`, `description`, `license`, `metadata` |
| non-spec keys | `globs`, `tags`, `x-skills-master` | none |
| validates against the spec | **no, deliberately** | **yes, enforced in CI** |

`metadata` is where two authored facts re-enter as spec-legal strings: `version` and `snapshot-date`, so an installed skill still says which release it is and when it was last checked. The rest of `x-skills-master` exists to drive *our* tooling — the registry, the taxonomy, the crawl, `pairs_with` integrity — none of which a consuming agent needs.

CI enforces this boundary from the outside: `scripts/spec-validate.py` runs the spec's own reference implementation (`skills-ref`, pinned) over every committed projection — all 434 skill directories — and never over `skills/`. Snapshot tests pin what *we* expect the emitters to write; this pins what the *spec* expects. See [emitters.md](emitters.md#spec-conformance).

## Progressive disclosure

| Level | Lives in | Loaded |
|------|----------|--------|
| 1 — metadata | `name` + `description` | always (drives auto-invocation) |
| 2 — instructions | `SKILL.md` body (≤ ~500 lines) | on invocation |
| 3 — resources | `reference.md` / `examples.md` / `checklist.md` | on demand |

Claude Code preserves all three levels natively. Single-file targets (Cursor, Copilot, AGENTS.md) get the Level-2 body **condensed**: links to Level-3 files are flattened and a pointer note is added.

## The compiler pipeline

```
discover → parse → validate → compile (per target) → write
```

- **discover** (`core/discover.ts`) — find every `SKILL.md` under the skills root.
- **parse** (`core/parse.ts`) — gray-matter splits frontmatter/body; resource files are read.
- **validate** (`schema/frontmatter.ts`, zod) — typed, normalized frontmatter; `core/lint.ts` adds content rules.
- **compile** (`core/compile.ts` + `emitters/`) — each enabled emitter projects the skill into `EmittedFile[]`.
- **write** (`core/writer.ts`) — applies files: `whole`-mode files are owned outright; `block`-mode regions are managed inside shared files via sentinel markers.

### Emitters

Every target implements one interface (`packages/cli/src/types.ts`):

```ts
interface Emitter {
  id: string;
  label: string;
  detect(projectRoot: string): boolean;
  emit(skill: ParsedSkill, ctx: EmitContext): EmittedFile[];
}
```

Adding a tool (Windsurf, Cline, …) is a new file in `emitters/` plus one line in `emitters/index.ts`; the rest of the pipeline is generic. Shipped emitters: `claude` (lossless, copies Level-3), `cursor` (`.mdc`), `copilot` (`.instructions.md` + a pointer block in the root file), `agents` (`AGENTS.md` block). See [emitters.md](emitters.md).

### Sentinel markers

Shared files (`AGENTS.md`, `.github/copilot-instructions.md`) carry managed regions:

```
<!-- BEGIN skills-master:<name> v<version> -->
...generated...
<!-- END skills-master:<name> -->
```

Updates replace only the bytes between the markers, so hand-written content outside is always preserved (`core/markers.ts`).

## Install state

In a consuming project:

- `skills-master.json` — config (`contentRef`, `targets`, output `paths`, `commit`).
- `skills-master.lock.json` — per-skill resolved `version`, `sourceHash`, and per-target emitted files + a content `hash` (computed from disk) used to detect local edits.
- Generated files are committed by default; `commit: false` gitignores them instead.

`registry.json` (committed in `skills/`) is the generated catalog the CLI reads to `list`/`search`/`add` without scanning every skill. It is deterministic and CI-verified for drift.

## Distribution

Two channels over the same content:

1. **npx CLI** — `skills-master add …` fetches skill subtrees (via `giget`, pinned to `contentRef`) and compiles them for whichever tools a project uses.
2. **Claude marketplace** — `marketplace build` generates `.claude-plugin/marketplace.json` and the plugins for native `/plugin install`. The output is committed, so it is a build artifact that can go stale: the build owns every file under `plugins/` and deletes any it no longer emits, and `marketplace build --check` gates the committed tree in CI. Whatever the skill library holds, the plugins must bundle — a skill missing from a plugin is invisible to anyone who installs that way.

### Two granularities, on purpose

Every skill ships in **two** plugins:

| | Example | Skills | Listing vs the ~8 KB budget |
|---|---|---:|---|
| per `(domain, class)` | `skills-master-apple-code` | 88 | 4.9× over |
| per `(domain, class, category)` | `skills-master-apple-code-app-frameworks` | 36 | 1.9× over — and 32 of 36 category plugins fit outright |

The class plugins are what the marketplace has always shipped and what existing installs name, so they stay. The category plugins exist because the agent's always-on skill listing is [budgeted](emitters.md#how-each-agent-triggers-a-skill): past roughly 8 KB, descriptions are replaced by a bare `- <name>`, so installing 107 skills at once means most of them arrive as names with no descriptions. A consumer picks a granularity; the skill bytes are identical either way, and a test asserts that.

A class with only one category (both `overviews` classes) gets **no** category plugin — it would be a byte-identical twin under a clumsier name. The cost of the whole arrangement is a doubled `plugins/` tree on disk, which is a build artifact rather than something a consumer downloads twice.
